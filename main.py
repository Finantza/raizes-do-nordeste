# -*- coding: utf-8 -*-
"""
Módulo Principal (Orquestrador CLI e Pipeline) — Sistema de Auditoria e Correção Documental.
Projeto: Rede Raízes do Nordeste (UNINTER — Qualidade de Software 2026).

Coordena os 6 módulos obrigatórios:
- Módulo 1: Leitura e extração (`leitor_documentos.py`)
- Módulo 2: Auditoria de consistência (`consistencia.py`)
- Módulo 3: Verificação do roteiro acadêmico UNINTER (`auditoria.py`)
- Módulo 4: Correção documental com backup SHA-256 (`correcao.py` e `backup.py`)
- Módulo 5: Relatório consolidado de 12 seções (`gerador_relatorios.py`)
- Módulo 6: Exportação em DOCX, PDF, XLSX, CSV e JSON (`exportacao.py`)
"""

import argparse
import json
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, Optional

from auditoria import VerificadorRoteiroAcademico
from backup import GestorBackup
from consistencia import AnalisadorConsistencia
from correcao import CorretorDocumental
from exportacao import ExportadorAuditoria
from gerador_relatorios import GeradorRelatorios
from leitor_documentos import LeitorDocumentos
from logs import GestorLogs


def executar_auditoria_completa(
    diretorio_docs: str = "docs",
    diretorio_saida: str = "auditoria_output",
    diretorio_codigo: Optional[str] = None,
    incluir_revisao_humana_aprovada: bool = True,
    copiar_consolidado_para_docs: bool = True,
) -> Dict[str, Any]:
    """
    Executa o pipeline completo de auditoria, verificação de roteiro, backup,
    correção documental, geração do relatório consolidado e exportação multi-formato.
    """
    raiz = Path(diretorio_codigo).resolve() if diretorio_codigo else Path(__file__).resolve().parent
    caminho_docs = (
        (raiz / diretorio_docs).resolve()
        if not Path(diretorio_docs).is_absolute()
        else Path(diretorio_docs).resolve()
    )
    caminho_saida = (
        (raiz / diretorio_saida).resolve()
        if not Path(diretorio_saida).is_absolute()
        else Path(diretorio_saida).resolve()
    )

    caminho_saida.mkdir(parents=True, exist_ok=True)

    gestor_logs = GestorLogs(str(caminho_saida / "logs"))
    gestor_logs.info(
        f"Iniciando Auditoria Técnica Automatizada | Documentos: {caminho_docs} | Saída: {caminho_saida}"
    )

    gestor_backup = GestorBackup(str(caminho_saida / "backups"), logger=gestor_logs)
    leitor = LeitorDocumentos(logger=gestor_logs)
    analisador = AnalisadorConsistencia(logger=gestor_logs)
    verificador = VerificadorRoteiroAcademico(logger=gestor_logs)
    corretor = CorretorDocumental(
        diretorio_saida=str(caminho_saida / "revisados"),
        gestor_backup=gestor_backup,
        gestor_logs=gestor_logs,
    )
    gerador = GeradorRelatorios(
        diretorio_saida=str(caminho_saida / "relatorios"),
        logger=gestor_logs,
    )
    exportador = ExportadorAuditoria(
        diretorio_base=str(caminho_saida),
        logger=gestor_logs,
    )

    # Módulo 1 — Leitura e extração
    documentos = leitor.carregar_diretorio(str(caminho_docs), incluir_raiz=True)
    fatos_codigo = leitor.inspecionar_repositorio_codigo(str(raiz))

    # Módulo 2 — Auditoria de consistência e 10 Regras de Integridade
    resultado_consistencia = analisador.executar_auditoria_consistencia(documentos, fatos_codigo)

    # Módulo 3 — Verificação do roteiro acadêmico UNINTER
    resultado_roteiro = verificador.avaliar_roteiro(documentos, fatos_codigo)

    # Módulo 4 — Correção documental (com backup SHA-256 prévio obrigatório)
    resultado_correcao = corretor.executar_correcoes(
        documentos=documentos,
        inconsistencias=resultado_consistencia["inconsistencias"],
        fatos_codigo=fatos_codigo,
        incluir_revisao_humana_aprovada=incluir_revisao_humana_aprovada,
    )

    # Módulo 5 — Relatório consolidado (12 seções obrigatórias)
    dados_consolidados = gerador.compilar_dados_relatorio(
        documentos=documentos,
        resultado_consistencia=resultado_consistencia,
        resultado_roteiro=resultado_roteiro,
        resultado_correcao=resultado_correcao,
    )
    caminho_consolidado_docx = gerador.gerar_relatorio_consolidado_docx(dados_consolidados)
    caminho_consolidado_md = gerador.gerar_relatorio_consolidado_markdown(dados_consolidados)

    # Módulo 6 — Exportação (DOCX, PDF, XLSX, CSV, JSON)
    arquivos_exportados = exportador.exportar_tudo(
        dados_consolidados=dados_consolidados,
        caminho_consolidado_docx=caminho_consolidado_docx,
    )
    arquivos_exportados["relatorio_consolidado_md"] = str(caminho_consolidado_md.resolve())

    # Copia o relatório consolidado para a pasta docs/ para fácil acesso acadêmico
    if copiar_consolidado_para_docs and caminho_docs.exists():
        for chave in ["relatorio_consolidado_docx", "relatorio_consolidado_pdf", "relatorio_consolidado_md"]:
            origem = arquivos_exportados.get(chave)
            if origem and Path(origem).exists():
                destino = caminho_docs / Path(origem).name
                shutil.copy2(origem, destino)

    total_itens_rot = max(1, resultado_roteiro.get("total_itens_avaliados", 12))
    atendidos = resultado_roteiro.get("atendidos", 0)
    parciais = resultado_roteiro.get("parcialmente_atendidos", 0)
    pct_conformidade = round(((atendidos + 0.5 * parciais) / total_itens_rot) * 100.0, 1)

    resumo = {
        "total_documentos_lidos": len(documentos),
        "total_testes_codigo_real": fatos_codigo.get("total_testes_no_codigo", 0),
        "suites_teste_codigo": fatos_codigo.get("suites_no_codigo", {}),
        "total_inconsistencias": resultado_consistencia.get("total_inconsistencias", 0),
        "inconsistencias_automaticas": resultado_consistencia.get("automaticas", 0),
        "inconsistencias_revisao_humana": resultado_consistencia.get("revisao_humana", 0),
        "conformidade_roteiro_uninter_pct": pct_conformidade,
        "atendidos": atendidos,
        "parcialmente_atendidos": parciais,
        "nao_atendidos": resultado_roteiro.get("nao_atendidos", 0),
        "total_correcoes_aplicadas": len(resultado_correcao.get("alteracoes_aplicadas", [])),
        "total_pendencias_humanas": len(resultado_correcao.get("pendencias_inseridas", [])),
        "pasta_backup": resultado_correcao.get("manifesto_backup", {}).get("pasta_sessao", ""),
        "arquivos_exportados": arquivos_exportados,
    }

    caminho_resumo = caminho_saida / "resumo_execucao_auditoria.json"
    caminho_resumo.write_text(json.dumps(resumo, indent=2, ensure_ascii=False), encoding="utf-8")

    gestor_logs.info("Pipeline de auditoria e correção concluído com sucesso.")
    gestor_logs.fechar()
    return resumo


