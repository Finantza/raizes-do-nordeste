# -*- coding: utf-8 -*-
"""
Módulo 6 — Exportação multi-formato (DOCX, PDF nativo, XLSX OpenXML nativo, CSV e JSON).
Não requer Microsoft Office ou motores externos instalados no Windows para gerar PDF e XLSX válidos.
"""

import csv
import json
import re
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from xml.sax.saxutils import escape as xml_escape

import docx


class ExportadorAuditoria:
    """Exporta relatórios individuais e consolidados em PDF, XLSX, CSV e JSON."""

    def __init__(self, diretorio_base: str = "auditoria_output", logger=None):
        self.diretorio_base = Path(diretorio_base)
        self.dir_relatorios = self.diretorio_base / "relatorios"
        self.dir_revisados = self.diretorio_base / "revisados"
        self.dir_relatorios.mkdir(parents=True, exist_ok=True)
        self.dir_revisados.mkdir(parents=True, exist_ok=True)
        self.logger = logger

    def exportar_tudo(
        self,
        dados_consolidados: Dict[str, Any],
        caminho_consolidado_docx: Path
    ) -> Dict[str, str]:
        """Gera todos os artefatos exigidos no Módulo 6: CSV, XLSX, JSON, PDFs individuais e PDF consolidado."""
        caminho_csv = self.dir_relatorios / "inconsistencias_identificadas.csv"
        self.exportar_csv_inconsistencias(dados_consolidados["inconsistencias"], caminho_csv)

        caminho_xlsx = self.dir_relatorios / "planilha_auditoria_qa.xlsx"
        self.exportar_xlsx_auditoria(dados_consolidados, caminho_xlsx)

        caminho_registro = self.dir_relatorios / "registro_alteracoes_realizadas.json"
        with open(caminho_registro, "w", encoding="utf-8") as f:
            json.dump(dados_consolidados["alteracoes"], f, ensure_ascii=False, indent=2)

        # Gera PDF do relatório consolidado
        caminho_consolidado_pdf = self.dir_relatorios / "relatorio-consolidado-auditoria.pdf"
        self.converter_docx_para_pdf(caminho_consolidado_docx, caminho_consolidado_pdf)

        # Gera PDFs individuais para todos os documentos revisados (.docx e .md)
        pdfs_individuais = []
        for arq_rev in sorted(self.dir_revisados.iterdir()):
            if arq_rev.suffix.lower() == ".docx":
                pdf_dest = self.dir_revisados / f"{arq_rev.stem}.pdf"
                self.converter_docx_para_pdf(arq_rev, pdf_dest)
                pdfs_individuais.append(str(pdf_dest.resolve()))
            elif arq_rev.suffix.lower() == ".md":
                pdf_dest = self.dir_revisados / f"{arq_rev.stem}.pdf"
                linhas = arq_rev.read_text(encoding="utf-8", errors="replace").splitlines()
                self.gerar_pdf_nativo(f"Documento Revisado: {arq_rev.name}", linhas, pdf_dest)
                pdfs_individuais.append(str(pdf_dest.resolve()))

        resumo_exportacao = {
            "relatorio_consolidado_docx": str(caminho_consolidado_docx.resolve()),
            "relatorio_consolidado_pdf": str(caminho_consolidado_pdf.resolve()),
            "planilha_auditoria_xlsx": str(caminho_xlsx.resolve()),
            "inconsistencias_csv": str(caminho_csv.resolve()),
            "registro_alteracoes_json": str(caminho_registro.resolve()),
            "total_pdfs_individuais": str(len(pdfs_individuais))
        }

        if self.logger:
            self.logger.info(
                f"Exportação concluída: Consolidado DOCX/PDF, Planilha XLSX, CSV e {len(pdfs_individuais)} PDFs individuais."
            )
        return resumo_exportacao

    def exportar_csv_inconsistencias(self, inconsistencias: List[Any], destino: Path) -> Path:
        """Exporta arquivo CSV com BOM UTF-8 (compatível com Excel em português no Windows)."""
        with open(destino, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f, delimiter=";")
            writer.writerow([
                "ID", "Severidade", "Categoria", "Documento", "Localizacao",
                "Descricao", "Evidencia_Encontrada", "Valor_Referencia_Factual",
                "Acao_Recomendada", "Modo_Correcao"
            ])
            for inc in inconsistencias:
                writer.writerow([
                    inc.id,
                    inc.severidade,
                    inc.categoria,
                    inc.documento,
                    inc.localizacao,
                    inc.descricao,
                    inc.evidencia_encontrada,
                    inc.valor_referencia_factual,
                    inc.acao_recomendada,
                    "Automática" if inc.automatica else "Revisão Humana"
                ])
        return destino

    def exportar_xlsx_auditoria(self, dados: Dict[str, Any], destino: Path) -> Path:
        """
        Gera um arquivo Excel OpenXML (.xlsx) válido com 4 abas:
        1. Inconsistencias
        2. Conformidade_Roteiro
        3. Correcoes_Aplicadas
        4. Documentos_Auditados
        """
        abas = [
            (
                "Inconsistencias",
                ["ID", "Severidade", "Categoria", "Documento", "Localizacao", "Evidencia Encontrada", "Valor Factual", "Tipo", "Descricao"],
                [
                    [
                        i.id, i.severidade, i.categoria, i.documento, i.localizacao,
                        i.evidencia_encontrada, i.valor_referencia_factual,
                        "Automática" if i.automatica else "Revisão Humana", i.descricao
                    ]
                    for i in dados["inconsistencias"]
                ]
            ),
            (
                "Conformidade_Roteiro",
                ["Codigo", "Item do Roteiro UNINTER", "Status", "Documentos Comprobatorios", "Evidencia Verificada", "Complemento Necessario"],
                [
                    [
                        r.codigo, r.item_roteiro, r.status, r.documentos_comprobatorios,
                        r.evidencia_verificada, r.complemento_necessario
                    ]
                    for r in dados["itens_roteiro"]
                ]
            ),
            (
                "Correcoes_Aplicadas",
                ["Timestamp", "ID Regra", "Documento Revisado", "Tipo Acao", "Valor Anterior", "Valor Novo", "Justificativa"],
                [
                    [
                        a["timestamp"], a["id_inconsistencia"], Path(a["documento_destino"]).name,
                        a["tipo_acao"], a["valor_anterior"], a["valor_novo"], a["justificativa"]
                    ]
                    for a in dados["alteracoes"]
                ]
            ),
            (
                "Documentos_Auditados",
                ["Nome", "Formato", "Tamanho (Bytes)", "SHA-256", "Titulos", "Paragrafos", "Tabelas"],
                [
                    [
                        d.nome, d.formato, str(d.tamanho_bytes), d.sha256,
                        str(len(d.titulos)), str(len(d.paragrafos)), str(len(d.tabelas))
                    ]
                    for d in dados["documentos"]
                ]
            )
        ]

        self._escrever_pacote_xlsx(destino, abas)
        return destino

    @staticmethod
    def _col_letter(n: int) -> str:
        res = ""
        while n > 0:
            n, rem = divmod(n - 1, 26)
            res = chr(65 + rem) + res
        return res

    def _escrever_pacote_xlsx(self, destino: Path, abas: List[tuple]) -> None:
        """Constrói o pacote ZIP OpenXML (SpreadsheetML) para Excel (.xlsx)."""
        with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
            # [Content_Types].xml
            overrides = "\n".join(
                f'  <Override PartName="/xl/worksheets/sheet{idx}.xml" '
                f'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                for idx in range(1, len(abas) + 1)
            )
            content_types = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
{overrides}
</Types>"""
            z.writestr("[Content_Types].xml", content_types)

            # _rels/.rels
            rels_root = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""
            z.writestr("_rels/.rels", rels_root)

            # xl/workbook.xml
            sheets_xml = "\n".join(
                f'    <sheet name="{xml_escape(nome[:31])}" sheetId="{idx}" r:id="rId{idx}"/>'
                for idx, (nome, _, _) in enumerate(abas, start=1)
            )
            workbook_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
{sheets_xml}
  </sheets>
</workbook>"""
            z.writestr("xl/workbook.xml", workbook_xml)

            # xl/_rels/workbook.xml.rels
            wb_rels = "\n".join(
                f'  <Relationship Id="rId{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{idx}.xml"/>'
                for idx in range(1, len(abas) + 1)
            )
            Id_styles = len(abas) + 1
            workbook_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
{wb_rels}
  <Relationship Id="rId{Id_styles}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""
            z.writestr("xl/_rels/workbook.xml.rels", workbook_rels)

            # xl/styles.xml
            styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF9C381E"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>"""
            z.writestr("xl/styles.xml", styles_xml)

            # xl/worksheets/sheet{idx}.xml
            for idx, (_, cabecalhos, linhas) in enumerate(abas, start=1):
                todas_linhas = [cabecalhos] + linhas
                rows_xml = []
                for r_num, row_vals in enumerate(todas_linhas, start=1):
                    estilo = ' s="1"' if r_num == 1 else ""
                    cells_xml = []
                    for c_num, val in enumerate(row_vals, start=1):
                        ref = f"{self._col_letter(c_num)}{r_num}"
                        texto_limpo = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", str(val or ""))
                        cells_xml.append(
                            f'<c r="{ref}" t="inlineStr"{estilo}><is><t>{xml_escape(texto_limpo)}</t></is></c>'
                        )
                    rows_xml.append(f'    <row r="{r_num}">{"".join(cells_xml)}</row>')

                sheet_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
{chr(10).join(rows_xml)}
  </sheetData>
