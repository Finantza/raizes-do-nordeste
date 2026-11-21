# -*- coding: utf-8 -*-
"""
Módulo 1 — Leitura e extração de documentos técnicos e evidências do código-fonte.
Suporta: DOCX, DOC, PDF, TXT, MD, CSV, XLSX e inspeção estática das suítes src/*.test.js e src/db.js.
"""

import csv
import hashlib
import os
import re
import zipfile
import zlib
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
import xml.etree.ElementTree as ET

import docx


@dataclass
class DocumentoExtraido:
    """Representa um documento lido com toda a sua estrutura preservada e metadados de origem."""
    caminho: str
    nome: str
    formato: str
    tamanho_bytes: int
    sha256: str
    titulos: List[Dict[str, Any]] = field(default_factory=list)
    paragrafos: List[Dict[str, Any]] = field(default_factory=list)
    tabelas: List[Dict[str, Any]] = field(default_factory=list)
    metricas_detectadas: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    referencias: List[str] = field(default_factory=list)
    avisos_leitura: List[str] = field(default_factory=list)

    @property
    def texto_completo(self) -> str:
        partes = [p["texto"] for p in self.paragrafos if p.get("texto")]
        for tab in self.tabelas:
            for linha in tab.get("linhas", []):
                partes.append(" | ".join(str(c) for c in linha))
        return "\n".join(partes)


