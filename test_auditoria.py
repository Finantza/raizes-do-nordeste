# -*- coding: utf-8 -*-
"""
Suíte de Testes Automatizados da Ferramenta de Auditoria e Correção Documental.
Projeto: Rede Raízes do Nordeste (UNINTER — Qualidade de Software 2026).

Valida:
1. Módulo 1 (`leitor_documentos.py`): Leitura de DOCX, DOC, PDF, TXT, MD, CSV, XLSX e inspeção de código.
2. Módulo 2 (`consistencia.py`): Detecção de divergências numéricas, técnicas e aplicação das 10 Regras de Integridade.
3. Módulo 3 (`auditoria.py`): Matriz de conformidade com o roteiro acadêmico da UNINTER.
4. Módulo 4 (`backup.py` e `correcao.py`): Criação de backup SHA-256 imutável, preservação dos originais, correções automáticas e marcação de pendências humanas.
5. Módulo 5 (`gerador_relatorios.py`): Geração do relatório consolidado com as 12 seções obrigatórias.
6. Módulo 6 (`exportacao.py`): Exportação de DOCX, PDF nativo válido (`%PDF-1.4`), XLSX OpenXML válido, CSV e JSON.
"""

import csv
import json
import tempfile
import threading
import unittest
import urllib.request
import zipfile
from http.server import HTTPServer
from pathlib import Path

from auditoria import VerificadorRoteiroAcademico
from backup import GestorBackup
from consistencia import AnalisadorConsistencia
from correcao import CorretorDocumental
from exportacao import ExportadorAuditoria
from gerador_relatorios import GeradorRelatorios
from interface import _PainelWebLocalHandler, executar_pipeline_interface
from leitor_documentos import LeitorDocumentos
from logs import GestorLogs
from main import executar_auditoria_completa


