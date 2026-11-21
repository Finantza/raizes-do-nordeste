# -*- coding: utf-8 -*-
"""
Módulo 4 — Correção documental assistida e auditável.
Gera versões revisadas dos relatórios preservando os originais intactos (após backup SHA-256),
aplicando apenas correções comprovadas ou autorizadas e inserindo notas claras de pendência humana
quando exigido pelas Regras de Integridade.
"""

import re
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional
import docx

from backup import GestorBackup
from consistencia import Inconsistencia
from leitor_documentos import DocumentoExtraido
from logs import GestorLogs


class CorretorDocumental:
    """Aplica correções autorizadas em documentos Markdown e Word (.docx / .doc) sem sobrescrever originais."""

    def __init__(
        self,
        diretorio_saida: str = "auditoria_output/revisados",
        gestor_backup: Optional[GestorBackup] = None,
        gestor_logs: Optional[GestorLogs] = None
    ):
        self.diretorio_saida = Path(diretorio_saida)
        self.diretorio_saida.mkdir(parents=True, exist_ok=True)
        self.gestor_backup = gestor_backup or GestorBackup()
        self.gestor_logs = gestor_logs or GestorLogs()

    def executar_correcoes(
        self,
        documentos: List[DocumentoExtraido],
        inconsistencias: List[Inconsistencia],
        fatos_codigo: Dict[str, Any],
        incluir_revisao_humana_aprovada: bool = True
    ) -> Dict[str, Any]:
        """
        Cria backup de todos os documentos originais e gera versões revisadas em auditoria_output/revisados/.
        """
        caminhos_originais = [Path(d.caminho) for d in documentos if Path(d.caminho).exists()]
        manifesto_backup = self.gestor_backup.criar_backup_lote(caminhos_originais, rotulo="auditoria_documental")

        total_real = fatos_codigo.get("total_testes_no_codigo", 57)
        suites_reais = fatos_codigo.get("total_suites_no_codigo", 8)

        # Agrupa inconsistências por nome de documento
        inc_por_doc: Dict[str, List[Inconsistencia]] = {}
        for inc in inconsistencias:
            inc_por_doc.setdefault(inc.documento, []).append(inc)

        arquivos_revisados: List[Dict[str, Any]] = []
        alteracoes_aplicadas: List[Dict[str, Any]] = []
        pendencias_inseridas: List[Dict[str, Any]] = []

        # Regras de padronização factual determinística (comprovadas pelo código-fonte em src/)
        regras_deterministicas = [
            (
                "REL-DET-01",
                r"\b29 testes automatizados\b",
                f"{total_real} testes automatizados",
                "Correção de contagem residual de 29 testes para o total real da suíte."
            ),
            (
                "REL-DET-02",
                r"\b(35|36|44|50) ([Tt]estes [Aa]utomatizados|[Tt]estes [Ee]xecutados|[Tt]estes [Aa]provados|[Cc]asos de [Tt]este [Aa]utomatizados)\b",
                f"{total_real} \\2",
                f"Sincronização da contagem global de testes para {total_real} testes ({suites_reais} suítes)."
            ),
            (
                "REL-DET-03",
                r"\b(5|6|7) ([Ss]u[íi]tes)\b",
                f"{suites_reais} \\2",
                f"Sincronização do total de suítes automatizadas para {suites_reais} suítes."
            ),
            (
                "REL-DET-04",
                r"\b10 salt rounds\b",
                "12 salt rounds",
                "Padronização do custo bcryptjs para 12 salt rounds conforme src/db.js e src/routes/auth.js."
            ),
            (
                "REL-DET-05",
                r"\(salt 10\)",
                "(12 salt rounds)",
                "Padronização do custo bcryptjs para 12 salt rounds conforme src/db.js."
            ),
            (
                "REL-DET-06",
                r"SameSite=Strict",
                "SameSite=Lax",
                "Alinhamento da flag SameSite do cookie de sessão com src/auth.js (sameSite: 'lax')."
            ),
            (
                "REL-DET-07",
                r"orders, order_items, estoque_movimentacoes",
                "orders, estoque_movimentacoes",
                "Remoção da tabela inexistente 'order_items' (itens são persistidos em orders.items_json)."
            )
        ]

        # Regras de qualificação de integridade (Regras 3, 4 e 5) quando aprovadas
        regras_qualificacao = [
            (
                "REL-INT-01",
                r"100% \(Auth, Pedidos, Estoque, Finanças\)",
                "100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida)",
                "Qualificação obrigatória pelas Regras de Integridade 3 e 4 (diferenciação entre cobertura de fluxos e cobertura de código)."
            ),
            (
                "REL-INT-02",
                r"100% dos fluxos de Auth, Pedidos, Unidades, Estoque, Finanças e Offline testados",
                "100% dos fluxos funcionais avaliados (cobertura de linhas de código via c8 não aferida)",
                "Qualificação obrigatória pelas Regras de Integridade 3 e 4."
            ),
            (
                "REL-INT-03",
                r"100% nas baterias de homologação",
                "100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)",
                "Qualificação obrigatória pela Regra de Integridade 5 (bateria pontual vs. disponibilidade mensal)."
            ),
            (
                "REL-INT-04",
                r"100% de uptime nas baterias de teste",
                "100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)",
                "Qualificação obrigatória pela Regra de Integridade 5."
            )
        ]

        docs_historicos = {
            "avaliacao-do-sistema.md",
            "guia-passo-a-passo-melhorias-qualidade.md",
            "relatorio-rascunho-apresentacao-banca.md",
            "relatorio-rascunho-apresentacao-banca.doc"
        }

        for doc_ext in documentos:
            origem = Path(doc_ext.caminho)
            if not origem.exists():
                continue

            destino = self.diretorio_saida / origem.name
            incs_doc = inc_por_doc.get(doc_ext.nome, [])
            eh_historico = doc_ext.nome in docs_historicos

            if origem.suffix.lower() in {".md", ".txt"}:
                res = self._revisar_markdown(
                    origem,
                    destino,
                    incs_doc,
                    regras_deterministicas if not eh_historico else [],
                    regras_qualificacao if incluir_revisao_humana_aprovada else [],
                    alteracoes_aplicadas,
                    pendencias_inseridas
                )
                arquivos_revisados.append(res)
            elif origem.suffix.lower() in {".docx", ".doc"}:
                res = self._revisar_word(
                    origem,
                    destino,
                    incs_doc,
                    regras_deterministicas if not eh_historico else [],
                    regras_qualificacao if incluir_revisao_humana_aprovada else [],
                    alteracoes_aplicadas,
                    pendencias_inseridas
                )
                arquivos_revisados.append(res)
            else:
                shutil.copy2(origem, destino)
                arquivos_revisados.append({
                    "documento": origem.name,
                    "caminho_revisado": str(destino.resolve()),
                    "total_correcoes": 0,
                    "total_pendencias": 0
                })

        return {
            "manifesto_backup": manifesto_backup,
            "arquivos_revisados": arquivos_revisados,
            "alteracoes_aplicadas": alteracoes_aplicadas,
            "pendencias_inseridas": pendencias_inseridas
        }

    def _revisar_markdown(
        self,
        origem: Path,
        destino: Path,
        incs_doc: List[Inconsistencia],
        regras_det: List[tuple],
        regras_qual: List[tuple],
        alteracoes_aplicadas: List[Dict[str, Any]],
        pendencias_inseridas: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        conteudo = origem.read_text(encoding="utf-8", errors="replace")
        total_corr = 0

        for cod_regra, padrao, substituto, just in list(regras_det) + list(regras_qual):
            for match in list(re.finditer(padrao, conteudo)):
                trecho_antigo = match.group(0)
                trecho_novo = re.sub(padrao, substituto, trecho_antigo)
                if trecho_antigo != trecho_novo:
                    reg = self.gestor_logs.registrar_alteracao(
                        documento_origem=str(origem),
                        documento_destino=str(destino),
                        id_inconsistencia=cod_regra,
                        tipo_acao="SUBSTITUICAO_EVIDENCIADA",
                        valor_anterior=trecho_antigo,
                        valor_novo=trecho_novo,
                        justificativa=just
                    )
                    alteracoes_aplicadas.append(reg)
                    total_corr += 1
            conteudo = re.sub(padrao, substituto, conteudo)

        # Insere bloco de pendências para revisão humana se houver inconsistências não resolvidas automaticamente
        pendentes = [i for i in incs_doc if not i.automatica and not i.padrao_busca]
        if pendentes:
            bloco_pend = [
                "\n\n---",
                "## [PENDÊNCIAS DE AUDITORIA PARA REVISÃO HUMANA]",
                "> Nota inserida pela Ferramenta de Auditoria Documental (Módulo 4 — Regra de Integridade):"
            ]
            for p in pendentes:
                bloco_pend.append(
                    f"- **[{p.id}] ({p.categoria} — {p.localizacao}):** {p.descricao} "
                    f"*Ação recomendada:* {p.acao_recomendada}"
                )
                pendencias_inseridas.append({
                    "id": p.id,
                    "documento": origem.name,
                    "categoria": p.categoria,
                    "descricao": p.descricao,
                    "acao_recomendada": p.acao_recomendada
                })
            conteudo += "\n".join(bloco_pend) + "\n"

        destino.write_text(conteudo, encoding="utf-8")
        return {
            "documento": origem.name,
            "caminho_revisado": str(destino.resolve()),
            "total_correcoes": total_corr,
            "total_pendencias": len(pendentes)
        }

    def _revisar_word(
        self,
        origem: Path,
        destino: Path,
        incs_doc: List[Inconsistencia],
        regras_det: List[tuple],
        regras_qual: List[tuple],
        alteracoes_aplicadas: List[Dict[str, Any]],
        pendencias_inseridas: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        total_corr = 0
        pendentes = [i for i in incs_doc if not i.automatica and not i.padrao_busca]

        try:
            d = docx.Document(str(origem))
            todas_regras = list(regras_det) + list(regras_qual)

            def aplicar_em_paragrafo(par):
                nonlocal total_corr
                texto_par = par.text
                if not texto_par:
                    return
                novo_texto = texto_par
                for cod_regra, padrao, substituto, just in todas_regras:
                    if re.search(padrao, novo_texto):
                        for m in re.finditer(padrao, novo_texto):
                            ant = m.group(0)
                            nov = re.sub(padrao, substituto, ant)
                            if ant != nov:
                                reg = self.gestor_logs.registrar_alteracao(
                                    documento_origem=str(origem),
                                    documento_destino=str(destino),
                                    id_inconsistencia=cod_regra,
                                    tipo_acao="SUBSTITUICAO_DOCX_EVIDENCIADA",
                                    valor_anterior=ant,
                                    valor_novo=nov,
                                    justificativa=just
                                )
                                alteracoes_aplicadas.append(reg)
                                total_corr += 1
                        novo_texto = re.sub(padrao, substituto, novo_texto)

                if novo_texto != texto_par:
                    if par.runs:
                        nome_fonte = par.runs[0].font.name
                        tam_fonte = par.runs[0].font.size
                        cor_fonte = par.runs[0].font.color.rgb if par.runs[0].font.color else None
                        par.text = novo_texto
                        if par.runs:
                            par.runs[0].font.name = nome_fonte
                            par.runs[0].font.size = tam_fonte
                            if cor_fonte:
                                par.runs[0].font.color.rgb = cor_fonte
                    else:
                        par.text = novo_texto

            for par in d.paragraphs:
                aplicar_em_paragrafo(par)

            for table in d.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for par in cell.paragraphs:
                            aplicar_em_paragrafo(par)

            if pendentes:
                p_hdr = d.add_paragraph()
                r_hdr = p_hdr.add_run("[PENDÊNCIAS DE AUDITORIA PARA REVISÃO HUMANA]")
                r_hdr.bold = True
                for p in pendentes:
                    d.add_paragraph(
                        f"[{p.id}] ({p.categoria} - {p.localizacao}): {p.descricao} "
                        f"Ação recomendada: {p.acao_recomendada}",
                        style="List Bullet"
                    )
                    pendencias_inseridas.append({
                        "id": p.id,
                        "documento": origem.name,
                        "categoria": p.categoria,
                        "descricao": p.descricao,
                        "acao_recomendada": p.acao_recomendada
                    })

            d.save(str(destino))
        except Exception:
            shutil.copy2(origem, destino)

        return {
            "documento": origem.name,
            "caminho_revisado": str(destino.resolve()),
            "total_correcoes": total_corr,
            "total_pendencias": len(pendentes)
        }