class LeitorDocumentos:
    """Extrator universal para DOCX, DOC, PDF, TXT, MD, CSV, XLSX e fatos do repositório."""

    EXTENSOES_SUPORTADAS = {".docx", ".doc", ".pdf", ".txt", ".md", ".csv", ".xlsx"}

    def __init__(self, logger=None):
        self.logger = logger

    @staticmethod
    def _calcular_sha256(caminho: Path) -> str:
        h = hashlib.sha256()
        with open(caminho, "rb") as f:
            for bloco in iter(lambda: f.read(65536), b""):
                h.update(bloco)
        return h.hexdigest()

    def carregar_diretorio(self, diretorio: str, incluir_raiz: bool = True) -> List[DocumentoExtraido]:
        """Varre um diretório de documentação (e opcionalmente documentos na raiz) e extrai todos."""
        pasta = Path(diretorio)
        arquivos: List[Path] = []
        if pasta.exists() and pasta.is_dir():
            for arq in sorted(pasta.iterdir()):
                if arq.is_file() and arq.suffix.lower() in self.EXTENSOES_SUPORTADAS:
                    arquivos.append(arq)

        if incluir_raiz:
            raiz = pasta.parent if pasta.name.lower() == "docs" else pasta
            readme = raiz / "README.md"
            if readme.exists() and readme not in arquivos:
                arquivos.append(readme)

        documentos = []
        for arq in arquivos:
            try:
                doc_ext = self.ler_arquivo(str(arq))
                documentos.append(doc_ext)
            except Exception as exc:
                if self.logger:
                    self.logger.erro(f"Erro ao ler arquivo '{arq}': {exc}")
        return documentos

    def ler_arquivo(self, caminho: str) -> DocumentoExtraido:
        """Lê um arquivo individual identificando seu formato real e extraindo seu conteúdo."""
        p = Path(caminho)
        if not p.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

        ext = p.suffix.lower()
        doc_info = DocumentoExtraido(
            caminho=str(p.resolve()),
            nome=p.name,
            formato=ext.lstrip(".").upper(),
            tamanho_bytes=p.stat().st_size,
            sha256=self._calcular_sha256(p)
        )

        if ext in {".docx", ".doc"}:
            self._ler_docx_ou_doc(p, doc_info)
        elif ext in {".txt", ".md"}:
            self._ler_texto_ou_markdown(p, doc_info)
        elif ext == ".csv":
            self._ler_csv(p, doc_info)
        elif ext == ".xlsx":
            self._ler_xlsx(p, doc_info)
        elif ext == ".pdf":
            self._ler_pdf(p, doc_info)
        else:
            raise ValueError(f"Formato não suportado: {ext}")

        self._extrair_metricas_e_referencias(doc_info)
        if self.logger:
            self.logger.info(
                f"Arquivo lido: {doc_info.nome} ({doc_info.formato}) - "
                f"{len(doc_info.titulos)} títulos, {len(doc_info.paragrafos)} parágrafos, {len(doc_info.tabelas)} tabelas."
            )
        return doc_info

    def _ler_docx_ou_doc(self, caminho: Path, doc_info: DocumentoExtraido) -> None:
        """Lê arquivos Word (.docx ou .doc OpenXML/texto)."""
        try:
            d = docx.Document(str(caminho))
            for idx, par in enumerate(d.paragraphs, start=1):
                texto = par.text.strip()
                if not texto:
                    continue
                estilo = par.style.name if par.style else "Normal"
                doc_info.paragrafos.append({
                    "indice": idx,
                    "texto": texto,
                    "estilo": estilo,
                    "origem": f"{doc_info.nome}:Parágrafo {idx}"
                })
                if estilo.startswith("Heading") or (len(par.runs) > 0 and all(r.bold for r in par.runs if r.text.strip()) and len(texto) < 120):
                    doc_info.titulos.append({
                        "indice": idx,
                        "texto": texto,
                        "estilo": estilo,
                        "origem": f"{doc_info.nome}:Título {idx}"
                    })

            for t_idx, table in enumerate(d.tables, start=1):
                linhas = []
                for row in table.rows:
                    linhas.append([cell.text.strip().replace("\n", " ") for cell in row.cells])
                doc_info.tabelas.append({
                    "indice": t_idx,
                    "cabecalho": linhas[0] if linhas else [],
                    "linhas": linhas,
                    "origem": f"{doc_info.nome}:Tabela {t_idx}"
                })
        except Exception as exc:
            # Fallback caso seja um .doc legado não-OpenXML ou texto puro
            doc_info.avisos_leitura.append(f"Leitura OpenXML indisponível ({exc}); acionado extrator textual bruto.")
            with open(caminho, "rb") as f:
                bruto = f.read()
            texto_limpo = re.sub(rb"[^\x20-\x7E\xC0-\xFF\r\n\t]", b" ", bruto).decode("latin-1", errors="ignore")
            for idx, linha in enumerate(texto_limpo.splitlines(), start=1):
                l_str = linha.strip()
                if len(l_str) > 3:
                    doc_info.paragrafos.append({
                        "indice": idx,
                        "texto": l_str,
                        "estilo": "TextoBruto",
                        "origem": f"{doc_info.nome}:Linha {idx}"
                    })

    def _ler_texto_ou_markdown(self, caminho: Path, doc_info: DocumentoExtraido) -> None:
        """Lê arquivos Markdown (.md) e texto (.txt), extraindo cabeçalhos, parágrafos e tabelas Markdown."""
        with open(caminho, "r", encoding="utf-8", errors="replace") as f:
            linhas = f.readlines()

        tabela_atual: List[List[str]] = []
        inicio_tabela = 0

        for idx, linha_bruta in enumerate(linhas, start=1):
            linha = linha_bruta.strip()

            # Detecta linha de tabela Markdown
            if linha.startswith("|") and linha.endswith("|"):
                celulas = [c.strip() for c in linha.strip("|").split("|")]
                # Ignora linha separadora |---|---|
                if all(re.match(r"^:?-{2,}:?$", c) for c in celulas if c):
                    continue
                if not tabela_atual:
                    inicio_tabela = idx
                tabela_atual.append(celulas)
                continue
            else:
                if tabela_atual:
                    doc_info.tabelas.append({
                        "indice": len(doc_info.tabelas) + 1,
                        "cabecalho": tabela_atual[0],
                        "linhas": tabela_atual,
                        "origem": f"{doc_info.nome}:Linhas {inicio_tabela}-{idx - 1}"
                    })
                    tabela_atual = []

            if not linha:
                continue

            if linha.startswith("#"):
                nivel = len(linha) - len(linha.lstrip("#"))
                titulo_limpo = linha.lstrip("#").strip()
                doc_info.titulos.append({
                    "indice": idx,
                    "texto": titulo_limpo,
                    "estilo": f"Heading {nivel}",
                    "origem": f"{doc_info.nome}:L{idx}"
                })

            doc_info.paragrafos.append({
                "indice": idx,
                "texto": linha,
                "estilo": "Markdown",
                "origem": f"{doc_info.nome}:L{idx}"
            })

        if tabela_atual:
            doc_info.tabelas.append({
                "indice": len(doc_info.tabelas) + 1,
                "cabecalho": tabela_atual[0],
                "linhas": tabela_atual,
                "origem": f"{doc_info.nome}:Linhas {inicio_tabela}-{len(linhas)}"
            })

    def _ler_csv(self, caminho: Path, doc_info: DocumentoExtraido) -> None:
        """Lê arquivos CSV convertendo-os em tabela estruturada."""
        with open(caminho, "r", encoding="utf-8-sig", errors="replace") as f:
            leitor = csv.reader(f)
            linhas = [row for row in leitor if any(c.strip() for c in row)]
        if linhas:
            doc_info.tabelas.append({
                "indice": 1,
                "cabecalho": linhas[0],
                "linhas": linhas,
                "origem": f"{doc_info.nome}:CSV"
            })

    def _ler_xlsx(self, caminho: Path, doc_info: DocumentoExtraido) -> None:
        """Lê planilhas Excel (.xlsx) via parser OpenXML nativo sem depender de bibliotecas externas pesadas."""
        try:
            with zipfile.ZipFile(caminho, "r") as z:
                shared_strings: List[str] = []
                if "xl/sharedStrings.xml" in z.namelist():
                    root_ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
                    for si in root_ss.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
                        textos = [t.text or "" for t in si.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")]
                        shared_strings.append("".join(textos))

                planilhas = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml"))
                for s_idx, sheet_name in enumerate(planilhas, start=1):
                    root_sh = ET.fromstring(z.read(sheet_name))
                    linhas_planilha = []
                    for row in root_sh.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
                        valores_linha = []
                        for c in row.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                            tipo = c.attrib.get("t", "")
                            v_el = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
                            is_el = c.find(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                            if tipo == "s" and v_el is not None and v_el.text is not None:
                                idx_ss = int(v_el.text)
                                valores_linha.append(shared_strings[idx_ss] if idx_ss < len(shared_strings) else "")
                            elif is_el is not None and is_el.text is not None:
                                valores_linha.append(is_el.text)
                            elif v_el is not None and v_el.text is not None:
                                valores_linha.append(v_el.text)
                            else:
                                valores_linha.append("")
                        if any(str(v).strip() for v in valores_linha):
                            linhas_planilha.append(valores_linha)
                    if linhas_planilha:
                        doc_info.tabelas.append({
                            "indice": s_idx,
                            "cabecalho": linhas_planilha[0],
                            "linhas": linhas_planilha,
                            "origem": f"{doc_info.nome}:Planilha {s_idx}"
                        })
        except Exception as exc:
            doc_info.avisos_leitura.append(f"Erro ao extrair XLSX: {exc}")

    def _ler_pdf(self, caminho: Path, doc_info: DocumentoExtraido) -> None:
        """Extrai fluxos de texto de arquivos PDF utilizando descompressão FlateDecode nativa."""
        try:
            with open(caminho, "rb") as f:
                dados = f.read()

            fragmentos: List[str] = []
            for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", dados, re.DOTALL):
                fluxo = match.group(1)
                try:
                    descomprimido = zlib.decompress(fluxo)
                except Exception:
                    descomprimido = fluxo
                for txt_match in re.finditer(rb"\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj", descomprimido):
                    fragmentos.append(txt_match.group(1).decode("latin-1", errors="ignore"))
                for tj_arr in re.finditer(rb"\[(.*?)\]\s*TJ", descomprimido, re.DOTALL):
                    partes = re.findall(rb"\(([^()\\]*(?:\\.[^()\\]*)*)\)", tj_arr.group(1))
                    if partes:
                        fragmentos.append("".join(p.decode("latin-1", errors="ignore") for p in partes))

            for idx, frag in enumerate(fragmentos, start=1):
                limpo = frag.strip()
                if limpo:
                    doc_info.paragrafos.append({
                        "indice": idx,
                        "texto": limpo,
                        "estilo": "PDFStream",
                        "origem": f"{doc_info.nome}:Fragmento {idx}"
                    })
        except Exception as exc:
            doc_info.avisos_leitura.append(f"Aviso na extração de PDF: {exc}")

    def _extrair_metricas_e_referencias(self, doc_info: DocumentoExtraido) -> None:
        """Varre parágrafos e tabelas extraindo afirmações numéricas, contagens de testes, métricas e referências."""
        metricas: Dict[str, List[Dict[str, Any]]] = {
            "total_testes": [],
            "total_suites": [],
            "bcrypt_rounds": [],
            "samesite_cookie": [],
            "disponibilidade": [],
            "latencia_p95": [],
            "cobertura": [],
            "tabelas_banco": [],
            "ids_casos_teste": [],
            "requisitos_rf": [],
            "requisitos_rnf_rq": []
        }

        fontes_texto = [(p["origem"], p["texto"]) for p in doc_info.paragrafos]
        for tab in doc_info.tabelas:
            for l_idx, linha in enumerate(tab.get("linhas", []), start=1):
                fontes_texto.append((f"{tab['origem']} (Linha {l_idx})", " | ".join(str(c) for c in linha)))

        for origem, texto in fontes_texto:
            # 1. Total de testes automatizados
            for m in re.finditer(
                r"\b(\d+)\s+(?:testes\s+automatizados|testes\s+executados|testes\s+aprovados|casos\s+de\s+teste\s+automatizados)",
                texto,
                re.IGNORECASE
            ):
                val = int(m.group(1))
                metricas["total_testes"].append({"valor": val, "trecho": m.group(0), "origem": origem})

            for m in re.finditer(r"concluiu\s+com\s+\*{0,2}(\d+)\s+aprovados", texto, re.IGNORECASE):
                val = int(m.group(1))
                metricas["total_testes"].append({"valor": val, "trecho": m.group(0), "origem": origem})

            # 2. Quantidade de suítes
            for m in re.finditer(r"\b(\d+)\s+su[íi]tes\b", texto, re.IGNORECASE):
                metricas["total_suites"].append({"valor": int(m.group(1)), "trecho": m.group(0), "origem": origem})

            # 3. Bcrypt salt rounds
            for m in re.finditer(r"(?:salt\s*rounds|rounds|custo|salt)\s*(?:de\s*)?(\d+)|(\d+)\s*(?:salt\s*)?rounds", texto, re.IGNORECASE):
                val = int(m.group(1) or m.group(2))
                if val in {4, 8, 10, 12, 14}:
                    metricas["bcrypt_rounds"].append({"valor": val, "trecho": m.group(0), "origem": origem})

            # 4. Flag SameSite do cookie
            for m in re.finditer(r"SameSite\s*=\s*(Lax|Strict|None)", texto, re.IGNORECASE):
                metricas["samesite_cookie"].append({"valor": m.group(1).capitalize(), "trecho": m.group(0), "origem": origem})

            # 5. Menção à tabela inexistente order_items
            if re.search(r"\border_items\b", texto, re.IGNORECASE):
                metricas["tabelas_banco"].append({"valor": "order_items", "trecho": "order_items", "origem": origem})

            # 6. Disponibilidade e afirmações mensais/100%
            if re.search(r"disponibilidade|uptime", texto, re.IGNORECASE):
                for m in re.finditer(r"(\d+[.,]?\d*%)\s*(?:mensal|nas\s+baterias|de\s+uptime|aferid[oa])?", texto, re.IGNORECASE):
                    metricas["disponibilidade"].append({"valor": m.group(0).strip(), "trecho": texto[:140], "origem": origem})

            # 7. Latência p95
            if re.search(r"\bp95\b", texto, re.IGNORECASE):
                metricas["latencia_p95"].append({"valor": texto[:120], "trecho": texto[:140], "origem": origem})

            # 8. Cobertura de testes
            if re.search(r"cobertura\s+de\s+(?:testes|fluxos|c[óo]digo|rotas)", texto, re.IGNORECASE):
                metricas["cobertura"].append({"valor": texto[:120], "trecho": texto[:140], "origem": origem})

            # 9. IDs de Casos de Teste e Requisitos
            for m in re.finditer(r"\b(CT-\d{2}|FE-\d{2}|BE-\d{2}|QA-\d{2}|FA-\d{2}|GE-\d{2}|OF-\d{2}|PR-\d{2})\b", texto):
                metricas["ids_casos_teste"].append({"valor": m.group(1), "trecho": texto[:100], "origem": origem})

            for m in re.finditer(r"\b(RF-\d{2})\b", texto):
                metricas["requisitos_rf"].append({"valor": m.group(1), "trecho": texto[:100], "origem": origem})

            for m in re.finditer(r"\b(RNF-\d{2}|RQ-\d{2})\b", texto):
                metricas["requisitos_rnf_rq"].append({"valor": m.group(1), "trecho": texto[:100], "origem": origem})

            # 10. Referências bibliográficas ou links de arquivos
            if any(termo in texto for termo in ("ABNT", "ISO/IEC 25010", "13.709", "OWASP", "SOMMERVILLE", "PRESSMAN", "Roteiro_de_Atividade_Pratica")):
                if texto not in doc_info.referencias:
                    doc_info.referencias.append(texto)

        doc_info.metricas_detectadas = metricas

    def inspecionar_repositorio_codigo(self, diretorio_raiz: str = ".") -> Dict[str, Any]:
        """
        Extrai a verdade factual verificável diretamente do código-fonte (src/ e public/)
        para servir como base empírica da auditoria (sem inventar dados).
        """
        raiz = Path(diretorio_raiz)
        src_dir = raiz / "src"
        docs_dir = raiz / "docs"

        suites_teste: Dict[str, int] = {}
        total_testes_codigo = 0
        if src_dir.exists():
            for arq_teste in sorted(src_dir.glob("*.test.js")):
                conteudo = arq_teste.read_text(encoding="utf-8", errors="replace")
                qtd = len(re.findall(r"^\s*test\s*\(", conteudo, re.MULTILINE))
                suites_teste[f"src/{arq_teste.name}"] = qtd
                total_testes_codigo += qtd

        # Inspeciona tabelas reais em src/db.js
        tabelas_reais: List[str] = []
        bcrypt_rounds_db = None
        db_file = src_dir / "db.js"
        if db_file.exists():
            db_code = db_file.read_text(encoding="utf-8", errors="replace")
            for m in re.finditer(r"CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_]+)", db_code, re.IGNORECASE):
                nome_tab = m.group(1)
                if nome_tab not in tabelas_reais:
                    tabelas_reais.append(nome_tab)
            m_hash = re.search(r"bcrypt\.hash\([^,]+,\s*(\d+)\)", db_code)
            if m_hash:
                bcrypt_rounds_db = int(m_hash.group(1))

        # Inspeciona SameSite real em src/auth.js
        samesite_real = None
        auth_file = src_dir / "auth.js"
        if auth_file.exists():
            auth_code = auth_file.read_text(encoding="utf-8", errors="replace")
            m_ss = re.search(r'sameSite:\s*["\']([a-zA-Z]+)["\']', auth_code)
            if m_ss:
                samesite_real = m_ss.group(1).capitalize()

        # Verifica se o PDF oficial do roteiro existe em docs/
        pdf_roteiro = docs_dir / "Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf"

        return {
            "suites_no_codigo": suites_teste,
            "total_suites_no_codigo": len(suites_teste),
            "total_testes_no_codigo": total_testes_codigo,
            "tabelas_reais_db": tabelas_reais,
            "bcrypt_rounds_real": bcrypt_rounds_db or 12,
            "samesite_cookie_real": samesite_real or "Lax",
            "pdf_roteiro_presente_no_disco": pdf_roteiro.exists()
        }