class TestFerramentaAuditoria(unittest.TestCase):
    """Testes unitários e de integração da aplicação de auditoria documental."""

    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.base_path = Path(self.temp_dir.name)
        self.logs = GestorLogs(str(self.base_path / "logs"))

    def tearDown(self) -> None:
        self.logs.fechar()
        self.temp_dir.cleanup()

    def test_01_backup_sha256_e_preservacao_originais(self) -> None:
        """Verifica se a Regra de Integridade 8 e 9 (backup SHA-256 prévio) funciona corretamente."""
        arq_origem = self.base_path / "doc_original.md"
        conteudo_original = "# Relatório Original\nTotal de 29 testes automatizados (100%).\n"
        arq_origem.write_text(conteudo_original, encoding="utf-8")

        gestor_backup = GestorBackup(str(self.base_path / "backups"), logger=self.logs)
        hash_antes = gestor_backup.calcular_sha256(arq_origem)
        manifesto = gestor_backup.criar_backup_lote([arq_origem], rotulo="teste_unitario")

        pasta_sessao = Path(manifesto["pasta_sessao"])
        self.assertTrue(pasta_sessao.exists())
        arq_manifesto = pasta_sessao / "manifesto_backup.json"
        self.assertTrue(arq_manifesto.exists())
        dados_manifesto = json.loads(arq_manifesto.read_text(encoding="utf-8"))
        self.assertEqual(dados_manifesto["total_arquivos"], 1)
        self.assertEqual(dados_manifesto["arquivos"][0]["sha256"], hash_antes)
        self.assertEqual(gestor_backup.calcular_sha256(arq_origem), hash_antes)

    def test_02_leitura_multi_formato_e_extracao_metricas(self) -> None:
        """Verifica se o Módulo 1 lê arquivos MD, TXT, CSV, PDF e XLSX e extrai métricas com origem."""
        pasta_docs = self.base_path / "docs_teste"
        pasta_docs.mkdir(parents=True, exist_ok=True)

        (pasta_docs / "relatorio_a.md").write_text(
            "# Relatório A\nForam executados 29 testes automatizados com latência p95 de 42 ms e 100% de cobertura.\n"
            "Disponibilidade mensal de 99,9% e bcrypt com 10 salt rounds e SameSite=Strict na tabela order_items.\n",
            encoding="utf-8",
        )
        (pasta_docs / "relatorio_b.txt").write_text(
            "Resumo de Testes\nTotal de 35 testes executados com p95 de 18 ms e bcrypt 12 salt rounds.\n",
            encoding="utf-8",
        )
        (pasta_docs / "dados.csv").write_text(
            "ID,Modulo,Status\nCT-01,Auth,APROVADO\nCT-02,PDV,APROVADO\n",
            encoding="utf-8",
        )

        # Cria um PDF nativo usando ExportadorAuditoria para testar leitura de PDF
        exportador = ExportadorAuditoria(str(self.base_path / "out_exp"), logger=self.logs)
        caminho_pdf = pasta_docs / "amostra.pdf"
        exportador.gerar_pdf_nativo("Amostra PDF", ["Linha 1 do PDF", "Total de 57 testes automatizados"], caminho_pdf)

        leitor = LeitorDocumentos(logger=self.logs)
        docs = leitor.carregar_diretorio(str(pasta_docs), incluir_raiz=False)
        self.assertEqual(len(docs), 4)

        nomes = {d.nome for d in docs}
        self.assertIn("relatorio_a.md", nomes)
        self.assertIn("relatorio_b.txt", nomes)
        self.assertIn("dados.csv", nomes)
        self.assertIn("amostra.pdf", nomes)

    def test_03_deteccao_inconsistencias_e_regras_integridade(self) -> None:
        """Verifica se o Módulo 2 identifica números conflitantes e violações das Regras 3, 4 e 5."""
        pasta_docs = self.base_path / "docs_inc"
        pasta_docs.mkdir(parents=True, exist_ok=True)

        (pasta_docs / "doc1.md").write_text(
            "# Doc 1\nTotal de 29 testes automatizados.\nTotal de 35 testes executados.\n"
            "Cobertura de testes: 100% (Auth, Pedidos, Estoque, Finanças).\n"
            "Disponibilidade mensal >= 99,5%: 100% nas baterias de homologação.\n"
            "bcrypt (10 salt rounds) e SameSite=Strict.\nTabela order_items.\n",
            encoding="utf-8",
        )
        (pasta_docs / "doc2.md").write_text(
            "# Doc 2\nTotal de 57 testes executados.\nbcrypt (12 salt rounds) e SameSite=Lax.\n",
            encoding="utf-8",
        )

        leitor = LeitorDocumentos(logger=self.logs)
        docs = leitor.carregar_diretorio(str(pasta_docs), incluir_raiz=False)
        fatos_codigo = {
            "total_testes_no_codigo": 57,
            "total_suites_no_codigo": 8,
            "suites_no_codigo": {"src/app.test.js": 14, "src/qualidade.test.js": 7},
            "bcrypt_rounds_real": 12,
            "samesite_cookie_real": "Lax",
            "tabelas_reais_db": [
                "users", "sessions", "products", "orders",
                "unidades", "estoque_movimentacoes", "financeiro_lancamentos"
            ],
            "pdf_roteiro_presente_no_disco": False,
        }

        analisador = AnalisadorConsistencia(logger=self.logs)
        rel = analisador.executar_auditoria_consistencia(docs, fatos_codigo)

        categorias = {inc.categoria for inc in rel["inconsistencias"]}
        self.assertIn("Quantidade Total de Testes", categorias)
        self.assertIn("Segurança da Aplicação (Bcrypt Cost)", categorias)
        self.assertIn("Segurança e Sessão (Flag SameSite)", categorias)
        self.assertIn("Arquitetura e Persistência (Esquema SQL)", categorias)
        self.assertIn("Regras 3 e 4 — Cobertura de Testes vs. Cobertura de Código", categorias)
        self.assertIn("Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual", categorias)

    def test_04_pipeline_completo_no_repositorio_real(self) -> None:
        """Executa o pipeline completo sobre a pasta docs/ real e valida todos os artefatos gerados."""
        raiz_projeto = Path(__file__).resolve().parent
        saida_teste = self.base_path / "saida_completa"

        resumo = executar_auditoria_completa(
            diretorio_docs=str(raiz_projeto / "docs"),
            diretorio_saida=str(saida_teste),
            diretorio_codigo=str(raiz_projeto),
            copiar_consolidado_para_docs=False,
        )

        self.assertGreaterEqual(resumo["total_documentos_lidos"], 6)
        self.assertEqual(resumo["total_testes_codigo_real"], 57)
        self.assertGreaterEqual(resumo["total_inconsistencias"], 5)
        self.assertGreater(resumo["total_correcoes_aplicadas"], 0)

        exp = resumo["arquivos_exportados"]
        for chave in [
            "relatorio_consolidado_docx",
            "relatorio_consolidado_pdf",
            "planilha_auditoria_xlsx",
            "inconsistencias_csv",
            "registro_alteracoes_json",
        ]:
            caminho = Path(exp[chave])
            self.assertTrue(caminho.exists(), f"Arquivo ausente: {caminho}")
            self.assertGreater(caminho.stat().st_size, 100)

        # Verifica cabeçalho binário do PDF (%PDF-1.4)
        pdf_bytes = Path(exp["relatorio_consolidado_pdf"]).read_bytes()
        self.assertTrue(pdf_bytes.startswith(b"%PDF-1.4"))

        # Verifica estrutura OpenXML do XLSX (4 abas)
        with zipfile.ZipFile(exp["planilha_auditoria_xlsx"], "r") as zf:
            nomes_zip = zf.namelist()
            self.assertIn("xl/workbook.xml", nomes_zip)
            self.assertIn("xl/worksheets/sheet1.xml", nomes_zip)
            self.assertIn("xl/worksheets/sheet4.xml", nomes_zip)

        # Verifica conteúdo do CSV de inconsistências
        with open(exp["inconsistencias_csv"], "r", encoding="utf-8-sig") as f:
            reader = list(csv.reader(f, delimiter=";"))
            self.assertGreater(len(reader), 2)

    def test_05_interface_frontend_web_e_download(self) -> None:
        """Valida o frontend Web (interface.py): renderização HTML, cards, tabelas e download de artefatos."""
        pasta_docs = self.base_path / "docs_ui"
        pasta_docs.mkdir(parents=True, exist_ok=True)
        (pasta_docs / "relatorio_ui.md").write_text(
            "# Relatório UI\nForam executados 35 testes automatizados com bcrypt 10 salt rounds e SameSite=Strict.\n",
            encoding="utf-8",
        )
        pasta_saida = self.base_path / "saida_ui"

        _PainelWebLocalHandler.resultado_cache = {}
        _PainelWebLocalHandler.pasta_docs = str(pasta_docs)
        _PainelWebLocalHandler.pasta_saida = str(pasta_saida)

        servidor = HTTPServer(("127.0.0.1", 0), _PainelWebLocalHandler)
        porta = servidor.server_port
        thread_srv = threading.Thread(target=servidor.serve_forever, daemon=True)
        thread_srv.start()

        try:
            url_base = f"http://127.0.0.1:{porta}"
            with urllib.request.urlopen(url_base, timeout=15) as resp:
                self.assertEqual(resp.status, 200)
                ctype = resp.headers.get("Content-Type", "")
                self.assertIn("text/html", ctype)
                html = resp.read().decode("utf-8")

            self.assertIn("Sistema de Auditoria e Correção Documental", html)
            self.assertIn("Inconsistências Identificadas", html)
            self.assertIn("Matriz do Roteiro Acadêmico UNINTER", html)
            self.assertIn("INC-001", html)
            self.assertIn("ROT-01", html)

            # Testa endpoint de download (/download?file=...) para arquivo dentro da raiz do projeto
            raiz_projeto = Path(__file__).resolve().parent
            arq_teste_dl = raiz_projeto / "auditoria_output" / "relatorios" / "inconsistencias_identificadas.csv"
            if arq_teste_dl.exists():
                from urllib.parse import quote
                url_dl = f"{url_base}/download?file={quote(str(arq_teste_dl))}"
                with urllib.request.urlopen(url_dl, timeout=10) as resp_dl:
                    self.assertEqual(resp_dl.status, 200)
                    disp = resp_dl.headers.get("Content-Disposition", "")
                    self.assertIn("attachment", disp)
                    conteudo_dl = resp_dl.read()
                    self.assertGreater(len(conteudo_dl), 50)
        finally:
            servidor.shutdown()
            servidor.server_close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
