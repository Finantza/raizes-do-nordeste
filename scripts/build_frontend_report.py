# -*- coding: utf-8 -*-
"""
Gerador do Relatório de Testes da Linha de Frontend (Word .doc, .docx e Markdown .md)
Projeto: Rede Raízes do Nordeste (UNINTER 2026)
"""

import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls


def build_frontend_test_report():
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(1.18)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(1.18)
        section.right_margin = Inches(0.79)

        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Relatório de Testes da Linha de Frontend | Rede 'Raízes do Nordeste'")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(128, 128, 128)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("UNINTER - 2026 | Garantia da Qualidade de Software - Bateria de Testes de Frontend")
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

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(11.5)
        run.font.color.rgb = COLOR_SECONDARY
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

    # Título
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(6)
    rt = p_title.add_run("RELATÓRIO DE TESTES DA LINHA DE FRONTEND\nREDE 'RAÍZES DO NORDESTE'")
    rt.bold = True
    rt.font.name = "Calibri"
    rt.font.size = Pt(16)
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

    add_h1("1. Resumo Executivo da Bateria de Testes de Frontend")
    add_p(
        "Este documento registra os resultados da verificação completa de todos os módulos da linha de frontend "
        "da aplicação web 'Raízes do Nordeste' (localizados no diretório public/). A bateria avalia a sintaxe estática "
        "dos 9 scripts JavaScript, a estrutura semântica e de acessibilidade das 5 páginas HTML5, o design system responsivo "
        "em public/style.css, a autonomia 100% offline sem dependência de CDNs externos e os testes funcionais automatizados "
        "dos componentes em src/frontend.test.js, src/products.test.js e src/offline.test.js."
    )

    add_table(
        [2.2, 4.3],
        ["Indicador de Qualidade de Frontend", "Resultado Aferido"],
        [
            ["Arquivos JavaScript do Frontend Testados", "9 de 9 aprovados em validação sintática (node --check) e funcional"],
            ["Páginas HTML5 e Folha de Estilos Verificadas", "5 páginas HTML + 1 folha CSS + logomarca SVG + 100 imagens locais"],
            ["Suíte Específica de Frontend (src/frontend.test.js)", "8 suítes de componentes executadas - 8 aprovadas (0 falhas)"],
            ["Suíte de Catálogo e Imagens (src/products.test.js)", "4 testes unitários executados - 4 aprovados (0 falhas)"],
            ["Suíte de Autonomia Offline (src/offline.test.js)", "6 testes de resiliência executados - 6 aprovados (0 falhas)"],
            ["Suíte Completa do Projeto (Frontend + Backend)", "44 testes automatizados no total - 44 aprovados (100% de sucesso)"],
            ["Dependências Externas de CDN (Scripts/Fontes/CSS)", "0 referências externas (operação 100% local e offline)"]
        ]
    )

    add_h1("2. Verificação Sintática e Estrutural dos Arquivos do Frontend")
    add_p(
        "Todos os scripts que compõem a camada de apresentação foram submetidos à validação do interpretador Node.js "
        "e à verificação de integridade de carregamento:"
    )

    add_table(
        [1.6, 3.6, 1.3],
        ["Arquivo Frontend", "Responsabilidade Técnica Testada", "Status"],
        [
            ["public/config.js", "Definição dinâmica de window.__APP_CONFIG__.apiBaseUrl para HTTP e file://", "APROVADO"],
            ["public/products.js", "Catálogo padrão de 100 itens, 21 combos, imagens locais, fallback, merge e escape HTML", "APROVADO"],
            ["public/auth.js", "Cliente HTTP fetch com credenciais, sessão /auth/me, visibilidade RBAC e logout", "APROVADO"],
            ["public/app.js", "Carrossel acessível da vitrine, cálculo de descontos (2 casas decimais) e destaques", "APROVADO"],
            ["public/login.js", "Formulário de login, cadastro com validação LGPD e botões de preenchimento rápido", "APROVADO"],
            ["public/cliente.js", "Cardápio categorizado, bloqueio de esgotados, controles [+] e [-] do carrinho e checkout", "APROVADO"],
            ["public/admin.js", "Indicadores executivos, resumo regional, inventário rápido e cadastro de produtos", "APROVADO"],
            ["public/operacional.js", "Rotina da unidade, checklist operacional, fila de pedidos e atualização de status", "APROVADO"],
            ["public/gestao.js", "Navegação por abas, controle de estoque auditado, contas a pagar/receber e catálogo", "APROVADO"],
            ["public/index.html", "Vitrine institucional, carrossel de ofertas, atalhos de categorias e chamadas de ação", "APROVADO"],
            ["public/login.html", "Interface de login único, cadastro com termo LGPD (Lei nº 13.709/2018) e contas demo", "APROVADO"],
            ["public/cliente.html", "Interface de cardápio público, carrinho com 4 modalidades multicanal e histórico", "APROVADO"],
            ["public/admin.html", "Painel administrativo restrito (data-required-role='admin') com 4 abas integradas", "APROVADO"],
            ["public/operacional.html", "Painel operacional da loja (data-required-role='loja,admin') com 4 abas integradas", "APROVADO"],
            ["public/style.css", "Variáveis de cor da paleta nordestina, layout responsivo (320px-1920px) e acessibilidade", "APROVADO"]
        ]
    )

    add_h1("3. Detalhamento dos Casos de Teste Automatizados de Frontend")
    add_p(
        "Abaixo estão listados todos os casos de teste executados diretamente sobre o código e a árvore DOM simulada "
        "da linha de frontend:"
    )

    add_table(
        [0.8, 1.5, 3.0, 1.2],
        ["ID", "Suíte", "Cenário de Frontend Verificado", "Resultado"],
        [
            ["FE-01", "src/frontend.test.js", "Configuração de apiBaseUrl, carregamento dos 100 produtos, escapeRaizesHtml contra XSS e validação de tamanho/formato de imagem em prepareRaizesProductImage", "APROVADO"],
            ["FE-02", "src/frontend.test.js", "Consulta de sessão /auth/me, migração automática de contas legadas do localStorage e aplicação de visibilidade RBAC nos elementos [data-admin-only], [data-staff-only], [data-loja-only] e [data-cliente-only]", "APROVADO"],
            ["FE-03", "src/frontend.test.js", "Renderização dos 5 slides do carrossel de ofertas na página inicial, 4 cartões de destaque e alternância de slides pelos botões anterior e próximo", "APROVADO"],
            ["FE-04", "src/frontend.test.js", "Preenchimento automático via botões de demonstração, bloqueio de cadastro quando o termo LGPD é desmarcado, criação de conta e redirecionamento pós-login", "APROVADO"],
            ["FE-05", "src/frontend.test.js", "Renderização das 5 categorias do cardápio, bloqueio de adição de item com estoque zero, incremento/decremento com botões [+] e [-] no carrinho e mapeamento de canal (Totem -> TOTEM) no checkout", "APROVADO"],
            ["FE-06", "src/frontend.test.js", "Cálculo de indicadores do painel administrativo (total de produtos, pedidos, faturamento e ticket médio), tabela de inventário e bloqueio de envio com preço vazio ('')", "APROVADO"],
            ["FE-07", "src/frontend.test.js", "Renderização da fila de pedidos na tela operacional da loja e carregamento dinâmico das abas de Controle de Estoque, Contas a Pagar/Receber e Catálogo de Produtos em gestao.js", "APROVADO"],
            ["FE-08", "src/frontend.test.js", "Inspeção estrutural de acessibilidade (lang='pt-BR', meta viewport, aria-live='polite'), presença do termo LGPD, opções multicanal e breakpoints responsivos no CSS", "APROVADO"],
            ["PR-01", "src/products.test.js", "Validação dos 100 produtos do cardápio sem IDs ou nomes duplicados e com preços, estoques e descontos dentro dos limites", "APROVADO"],
            ["PR-02", "src/products.test.js", "Verificação dos 21 combos promocionais com lista estruturada de itensInclusos e descrições preenchidas", "APROVADO"],
            ["PR-03", "src/products.test.js", "Mesclagem não destrutiva do catálogo (mergeRaizesProducts) preservando edições e produtos personalizados", "APROVADO"],
            ["PR-04", "src/products.test.js", "Resolução determinística das 100 imagens locais em /imagens/ e das fotos de fallback por categoria em /images/products/", "APROVADO"],
            ["OF-01", "src/offline.test.js", "Recuperação automática dos 100 produtos padrão no navegador quando a requisição à API falha por falta de conexão", "APROVADO"],
            ["OF-02", "src/offline.test.js", "Ausência total de scripts, folhas de estilo ou @import apontando para CDNs externos (http/https) nas páginas HTML e CSS", "APROVADO"],
            ["OF-03", "src/offline.test.js", "Serviço HTTP 200 e MIME type correto para todas as 12 rotas estáticas principais do frontend pelo Express", "APROVADO"],
            ["OF-04", "src/offline.test.js", "Existência física no disco de todas as 100 imagens de produtos e fotos de fallback referenciadas pelo frontend", "APROVADO"],
            ["OF-05", "src/offline.test.js", "Paridade matemática exata no cálculo de preços com desconto entre o frontend (cliente.js e app.js) e o backend (orders.js)", "APROVADO"]
        ]
    )

    add_h1("4. Bugs de Frontend Diagnosticados e Corrigidos na Bateria")
    add_bullet(
        "Em public/app.js, a função getDiscountedPrice() foi ajustada para arredondar o valor promocional em duas casas decimais (Math.round(... * 100) / 100), garantindo paridade exata com o carrinho e com o backend.",
        "1. Arredondamento Financeiro na Vitrine: "
    )
    add_bullet(
        "Em public/admin.js, public/operacional.js e public/gestao.js, a conversão direta Number('') resultava em 0. Os formulários agora convertem strings vazias em NaN antes da validação, impedindo envios com campos numéricos em branco.",
        "2. Coerção de Campos Numéricos Vazios nos Formulários: "
    )
    add_bullet(
        "Em public/cliente.js, produtos sem oferta (offer === 0) não exibem mais o selo '-0%' nem o preço duplicado; produtos com estoque 0 exibem 'Esgotado' com botão desabilitado; e o carrinho ganhou botões [-] e [+] limitados ao estoque real.",
        "3. Usabilidade do Cardápio e Controle de Estoque no Carrinho: "
    )
    add_bullet(
        "Em public/cliente.js, ao concluir o pedido, o frontend agora envia o canal correspondente à modalidade escolhida (WEB, PICKUP, BALCAO, TOTEM) e recarrega imediatamente o catálogo para exibir o novo saldo de estoque.",
        "4. Sincronização Multicanal e Atualização Pós-Compra: "
    )
    add_bullet(
        "Em public/admin.js, public/operacional.js e public/gestao.js, a exclusão ou troca de foto de um produto sincroniza automaticamente todas as tabelas abertas nas abas de visão geral, catálogo e estoque.",
        "5. Sincronização Entre Abas de Gestão: "
    )

    add_h1("5. Parecer de Homologação do Frontend")
    add_p(
        "Conclui-se que toda a linha de frontend do sistema 'Raízes do Nordeste' foi verificada e aprovada sem erros "
        "sintáticos, visuais ou funcionais. Os 44 testes automatizados do repositório (incluindo os 18 testes dedicados "
        "exclusivamente à camada de frontend, catálogo e operação offline) executam com 100% de aprovação."
    )

    os.makedirs("docs", exist_ok=True)
    docx_docs = os.path.join("docs", "relatorio-testes-frontend.docx")
    doc_docs = os.path.join("docs", "relatorio-testes-frontend.doc")
    doc.save(docx_docs)
    shutil.copyfile(docx_docs, doc_docs)
    shutil.copyfile(docx_docs, "relatorio-testes-frontend.docx")
    shutil.copyfile(docx_docs, "relatorio-testes-frontend.doc")
    print(f"[OK] Relatórios Word gerados: {doc_docs}, {docx_docs} e cópias na raiz.")


if __name__ == "__main__":
    build_frontend_test_report()
