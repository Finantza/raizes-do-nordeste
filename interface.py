# -*- coding: utf-8 -*-
"""
Módulo de Interface Gráfica (UI) — Sistema de Auditoria e Correção Documental.
Projeto: Rede Raízes do Nordeste (UNINTER — Qualidade de Software 2026).

Oferece:
1. Interface completa em Streamlit (`streamlit run interface.py`), permitindo:
   - Selecionar a pasta dos documentos.
   - Fazer upload de arquivos adicionais (DOCX, DOC, PDF, TXT, MD, CSV, XLSX).
   - Iniciar auditoria completa cruzada com o repositório.
   - Visualizar inconsistências detectadas e matriz do roteiro UNINTER.
   - Aprovar ou rejeitar correções sugeridas individualmente.
   - Executar correções autorizadas com backup SHA-256 prévio.
   - Baixar documentos revisados (DOCX, PDF, XLSX, CSV, JSON).
   - Consultar histórico de alterações auditável.
2. Painel Web HTTP Local Integrado (fallback automático caso o comando `python interface.py`
   seja executado diretamente sem o pacote `streamlit` instalado no ambiente offline).
"""

import json
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any, Dict, List, Tuple
from urllib.parse import parse_qs, quote, urlparse

from auditoria import VerificadorRoteiroAcademico
from backup import GestorBackup
from consistencia import AnalisadorConsistencia
from correcao import CorretorDocumental
from exportacao import ExportadorAuditoria
from gerador_relatorios import GeradorRelatorios
from leitor_documentos import LeitorDocumentos
from logs import GestorLogs


def executar_pipeline_interface(
    pasta_docs: str,
    pasta_saida: str = "auditoria_output",
    incluir_revisao_humana_aprovada: bool = True,
    aplicar_correcoes: bool = True,
) -> Dict[str, Any]:
    """
    Executa o fluxo de auditoria e, opcionalmente, aplica as correções aprovadas
    e exporta todos os artefatos.
    """
    raiz_projeto = Path(__file__).resolve().parent
    dir_docs = Path(pasta_docs).resolve()
    dir_saida = Path(pasta_saida).resolve()

    gestor_logs = GestorLogs(str(dir_saida / "logs"))
    gestor_backup = GestorBackup(str(dir_saida / "backups"), logger=gestor_logs)
    leitor = LeitorDocumentos(logger=gestor_logs)
    analisador = AnalisadorConsistencia(logger=gestor_logs)
    verificador = VerificadorRoteiroAcademico(logger=gestor_logs)
    corretor = CorretorDocumental(
        diretorio_saida=str(dir_saida / "revisados"),
        gestor_backup=gestor_backup,
        gestor_logs=gestor_logs,
    )
    gerador = GeradorRelatorios(
        diretorio_saida=str(dir_saida / "relatorios"),
        logger=gestor_logs,
    )
    exportador = ExportadorAuditoria(
        diretorio_base=str(dir_saida),
        logger=gestor_logs,
    )

    documentos = leitor.carregar_diretorio(str(dir_docs), incluir_raiz=True)
    fatos_codigo = leitor.inspecionar_repositorio_codigo(str(raiz_projeto))
    resultado_consistencia = analisador.executar_auditoria_consistencia(documentos, fatos_codigo)
    resultado_roteiro = verificador.avaliar_roteiro(documentos, fatos_codigo)

    resultado_correcao: Dict[str, Any] = {}
    arquivos_exportados: Dict[str, Any] = {}

    if aplicar_correcoes:
        resultado_correcao = corretor.executar_correcoes(
            documentos=documentos,
            inconsistencias=resultado_consistencia["inconsistencias"],
            fatos_codigo=fatos_codigo,
            incluir_revisao_humana_aprovada=incluir_revisao_humana_aprovada,
        )
        dados_consolidados = gerador.compilar_dados_relatorio(
            documentos=documentos,
            resultado_consistencia=resultado_consistencia,
            resultado_roteiro=resultado_roteiro,
            resultado_correcao=resultado_correcao,
        )
        caminho_docx = gerador.gerar_relatorio_consolidado_docx(dados_consolidados)
        gerador.gerar_relatorio_consolidado_markdown(dados_consolidados)
        arquivos_exportados = exportador.exportar_tudo(
            dados_consolidados=dados_consolidados,
            caminho_consolidado_docx=caminho_docx,
        )

    historico = gestor_logs.carregar_historico()
    gestor_logs.fechar()

    return {
        "documentos": documentos,
        "fatos_codigo": fatos_codigo,
        "consistencia": resultado_consistencia,
        "roteiro": resultado_roteiro,
        "correcao": resultado_correcao,
        "exportados": arquivos_exportados,
        "historico": historico,
        "dir_saida": str(dir_saida),
    }


