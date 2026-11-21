# -*- coding: utf-8 -*-
"""
Módulo de backup seguro e verificação de integridade SHA-256 (Regra 8 e Regra 9).
Cria cópias carimbadas antes de qualquer geração ou revisão documental e preserva os originais.
"""

import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class GestorBackup:
    """Gerencia backups imutáveis com manifesto criptográfico SHA-256."""

    def __init__(self, diretorio_backups: str = "auditoria_output/backups", logger: Any = None):
        self.diretorio_backups = Path(diretorio_backups)
        self.diretorio_backups.mkdir(parents=True, exist_ok=True)
        self.logger = logger

    @staticmethod
    def calcular_sha256(caminho: Path) -> str:
        """Calcula o hash SHA-256 de um arquivo para garantir rastreabilidade e integridade."""
        h = hashlib.sha256()
        with open(caminho, "rb") as f:
            for bloco in iter(lambda: f.read(65536), b""):
                h.update(bloco)
        return h.hexdigest()

    def criar_backup_lote(self, arquivos: List[Path], rotulo: str = "pre_correcao") -> Dict[str, Any]:
        """
        Copia uma lista de arquivos para uma pasta com timestamp e grava manifesto_backup.json
        contendo caminho original, caminho de backup, tamanho em bytes e hash SHA-256.
        """
        carimbo = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        pasta_sessao = self.diretorio_backups / f"{carimbo}_{rotulo}"
        pasta_sessao.mkdir(parents=True, exist_ok=True)

        itens_manifesto = []
        for arq in arquivos:
            caminho_orig = Path(arq)
            if not caminho_orig.exists() or not caminho_orig.is_file():
                continue

            hash_orig = self.calcular_sha256(caminho_orig)
            destino = pasta_sessao / caminho_orig.name
            contador = 1
            while destino.exists():
                destino = pasta_sessao / f"{caminho_orig.stem}_{contador}{caminho_orig.suffix}"
                contador += 1

            shutil.copy2(caminho_orig, destino)
            hash_bkp = self.calcular_sha256(destino)

            if hash_orig != hash_bkp:
                raise IOError(f"Verificação de integridade SHA-256 falhou no backup de {caminho_orig}")

            itens_manifesto.append({
                "arquivo_original": str(caminho_orig.resolve()),
                "arquivo_backup": str(destino.resolve()),
                "nome": caminho_orig.name,
                "tamanho_bytes": caminho_orig.stat().st_size,
                "sha256": hash_orig
            })

        manifesto = {
            "id_sessao": f"{carimbo}_{rotulo}",
            "criado_em": datetime.now().isoformat(timespec="seconds"),
            "pasta_sessao": str(pasta_sessao.resolve()),
            "total_arquivos": len(itens_manifesto),
            "arquivos": itens_manifesto
        }

        caminho_manifesto = pasta_sessao / "manifesto_backup.json"
        with open(caminho_manifesto, "w", encoding="utf-8") as f:
            json.dump(manifesto, f, ensure_ascii=False, indent=2)

        if self.logger:
            self.logger.info(
                f"Backup criado em '{pasta_sessao}' com {len(itens_manifesto)} arquivo(s) verificados por SHA-256."
            )
        return manifesto

    def listar_backups(self) -> List[Dict[str, Any]]:
        """Lista todos os manifestos de backup existentes."""
        manifestos = []
        for arquivo in sorted(self.diretorio_backups.glob("*/manifesto_backup.json"), reverse=True):
            try:
                with open(arquivo, "r", encoding="utf-8") as f:
                    manifestos.append(json.load(f))
            except Exception:
                continue
        return manifestos
