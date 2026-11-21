# -*- coding: utf-8 -*-
"""
Módulo de logs estruturados e trilha de auditoria (Audit Trail).
Garante rastreabilidade completa de todas as leituras, diagnósticos, backups e correções.
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


class GestorLogs:
    """Gerencia o registro de logs em arquivo, console e memória para a interface e relatórios."""

    def __init__(self, diretorio_logs: str = "auditoria_output/logs"):
        self.diretorio_logs = Path(diretorio_logs)
        self.diretorio_logs.mkdir(parents=True, exist_ok=True)
        self.arquivo_log = self.diretorio_logs / "auditoria.log"
        self.arquivo_historico = self.diretorio_logs / "historico_alteracoes.json"
        logger_name = f"AuditoriaRaizes.{abs(hash(str(self.arquivo_log.resolve())))}"
        self.logger = logging.getLogger(logger_name)
        self.logger.setLevel(logging.DEBUG)
        self.logger.propagate = False

        # Fecha handlers anteriores do mesmo logger para evitar bloqueio de arquivo no Windows
        for h in list(self.logger.handlers):
            try:
                h.close()
            except Exception:
                pass
            self.logger.removeHandler(h)

        fmt = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(module)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        fh = logging.FileHandler(self.arquivo_log, encoding="utf-8")
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(fmt)
        self.logger.addHandler(fh)

        ch = logging.StreamHandler()
        ch.setLevel(logging.WARNING)
        ch.setFormatter(fmt)
        self.logger.addHandler(ch)

    def info(self, mensagem: str, **kwargs: Any) -> None:
        self.logger.info(mensagem)

    def aviso(self, mensagem: str, **kwargs: Any) -> None:
        self.logger.warning(mensagem)

    def erro(self, mensagem: str, **kwargs: Any) -> None:
        self.logger.error(mensagem)

    def fechar(self) -> None:
        """Fecha explicitamente os manipuladores de arquivo (necessário no Windows para limpeza de diretórios temporários)."""
        for h in list(self.logger.handlers):
            try:
                h.flush()
                h.close()
            except Exception:
                pass
            self.logger.removeHandler(h)

    def registrar_alteracao(
        self,
        documento_origem: str,
        documento_destino: str,
        id_inconsistencia: str,
        tipo_acao: str,
        valor_anterior: str,
        valor_novo: str,
        justificativa: str,
        aprovado_por: str = "Auditoria Automatizada / Revisão Humana"
    ) -> Dict[str, Any]:
        """Registra uma alteração individual no histórico JSON persistente."""
        registro = {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "documento_origem": str(documento_origem),
            "documento_destino": str(documento_destino),
            "id_inconsistencia": id_inconsistencia,
            "tipo_acao": tipo_acao,
            "valor_anterior": valor_anterior,
            "valor_novo": valor_novo,
            "justificativa": justificativa,
            "aprovado_por": aprovado_por
        }
        historico = self.carregar_historico()
        historico.append(registro)
        with open(self.arquivo_historico, "w", encoding="utf-8") as f:
            json.dump(historico, f, ensure_ascii=False, indent=2)
        self.info(
            f"Alteração registrada [{id_inconsistencia}] em '{os.path.basename(documento_destino)}': "
            f"{tipo_acao}"
        )
        return registro

    def carregar_historico(self) -> List[Dict[str, Any]]:
        """Retorna todas as alterações já registradas."""
        if not self.arquivo_historico.exists():
            return []
        try:
            with open(self.arquivo_historico, "r", encoding="utf-8") as f:
                dados = json.load(f)
                return dados if isinstance(dados, list) else []
        except Exception as exc:
            self.erro(f"Falha ao carregar histórico de alterações: {exc}")
            return []

    def obter_historico(self) -> List[Dict[str, Any]]:
        """Alias para compatibilidade com a interface gráfica."""
        return self.carregar_historico()

    def ler_linhas_log(self, limite: int = 200) -> List[str]:
        """Retorna as últimas linhas do arquivo de log textual."""
        if not self.arquivo_log.exists():
            return []
        with open(self.arquivo_log, "r", encoding="utf-8", errors="replace") as f:
            linhas = f.readlines()
        return [linha.rstrip("\r\n") for linha in linhas[-limite:]]