</worksheet>"""
                z.writestr(f"xl/worksheets/sheet{idx}.xml", sheet_xml)

    def converter_docx_para_pdf(self, caminho_docx: Path, caminho_pdf: Path) -> Path:
        """Extrai parágrafos e tabelas de um DOCX e gera um documento PDF 1.4 paginado nativo."""
        linhas_texto: List[str] = []
        try:
            d = docx.Document(str(caminho_docx))
            for par in d.paragraphs:
                t = par.text.strip()
                if t:
                    linhas_texto.append(t)
            for tab in d.tables:
                linhas_texto.append("-" * 85)
                for row in tab.rows:
                    celulas = [c.text.strip().replace("\n", " ") for c in row.cells]
                    linhas_texto.append(" | ".join(celulas))
                linhas_texto.append("-" * 85)
        except Exception as exc:
            linhas_texto.append(f"Documento: {caminho_docx.name} ({exc})")

        return self.gerar_pdf_nativo(caminho_docx.name, linhas_texto, caminho_pdf)

    def gerar_pdf_nativo(self, titulo: str, linhas_brutas: List[str], destino: Path) -> Path:
        """
        Escritor PDF 1.4 multipágina nativo em Python puro (com fonte Type1 Helvetica/WinAnsiEncoding).
        Não requer bibliotecas C ou impressoras virtuais externas.
        """
        # Quebra linhas longas em 95 colunas
        linhas_quebradas: List[str] = [f"DOCUMENTO: {titulo}", "=" * 90, ""]
        for linha in linhas_brutas:
            limpa = linha.replace("\t", "  ").strip()
            if not limpa:
                linhas_quebradas.append("")
                continue
            while len(limpa) > 95:
                corte = limpa.rfind(" ", 0, 95)
                if corte <= 0:
                    corte = 95
                linhas_quebradas.append(limpa[:corte])
                limpa = limpa[corte:].lstrip()
            linhas_quebradas.append(limpa)

        linhas_por_pagina = 52
        paginas: List[List[str]] = [
            linhas_quebradas[i:i + linhas_por_pagina]
            for i in range(0, max(1, len(linhas_quebradas)), linhas_por_pagina)
        ]

        def pdf_escape(s: str) -> bytes:
            # Converte caracteres Unicode para Windows-1252 (WinAnsiEncoding do PDF Type1)
            substituicoes = {
                "✔": "[OK]", "✓": "[OK]", "✕": "X", "•": "*", "—": "-", "–": "-",
                "“": '"', "”": '"', "‘": "'", "’": "'", "↔": "<->", "→": "->", "≤": "<=", "≥": ">="
            }
            for k, v in substituicoes.items():
                s = s.replace(k, v)
            b = s.encode("cp1252", errors="replace")
            b = b.replace(b"\\", b"\\\\").replace(b"(", b"\\(").replace(b")", b"\\)")
            return b

        objetos: List[bytes] = []

        # Obj 1: Catalog, Obj 2: Pages, Obj 3: Font Helvetica
        num_paginas = len(paginas)
        ids_paginas = [4 + i * 2 for i in range(num_paginas)]
        kids_str = " ".join(f"{pid} 0 R" for pid in ids_paginas)

        objetos.append(b"<< /Type /Catalog /Pages 2 0 R >>")
        objetos.append(f"<< /Type /Pages /Kids [{kids_str}] /Count {num_paginas} >>".encode("ascii"))
        objetos.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")

        for idx_p, linhas_pag in enumerate(paginas):
            page_id = 4 + idx_p * 2
            content_id = page_id + 1

            comandos = [b"BT", b"/F1 9.5 Tf", b"13 TL", b"42 790 Td"]
            for l_str in linhas_pag:
                comandos.append(b"(" + pdf_escape(l_str) + b") Tj T*")
            comandos.append(f"({idx_p + 1}/{num_paginas}) Tj".encode("ascii"))
            comandos.append(b"ET")
            stream_bytes = b"\n".join(comandos)

            obj_page = (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
                f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_id} 0 R >>"
            ).encode("ascii")
            obj_content = (
                f"<< /Length {len(stream_bytes)} >>\nstream\n".encode("ascii")
                + stream_bytes
                + b"\nendstream"
            )
            objetos.append(obj_page)
            objetos.append(obj_content)

        # Monta o arquivo PDF com tabela xref precisa
        buffer = bytearray(b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")
        offsets = [0]
        for i, obj in enumerate(objetos, start=1):
            offsets.append(len(buffer))
            buffer.extend(f"{i} 0 obj\n".encode("ascii"))
            buffer.extend(obj)
            buffer.extend(b"\nendobj\n")

        xref_pos = len(buffer)
        buffer.extend(f"xref\n0 {len(objetos) + 1}\n".encode("ascii"))
        buffer.extend(b"0000000000 65535 f \n")
        for off in offsets[1:]:
            buffer.extend(f"{off:010d} 00000 n \n".encode("ascii"))

        buffer.extend(
            f"trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
        )

        with open(destino, "wb") as f:
            f.write(buffer)
        return destino