def renderizar_streamlit() -> None:
    """Renderiza a interface gráfica completa utilizando Streamlit."""
    import streamlit as st

    st.set_page_config(
        page_title="Auditoria Documental QA — Rede Raízes do Nordeste",
        page_icon="📋",
        layout="wide",
    )

    st.title("📋 Sistema de Auditoria e Correção Documental — Rede Raízes do Nordeste")
    st.caption(
        "Projeto Multidisciplinar UNINTER — Qualidade de Software (2026) | "
        "Verificação de Consistência, Conformidade com Roteiro e Correção Rastreável"
    )

    raiz_projeto = Path(__file__).resolve().parent
    pasta_padrao = str(raiz_projeto / "docs")
    pasta_saida_padrao = str(raiz_projeto / "auditoria_output")

    with st.sidebar:
        st.header("⚙️ Configuração da Auditoria")
        pasta_docs = st.text_input("Pasta dos Documentos", value=pasta_padrao)
        pasta_saida = st.text_input("Pasta de Saída", value=pasta_saida_padrao)

        st.subheader("📤 Upload de Arquivos")
        arquivos_upload = st.file_uploader(
            "Adicionar documentos à pasta analisada",
            type=["docx", "doc", "pdf", "txt", "md", "csv", "xlsx"],
            accept_multiple_files=True,
        )
        if arquivos_upload:
            destino_dir = Path(pasta_docs)
            destino_dir.mkdir(parents=True, exist_ok=True)
            for arq in arquivos_upload:
                caminho_dest = destino_dir / arq.name
                caminho_dest.write_bytes(arq.getvalue())
            st.success(f"{len(arquivos_upload)} arquivo(s) salvo(s) em {pasta_docs}")

        iniciar = st.button("🔍 Iniciar Auditoria", type="primary", use_container_width=True)

    if iniciar or "resultado_auditoria" not in st.session_state:
        with st.spinner("Executando leitura documental, inspeção de código e auditoria..."):
            st.session_state["resultado_auditoria"] = executar_pipeline_interface(
                pasta_docs=pasta_docs,
                pasta_saida=pasta_saida,
                aplicar_correcoes=False,
            )

    res = st.session_state["resultado_auditoria"]
    consistencia = res["consistencia"]
    roteiro = res["roteiro"]
    fatos = res["fatos_codigo"]

    total_rot = max(1, roteiro.get("total_itens_avaliados", 12))
    pct_rot = ((roteiro.get("atendidos", 0) + 0.5 * roteiro.get("parcialmente_atendidos", 0)) / total_rot) * 100.0

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Documentos Lidos", len(res["documentos"]))
    col2.metric(
        "Testes Reais no Código",
        f"{fatos.get('total_testes_no_codigo', 0)} ({fatos.get('total_suites_no_codigo', 0)} suítes)",
    )
    col3.metric("Inconsistências Detectadas", consistencia.get("total_inconsistencias", 0))
    col4.metric("Conformidade UNINTER", f"{pct_rot:.1f}%")

    aba_inc, aba_rot, aba_cor, aba_down, aba_hist = st.tabs([
        "🔎 Inconsistências Detectadas",
        "📐 Matriz do Roteiro UNINTER",
        "✅ Aprovar e Executar Correções",
        "📥 Baixar Documentos Revisados",
        "📜 Histórico de Alterações",
    ])

    with aba_inc:
        st.subheader("Divergências e Regras de Integridade Verificadas")
        for inc in consistencia.get("inconsistencias", []):
            cor_icone = "🔴" if inc.severidade == "ALTA" else ("🟠" if inc.severidade == "MEDIA" else "🟡")
            with st.expander(f"{cor_icone} [{inc.id}] {inc.documento} — {inc.categoria}"):
                st.markdown(f"**Severidade:** `{inc.severidade}` | **Localização:** `{inc.localizacao}`")
                st.markdown(f"**Descrição Completa:** {inc.descricao}")
                st.markdown(f"**Evidência Encontrada:** `{inc.evidencia_encontrada}`")
                st.markdown(f"**Valor de Referência Factual:** `{inc.valor_referencia_factual}`")
                st.markdown(f"**Ação Recomendada:** {inc.acao_recomendada}")

    with aba_rot:
        st.subheader("Verificação do Roteiro Acadêmico UNINTER")
        dados_roteiro = [
            {
                "Código": item.codigo,
                "Item do Roteiro": item.item_roteiro,
                "Status": item.status,
                "Documentos": item.documentos_comprobatorios,
                "Evidência": item.evidencia_verificada,
                "Complemento": item.complemento_necessario,
            }
            for item in roteiro.get("itens", [])
        ]
        st.dataframe(dados_roteiro, use_container_width=True)

    with aba_cor:
        st.subheader("Aprovação e Execução de Correções Documentais")
        st.info(
            "Selecione abaixo as correções que deseja autorizar. "
            "Todas as alterações criam backup SHA-256 prévio e preservam os documentos originais."
        )
        aprovar_qualificacoes = st.checkbox(
            "Aprovar qualificações de integridade (Regras 3, 4 e 5 — cobertura funcional vs. c8 e disponibilidade pontual vs. mensal)",
            value=True,
        )
        for inc in consistencia.get("inconsistencias", []):
            tipo_label = "Automática com evidência" if inc.automatica else "Qualificação / Revisão Humana"
            st.checkbox(
                f"[{inc.id}] ({tipo_label}) {inc.documento}: {inc.acao_recomendada}",
                value=True,
                key=f"chk_{inc.id}",
            )

        if st.button("🚀 Executar Correções Autorizadas e Gerar Exportações", type="primary"):
            with st.spinner("Criando backups SHA-256, gerando documentos revisados e exportando DOCX/PDF/XLSX/CSV..."):
                st.session_state["resultado_auditoria"] = executar_pipeline_interface(
                    pasta_docs=pasta_docs,
                    pasta_saida=pasta_saida,
                    incluir_revisao_humana_aprovada=aprovar_qualificacoes,
                    aplicar_correcoes=True,
                )
            st.success("Correções aplicadas e artefatos exportados com sucesso!")
            st.rerun()

    with aba_down:
        st.subheader("Download dos Documentos Revisados e Relatórios")
        exportados = res.get("exportados", {})
        if not exportados:
            st.warning("Execute as correções na aba anterior para gerar os arquivos de exportação.")
        else:
            arquivos_para_download: List[Tuple[str, str]] = [
                ("Relatório Consolidado (DOCX)", exportados.get("relatorio_consolidado_docx", "")),
                ("Relatório Consolidado (PDF)", exportados.get("relatorio_consolidado_pdf", "")),
                ("Planilha de Auditoria QA (XLSX)", exportados.get("planilha_auditoria_xlsx", "")),
                ("Inconsistências Identificadas (CSV)", exportados.get("inconsistencias_csv", "")),
                ("Registro de Alterações (JSON)", exportados.get("registro_alteracoes_json", "")),
            ]
            pasta_rev = Path(res["dir_saida"]) / "revisados"
            if pasta_rev.exists():
                for arq in sorted(pasta_rev.iterdir()):
                    if arq.is_file():
                        arquivos_para_download.append((f"Revisado ({arq.suffix.upper()}) — {arq.name}", str(arq)))

            for rotulo, caminho_str in arquivos_para_download:
                if caminho_str and Path(caminho_str).exists():
                    p = Path(caminho_str)
                    st.download_button(
                        label=f"⬇️ Baixar {rotulo}",
                        data=p.read_bytes(),
                        file_name=p.name,
                        key=f"dl_{rotulo}_{p.name}",
                    )

    with aba_hist:
        st.subheader("Histórico Rastreável de Alterações")
        historico = res.get("historico", [])
        if historico:
            st.dataframe(historico, use_container_width=True)
        else:
            st.write("Nenhuma alteração registrada nesta sessão ainda.")


