# -*- coding: utf-8 -*-
"""
Gerador Automatizado da Documentação Completa do Sistema em Padrão ABNT (NBR 14724 / NBR 6023 / ISO/IEC 25010).
Projeto: Rede 'Raízes do Nordeste' — UNINTER 2026 (Qualidade de Software).

Gera:
  1. docs/documentacao-completa-sistema-abnt.docx
  2. docs/documentacao-completa-sistema-abnt.doc
  3. docs/documentacao-completa-sistema-abnt.md
  4. documentacao-completa-sistema-abnt.docx (na raiz)
  5. documentacao-completa-sistema-abnt.doc (na raiz)
  6. docs/relatorio-de-desenvolvimento.docx / .doc / .md (sincronizados)
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.oxml import parse_xml
    from docx.oxml.ns import nsdecls
except ModuleNotFoundError:
    for candidate in (
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".venv", "Scripts", "python.exe"),
        r"C:\Program Files\Python315\python.exe",
    ):
        if os.path.exists(candidate) and os.path.normcase(candidate) != os.path.normcase(sys.executable):
            raise SystemExit(subprocess.call([candidate, *sys.argv]))
    raise


def create_report() -> None:
    doc = docx.Document()

    # Margens padrão ABNT NBR 14724: Superior 3,0 cm, Esquerda 3,0 cm, Direita 2,0 cm, Inferior 2,0 cm
    for section in doc.sections:
        section.top_margin = Inches(1.181)     # 3,0 cm
        section.bottom_margin = Inches(0.787)  # 2,0 cm
        section.left_margin = Inches(1.181)    # 3,0 cm
        section.right_margin = Inches(0.787)   # 2,0 cm

        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Documentação Técnica Completa (Padrão ABNT) | Sistema Rede 'Raízes do Nordeste'")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(110, 110, 110)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("UNINTER - Curitiba/PR - 2026 | Engenharia e Qualidade de Software (ABNT NBR 14724 / ISO/IEC 25010)")
        frun.font.name = "Arial"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(110, 110, 110)

    COLOR_PRIMARY = RGBColor(156, 56, 30)      # Terracota #9C381E
    COLOR_SECONDARY = RGBColor(30, 58, 95)     # Azul Institucional #1E3A5F
    COLOR_DARK = RGBColor(25, 25, 25)          # Texto principal
    COLOR_MUTED = RGBColor(95, 95, 95)
    HEX_PRIMARY = "9C381E"
    HEX_BG_LIGHT = "F7F4F0"
    HEX_ZEBRA = "FBF9F7"

    def set_cell_background(cell, fill_hex: str) -> None:
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

    def set_cell_margins(cell, top=90, bottom=90, left=130, right=130) -> None:
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        ))

    def set_table_borders(table, color="CCCCCC", sz="4", val="single") -> None:
        tblPr = table._tbl.tblPr
        tblPr.append(parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="none"/><w:right w:val="none"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        ))

    def add_heading_1(text: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text.upper())
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(12)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_2(text: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(11.5)
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_body(text: str, bold_prefix: str = "", italic: bool = False, first_line_indent: bool = True):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.5
        if first_line_indent and not bold_prefix:
            p.paragraph_format.first_line_indent = Inches(0.49)  # Recuo ABNT 1,25 cm
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
            run_b.font.name = "Arial"
            run_b.font.size = Pt(11)
            run_b.font.color.rgb = COLOR_DARK
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(11)
        run.font.color.rgb = COLOR_DARK
        run.italic = italic
        return p

    def add_bullet(text: str, bold_prefix: str = ""):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.25
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
            run_b.font.name = "Arial"
            run_b.font.size = Pt(10.5)
            run_b.font.color.rgb = COLOR_DARK
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(10.5)
        run.font.color.rgb = COLOR_DARK
        return p

    def add_callout_box(text: str, title: str = "NOTA TÉCNICA"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.2)
        set_cell_background(cell, HEX_BG_LIGHT)
        set_cell_margins(cell, top=110, bottom=110, left=160, right=150)

        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{HEX_PRIMARY}"/>'
            f'<w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        ))

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.2
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        run_t = p.add_run(f"[{title}] ")
        run_t.bold = True
        run_t.font.name = "Arial"
        run_t.font.size = Pt(9.5)
        run_t.font.color.rgb = COLOR_PRIMARY

        run_b = p.add_run(text)
        run_b.font.name = "Arial"
        run_b.font.size = Pt(9.5)
        run_b.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(3)

    def add_abnt_table(caption: str, source: str, col_widths, headers, rows_data) -> None:
        # Legenda no topo da tabela (ABNT NBR 14724 / IBGE)
        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.space_before = Pt(8)
        p_cap.paragraph_format.space_after = Pt(3)
        p_cap.paragraph_format.keep_with_next = True
        r_cap = p_cap.add_run(caption)
        r_cap.bold = True
        r_cap.font.name = "Arial"
        r_cap.font.size = Pt(10)
        r_cap.font.color.rgb = COLOR_DARK

        table = doc.add_table(rows=1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table, color="CCCCCC", sz="4")

        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = str(header_text)
            hdr_cells[i].width = Inches(col_widths[i])
            set_cell_background(hdr_cells[i], HEX_PRIMARY)
            set_cell_margins(hdr_cells[i], top=100, bottom=100, left=100, right=100)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.bold = True
                run.font.name = "Arial"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(255, 255, 255)

        for r_idx, row_values in enumerate(rows_data):
            row_cells = table.add_row().cells
            bg_color = HEX_ZEBRA if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_values):
                row_cells[c_idx].text = str(val)
                row_cells[c_idx].width = Inches(col_widths[c_idx])
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=75, bottom=75, left=90, right=90)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.name = "Arial"
                    run.font.size = Pt(8.5)
                    run.font.color.rgb = COLOR_DARK

        # Fonte abaixo da tabela (ABNT NBR 14724)
        p_src = doc.add_paragraph()
        p_src.paragraph_format.space_before = Pt(2)
        p_src.paragraph_format.space_after = Pt(8)
        r_src = p_src.add_run(f"Fonte: {source}")
        r_src.font.name = "Arial"
        r_src.font.size = Pt(9)
        r_src.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # ELEMENTO PRÉ-TEXTUAL 1: CAPA (ABNT NBR 14724)
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(24)
    r_inst = p_inst.add_run(
        "CENTRO UNIVERSITÁRIO INTERNACIONAL UNINTER\n"
        "ESCOLA SUPERIOR POLITÉCNICA\n"
        "CURSO SUPERIOR DE TECNOLOGIA EM COMPUTAÇÃO"
    )
    r_inst.bold = True
    r_inst.font.name = "Arial"
    r_inst.font.size = Pt(12)
    r_inst.font.color.rgb = COLOR_SECONDARY

    p_aut_capa = doc.add_paragraph()
    p_aut_capa.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_aut_capa.paragraph_format.space_before = Pt(60)
    r_aut_capa = p_aut_capa.add_run("RONALDO COUTINHO")
    r_aut_capa.bold = True
    r_aut_capa.font.name = "Arial"
    r_aut_capa.font.size = Pt(12)
    r_aut_capa.font.color.rgb = COLOR_DARK

    p_tit = doc.add_paragraph()
    p_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_tit.paragraph_format.space_before = Pt(72)
    p_tit.paragraph_format.space_after = Pt(12)
    r_tit = p_tit.add_run(
        "DOCUMENTAÇÃO TÉCNICA COMPLETA E RELATÓRIO DE GARANTIA DA QUALIDADE:\n"
        "SISTEMA DE GESTÃO INTEGRADA E CARDÁPIO MULTICANAL\n"
        "REDE 'RAÍZES DO NORDESTE'"
    )
    r_tit.bold = True
    r_tit.font.name = "Arial"
    r_tit.font.size = Pt(14)
    r_tit.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(120)
    r_sub = p_sub.add_run(
        "Arquitetura Full-Stack (Node.js/Express/SQLite WAL), Frontend Multicanal 100% Offline, "
        "Segurança Defensiva (OWASP/LGPD), Homologação Automatizada (57 Testes em 8 Suítes) "
        "e Ferramenta de Auditoria Documental em Python"
    )
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = COLOR_DARK

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_before = Pt(90)
    r_loc = p_loc.add_run("CURITIBA — PR\n2026")
    r_loc.bold = True
    r_loc.font.name = "Arial"
    r_loc.font.size = Pt(12)
    r_loc.font.color.rgb = COLOR_SECONDARY

    doc.add_page_break()

    # =========================================================================
    # ELEMENTO PRÉ-TEXTUAL 2: FOLHA DE ROSTO (ABNT NBR 14724)
    # =========================================================================
    p_fr_aut = doc.add_paragraph()
    p_fr_aut.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fr_aut.paragraph_format.space_before = Pt(24)
    r_fr_aut = p_fr_aut.add_run("RONALDO COUTINHO")
    r_fr_aut.bold = True
    r_fr_aut.font.name = "Arial"
    r_fr_aut.font.size = Pt(12)

    p_fr_tit = doc.add_paragraph()
    p_fr_tit.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fr_tit.paragraph_format.space_before = Pt(72)
    p_fr_tit.paragraph_format.space_after = Pt(48)
    r_fr_tit = p_fr_tit.add_run(
        "DOCUMENTAÇÃO TÉCNICA COMPLETA E RELATÓRIO DE GARANTIA DA QUALIDADE:\n"
        "SISTEMA DE GESTÃO INTEGRADA E CARDÁPIO MULTICANAL REDE 'RAÍZES DO NORDESTE'"
    )
    r_fr_tit.bold = True
    r_fr_tit.font.name = "Arial"
    r_fr_tit.font.size = Pt(13)
    r_fr_tit.font.color.rgb = COLOR_PRIMARY

    p_nat = doc.add_paragraph()
    p_nat.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_nat.paragraph_format.left_indent = Inches(2.8)
    p_nat.paragraph_format.space_before = Pt(36)
    p_nat.paragraph_format.space_after = Pt(72)
    p_nat.paragraph_format.line_spacing = 1.0
    r_nat = p_nat.add_run(
        "Relatório Técnico e Documentação de Sistema apresentados à disciplina de "
        "Projeto Multidisciplinar — Trilha: Qualidade de Software, da Escola Superior "
        "Politécnica do Centro Universitário Internacional UNINTER, como requisito "
        "parcial para avaliação e homologação acadêmica.\n\n"
        "Orientador: Prof. Me. Rodrigo Nascimento."
    )
    r_nat.font.name = "Arial"
    r_nat.font.size = Pt(10)
    r_nat.font.color.rgb = COLOR_DARK

    p_fr_loc = doc.add_paragraph()
    p_fr_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fr_loc.paragraph_format.space_before = Pt(100)
    r_fr_loc = p_fr_loc.add_run("CURITIBA — PR\n2026")
    r_fr_loc.bold = True
    r_fr_loc.font.name = "Arial"
    r_fr_loc.font.size = Pt(12)
    r_fr_loc.font.color.rgb = COLOR_SECONDARY

    doc.add_page_break()

    # =========================================================================
    # ELEMENTO PRÉ-TEXTUAL 3: RESUMO E ABSTRACT (ABNT NBR 6028)
    # =========================================================================
    add_heading_1("Resumo")
    add_body(
        "Este documento apresenta a documentação técnica completa, nos padrões da Associação Brasileira de Normas Técnicas (ABNT NBR 14724, NBR 6023, NBR 6024 e NBR ISO/IEC 25010), do sistema de software desenvolvido para a rede fictícia de culinária regional 'Raízes do Nordeste'. O projeto abrange uma plataforma web full-stack multicanal (WEB, APP, TOTEM, BALCÃO e PICKUP), estruturada sobre o servidor Node.js e Express 4 com camada de persistência híbrida em SQLite3 (modo Write-Ahead Logging — WAL) e PostgreSQL. O sistema contempla cinco interfaces de usuário 100% locais e autônomas (sem dependências de CDNs externos), um catálogo de 100 produtos regionais (incluindo 21 combos com itens inclusos detalhados e 100 imagens locais), autenticação com sessão no servidor via cookies assinados por HMAC-SHA256 (HttpOnly, Secure, SameSite=Lax), criptografia de senhas com bcryptjs (12 salt rounds), controle de acesso baseado em papéis (RBAC para cliente, loja e admin), recálculo obrigatório de preços e baixa atômica de estoque no servidor, além de módulos gerenciais de Controle de Estoque e Contas a Pagar e Receber. A qualidade da aplicação é verificada por 57 testes automatizados distribuídos em 8 suítes Node.js (100% aprovados) e por uma Ferramenta de Auditoria e Correção Documental desenvolvida em Python 3 (composta por 11 módulos e 5 testes automatizados próprios), garantindo rastreabilidade integral, conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e mitigação de riscos OWASP Top 10.",
        first_line_indent=False
    )
    add_body(
        "Qualidade de Software. Engenharia de Requisitos. ISO/IEC 25010. LGPD. Node.js. SQLite WAL. Testes Automatizados. Auditoria Documental em Python.",
        bold_prefix="Palavras-chave: ",
        first_line_indent=False
    )

    add_heading_1("Abstract")
    add_body(
        "This document provides the complete technical documentation, formatted according to ABNT standards (NBR 14724, NBR 6023, and ISO/IEC 25010), for the software system built for the regional food franchise network 'Raízes do Nordeste'. The solution encompasses a multi-channel full-stack web platform (WEB, APP, TOTEM, COUNTER, and PICKUP) powered by Node.js and Express 4 with a hybrid persistence layer supporting SQLite3 (Write-Ahead Logging — WAL mode) and PostgreSQL. It includes five 100% offline-capable user interfaces, a catalog of 100 regional products (with 21 structured combos and 100 local images), server-side session authentication via HMAC-SHA256 signed cookies (HttpOnly, Secure, SameSite=Lax), bcryptjs password hashing (12 salt rounds), Role-Based Access Control (RBAC for customer, store, and admin), mandatory server-side price recalculation with atomic stock deduction, and management modules for Inventory Control and Accounts Payable/Receivable. Software quality is validated by 57 automated Node.js tests across 8 test suites (100% passing) and a modular Python 3 Technical Documentation Audit & Correction Tool (11 modules and 5 automated tests), ensuring end-to-end traceability, LGPD compliance, and OWASP Top 10 risk mitigation.",
        first_line_indent=False
    )
    add_body(
        "Software Quality. Requirements Engineering. ISO/IEC 25010. LGPD. Node.js. SQLite WAL. Automated Testing. Python Documentation Auditing.",
        bold_prefix="Keywords: ",
        first_line_indent=False
    )

    doc.add_page_break()

    # =========================================================================
    # ELEMENTO PRÉ-TEXTUAL 4: SUMÁRIO E FICHA TÉCNICA (ABNT NBR 6027)
    # =========================================================================
    add_heading_1("Sumário Executivo das Seções")
    sumario_itens = [
        ("1", "Introdução, Contexto do Negócio e Multicanalidade"),
        ("2", "Arquitetura Geral do Sistema e Estrutura de Diretórios"),
        ("3", "Especificação Completa do Backend (Servidor, Middlewares e Segurança)"),
        ("4", "Modelagem do Banco de Dados Relacional (SQLite WAL e PostgreSQL)"),
        ("5", "Documentação Completa da API REST (21 Endpoints e Regras de Validação)"),
        ("6", "Especificação Completa do Frontend (5 Páginas HTML, 9 Módulos JS e Design System)"),
        ("7", "Catálogo Corporativo de 100 Produtos, 21 Combos e Resolução Offline de Imagens"),
        ("8", "Engenharia de Requisitos (RF-01 a RF-08) e Casos de Uso (UC01 a UC09)"),
        ("9", "Especificação de Qualidade ISO/IEC 25010 (8 Requisitos Mensuráveis RQ-01 a RQ-08)"),
        ("10", "Estratégia de Garantia da Qualidade e Suíte Completa de 57 Testes Automatizados (8 Suítes)"),
        ("11", "Matriz de Rastreabilidade Bidirecional e Planilha de Indicadores (SLA / SLO / KPIs)"),
        ("12", "Segurança Defensiva (OWASP Top 10) e Privacidade de Dados (LGPD — Lei nº 13.709/2018)"),
        ("13", "Ferramenta de Auditoria e Correção Automatizada de Relatórios Técnicos (Python 3)"),
        ("14", "Guia Operacional de Instalação, Execução, Credenciais e Declaração de Uso de IA"),
        ("15", "Conclusão Técnica e Referências Bibliográficas (ABNT NBR 6023)")
    ]
    add_abnt_table(
        caption="Tabela 1 — Estrutura Organizacional da Documentação Técnica do Sistema",
        source="Elaborado pelo autor (2026).",
        col_widths=[0.8, 5.4],
        headers=["Seção", "Título da Seção Documental"],
        rows_data=sumario_itens
    )

    add_abnt_table(
        caption="Tabela 2 — Ficha Técnica e Identificação Geral do Projeto",
        source="Elaborado pelo autor (2026).",
        col_widths=[2.2, 4.0],
        headers=["Parâmetro Institucional / Técnico", "Especificação Verificada no Repositório"],
        rows_data=[
            ["Instituição de Ensino", "Centro Universitário Internacional UNINTER — Escola Superior Politécnica"],
            ["Disciplina", "Projeto Multidisciplinar — Trilha: Qualidade de Software (2026)"],
            ["Docente Orientador", "Prof. Me. Rodrigo Nascimento"],
            ["Acadêmico / Autor", "Ronaldo Coutinho"],
            ["Sistema Documentado", "Rede 'Raízes do Nordeste' — Vitrine, Cardápio Multicanal, Gestão e Auditoria QA"],
            ["Stack Backend & Persistência", "Node.js (ES Modules), Express 4.21, SQLite3 (better-sqlite3 em modo WAL) / PostgreSQL (pg)"],
            ["Stack de Segurança", "Helmet 8.3 (CSP estrito), Bcryptjs 3.0 (12 salt rounds), Cookies HMAC-SHA256, Rate-Limiter-Flexible"],
            ["Stack Frontend", "HTML5 Semântico, CSS3 Responsivo (Design Tokens), Vanilla JavaScript ES2022 (100% Local / Zero CDNs)"],
            ["Stack de Auditoria Documental", "Python 3.10+, python-docx, Streamlit / Painel HTTP Local, Geradores Nativos PDF 1.4 e OpenXML XLSX"],
            ["Suíte de Testes da Aplicação Web", "57 Testes Automatizados em 8 Suítes (node:test + Supertest) — 57 Aprovados (0 Falhas)"],
            ["Suíte de Testes da Auditoria Python", "5 Testes Automatizados em test_auditoria.py (unittest) — 5 Aprovados (0 Falhas)"]
        ]
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 1: INTRODUÇÃO, CONTEXTO E MULTICANALIDADE
    # =========================================================================
    add_heading_1("1. Introdução, Contexto do Negócio e Multicanalidade")
    add_heading_2("1.1 Contexto Operacional da Rede 'Raízes do Nordeste'")
    add_body(
        "A 'Raízes do Nordeste' é uma rede de lanchonetes e restaurantes de culinária regional nordestina em processo de expansão nacional por meio de unidades próprias e franqueadas. O cardápio oficial é composto por 100 produtos padronizados divididos em cinco categorias: Lanches, Pratos, Bebidas, Sobremesas e Ofertas (incluindo 21 combos promocionais com composição explícita de itens inclusos)."
    )
    add_body(
        "Para sustentar o crescimento da operação sem perda de controle financeiro, ruptura de estoque ou vulnerabilidades cibernéticas, o sistema evoluiu de um protótipo estático baseado em armazenamento local no navegador (localStorage) para uma plataforma corporativa em camadas, dotada de banco de dados relacional transacional, autenticação centralizada, controle de acesso por papéis (RBAC) e operação 100% resiliente offline."
    )

    add_heading_2("1.2 Arquitetura Multicanal (5 Canais Integrados)")
    add_body(
        "O sistema atende simultaneamente cinco canais operacionais de venda e atendimento, registrados e validados na camada de pedidos (src/routes/orders.js e public/cliente.js):"
    )
    add_bullet("Acesso via navegadores desktop e notebooks para pedidos de Delivery em domicílio e administração corporativa.", "1. WEB (Portal Web / Delivery): ")
    add_bullet("Experiência responsiva otimizada para smartphones (360px a 414px) com fluxo de compra em até 3 passos.", "2. APP (Mobile Web): ")
    add_bullet("Interface de autoatendimento para totens touch-screen instalados no salão das lojas físicas, operando em rede local mesmo sem conexão externa com a internet.", "3. TOTEM (Autoatendimento em Loja): ")
    add_bullet("Atendimento presencial registrado no ponto de venda (PDV) para consumo imediato no salão.", "4. BALCÃO (PDV Presencial): ")
    add_bullet("Compra antecipada com seleção da franquia e região para retirada rápida no balcão sem fila.", "5. PICKUP (Retirada Programada): ")

    # =========================================================================
    # SEÇÃO 2: ARQUITETURA GERAL E ESTRUTURA DE DIRETÓRIOS
    # =========================================================================
    add_heading_1("2. Arquitetura Geral do Sistema e Estrutura de Diretórios")
    add_body(
        "O sistema é organizado em dois subsistemas integrados no mesmo repositório: (A) a Aplicação Web Full-Stack da Rede 'Raízes do Nordeste' (em Node.js/Express e Vanilla JS) e (B) a Ferramenta de Auditoria e Correção Automatizada de Relatórios Técnicos (em Python 3). A Tabela 3 documenta todos os diretórios e arquivos que compõem a arquitetura."
    )

    add_abnt_table(
        caption="Tabela 3 — Mapeamento Completo de Arquivos e Módulos do Sistema",
        source="Inspeção direta do repositório (2026).",
        col_widths=[2.0, 1.1, 3.1],
        headers=["Caminho do Arquivo", "Camada / Tipo", "Responsabilidade Técnica no Sistema"],
        rows_data=[
            ["src/server.js", "Backend (Entry)", "Inicializa o servidor HTTP Express na porta configurada (PORT ou 3000)."],
            ["src/app.js", "Backend (Core)", "Configura Helmet (CSP), parser de cookies anti-Prototype Pollution, CORS, 4 Rate Limiters, rotas estáticas e tratamento global de erros (400/403/404/413/429/500)."],
            ["src/auth.js", "Backend (Auth)", "Gerencia assinatura HMAC-SHA256 de cookies (raizes_session), comparação timingSafeEqual e middlewares requireAuth e requireRole."],
            ["src/db.js", "Backend (Dados)", "Camada híbrida SQLite3 (modo WAL + foreign_keys=ON) e PostgreSQL. Gerencia as 7 tabelas relacionais, seed inicial e transações atômicas."],
            ["src/routes/auth.js", "Backend (Rota)", "Endpoints de cadastro com consentimento LGPD, login com bcryptjs (12 rounds), logout, consulta de sessão (/me) e migração segura de usuários."],
            ["src/routes/products.js", "Backend (Rota)", "CRUD completo do catálogo de produtos, validação estrita de tipos/limites/XSS, imagens Base64 e migração administrativa."],
            ["src/routes/orders.js", "Backend (Rota)", "Criação de pedidos multicanal com consolidação de itens repetidos, verificação de saldo, recálculo de preços no servidor e atualização de status."],
            ["src/routes/unidades.js", "Backend (Rota)", "Listagem pública e cadastro autenticado (sessão admin ou Bearer token >= 32 bytes) de unidades franqueadas com validação de UF e código."],
            ["src/routes/estoque.js", "Backend (Rota)", "Resumo de inventário, histórico auditado e registro transacional de entradas, saídas e ajustes de balanço (restrito a admin e loja)."],
            ["src/routes/financeiro.js", "Backend (Rota)", "Gestão de contas a pagar e a receber, cálculo de saldos realizado/projetado, títulos vencidos, baixa, estorno e exclusão (admin e loja)."],
            ["public/index.html + app.js", "Frontend (Vitrine)", "Landing page institucional com carrossel acessível de ofertas, destaques do cardápio e navegação respeitando prefers-reduced-motion."],
            ["public/login.html + login.js", "Frontend (Acesso)", "Tela unificada de login, atalhos de demonstração (Admin, Loja, Cliente) e formulário de cadastro com termo obrigatório da LGPD."],
            ["public/cliente.html + cliente.js", "Frontend (PDV)", "Cardápio interativo com filtro por categoria, bloqueio de esgotados, sacola local com botões [+] e [-] e checkout multicanal."],
            ["public/admin.html + admin.js", "Frontend (Gestão)", "Painel executivo da franqueadora: KPIs de faturamento, ticket médio, resumo regional, inventário rápido e abas de gestão."],
            ["public/operacional.html + operacional.js", "Frontend (Loja)", "Painel operacional da unidade: fila de pedidos do dia, alteração de status em tempo real, checklists operacionais e rotas."],
            ["public/gestao.js", "Frontend (Módulos)", "Módulo compartilhado entre Admin e Loja para Controle de Estoque, Contas a Pagar/Receber e Catálogo com busca sem perda de foco."],
            ["public/auth.js + config.js", "Frontend (Sessão)", "Cliente HTTP (raizesApiRequest), proteção de rotas por atributo data-required-role e visibilidade RBAC (data-*-only)."],
            ["public/products.js", "Frontend (Dados)", "Catálogo base de 100 produtos e 21 combos para fallback offline, resolução de imagens locais e redimensionamento JPEG via Canvas."],
            ["public/style.css", "Frontend (UI)", "Design system responsivo com tokens de cores nordestinas, suporte a totens/mobile e componentes acessíveis."],
            ["main.py + interface.py", "Auditoria Python", "Orquestrador CLI e Interface Gráfica (Streamlit + Painel Web HTTP Local) da ferramenta de auditoria e correção documental."],
            ["leitor_documentos.py + consistencia.py", "Auditoria Python", "Módulos 1 e 2: Leitura de DOCX/DOC/PDF/MD/TXT/CSV/XLSX, inspeção do código-fonte e verificação das 10 Regras de Integridade."],
            ["auditoria.py + correcao.py + backup.py", "Auditoria Python", "Módulos 3 e 4: Matriz do Roteiro UNINTER (ROT-01 a ROT-12), backup imutável SHA-256 e correção documental rastreável."],
            ["gerador_relatorios.py + exportacao.py + logs.py", "Auditoria Python", "Módulos 5 e 6: Relatório Consolidado de 12 seções e exportação nativa em DOCX, PDF 1.4, XLSX (4 abas), CSV e JSON."]
        ]
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 3: ESPECIFICAÇÃO COMPLETA DO BACKEND
    # =========================================================================
    add_heading_1("3. Especificação Completa do Backend (Servidor, Middlewares e Segurança)")
    add_heading_2("3.1 Pipeline de Middlewares e Defesa em Profundidade (src/app.js)")
    add_body(
        "O núcleo HTTP em src/app.js implementa uma cadeia sequencial de defesa em profundidade para proteger todas as rotas da aplicação:"
    )
    add_bullet("Oculta o cabeçalho X-Powered-By e aplica Content-Security-Policy (CSP) restritiva (default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'self') e Referrer-Policy: no-referrer.", "1. Helmet Security Headers: ")
    add_bullet("Constrói o dicionário req.cookies usando Object.create(null) e bloqueia explicitamente chaves __proto__, constructor e prototype, eliminando vetores de poluição de protótipo.", "2. Parser de Cookies Anti-Prototype Pollution: ")
    add_bullet("Permite requisições sem cabeçalho Origin (testes e chamadas locais), origens localhost/127.0.0.1 e domínios declarados em RAIZES_CORS_ORIGINS, rejeitando origens externas não autorizadas com HTTP 403.", "3. Controle Estrito de CORS: ")
    add_bullet("Quatro instâncias persistidas no banco de dados (tabela rate_limiter_flexible): limite global de 300 req/15 min em /api; 5 tentativas/15 min em /api/auth/login; 10 cadastros/15 min em /api/auth/register; e 3 chamadas/15 min em /api/auth/migrate-local-users, respondendo HTTP 429 com cabeçalho Retry-After.", "4. Rate Limiting Multicamada: ")
    add_bullet("Todas as respostas sob /api recebem Cache-Control: no-store para impedir armazenamento em cache de dados financeiros ou pessoais em computadores compartilhados.", "5. Prevenção de Cache de Dados Sensíveis: ")

    add_heading_2("3.2 Criptografia de Sessão e Autorização RBAC (src/auth.js)")
    add_body(
        "O módulo src/auth.js gerencia sessões stateful persistidas no banco de dados combinadas com cookies assinados criptograficamente:"
    )
    add_bullet("Gera identificadores de sessão aleatórios de 256 bits (randomBytes(32).toString('base64url')) com validade de 7 dias (SESSION_TTL_MS).", "Geração de Token de Sessão: ")
    add_bullet("O cookie raizes_session armazena o par <sessionId>.<assinaturaHMAC_SHA256>. Na leitura, parseSignedSession valida o formato e compara a assinatura usando crypto.timingSafeEqual, neutralizando ataques de canal lateral (timing attacks).", "Assinatura HMAC-SHA256 e Comparação em Tempo Constante: ")
    add_bullet("Em ambiente de produção (NODE_ENV=production), o servidor recusa a inicialização caso a variável RAIZES_SESSION_SECRET não esteja definida ou possua menos de 32 bytes de entropia.", "Fail-Closed em Produção: ")

    # =========================================================================
    # SEÇÃO 4: MODELAGEM DO BANCO DE DADOS RELACIONAL
    # =========================================================================
    add_heading_1("4. Modelagem do Banco de Dados Relacional (SQLite WAL e PostgreSQL)")
    add_body(
        "A camada de persistência em src/db.js opera de forma híbrida: por padrão utiliza SQLite3 via better-sqlite3 com pragmas journal_mode = WAL e foreign_keys = ON, podendo alternar automaticamente para PostgreSQL (pg.Pool) quando a variável DATABASE_URL é fornecida. O esquema relacional é composto exatamente por 7 tabelas de domínio (além da tabela auxiliar do rate limiter), detalhadas na Tabela 4."
    )

    add_abnt_table(
        caption="Tabela 4 — Esquema Relacional das 7 Tabelas do Banco de Dados (src/db.js)",
        source="Código-fonte src/db.js (2026).",
        col_widths=[1.4, 2.5, 2.3],
        headers=["Tabela SQL", "Colunas e Tipos Principais", "Restrições de Integridade e Uso"],
        rows_data=[
            ["users", "id (PK), name, email, password_hash, role, created_at", "UNIQUE(email); role restrito a 'admin', 'loja' ou 'cliente'; hash bcryptjs (12 rounds)."],
            ["sessions", "id (PK TEXT), user_id (FK), expires_at", "FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE; expiração verificada a cada requisição."],
            ["unidades", "id (PK), codigo, nome, cidade, estado, ativa, criada_em", "UNIQUE(codigo); código normalizado em maiúsculas (2 a 20 caracteres) e UF de 2 letras."],
            ["products", "id (PK), nome, categoria, descricao, preco, estoque, offer, imagem, itens_inclusos", "Armazena os 100 produtos e 21 combos; itens_inclusos serializado em JSON."],
            ["orders", "id (UUID PK), user_id (FK), legacy_id, store, region, method, total, items_json, details_json, created_at, status", "UNIQUE(user_id, legacy_id) para idempotência de migração; transação atômica com baixa automática de estoque."],
            ["estoque_movimentacoes", "id (PK), product_id (FK), tipo, quantidade, estoque_anterior, estoque_novo, motivo, usuario_nome, criado_em", "FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE; trilha de auditoria de entradas, saídas e ajustes."],
            ["financeiro_lancamentos", "id (PK), tipo, titulo, categoria, valor, data_vencimento, data_pagamento, status, forma_pagamento, observacoes, loja, criado_em", "Registra títulos a pagar e a receber, vencimentos ISO 8601 válidos e baixas."]
        ]
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 5: DOCUMENTAÇÃO COMPLETA DA API REST (21 ENDPOINTS)
    # =========================================================================
    add_heading_1("5. Documentação Completa da API REST (21 Endpoints e Regras de Validação)")
    add_body(
        "A API RESTful responde sob o prefixo /api e utiliza validação rigorosa de tipos (função toStrictNumber que rejeita booleanos, null e strings vazias, evitando coerções silenciosas do JavaScript). A Tabela 5 documenta todos os 21 endpoints implementados."
    )

    add_abnt_table(
        caption="Tabela 5 — Catálogo Completo dos 21 Endpoints da API REST",
        source="Módulos src/app.js e src/routes/*.js (2026).",
        col_widths=[0.7, 1.7, 1.0, 2.8],
        headers=["Método", "Rota (/api/...)", "Autorização", "Comportamento, Regras de Negócio e Códigos HTTP"],
        rows_data=[
            ["GET", "/api/health", "Público", "Retorna HTTP 200 com { status: 'ok', aplicacao: 'Rede Raízes do Nordeste' }."],
            ["POST", "/api/auth/register", "Público (Rate 10)", "Cadastra cliente (role fixo 'cliente'). Exige lgpdConsent !== false, senha de 8-128 chars e nome sem '<>'. Retorna 201, 400 ou 409."],
            ["POST", "/api/auth/login", "Público (Rate 5)", "Autentica com bcrypt.compare (usa dummyPasswordHash se e-mail não existir para evitar enumeração por tempo). Emite cookie HttpOnly. Retorna 200, 401 ou 429."],
            ["POST", "/api/auth/logout", "Público", "Remove a sessão do banco e limpa o cookie raizes_session. Retorna HTTP 204."],
            ["GET", "/api/auth/me", "Sessão ativa", "Retorna os dados públicos ({ id, name, email, role }) da sessão válida ou HTTP 401."],
            ["POST", "/api/auth/migrate-local-users", "Público (Rate 3)", "Importa até 200 contas legadas sempre com perfil 'cliente', protegendo as contas demo (admin/loja/cliente@raizes.com)."],
            ["GET", "/api/unidades", "Público", "Lista todas as unidades franqueadas em ordem alfabética de nome (HTTP 200)."],
            ["POST", "/api/unidades", "Admin / Token", "Valida código (2-20 chars), nome, cidade e UF (2 letras). Exige sessão admin ou Bearer token >= 32 bytes. Retorna 201, 400, 401, 409 ou 503."],
            ["GET", "/api/products", "Público", "Lista todos os produtos do catálogo com preços, estoques, ofertas e itens inclusos."],
            ["POST", "/api/products", "admin ou loja", "Cria produto validando categoria, preço (0 a 100.000), estoque inteiro, oferta (0 a 100%) e imagem local/Base64 JPEG <= 900 KB."],
            ["POST", "/api/products/migrate-local", "admin", "Faz upsert de produto legado preservando IDs válidos (HTTP 200 ou 400)."],
            ["PUT", "/api/products/:id", "admin ou loja", "Atualiza dados ou foto de um produto existente (HTTP 200, 400 ou 404)."],
            ["DELETE", "/api/products/:id", "admin ou loja", "Remove produto do catálogo (HTTP 204 ou 404)."],
            ["GET", "/api/orders", "Sessão ativa", "Cliente vê apenas seus próprios pedidos; perfis admin e loja visualizam todos os pedidos da rede."],
            ["POST", "/api/orders", "cliente", "Consolida itens repetidos, valida estoque disponível, recalcula preços com descontos no servidor, deduz estoque em transação atômica e grava o canal (WEB/APP/TOTEM/BALCAO/PICKUP)."],
            ["POST", "/api/orders/migrate-local", "cliente", "Migra até 100 pedidos locais com idempotência por (user_id, legacy_id) e recálculo no servidor."],
            ["PATCH", "/api/orders/:id/status", "admin ou loja", "Atualiza status operacional ('Em preparo', 'Em rota', 'Concluído', 'Cancelado'). Retorna 200, 400 ou 404."],
            ["GET", "/api/estoque/resumo", "admin ou loja", "Retorna totalProdutos, totalItens, valorTotal (arredondado), totalCriticos (<=5), totalAtencao (6-10) e totalNormais (>10)."],
            ["GET", "/api/estoque/movimentacoes", "admin ou loja", "Lista até 200 movimentações recentes com JOIN em products."],
            ["POST", "/api/estoque/movimentacao", "admin ou loja", "Executa transação atômica de 'entrada', 'saida' (piso zero) ou 'ajuste' (>=0) e grava auditoria com responsável."],
            ["GET/POST/PATCH/DEL", "/api/financeiro/*", "admin ou loja", "Gerencia contas a pagar/receber (/resumo, /, /:id/status, /:id) com validação de datas reais no calendário ISO (rejeita 2026-02-31)."]
        ]
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 6: ESPECIFICAÇÃO COMPLETA DO FRONTEND
    # =========================================================================
    add_heading_1("6. Especificação Completa do Frontend (5 Páginas HTML, 9 Módulos JS e Design System)")
    add_body(
        "O frontend foi construído em HTML5 semântico, CSS3 customizado (public/style.css) e JavaScript puro (Vanilla ES2022), sem qualquer dependência de CDNs externos, garantindo funcionamento 100% offline em lojas e totens:"
    )
    add_bullet("Apresenta a identidade visual regional (logomarca vetorial raizes-logo.svg), carrossel dinâmico com até 5 produtos em oferta (com pausa automática ao passar o mouse, receber foco de teclado ou quando o sistema operacional solicita prefers-reduced-motion: reduce) e vitrine de destaques.", "1. Vitrine Institucional (public/index.html e public/app.js): ")
    add_bullet("Reúne autenticação, botões de preenchimento rápido com 1 clique para avaliação das três contas demonstrativas (Admin, Loja e Cliente) e formulário de cadastro com checkbox obrigatório de consentimento LGPD (#register-lgpd-consent).", "2. Portal de Login e Cadastro LGPD (public/login.html e public/login.js): ")
    add_bullet("Exibe os 100 itens por categoria com chips de filtro, selos de desconto, composição dos combos ('Inclui: ...'), bloqueio visual e funcional de produtos esgotados (estoque === 0 -> botão 'Indisponível' desabilitado), sacola persistente com controles [+] e [-] limitados ao saldo em estoque e seletor de modo de atendimento (Delivery, Retirada, Balcão, Totem) mapeado automaticamente para o canal correspondente.", "3. Cardápio e Checkout Multicanal do Cliente (public/cliente.html e public/cliente.js): ")
    add_bullet("Protegido por data-required-role='admin'. Exibe 8 indicadores executivos (total de produtos, unidades em estoque, itens em baixo estoque, faturamento consolidado, franquias ativas, total de pedidos, regiões atendidas e ticket médio), resumo financeiro por região e abas integradas de Catálogo, Estoque e Financeiro.", "4. Painel Executivo do Administrador (public/admin.html e public/admin.js): ")
    add_bullet("Protegido por data-required-role='loja,admin'. Apresenta indicadores diários da operação (vendas do dia, pedidos hoje, pedidos em atenção, entregas Delivery, retiradas, região líder ordenada por volume e lojas ativas), barras de progresso de tarefas da loja, status de rotas e fila de pedidos com atualização instantânea de status.", "5. Painel Operacional da Franquia (public/operacional.html e public/operacional.js): ")
    add_bullet("Renderiza as abas de Controle de Estoque (cards de resumo, filtros Todos/Críticos/Atenção/Normais, busca textual com preservação automática de foco e cursor, botões rápidos '+ Entrada' e '- Saída' e histórico auditado) e Financeiro (cards de Contas a Pagar, Contas a Receber, Saldo Projetado/Realizado, Títulos Vencidos, filtros combinados, baixa/estorno e exclusão).", "6. Módulos Compartilhados de Gestão (public/gestao.js): ")

    # =========================================================================
    # SEÇÃO 7: CATÁLOGO DE 100 PRODUTOS, 21 COMBOS E IMAGENS LOCAIS
    # =========================================================================
    add_heading_1("7. Catálogo Corporativo de 100 Produtos, 21 Combos e Resolução Offline de Imagens")
    add_body(
        "O arquivo public/products.js define o catálogo oficial de 100 itens regionais nordestinos (IDs 1 a 100), semeados automaticamente no banco SQLite/PostgreSQL na primeira inicialização de src/db.js:"
    )
    add_bullet("Lanches (20 itens), Pratos (20 itens), Bebidas (20 itens), Sobremesas (20 itens) e Ofertas/Combos (20 itens + combos especiais, totalizando 21 combos com o array itensInclusos preenchido).", "Distribuição do Catálogo: ")
    add_bullet("Cada produto possui uma imagem dedicada em src/imagens/produto-001.jpg a produto-100.jpg (servidas na rota estática /imagens/) e uma imagem de fallback por categoria em public/images/products/ (lanches.jpg, pratos.jpg, bebidas.jpg, sobremesas.jpg, ofertas.jpg). Caso uma imagem falhe no carregamento, o listener bindRaizesProductImageFallbacks aciona automaticamente a foto de fallback local.", "Resolução Determinística de Imagens e Fallback: ")
    add_bullet("A função prepareRaizesProductImage valida o tipo MIME (JPEG, PNG ou WebP), rejeita arquivos acima de 8 MB, redimensiona a imagem em Canvas HTML5 para no máximo 640x480 pixels e exporta em data:image/jpeg;base64 com qualidade 0.82, respeitando o limite de 900 KB do backend.", "Processamento de Upload de Fotos no Navegador: ")

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 8: ENGENHARIA DE REQUISITOS E CASOS DE USO
    # =========================================================================
    add_heading_1("8. Engenharia de Requisitos (RF-01 a RF-08) e Casos de Uso (UC01 a UC09)")
    add_body(
        "Os requisitos funcionais e casos de uso foram especificados com critérios objetivos de aceitação e vinculados diretamente aos módulos de código e testes automatizados, conforme Tabela 6."
    )

    add_abnt_table(
        caption="Tabela 6 — Especificação dos Requisitos Funcionais (RF-01 a RF-08) e Casos de Uso (UC01 a UC09)",
        source="Documento docs/REQUISITOS.md e código-fonte (2026).",
        col_widths=[0.7, 0.7, 2.3, 2.5],
        headers=["Req.", "Caso Uso", "Descrição Funcional", "Implementação e Critério de Aceite"],
        rows_data=[
            ["RF-01", "UC01", "Gestão de Unidades Franqueadas (listagem pública e cadastro autenticado).", "src/routes/unidades.js — Valida código único (2-20 chars), nome, cidade e UF (2 letras); retorna 201 ou 409."],
            ["RF-02", "UC02", "Catálogo de 100 Produtos Regionais e 21 Combos com itens inclusos.", "public/products.js e src/routes/products.js — 100 itens únicos com preços, descontos e composição de combos."],
            ["RF-03", "UC03 / UC04", "Cadastro de Cliente com Consentimento LGPD, Login e Sessão Segura.", "src/routes/auth.js e src/auth.js — Hash bcryptjs (12 rounds), cookie HttpOnly HMAC e bloqueio se recusar LGPD."],
            ["RF-04", "UC05", "Checkout Multicanal com Recálculo Centralizado e Baixa Atômica de Estoque.", "src/routes/orders.js e src/db.js — Ignora preço enviado pelo cliente, valida estoque, deduz saldo e grava pedido."],
            ["RF-05", "UC07", "Controle de Estoque e Auditoria de Movimentações (Entrada, Saída e Ajuste).", "src/routes/estoque.js e public/gestao.js — Restrito a admin/loja; impede saldo negativo e registra histórico."],
            ["RF-06", "UC08", "Gestão Financeira de Contas a Pagar e a Receber com Baixa e Estorno.", "src/routes/financeiro.js e public/gestao.js — Valida datas ISO reais, calcula vencidos e saldos projetado/realizado."],
            ["RF-07", "UC06", "Gerenciamento Administrativo do Catálogo (Criação, Edição, Foto e Exclusão).", "src/routes/products.js, public/admin.js e public/operacional.js — Bloqueia XSS e exige perfil admin ou loja."],
            ["RF-08", "UC09", "Operação 100% Offline, Migração Idempotente de Dados Legados e Fallback Visual.", "public/products.js, src/offline.test.js e test-offline.bat — Zero CDNs externos e 100 imagens locais verificadas."]
        ]
    )

    # =========================================================================
    # SEÇÃO 9: ESPECIFICAÇÃO DE QUALIDADE ISO/IEC 25010 (8 REQUISITOS)
    # =========================================================================
    add_heading_1("9. Especificação de Qualidade ISO/IEC 25010 (8 Requisitos Mensuráveis RQ-01 a RQ-08)")
    add_body(
        "Em cumprimento ao Roteiro Prático UNINTER 2026, a Tabela 7 apresenta os 8 requisitos não funcionais mensuráveis baseados na norma ABNT NBR ISO/IEC 25010, todos verificados empiricamente pela suíte automatizada src/qualidade.test.js."
    )

    add_abnt_table(
        caption="Tabela 7 — Requisitos de Qualidade Mensuráveis (ISO/IEC 25010) e Resultados Aferidos",
        source="Suíte automatizada src/qualidade.test.js (2026).",
        col_widths=[0.6, 1.1, 1.5, 1.5, 1.5],
        headers=["ID", "Característica ISO 25010", "Meta / Critério de Aceite", "Teste Automatizado Vinculado", "Resultado Empírico Medido"],
        rows_data=[
            ["RQ-01", "Eficiência de Desempenho", "Latência p95 < 1500 ms e média < 250 ms nas rotas críticas.", "QA-01 (src/qualidade.test.js)", "p95 aferido < 180 ms e média < 65 ms (APROVADO)."],
            ["RQ-02", "Disponibilidade (Confiabilidade)", "100% de respostas HTTP 200 nas sondagens e Cache-Control: no-store.", "QA-02 (src/qualidade.test.js)", "100% de sucesso nas sondagens contínuas da suíte (APROVADO)."],
            ["RQ-03", "Segurança (Integridade Anti-Fraude)", "100% dos preços e totais recalculados no servidor; bloqueio de adulteração.", "QA-03 (src/qualidade.test.js)", "Payloads com preco: 0.01 ignorados; valor real cobrado (APROVADO)."],
            ["RQ-04", "Usabilidade e Acessibilidade", "Checkout em <= 3 passos e presença de atributos ARIA / labels.", "QA-04 e FE-08", "Fluxo concluído em 3 ações; 100% dos controles rotulados (APROVADO)."],
            ["RQ-05", "Confiabilidade e Idempotência ACID", "Zero duplicação em migração repetida e rollback total em falha.", "QA-05 e BE-06", "Constraint UNIQUE(user_id, legacy_id) e transações ACID validadas (APROVADO)."],
            ["RQ-06", "Compatibilidade e Responsividade", "Suporte a viewports de 360px a 1920px sem overflow horizontal.", "QA-04 e FE-08", "Media queries e grids fluidos verificados em public/style.css (APROVADO)."],
            ["RQ-07", "Observabilidade e Proteção LGPD", "Erros 4xx/5xx padronizados em JSON sem vazar stack trace ou password_hash.", "QA-06 (src/qualidade.test.js)", "Zero vazamento de hashes ou traces em respostas de erro (APROVADO)."],
            ["RQ-08", "Manutenibilidade e Governança", "Execução completa da suíte em < 60s e rastreabilidade documental 100%.", "QA-07 e test_auditoria.py", "57 testes JS executados em ~49s + 5 testes Python aprovados (APROVADO)."]
        ]
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 10: SUÍTE COMPLETA DE 57 TESTES AUTOMATIZADOS (8 SUÍTES)
    # =========================================================================
    add_heading_1("10. Estratégia de Garantia da Qualidade e Suíte Completa de 57 Testes Automatizados")
    add_body(
        "A aplicação web conta com 57 casos de teste automatizados distribuídos em 8 suítes independentes no diretório src/, executadas pelo Node.js Test Runner (node --test) com bancos SQLite temporários isolados (fs.mkdtempSync). A Tabela 8 consolida as 8 suítes e a Tabela 9 lista todos os 57 casos de teste homologados."
    )

    add_abnt_table(
        caption="Tabela 8 — Consolidação das 8 Suítes de Testes Automatizados do Sistema (Node.js)",
        source="Execução real via test-offline.bat --no-server (2026).",
        col_widths=[1.6, 1.3, 0.8, 0.8, 1.7],
        headers=["Arquivo da Suíte", "Foco Principal", "Testes", "Aprovados", "Escopo Validado"],
        rows_data=[
            ["src/app.test.js", "Integração & Segurança", "14", "14 (100%)", "Headers Helmet/CSP, imagens, unidades, auth LGPD, rate limit 429, RBAC, XSS, pedidos e persistência SQLite."],
            ["src/faults.test.js", "Testes Negativos & Borda", "7", "7 (100%)", "JSON inválido, CORS 403, Prototype Pollution, sessões expiradas, coerção de tipos, datas impossíveis e concorrência ACID."],
            ["src/gestao.test.js", "Estoque & Financeiro", "5", "5 (100%)", "Bloqueio RBAC para clientes e operações completas de estoque e contas a pagar/receber para admin e loja."],
            ["src/offline.test.js", "Autonomia 100% Offline", "6", "6 (100%)", "Fallback do catálogo, ausência total de CDNs, assets estáticos, SQLite offline, 100 fotos locais e paridade de preços."],
            ["src/products.test.js", "Integridade do Catálogo", "4", "4 (100%)", "100 produtos únicos, 21 combos com itensInclusos, preservação na migração e resolução de imagens."],
            ["src/frontend.test.js", "Frontend & DOM", "8", "8 (100%)", "Testes FE-01 a FE-08 cobrindo todos os 9 scripts de public/*.js, carrinho [+]/[-], bloqueio de esgotados e acessibilidade."],
            ["src/backend.test.js", "Backend & Persistência", "6", "6 (100%)", "Testes BE-01 a BE-06 cobrindo src/db.js, HMAC timingSafeEqual, CRUD catálogo, baixa automática de estoque e filtros financeiros."],
            ["src/qualidade.test.js", "Qualidade ISO/IEC 25010", "7", "7 (100%)", "Testes QA-01 a QA-07 verificando latência p95, uptime, anti-fraude, usabilidade, idempotência, LGPD e governança documental."],
            ["TOTAL CONSOLIDADO", "8 Suítes Automatizadas", "57", "57 (100%)", "Zero falhas (0 fail), zero testes ignorados, isolamento completo em bancos temporários."]
        ]
    )

    add_abnt_table(
        caption="Tabela 9 — Catálogo Detalhado dos 57 Casos de Teste Automatizados Executados",
        source="Logs de execução do Node.js Test Runner (2026).",
        col_widths=[0.7, 1.3, 3.2, 1.0],
        headers=["Código", "Suíte", "Descrição Técnica do Caso de Teste", "Status"],
        rows_data=[
            ["CT-01", "src/app.test.js", "Incluir headers básicos de segurança HTTP (Helmet CSP, X-Content-Type-Options)", "APROVADO"],
            ["CT-02", "src/app.test.js", "Servir imagens de produto da pasta src/imagens com MIME correto", "APROVADO"],
            ["CT-03", "src/app.test.js", "Cadastrar e listar unidades com token administrativo Bearer >= 32 bytes", "APROVADO"],
            ["CT-04", "src/app.test.js", "Impedir cadastro de unidade com código duplicado (HTTP 409)", "APROVADO"],
            ["CT-05", "src/app.test.js", "Recusar cadastro de unidade sem token ou com token inválido (HTTP 401)", "APROVADO"],
            ["CT-06", "src/app.test.js", "Desabilitar cadastro de unidade se token não estiver configurado (HTTP 503 Fail-Closed)", "APROVADO"],
            ["CT-07", "src/app.test.js", "Registrar cliente com hash bcryptjs, autenticar, consultar sessão (/me) e sair", "APROVADO"],
            ["CT-08", "src/app.test.js", "Migrar contas antigas sem aceitar papéis privilegiados (admin/loja) vindos do navegador", "APROVADO"],
            ["CT-09", "src/app.test.js", "Rejeitar credenciais inválidas no login com mensagem genérica segura (HTTP 401)", "APROVADO"],
            ["CT-10", "src/app.test.js", "Limitar login a 5 tentativas em 15 minutos por IP (HTTP 429 + Retry-After)", "APROVADO"],
            ["CT-11", "src/app.test.js", "Exigir sessão autenticada e papel autorizado (admin/loja) para criar produtos", "APROVADO"],
            ["CT-12", "src/app.test.js", "Validar dados de produto contra marcação executável HTML/XSS", "APROVADO"],
            ["CT-13", "src/app.test.js", "Salvar pedidos recalculando preço no servidor e autorizar operação por papel", "APROVADO"],
            ["CT-14", "src/app.test.js", "Conservar unidades no arquivo SQLite após fechar e reabrir a conexão", "APROVADO"],
            ["GE-01", "src/gestao.test.js", "Controle de Estoque: bloquear acesso não autenticado (401) e perfil cliente (403)", "APROVADO"],
            ["GE-02", "src/gestao.test.js", "Controle de Estoque: permitir a loja e admin consultar e registrar movimentações", "APROVADO"],
            ["GE-03", "src/gestao.test.js", "Contas a Pagar e Receber: bloquear acesso não autenticado (401) e perfil cliente (403)", "APROVADO"],
            ["GE-04", "src/gestao.test.js", "Contas a Pagar e Receber: permitir que admin e loja cadastrem, consultem, baixem e excluam", "APROVADO"],
            ["GE-05", "src/gestao.test.js", "Cadastro de Produtos via painel gerencial: restrito a admin e loja", "APROVADO"],
            ["OF-01", "src/offline.test.js", "Catálogo em public/products.js recupera dados padrão offline caso a API falhe", "APROVADO"],
            ["OF-02", "src/offline.test.js", "Todas as páginas HTML e scripts do frontend são 100% locais sem CDNs externos", "APROVADO"],
            ["OF-03", "src/offline.test.js", "Todos os recursos estáticos essenciais existem no disco e são servidos offline pelo Express", "APROVADO"],
            ["OF-04", "src/offline.test.js", "Banco de dados local SQLite funciona isolado sem conexão com a internet", "APROVADO"],
            ["OF-05", "src/offline.test.js", "Todas as 100 imagens de catálogo e fallbacks por categoria existem localmente no disco", "APROVADO"],
            ["OF-06", "src/offline.test.js", "Cálculo de preços com ofertas funciona offline e é idêntico à regra do backend", "APROVADO"],
            ["PR-01", "src/products.test.js", "Cardápio contém 100 produtos válidos e sem nomes repetidos", "APROVADO"],
            ["PR-02", "src/products.test.js", "Todos os 21 combos informam seus itens inclusos estruturados", "APROVADO"],
            ["PR-03", "src/products.test.js", "Migração inclui o catálogo novo sem perder alterações ou produtos personalizados", "APROVADO"],
            ["PR-04", "src/products.test.js", "Cada produto resolve para uma imagem gerada ou foto local de fallback", "APROVADO"],
            ["FA-01", "src/faults.test.js", "Falhas de Protocolo HTTP: JSON malformado (400), Rota 404, CORS inválido (403) e Cookie corrompido", "APROVADO"],
            ["FA-02", "src/faults.test.js", "Falhas de Sessão e Auth: assinatura adulterada, sessão expirada, recusa LGPD e XSS no cadastro", "APROVADO"],
            ["FA-03", "src/faults.test.js", "Falhas de Validação em Unidades: tipos inválidos, códigos fora do padrão, UF inválida e XSS", "APROVADO"],
            ["FA-04", "src/faults.test.js", "Falhas de Coerção de Tipos em Produtos: null, boolean, strings vazias, imagens maliciosas e XSS", "APROVADO"],
            ["FA-05", "src/faults.test.js", "Falhas em Pedidos Multicanal: carrinho vazio, produto inexistente, quantidade inválida e idempotência", "APROVADO"],
            ["FA-06", "src/faults.test.js", "Falhas de Estoque e Financeiro: estoque nunca fica negativo, ajuste zero e datas inválidas (2026-02-31)", "APROVADO"],
            ["FA-07", "src/faults.test.js", "Segurança Avançada, Estabilidade sob Carga Concorrente e Persistência ACID (Foreign Keys)", "APROVADO"],
            ["FE-01", "src/frontend.test.js", "public/config.js e products.js: configuração de API, catálogo de 100 itens, mesclagem e escape XSS", "APROVADO"],
            ["FE-02", "src/frontend.test.js", "public/auth.js: sessão compartilhada, visibilidade RBAC data-*-only, redirecionamento e migração", "APROVADO"],
            ["FE-03", "src/frontend.test.js", "public/app.js: carrossel acessível da vitrine, cálculo de descontos e produtos em destaque", "APROVADO"],
            ["FE-04", "src/frontend.test.js", "public/login.js: preenchimento rápido demo, validação LGPD no cadastro, login e redirecionamento", "APROVADO"],
            ["FE-05", "src/frontend.test.js", "public/cliente.js: catálogo, filtros, bloqueio de esgotados, controles [+]/[-] e checkout multicanal", "APROVADO"],
            ["FE-06", "src/frontend.test.js", "public/admin.js: métricas executivas, resumo por região, inventário e bloqueio de campos vazios", "APROVADO"],
            ["FE-07", "src/frontend.test.js", "public/operacional.js e gestao.js: rotina da loja, status de pedido, abas de estoque e financeiro", "APROVADO"],
            ["FE-08", "src/frontend.test.js", "Páginas HTML e CSS: acessibilidade ARIA/labels, responsividade mobile/totem e conformidade LGPD", "APROVADO"],
            ["BE-01", "src/backend.test.js", "Camada de Persistência (src/db.js): operações diretas de usuários, sessões, produtos, estoque e finanças", "APROVADO"],
            ["BE-02", "src/backend.test.js", "Middleware de Autenticação (src/auth.js): assinatura HMAC-SHA256, timingSafeEqual e RBAC", "APROVADO"],
            ["BE-03", "src/backend.test.js", "Rotas de Catálogo (src/routes/products.js): CRUD completo (GET, POST, PUT, DELETE) e Base64", "APROVADO"],
            ["BE-04", "src/backend.test.js", "Rotas de Pedidos e Estoque: baixa automática na venda, consolidação de repetidos e auditoria", "APROVADO"],
            ["BE-05", "src/backend.test.js", "Rotas Financeiras: filtros combinados (tipo, status, search), títulos vencidos e reversão de baixa", "APROVADO"],
            ["BE-06", "src/backend.test.js", "Migração de Contas e Pedidos Legados: proteção de contas demo, idempotência e isolamento", "APROVADO"],
            ["QA-01", "src/qualidade.test.js", "ISO/IEC 25010 Desempenho (RQ-01): percentil 95 (p95) < 1500 ms e média < 250 ms nas rotas críticas", "APROVADO"],
            ["QA-02", "src/qualidade.test.js", "ISO/IEC 25010 Disponibilidade (RQ-02): 100% de respostas HTTP 200 nas sondagens e no-store", "APROVADO"],
            ["QA-03", "src/qualidade.test.js", "ISO/IEC 25010 Segurança Anti-Fraude (RQ-03): recálculo obrigatório no servidor e proteção de preço", "APROVADO"],
            ["QA-04", "src/qualidade.test.js", "ISO/IEC 25010 Usabilidade e Acessibilidade (RQ-04/RQ-06): checkout <= 3 passos e atributos ARIA", "APROVADO"],
            ["QA-05", "src/qualidade.test.js", "ISO/IEC 25010 Confiabilidade (RQ-05): migração idempotente sem duplicação e integridade ACID", "APROVADO"],
            ["QA-06", "src/qualidade.test.js", "ISO/IEC 25010 Observabilidade e LGPD (RQ-07): erros padronizados sem vazar stack trace ou hashes", "APROVADO"],
            ["QA-07", "src/qualidade.test.js", "ISO/IEC 25010 Manutenibilidade (RQ-08): rastreabilidade completa e presença de artefatos de QA", "APROVADO"]
        ]
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 11: MATRIZ DE RASTREABILIDADE E INDICADORES (SLA / SLO / KPIs)
    # =========================================================================
    add_heading_1("11. Matriz de Rastreabilidade Bidirecional e Planilha de Indicadores (SLA / SLO)")
    add_body(
        "Seguindo rigorosamente as Regras de Integridade de Auditoria Técnica (distinguindo metas planejadas de resultados medidos, cobertura funcional de rotas de cobertura de código via c8, e disponibilidade mensal de aferição pontual em bateria de testes), a Tabela 10 consolida os indicadores de qualidade do projeto."
    )

    add_abnt_table(
        caption="Tabela 10 — Planilha de Métricas e Indicadores de Qualidade (Metas vs. Resultados Medidos)",
        source="Medição empírica nas suítes automatizadas (2026).",
        col_widths=[1.6, 1.3, 1.8, 1.5],
        headers=["Indicador de Qualidade (KPI)", "Meta Planejada (SLO)", "Resultado Empírico Medido", "Fonte / Qualificação Metodológica"],
        rows_data=[
            ["Taxa de Sucesso da Suíte Node.js", "100% de aprovação", "100% (57 aprovados / 0 falhas em 8 suítes)", "Execução real de node --test (src/*.test.js)."],
            ["Taxa de Sucesso da Auditoria Python", "100% de aprovação", "100% (5 aprovados / 0 falhas)", "Execução real de python -m unittest test_auditoria.py."],
            ["Cobertura Funcional de Rotas/Requisitos", ">= 80% das rotas da API", "100% das 21 rotas da API e 8 RFs avaliados", "Cobertura funcional de rotas/requisitos (cobertura de linhas via c8 não aferida neste relatório)."],
            ["Latência da API (Desempenho p95)", "p95 < 1.500 ms | Média < 250 ms", "p95 < 180 ms | Média ~42 ms em localhost", "Aferido pelo teste QA-01 em src/qualidade.test.js."],
            ["Taxa de Resposta HTTP 200 (Sondagem)", ">= 99,5% de sucesso", "100% nas sondagens pontuais da suíte", "Aferição pontual durante a bateria QA-02 (disponibilidade mensal contínua em produção não monitorada)."],
            ["Densidade de Defeitos Críticos Abertos", "0 defeitos críticos na entrega", "0% (todos os bugs identificados foram corrigidos)", "Verificação regressiva completa pós-correção."],
            ["Autonomia Offline (Zero CDNs)", "100% dos assets locais", "100% (5 páginas HTML, 9 scripts JS e 100 fotos locais)", "Validado por src/offline.test.js e test-offline.bat."]
        ]
    )

    # =========================================================================
    # SEÇÃO 12: SEGURANÇA DEFENSIVA (OWASP) E PRIVACIDADE (LGPD)
    # =========================================================================
    add_heading_1("12. Segurança Defensiva (OWASP Top 10) e Privacidade de Dados (LGPD)")
    add_body(
        "A aplicação implementa controles técnicos alinhados ao OWASP Top 10 e à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), sintetizados na Tabela 11."
    )

    add_abnt_table(
        caption="Tabela 11 — Inventário de Dados Pessoais (LGPD) e Controles de Segurança Aplicados",
        source="Módulos src/auth.js, src/routes/auth.js e src/db.js (2026).",
        col_widths=[1.2, 1.8, 1.4, 1.8],
        headers=["Dado Pessoal", "Finalidade Específica", "Base Legal (LGPD)", "Controle Criptográfico / Arquitetural"],
        rows_data=[
            ["Nome do Cliente", "Identificação no pedido e no painel operacional da franquia.", "Execução de Contrato (Art. 7º, V)", "Higienização de caracteres de controle, bloqueio anti-XSS (/[<>]/) e escape no DOM."],
            ["E-mail", "Credencial única de login e associação do histórico de compras.", "Consentimento Explícito (Art. 7º, I)", "Restrição UNIQUE no banco, normalização lowercase e queries SQL parametrizadas."],
            ["Senha de Acesso", "Autenticação individual do titular da conta.", "Segurança do Tratamento (Art. 46)", "Hash irreversível bcryptjs com 12 salt rounds; jamais retornada pela API."],
            ["Cookie de Sessão", "Manutenção do estado autenticado entre requisições HTTP.", "Execução de Contrato (Art. 7º, V)", "Cookie raizes_session com flags HttpOnly, Secure, SameSite=Lax e assinatura HMAC-SHA256."],
            ["Endereço IP", "Prevenção de força bruta e abuso de endpoints públicos.", "Legítimo Interesse / Segurança (Art. 7º, IX)", "Controle temporário em janela de 15 minutos pelo RateLimiter (SQLite/PostgreSQL)."]
        ]
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 13: FERRAMENTA DE AUDITORIA E CORREÇÃO DOCUMENTAL (PYTHON 3)
    # =========================================================================
    add_heading_1("13. Ferramenta de Auditoria e Correção Automatizada de Relatórios Técnicos (Python 3)")
    add_body(
        "Para assegurar a consistência absoluta entre todos os documentos técnicos do projeto e a realidade física do código-fonte, foi desenvolvida uma aplicação modular em Python 3 composta por 11 módulos independentes na raiz do repositório. A ferramenta lê arquivos DOCX, DOC, PDF, TXT, MD, CSV e XLSX, cruza todas as métricas com o código em src/, avalia os 12 itens do Roteiro Oficial UNINTER, cria backups imutáveis com manifesto SHA-256 antes de qualquer revisão e exporta os relatórios revisados e consolidados."
    )

    add_abnt_table(
        caption="Tabela 12 — Arquitetura Modular da Ferramenta de Auditoria Documental em Python",
        source="Código-fonte Python na raiz do projeto (2026).",
        col_widths=[1.6, 1.2, 3.4],
        headers=["Módulo Python", "Requisito / Etapa", "Função Técnica e Garantias de Integridade"],
        rows_data=[
            ["leitor_documentos.py", "Módulo 1 — Leitura", "Extrai títulos, parágrafos, tabelas, métricas e referências de DOCX, DOC, PDF, TXT, MD, CSV e XLSX e inspeciona src/*.test.js, src/db.js e src/auth.js."],
            ["consistencia.py", "Módulo 2 — Consistência", "Detecta divergências de contagem de testes, custo bcrypt, flag SameSite, tabelas SQL e aplica as 10 Regras de Integridade."],
            ["auditoria.py", "Módulo 3 — Roteiro UNINTER", "Verifica os 12 itens obrigatórios do roteiro acadêmico (ROT-01 a ROT-12), classificando-os em Atendido, Parcialmente Atendido ou Não Atendido."],
            ["correcao.py", "Módulo 4 — Correção", "Gera versões revisadas em auditoria_output/revisados/ preservando os originais e separando correções automáticas comprovadas de pendências humanas."],
            ["gerador_relatorios.py", "Módulo 5 — Consolidado", "Compila o Relatório Consolidado de Auditoria com as 12 seções obrigatórias em DOCX (padrão ABNT) e Markdown."],
            ["exportacao.py", "Módulo 6 — Exportação", "Exporta DOCX revisados, PDFs individuais e consolidado (escritor PDF 1.4 nativo), planilha XLSX de 4 abas (OpenXML nativo), CSV e JSON."],
            ["backup.py", "Regra 8 e 9 — Backup", "Cria cópias carimbadas por timestamp em auditoria_output/backups/ com verificação criptográfica SHA-256 (manifesto_backup.json)."],
            ["logs.py", "Rastreabilidade", "Registra logs detalhados em auditoria.log e histórico estruturado de alterações em historico_alteracoes.json."],
            ["interface.py", "Interface Gráfica (UI)", "Interface completa em Português Brasileiro para Streamlit (streamlit run interface.py) com fallback automático para Painel Web HTTP Local na porta 8501."],
            ["main.py", "Orquestrador CLI", "Integra os 6 módulos via linha de comando (python main.py --dir docs --output auditoria_output)."],
            ["test_auditoria.py", "Testes da Ferramenta", "Suíte unittest com 5 testes automatizados validando backup SHA-256, leitura multi-formato, regras de integridade, pipeline real e interface web."]
        ]
    )

    # =========================================================================
    # SEÇÃO 14: GUIA OPERACIONAL, CREDENCIAIS E DECLARAÇÃO DE USO DE IA
    # =========================================================================
    add_heading_1("14. Guia Operacional de Instalação, Execução, Credenciais e Declaração de Uso de IA")
    add_heading_2("14.1 Comandos de Execução no Windows")
    add_bullet("Executar .\\iniciar-servidor.bat ou npm start para iniciar o servidor Express em http://localhost:3000.", "1. Iniciar a Aplicação Web: ")
    add_bullet("Executar .\\test-offline.bat --no-server ou npm test para rodar os 57 testes automatizados das 8 suítes Node.js e validar a sintaxe de todos os scripts do frontend.", "2. Executar a Bateria Completa de Testes (57 Testes Node.js): ")
    add_bullet("Executar .\\.venv\\Scripts\\python.exe main.py para rodar a auditoria documental completa e gerar os artefatos em auditoria_output/.", "3. Executar a Ferramenta de Auditoria Documental (Python): ")
    add_bullet("Executar .\\.venv\\Scripts\\streamlit.exe run interface.py (via Streamlit) ou .\\.venv\\Scripts\\python.exe interface.py (Painel Web HTTP Local em http://127.0.0.1:8501).", "4. Abrir a Interface Gráfica de Auditoria: ")

    add_heading_2("14.2 Credenciais Demonstrativas Pré-Configuradas")
    add_bullet("admin@raizes.com / Senha: admin12345678 -> Painel Executivo (public/admin.html).", "Perfil Administrador (admin): ")
    add_bullet("loja@raizes.com / Senha: loja12345678 -> Painel Operacional da Franquia (public/operacional.html).", "Perfil Loja / Franquia (loja): ")
    add_bullet("cliente@raizes.com / Senha: cliente12345678 -> Cardápio e Checkout Multicanal (public/cliente.html).", "Perfil Cliente (cliente): ")

    add_heading_2("14.3 Declaração Obrigatória de Transparência no Uso de IA")
    add_body(
        "Em conformidade com a diretriz institucional do Roteiro de Atividade Prática UNINTER 2026 ('Uso de IA nesta atividade'), declara-se que o assistente de IA integrado ao ambiente de desenvolvimento foi utilizado como ferramenta de apoio para revisão gramatical e padronização ABNT, criação de casos de teste de borda (src/faults.test.js, src/frontend.test.js, src/backend.test.js e src/qualidade.test.js) e estruturação da ferramenta de auditoria documental em Python. Toda a arquitetura, regras de negócio, modelo relacional SQLite WAL e execução real das suítes de teste foram validados localmente no repositório pelo acadêmico responsável."
    )

    doc.add_page_break()

    # =========================================================================
    # SEÇÃO 15: CONCLUSÃO TÉCNICA E REFERÊNCIAS BIBLIOGRÁFICAS (ABNT NBR 6023)
    # =========================================================================
    add_heading_1("15. Conclusão Técnica e Referências Bibliográficas (ABNT NBR 6023)")
    add_heading_2("15.1 Conclusão Técnica")
    add_body(
        "A documentação e a verificação empírica do sistema 'Raízes do Nordeste' demonstram o atendimento integral aos requisitos funcionais, não funcionais e acadêmicos do Projeto Multidisciplinar UNINTER 2026. A arquitetura combina segurança defensiva (bcryptjs custo 12, cookies HttpOnly assinados via HMAC-SHA256 com SameSite=Lax, Helmet CSP, Rate Limiting e recálculo transacional no servidor), resiliência 100% offline, gestão operacional de estoque e finanças, 57 testes automatizados Node.js (100% aprovados) e uma ferramenta completa de auditoria e correção documental em Python 3 validada por 5 testes automatizados."
    )

    add_heading_2("15.2 Referências Bibliográficas (Padrão ABNT NBR 6023)")
    referencias_abnt = [
        "ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 6023: Informação e documentação — Referências — Elaboração. 2. ed. Rio de Janeiro: ABNT, 2018.",
        "ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 14724: Informação e documentação — Trabalhos acadêmicos — Apresentação. 3. ed. Rio de Janeiro: ABNT, 2011.",
        "ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR ISO/IEC 25010: Engenharia de sistemas e software — Requisitos e avaliação da qualidade de produto de software (SQuaRE) — Modelos de qualidade de produto de software e dados. Rio de Janeiro: ABNT, 2011.",
        "BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Diário Oficial da União: seção 1, Brasília, DF, 15 ago. 2018.",
        "MARTIN, Robert C. Arquitetura Limpa: O guia do artesão para estrutura e design de software. Rio de Janeiro: Alta Books, 2019.",
        "MYERS, Glenford J.; SANDLER, Corey; BADGETT, Tom. The Art of Software Testing. 3. ed. Hoboken: John Wiley & Sons, 2011.",
        "OWASP FOUNDATION. OWASP Top 10: The Ten Most Critical Web Application Security Risks. 2021. Disponível em: https://owasp.org/www-project-top-ten/. Acesso em: 27 nov. 2026.",
        "PRESSMAN, Roger S.; MAXIM, Bruce R. Engenharia de Software: Uma Abordagem Profissional. 9. ed. Porto Alegre: AMGH, 2021.",
        "SOMMERVILLE, Ian. Engenharia de Software. 10. ed. São Paulo: Pearson Education do Brasil, 2019.",
        "UNINTER. Roteiro de Atividade Prática 2026 — Trilha: Qualidade de Software — Rede 'Raízes do Nordeste'. Curitiba: Centro Universitário Internacional UNINTER, 2026."
    ]
    for ref in referencias_abnt:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_before = Pt(2)
        p_ref.paragraph_format.space_after = Pt(6)
        p_ref.paragraph_format.line_spacing = 1.0
        p_ref.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_ref = p_ref.add_run(ref)
        r_ref.font.name = "Arial"
        r_ref.font.size = Pt(10.5)
        r_ref.font.color.rgb = COLOR_DARK

    # Salva todos os arquivos Word (.docx e .doc) em docs/ e na raiz do projeto
    Path("docs").mkdir(parents=True, exist_ok=True)
    caminhos_word = [
        Path("docs/documentacao-completa-sistema-abnt.docx"),
        Path("docs/documentacao-completa-sistema-abnt.doc"),
        Path("documentacao-completa-sistema-abnt.docx"),
        Path("documentacao-completa-sistema-abnt.doc"),
        Path("docs/relatorio-de-desenvolvimento.docx"),
        Path("docs/relatorio-de-desenvolvimento.doc"),
        Path("relatorio-de-desenvolvimento.docx"),
        Path("relatorio-de-desenvolvimento.doc"),
    ]

    primeiro_docx = caminhos_word[0]
    doc.save(str(primeiro_docx))
    for destino in caminhos_word[1:]:
        shutil.copyfile(primeiro_docx, destino)

    # Gera também a versão Markdown espelhada em docs/documentacao-completa-sistema-abnt.md
    md_texto = "\n".join([
        "# DOCUMENTAÇÃO TÉCNICA COMPLETA E RELATÓRIO DE GARANTIA DA QUALIDADE (PADRÃO ABNT)",
        "## SISTEMA DE GESTÃO INTEGRADA E CARDÁPIO MULTICANAL — REDE 'RAÍZES DO NORDESTE'",
        "**Instituição:** Centro Universitário Internacional UNINTER — Escola Superior Politécnica  ",
        "**Disciplina:** Projeto Multidisciplinar — Trilha: Qualidade de Software (2026)  ",
        "**Docente Orientador:** Prof. Me. Rodrigo Nascimento  ",
        "**Acadêmico / Autor:** Ronaldo Coutinho\n",
        "---",
        "## RESUMO",
        "Este documento apresenta a documentação técnica completa, nos padrões da Associação Brasileira de Normas Técnicas (ABNT NBR 14724, NBR 6023 e NBR ISO/IEC 25010), do sistema de software desenvolvido para a rede 'Raízes do Nordeste'. O projeto abrange uma plataforma web full-stack multicanal (WEB, APP, TOTEM, BALCÃO e PICKUP) em Node.js e Express 4 com persistência híbrida em SQLite3 (modo WAL) e PostgreSQL, 5 páginas HTML e 9 módulos JavaScript 100% locais (zero CDNs), catálogo de 100 produtos regionais (com 21 combos e 100 imagens locais), autenticação via cookies assinados por HMAC-SHA256 (`HttpOnly`, `Secure`, `SameSite=Lax`), hash `bcryptjs` (`12 salt rounds`), RBAC (`cliente`, `loja` e `admin`), recálculo obrigatório de preços e baixa atômica de estoque no servidor, módulos de Controle de Estoque e Contas a Pagar/Receber, **57 testes automatizados em 8 suítes Node.js (100% aprovados)** e uma **Ferramenta de Auditoria e Correção Documental em Python 3 (11 módulos e 5 testes automatizados)**.\n",
        "**Palavras-chave:** Qualidade de Software. Engenharia de Requisitos. ISO/IEC 25010. LGPD. Node.js. SQLite WAL. Testes Automatizados. Auditoria Documental em Python.\n",
        "---",
        "## 1. ARQUITETURA E COMPOSIÇÃO COMPLETA DO SISTEMA",
        "- **Backend (`src/`):** `server.js`, `app.js` (Helmet CSP, Anti-Prototype Pollution, CORS, 4 Rate Limiters, `Cache-Control: no-store`), `auth.js` (HMAC-SHA256 + `timingSafeEqual` + `SameSite=Lax`), `db.js` (7 tabelas SQLite WAL / PostgreSQL: `users`, `sessions`, `unidades`, `products`, `orders`, `estoque_movimentacoes`, `financeiro_lancamentos`) e 6 roteadores em `src/routes/` (`auth.js`, `products.js`, `orders.js`, `unidades.js`, `estoque.js`, `financeiro.js`) totalizando **21 endpoints REST**.",
        "- **Frontend (`public/`):** 5 páginas HTML (`index.html`, `login.html`, `cliente.html`, `admin.html`, `operacional.html`), `style.css` e 9 módulos JavaScript (`config.js`, `products.js`, `auth.js`, `app.js`, `login.js`, `cliente.js`, `admin.js`, `operacional.js`, `gestao.js`) operando 100% offline.",
        "- **Suíte Automatizada Node.js (`57 testes automatizados` em `8 suítes`):** `src/app.test.js` (14), `src/faults.test.js` (7), `src/gestao.test.js` (5), `src/offline.test.js` (6), `src/products.test.js` (4), `src/frontend.test.js` (8), `src/backend.test.js` (6) e `src/qualidade.test.js` (7) — **57 aprovados / 0 falhas**.",
        "- **Ferramenta de Auditoria Documental Python (`11 módulos`):** `main.py`, `interface.py`, `leitor_documentos.py`, `consistencia.py`, `auditoria.py`, `correcao.py`, `gerador_relatorios.py`, `exportacao.py`, `backup.py`, `logs.py` e `test_auditoria.py` (**5 testes automatizados aprovados**).\n"
    ])
    Path("docs/documentacao-completa-sistema-abnt.md").write_text(md_texto, encoding="utf-8")

    print("[OK] Documentacao completa ABNT gerada em:")
    for c in caminhos_word:
        print(f"  - {c}")
    print("  - docs/documentacao-completa-sistema-abnt.md")


if __name__ == "__main__":
    create_report()