def main() -> int:
    """Ponto de entrada via linha de comando (CLI)."""
    parser = argparse.ArgumentParser(
        description="Ferramenta de Auditoria e Correção Automatizada de Relatórios Técnicos — Rede Raízes do Nordeste"
    )
    parser.add_argument(
        "--dir",
        default="docs",
        help="Diretório contendo os documentos técnicos a serem auditados (padrão: docs)",
    )
    parser.add_argument(
        "--output",
        default="auditoria_output",
        help="Diretório de saída para backups, relatórios, DOCX, PDF, XLSX e CSV (padrão: auditoria_output)",
    )
    parser.add_argument(
        "--gui",
        action="store_true",
        help="Inicia a interface gráfica web local na porta 8501 após a auditoria",
    )
    args = parser.parse_args()

    resumo = executar_auditoria_completa(
        diretorio_docs=args.dir,
        diretorio_saida=args.output,
    )

    print("=" * 78)
    print("AUDITORIA E CORRECAO DOCUMENTAL — REDE RAIZES DO NORDESTE (UNINTER 2026)")
    print("=" * 78)
    print(f"Documentos analisados        : {resumo['total_documentos_lidos']}")
    print(f"Testes reais no repositorio  : {resumo['total_testes_codigo_real']} ({len(resumo['suites_teste_codigo'])} suites)")
    print(f"Inconsistencias identificadas: {resumo['total_inconsistencias']} "
          f"(Automaticas: {resumo['inconsistencias_automaticas']} | Revisao Humana: {resumo['inconsistencias_revisao_humana']})")
    print(f"Conformidade Roteiro UNINTER : {resumo['conformidade_roteiro_uninter_pct']:.1f}% "
          f"(Atendidos: {resumo['atendidos']} | Parciais: {resumo['parcialmente_atendidos']} | Nao Atendidos: {resumo['nao_atendidos']})")
    print(f"Correcoes aplicadas          : {resumo['total_correcoes_aplicadas']}")
    print(f"Notas de pendencia inseridas : {resumo['total_pendencias_humanas']}")
    print(f"Backup SHA-256 criado em     : {resumo['pasta_backup']}")
    print("-" * 78)
    exp = resumo["arquivos_exportados"]
    print(f"Relatorio Consolidado DOCX   : {exp.get('relatorio_consolidado_docx')}")
    print(f"Relatorio Consolidado PDF    : {exp.get('relatorio_consolidado_pdf')}")
    print(f"Planilha de Auditoria XLSX   : {exp.get('planilha_auditoria_xlsx')}")
    print(f"Inconsistencias CSV          : {exp.get('inconsistencias_csv')}")
    print(f"Registro de Alteracoes JSON  : {exp.get('registro_alteracoes_json')}")
    print(f"PDFs Individuais Gerados     : {exp.get('total_pdfs_individuais')}")
    print("=" * 78)

    if args.gui:
        from interface import iniciar_painel_local
        iniciar_painel_local(porta=8501, abrir_navegador=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