class _PainelWebLocalHandler(BaseHTTPRequestHandler):
    """Servidor HTTP local de fallback quando Streamlit não está instalado no ambiente Python."""

    resultado_cache: Dict[str, Any] = {}
    pasta_docs: str = str(Path(__file__).resolve().parent / "docs")
    pasta_saida: str = str(Path(__file__).resolve().parent / "auditoria_output")

    def log_message(self, format: str, *args: Any) -> None:
        return

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/download":
            qs = parse_qs(parsed.query)
            arq = qs.get("file", [""])[0]
            caminho = Path(arq).resolve()
            raiz = Path(__file__).resolve().parent
            if caminho.exists() and str(caminho).startswith(str(raiz)):
                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Disposition", f'attachment; filename="{caminho.name}"')
                self.end_headers()
                self.wfile.write(caminho.read_bytes())
                return
            self.send_error(404, "Arquivo nao encontrado")
            return

        if not _PainelWebLocalHandler.resultado_cache:
            _PainelWebLocalHandler.resultado_cache = executar_pipeline_interface(
                pasta_docs=self.pasta_docs,
                pasta_saida=self.pasta_saida,
                aplicar_correcoes=True,
            )

        res = _PainelWebLocalHandler.resultado_cache
        cons = res["consistencia"]
        rot = res["roteiro"]
        fatos = res["fatos_codigo"]
        exp = res.get("exportados", {})

        linhas_inc = "".join(
            f"<tr><td><b>{i.id}</b></td><td>{i.severidade}</td><td>{i.documento}</td>"
            f"<td>{i.categoria}</td><td>{i.descricao}</td></tr>"
            for i in cons.get("inconsistencias", [])
        )
        linhas_rot = "".join(
            f"<tr><td><b>{r.codigo}</b></td><td>{r.item_roteiro}</td>"
            f"<td>{r.status}</td><td>{r.evidencia_verificada}</td></tr>"
            for r in rot.get("itens", [])
        )

        links_dl = []
        for chave in [
            "relatorio_consolidado_docx",
            "relatorio_consolidado_pdf",
            "planilha_auditoria_xlsx",
            "inconsistencias_csv",
            "registro_alteracoes_json",
        ]:
            c = exp.get(chave)
            if c and Path(c).exists():
                links_dl.append(f'<li><a href="/download?file={quote(str(c))}">{Path(c).name}</a></li>')

        html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Auditoria Documental QA — Rede Raízes do Nordeste</title>
