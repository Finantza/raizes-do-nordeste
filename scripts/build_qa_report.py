# -*- coding: utf-8 -*-
"""
Gerador do Relatório de Testes da Linha de Qualidade de Software (QA & ISO/IEC 25010)
Gera:
  - docs/relatorio-testes-qualidade-software.docx
  - docs/relatorio-testes-qualidade-software.doc
  - relatorio-testes-qualidade-software.docx
  - relatorio-testes-qualidade-software.doc
"""

import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls


def build_qa_test_report():
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(1.18)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(1.18)
        section.right_margin = Inches(0.79)

        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Relatório de Testes da Linha de Qualidade de Software (QA) | Rede 'Raízes do Nordeste'")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(128, 128, 128)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("UNINTER - 2026 | Garantia da Qualidade de Software (ISO/IEC 25010, LGPD e OWASP)")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(128, 128, 128)

    COLOR_PRIMARY = RGBColor(156, 56, 30)
    COLOR_SECONDARY = RGBColor(30, 58, 95)
    COLOR_DARK = RGBColor(34, 34, 34)
    HEX_PRIMARY = "9C381E"
    HEX_ZEBRA = "FBF9F7"

    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/>'
            f'<w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    def set_table_borders(table, color="D0D0D0", sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(14)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_p(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.bold = True
            rb.font.name = "Calibri"
            rb.font.size = Pt(10.5)
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10.5)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(2)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.bold = True
            rb.font.name = "Calibri"
            rb.font.size = Pt(10)
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_table(col_widths, headers, rows_data):
        table = doc.add_table(rows=1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table)
        hdr = table.rows[0].cells
        for i, h_text in enumerate(headers):
            hdr[i].text = h_text
            hdr[i].width = Inches(col_widths[i])
            set_cell_background(hdr[i], HEX_PRIMARY)
            set_cell_margins(hdr[i], top=100, bottom=100)
            for run in hdr[i].paragraphs[0].runs:
                run.bold = True
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(255, 255, 255)
        for r_idx, r_vals in enumerate(rows_data):
            row = table.add_row().cells
            bg = HEX_ZEBRA if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(r_vals):
                row[c_idx].text = str(val)
                row[c_idx].width = Inches(col_widths[c_idx])
                set_cell_background(row[c_idx], bg)
                set_cell_margins(row[c_idx])
                for run in row[c_idx].paragraphs[0].runs:
                    run.font.name = "Calibri"
                    run.font.size = Pt(8.5)
                    run.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(6)
    rt = p_title.add_run("RELATÓRIO DE TESTES DA LINHA DE QUALIDADE DE SOFTWARE (QA)\nREDE 'RAÍZES DO NORDESTE'")
    rt.bold = True
    rt.font.name = "Calibri"
    rt.font.size = Pt(15.5)
    rt.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)
    rs = p_sub.add_run(
        "Centro Universitário Internacional UNINTER - Projeto Multidisciplinar: Qualidade de Software (2026)\n"
        "Acadêmico: Ronaldo Coutinho | Docente: Prof. Me. Rodrigo Nascimento"
    )
    rs.font.name = "Calibri"
    rs.font.size = Pt(10)
    rs.font.color.rgb = COLOR_SECONDARY

    add_h1("1. Resumo Executivo da Garantia da Qualidade de Software (QA)")
    add_p(
        "Este documento consolida todos os testes, métricas, matrizes de rastreabilidade e evidências empíricas "
        "da linha de Qualidade de Software (QA) do projeto 'Raízes do Nordeste'. A validação abrange os 8 requisitos "
        "não funcionais mensuráveis da norma ABNT NBR ISO/IEC 25010, os 8 requisitos funcionais de negócio, a proteção "
        "contra os principais riscos OWASP Top 10, a conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) "
        "e a execução automatizada integral de 57 casos de teste distribuídos em 8 suítes especializadas."
    )

    add_table(
        [2.5, 4.0],
        ["Parâmetro Consolidado de QA", "Resultado Aferido na Bateria Oficial"],
        [
            ["Total de Suítes Automatizadas no Projeto", "8 suítes (qualidade, backend, frontend, faults, app, gestao, offline, products)"],
            ["Total de Casos de Teste Automatizados", "57 testes executados - 57 aprovados (0 falhas / 100% de sucesso)"],
            ["Suíte Específica ISO/IEC 25010 (src/qualidade.test.js)", "7 auditorias de atributos de qualidade - 7 aprovadas (0 falhas)"],
            ["Validação Sintática Estática (node --check)", "9 de 9 scripts do frontend aprovados sem erros"],
            ["Integridade Física do Banco SQLite (WAL Mode)", "PRAGMA integrity_check = ok | PRAGMA foreign_key_check = 0 violações"],
            ["Densidade de Defeitos Críticos Pendentes", "0% (todos os bugs identificados nas fases de auditoria foram corrigidos)"],
            ["Autonomia e Resiliência Offline", "100% dos recursos estáticos, imagens e banco operando sem CDNs externos"]
        ]
    )

    add_h1("2. Aferição Automatizada dos 8 Requisitos de Qualidade (ISO/IEC 25010)")
    add_p(
        "A suíte src/qualidade.test.js executa medições diretas sobre a funcionalidade crítica de Processamento "
        "Transacional de Pedidos Multicanal e Gestão Integrada:"
    )

    add_table(
        [0.7, 1.3, 1.8, 1.5, 1.2],
        ["ID", "Atributo ISO 25010", "Meta / Critério de Aceitação", "Resultado Medido em Teste", "Situação"],
        [
            ["RQ-01", "Desempenho", "Latência p95 < 1500 ms em lote de 20 pedidos consecutivos", "Aprovado em QA-01 (p95 < 150 ms; média < 50 ms)", "HOMOLOGADO"],
            ["RQ-02", "Disponibilidade", "Uptime >= 99,5% e cabeçalho Cache-Control: no-store na API", "Aprovado em QA-02 (100% em 25 sondagens contínuas)", "HOMOLOGADO"],
            ["RQ-03", "Segurança (Anti-Fraude)", "Descarte total de preços/descontos manipulados pelo cliente", "Aprovado em QA-03 (total R$ 0,02 recalculado para R$ 116,88)", "HOMOLOGADO"],
            ["RQ-04", "Usabilidade", "Checkout em <= 3 passos e login demonstrativo em 1 clique", "Aprovado em QA-04 (fluxo direto e 3 botões demo validados)", "HOMOLOGADO"],
            ["RQ-05", "Confiabilidade", "Idempotência de migração (legacyId) e integridade ACID SQLite", "Aprovado em QA-05 (3 envios = 1 registro; integrity_check = ok)", "HOMOLOGADO"],
            ["RQ-06", "Compatibilidade", "Responsividade de 320px a 1920px e suporte a reduced-motion", "Aprovado em QA-04 e FE-08 (breakpoints CSS verificados)", "HOMOLOGADO"],
            ["RQ-07", "Observabilidade e LGPD", "Erros JSON padronizados sem vazar senhas, hashes ou stack trace", "Aprovado em QA-06 (0 vazamentos em respostas 201/400/404)", "HOMOLOGADO"],
            ["RQ-08", "Manutenibilidade", "Execução automatizada de toda a suíte e presença dos artefatos", "Aprovado em QA-07 (15 artefatos de documentação e 57 testes OK)", "HOMOLOGADO"]
        ]
    )

    add_h1("3. Visão Consolidada das 8 Suítes de Testes Automatizados (57 Testes)")
    add_table(
        [1.7, 0.9, 2.8, 1.1],
        ["Arquivo de Suíte", "Qtd. Testes", "Escopo Principal de Verificação", "Status"],
        [
            ["src/qualidade.test.js", "7", "Auditoria dos 8 requisitos mensuráveis ISO/IEC 25010 (desempenho p95, disponibilidade, anti-fraude, usabilidade, idempotência, observabilidade/LGPD e governança documental)", "7 / 7 OK"],
            ["src/backend.test.js", "6", "Testes profundos de backend: repositório db.js, assinatura HMAC em auth.js, CRUD com Base64, consolidação e baixa automática de estoque em pedidos, filtros financeiros e isolamento entre clientes", "6 / 6 OK"],
            ["src/frontend.test.js", "8", "Testes de todos os 9 scripts de public/ e 5 páginas HTML: carrossel, login demo, bloqueio LGPD, controles [+] e [-] do carrinho, bloqueio de esgotados, painéis admin/loja e abas de gestão", "8 / 8 OK"],
            ["src/faults.test.js", "7", "Testes negativos, casos de borda e estresse: JSON truncado, CORS, Prototype Pollution, coerção de tipos (null/boolean/''), datas impossíveis (31/02), SQLi, Path Traversal, Payload > 1MB (413) e 40 reqs concorrentes", "7 / 7 OK"],
            ["src/app.test.js", "14", "Integração da API Express: Helmet/CSP, imagens estáticas, unidades com token 32+ bytes (fail-closed 503), registro/login/logout, rate limit (HTTP 429), RBAC, XSS e persistência após reconexão", "14 / 14 OK"],
            ["src/gestao.test.js", "5", "Regras de negócio e autorização RBAC dos módulos internos de Controle de Estoque (/api/estoque/*) e Contas a Pagar e Receber (/api/financeiro/*)", "5 / 5 OK"],
            ["src/offline.test.js", "6", "Resiliência e autonomia 100% offline: fallback automático de 100 produtos sem rede, zero CDNs externos em HTML/CSS, 100 imagens físicas no disco e paridade matemática de preços", "6 / 6 OK"],
            ["src/products.test.js", "4", "Testes unitários do catálogo: 100 produtos únicos, 21 combos com itensInclusos, mesclagem não destrutiva (mergeRaizesProducts) e escape HTML anti-XSS", "4 / 4 OK"]
        ]
    )

    add_h1("4. Matriz de Rastreabilidade Bidirecional Completa (Requisito ↔ Suítes ↔ Evidência)")
    add_table(
        [0.9, 2.1, 2.3, 1.2],
        ["Requisito", "Suítes e Casos de Teste Vinculados", "Evidência Técnica Comprovada", "Situação"],
        [
            ["RF-01 (Unidades)", "app.test (CT-03..06), faults.test (FA-03)", "Cadastro 201, duplicado 409, sem token 401, token fraco 503 e validação UF", "100% Coberto"],
            ["RF-02 (Catálogo/Combos)", "products.test (PR-01..04), backend.test (BE-01, BE-03), frontend.test (FE-01)", "100 produtos únicos, 21 combos, CRUD com Base64 e 100 imagens locais", "100% Coberto"],
            ["RF-03 (Cadastro/LGPD)", "app.test (CT-07), faults.test (FA-02), frontend.test (FE-04), qualidade.test (QA-06)", "Consentimento LGPD obrigatório no front/back, hash bcrypt (12 rounds) e zero vazamento", "100% Coberto"],
            ["RF-04 (Sessão/RBAC)", "app.test (CT-08..11), backend.test (BE-02, BE-06), frontend.test (FE-02)", "Cookies HttpOnly assinados HMAC, rate limit 429 e isolamento por perfil", "100% Coberto"],
            ["RF-05 (Pedidos Multicanal)", "app.test (CT-13), faults.test (FA-05), backend.test (BE-04), frontend.test (FE-05), qualidade.test (QA-03)", "5 canais (WEB, APP, TOTEM, BALCAO, PICKUP), recálculo no servidor e baixa automática de estoque", "100% Coberto"],
            ["RF-06 (Status do Pedido)", "app.test (CT-13), faults.test (FA-05), frontend.test (FE-07)", "Transições de status por loja/admin e bloqueio 403 para clientes", "100% Coberto"],
            ["RF-07 (Estoque Auditado)", "gestao.test (GE-01..02), faults.test (FA-06..07), backend.test (BE-04)", "Entradas, saídas, ajuste zero, transações atômicas e histórico de auditoria", "100% Coberto"],
            ["RF-08 (Financeiro)", "gestao.test (GE-03..04), faults.test (FA-06), backend.test (BE-05)", "Contas a pagar/receber, filtros combinados, datas ISO reais, baixa e estorno", "100% Coberto"],
            ["RQ-01 a RQ-08 (ISO 25010)", "qualidade.test (QA-01..07), offline.test (OF-01..06), faults.test (FA-07)", "Latência p95 < 1500ms, uptime 100%, anti-fraude, idempotência e operação 100% offline", "100% Coberto"]
        ]
    )

    add_h1("5. Parecer Final da Engenharia de Qualidade")
    add_p(
        "Com 57 testes automatizados aprovados (0 falhas) em 8 suítes complementares, validação sintática integral "
        "dos scripts, transações ACID verificadas com PRAGMA integrity_check e documentação técnica alinhada ao Roteiro "
        "Prático UNINTER 2026, o sistema 'Raízes do Nordeste' encontra-se integralmente homologado na trilha de "
        "Qualidade de Software."
    )

    os.makedirs("docs", exist_ok=True)
    docx_docs = os.path.join("docs", "relatorio-testes-qualidade-software.docx")
    doc_docs = os.path.join("docs", "relatorio-testes-qualidade-software.doc")
    doc.save(docx_docs)
    shutil.copyfile(docx_docs, doc_docs)
    shutil.copyfile(docx_docs, "relatorio-testes-qualidade-software.docx")
    shutil.copyfile(docx_docs, "relatorio-testes-qualidade-software.doc")
    print(f"[OK] Relatórios Word de Qualidade de Software gerados: {doc_docs}, {docx_docs} e cópias na raiz.")


if __name__ == "__main__":
    build_qa_test_report()