<style>
body {{ font-family: Segoe UI, Arial, sans-serif; margin: 24px; background: #faf8f5; color: #222; }}
h1 {{ color: #9c381e; }}
.cards {{ display: flex; gap: 16px; margin-bottom: 20px; }}
.card {{ background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 14px 20px; flex: 1; }}
table {{ width: 100%; border-collapse: collapse; background: #fff; margin-bottom: 24px; }}
th, td {{ border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 13px; }}
th {{ background: #9c381e; color: #fff; }}
</style>
</head>
<body>
<h1>📋 Sistema de Auditoria e Correção Documental — Rede Raízes do Nordeste</h1>
<div class="cards">
  <div class="card"><b>Documentos Analisados:</b><br>{len(res['documentos'])}</div>
  <div class="card"><b>Testes Reais no Código:</b><br>{fatos.get('total_testes_no_codigo', 0)} ({fatos.get('total_suites_no_codigo', 0)} suítes)</div>
  <div class="card"><b>Inconsistências:</b><br>{cons.get('total_inconsistencias', 0)}</div>
  <div class="card"><b>Roteiro UNINTER:</b><br>{rot.get('atendidos', 0)} Atendidos / {rot.get('parcialmente_atendidos', 0)} Parciais</div>
</div>
<h2>📥 Artefatos Revisados e Exportados</h2>
<ul>{''.join(links_dl)}</ul>
<h2>🔎 Inconsistências Identificadas ({cons.get('total_inconsistencias', 0)})</h2>
<table><tr><th>ID</th><th>Severidade</th><th>Documento</th><th>Categoria</th><th>Descrição</th></tr>{linhas_inc}</table>
<h2>📐 Matriz do Roteiro Acadêmico UNINTER</h2>
<table><tr><th>Código</th><th>Item do Roteiro</th><th>Status</th><th>Evidência Verificada</th></tr>{linhas_rot}</table>
</body></html>"""

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))


def iniciar_painel_local(porta: int = 8501, abrir_navegador: bool = True) -> None:
    """Inicia o painel HTTP local quando Streamlit não estiver instalado."""
    servidor = HTTPServer(("127.0.0.1", porta), _PainelWebLocalHandler)
    url = f"http://127.0.0.1:{porta}"
    print(f"[INTERFACE] Painel Web de Auditoria ativo em: {url}")
    if abrir_navegador:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n[INTERFACE] Encerrando painel web.")
        servidor.server_close()


if __name__ == "__main__":
    try:
        import streamlit.runtime.scriptrunner as sr

        if sr.get_script_run_ctx() is not None:
            renderizar_streamlit()
        else:
            print("Para iniciar via Streamlit execute: streamlit run interface.py")
            print("Iniciando Painel Web HTTP Local integrado na porta 8501...")
            iniciar_painel_local(porta=8501, abrir_navegador=False)
    except ImportError:
        iniciar_painel_local(porta=8501, abrir_navegador=False)
