# -*- coding: utf-8 -*-
"""
Módulo 2 — Auditoria de consistência interdocumental e aderência às 10 Regras de Integridade.
Identifica conflitos de números, métricas, casos de teste, cobertura, disponibilidade e homologação.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from leitor_documentos import DocumentoExtraido


@dataclass
class Inconsistencia:
    """Representa uma divergência ou violação de integridade detectada entre documentos ou código."""
    id: str
    categoria: str
    severidade: str  # "ALTA", "MEDIA", "BAIXA"
    documento: str
    localizacao: str
    descricao: str
    evidencia_encontrada: str
    valor_referencia_factual: str
    acao_recomendada: str
    automatica: bool  # True = correção determinística com evidência; False = requer aprovação/revisão humana
    padrao_busca: str = ""
    texto_substituto: str = ""
    aprovada: bool = True


class AnalisadorConsistencia:
    """Analisa a consistência cruzada entre todos os documentos extraídos e a realidade do repositório."""

    def __init__(self, logger=None):
        self.logger = logger

    def executar_auditoria_consistencia(
        self,
        documentos: List[DocumentoExtraido],
        fatos_codigo: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Executa todas as verificações de consistência do Módulo 2 e das Regras de Integridade."""
        inconsistencias: List[Inconsistencia] = []
        seq = 1

        def proximo_id() -> str:
            nonlocal seq
            cid = f"INC-{seq:03d}"
            seq += 1
            return cid

        total_real = fatos_codigo.get("total_testes_no_codigo", 57)
        suites_reais = fatos_codigo.get("total_suites_no_codigo", 8)
        bcrypt_real = fatos_codigo.get("bcrypt_rounds_real", 12)
        samesite_real = fatos_codigo.get("samesite_cookie_real", "Lax")
        tabelas_reais = fatos_codigo.get("tabelas_reais_db", [])

        mapa_contagens_por_doc: Dict[str, List[int]] = {}

        # Documentos históricos/guias que intencionalmente descrevem versões anteriores (16/10/2026)
        docs_historicos = {
            "avaliacao-do-sistema.md",
            "guia-passo-a-passo-melhorias-qualidade.md",
            "relatorio-rascunho-apresentacao-banca.md",
            "relatorio-rascunho-apresentacao-banca.doc"
        }

        for doc in documentos:
            m = doc.metricas_detectadas
            eh_historico = doc.nome in docs_historicos

            # 1. Verificação de Quantidade Total de Testes e Suítes
            valores_testes = sorted({item["valor"] for item in m.get("total_testes", [])})
            if valores_testes:
                mapa_contagens_por_doc[doc.nome] = valores_testes

            for item in m.get("total_testes", []):
                val = item["valor"]
                # Ignora contagens parciais legítimas (ex: 32 testes de backend, 18 de frontend, 7 ou 10 históricos)
                if val in {35, 36, 44, 50} and val != total_real and not eh_historico:
                    inconsistencias.append(Inconsistencia(
                        id=proximo_id(),
                        categoria="Quantidade Total de Testes",
                        severidade="ALTA",
                        documento=doc.nome,
                        localizacao=item["origem"],
                        descricao=(
                            f"O documento declara um total de {val} testes automatizados, mas a suíte atual do "
                            f"repositório possui {total_real} testes distribuídos em {suites_reais} suítes "
                            f"({', '.join(f'{k}:{v}' for k, v in fatos_codigo.get('suites_no_codigo', {}).items())})."
                        ),
                        evidencia_encontrada=item["trecho"],
                        valor_referencia_factual=f"{total_real} testes automatizados ({suites_reais} suítes)",
                        acao_recomendada=f"Atualizar a contagem total de {val} para {total_real} testes ({suites_reais} suítes) conforme suíte real.",
                        automatica=True,
                        padrao_busca=item["trecho"],
                        texto_substituto=item["trecho"].replace(str(val), str(total_real))
                    ))
                elif val == 29 and not eh_historico:
                    inconsistencias.append(Inconsistencia(
                        id=proximo_id(),
                        categoria="Quantidade Total de Testes (Contradição Interna)",
                        severidade="ALTA",
                        documento=doc.nome,
                        localizacao=item["origem"],
                        descricao=(
                            f"Menção residual a '29 testes automatizados' em documento que lista 35+ casos de teste."
                        ),
                        evidencia_encontrada=item["trecho"],
                        valor_referencia_factual=f"{total_real} testes automatizados",
                        acao_recomendada=f"Substituir '29 testes automatizados' por '{total_real} testes automatizados'.",
                        automatica=True,
                        padrao_busca="29 testes automatizados",
                        texto_substituto=f"{total_real} testes automatizados"
                    ))

            # 2. Verificação de Bcrypt Salt Rounds (10 vs 12)
            for item in m.get("bcrypt_rounds", []):
                if item["valor"] == 10:
                    inconsistencias.append(Inconsistencia(
                        id=proximo_id(),
                        categoria="Segurança da Aplicação (Bcrypt Cost)",
                        severidade="MEDIA",
                        documento=doc.nome,
                        localizacao=item["origem"],
                        descricao=(
                            f"O documento menciona bcryptjs com 10 salt rounds, porém o código-fonte "
                            f"(src/db.js e src/routes/auth.js) utiliza custo {bcrypt_real} (12 salt rounds)."
                        ),
                        evidencia_encontrada=item["trecho"],
                        valor_referencia_factual=f"{bcrypt_real} salt rounds",
                        acao_recomendada="Padronizar para '12 salt rounds' de acordo com src/db.js e src/routes/auth.js.",
                        automatica=True,
                        padrao_busca=item["trecho"],
                        texto_substituto=item["trecho"].replace("10", str(bcrypt_real))
                    ))

            # 3. Verificação da Flag SameSite do Cookie de Sessão (Strict vs Lax)
            for item in m.get("samesite_cookie", []):
                if item["valor"].lower() == "strict":
                    inconsistencias.append(Inconsistencia(
                        id=proximo_id(),
                        categoria="Segurança e Sessão (Flag SameSite)",
                        severidade="MEDIA",
                        documento=doc.nome,
                        localizacao=item["origem"],
                        descricao=(
                            f"O texto afirma que o cookie de sessão utiliza 'SameSite=Strict', mas a implementação "
                            f"em src/auth.js define 'sameSite: \"{samesite_real.lower()}\"'."
                        ),
                        evidencia_encontrada=item["trecho"],
                        valor_referencia_factual=f"SameSite={samesite_real}",
                        acao_recomendada=f"Corrigir para 'SameSite={samesite_real}'.",
                        automatica=True,
                        padrao_busca=item["trecho"],
                        texto_substituto=f"SameSite={samesite_real}"
                    ))

            # 4. Verificação de Tabelas do Esquema Relacional (order_items inexistente)
            for item in m.get("tabelas_banco", []):
                if item["valor"] == "order_items" and "order_items" not in tabelas_reais:
                    inconsistencias.append(Inconsistencia(
                        id=proximo_id(),
                        categoria="Arquitetura e Persistência (Esquema SQL)",
                        severidade="ALTA",
                        documento=doc.nome,
                        localizacao=item["origem"],
                        descricao=(
                            "O documento cita uma tabela 'order_items', mas o esquema real em src/db.js "
                            f"possui 7 tabelas ({', '.join(tabelas_reais)}) e armazena os itens em 'orders.items_json'."
                        ),
                        evidencia_encontrada=item["trecho"],
                        valor_referencia_factual=f"7 tabelas reais: {', '.join(tabelas_reais)}",
                        acao_recomendada="Remover referência à tabela inexistente 'order_items' e alinhar ao esquema de src/db.js.",
                        automatica=True,
                        padrao_busca="order_items, ",
                        texto_substituto=""
                    ))

            # 5. Regra de Integridade 3 e 4: Cobertura de Fluxos/Requisitos vs. Cobertura de Código
            for item in m.get("cobertura", []):
                trecho = item["trecho"]
                if "100%" in trecho and not any(p in trecho.lower() for p in ("c8", "istanbul", "linha", "branch", "escopo")):
                    inconsistencias.append(Inconsistencia(
                        id=proximo_id(),
                        categoria="Regras 3 e 4 — Cobertura de Testes vs. Cobertura de Código",
                        severidade="MEDIA",
                        documento=doc.nome,
                        localizacao=item["origem"],
                        descricao=(
                            "O relatório declara '100%' em indicador de cobertura de rotas/fluxos. "
                            "Pelas Regras de Integridade 3 e 4, é obrigatório explicitar que se trata de "
                            "cobertura funcional de rotas/requisitos avaliados, e não cobertura de linhas/branches de código medida por c8."
                        ),
                        evidencia_encontrada=trecho,
                        valor_referencia_factual="100% das rotas funcionais avaliadas (cobertura de linhas via c8 não aferida no relatório)",
                        acao_recomendada="Adicionar nota de qualificação diferenciando cobertura funcional de rotas e cobertura de código.",
                        automatica=False,
                        padrao_busca="100% (Auth, Pedidos, Estoque, Finanças)",
                        texto_substituto="100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de código via c8 não aferida)"
                    ))

            # 6. Regra de Integridade 5: Disponibilidade Mensal vs. Bateria Pontual
            for item in m.get("disponibilidade", []):
                trecho = item["trecho"]
                if "100%" in trecho and ("mensal" in trecho.lower() or "homologação" in trecho.lower()):
                    inconsistencias.append(Inconsistencia(
                        id=proximo_id(),
                        categoria="Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual",
                        severidade="MEDIA",
                        documento=doc.nome,
                        localizacao=item["origem"],
                        descricao=(
                            "O documento associa meta de disponibilidade mensal (≥ 99,5% mensal) ao resultado "
                            "'100% nas baterias de homologação'. Pela Regra 5, uma bateria pontual de testes "
                            "comprova apenas 100% de respostas HTTP 200 durante a execução da suíte, e não disponibilidade mensal contínua."
                        ),
                        evidencia_encontrada=trecho,
                        valor_referencia_factual="100% de respostas HTTP 200 na bateria pontual (disponibilidade mensal contínua não monitorada em produção)",
                        acao_recomendada="Qualificar o resultado como aferição pontual durante a execução da suíte de testes.",
                        automatica=False,
                        padrao_busca="100% nas baterias de homologação",
                        texto_substituto="100% nas sondagens pontuais da suíte (uptime mensal contínuo não medido)"
                    ))

            # 7. Divergência de numeração de Casos de Teste entre PLANO_TESTES.md e relatorio-de-revisao-do-sistema.md
            if doc.nome == "relatorio-de-revisao-do-sistema.md":
                for tab in doc.tabelas:
                    for linha in tab.get("linhas", []):
                        if len(linha) >= 3 and linha[1] == "CT-01" and "100 produtos" in linha[2]:
                            inconsistencias.append(Inconsistencia(
                                id=proximo_id(),
                                categoria="Identificação e Numeração de Casos de Teste",
                                severidade="MEDIA",
                                documento=doc.nome,
                                localizacao=tab["origem"],
                                descricao=(
                                    "Divergência de identificação de casos de teste: em relatorio-de-revisao-do-sistema.md, "
                                    "'CT-01' refere-se ao catálogo de 100 produtos, enquanto em PLANO_TESTES.md e "
                                    "relatorio-de-desenvolvimento.md 'CT-01' refere-se aos headers de segurança HTTP (Helmet) "
                                    "e o catálogo é 'CT-26' / 'PR-01'."
                                ),
                                evidencia_encontrada=" | ".join(linha[:4]),
                                valor_referencia_factual="Padronizar conforme catálogo mestre PLANO_TESTES.md (CT-01 = Headers Helmet; CT-26/PR-01 = Catálogo 100 produtos)",
                                acao_recomendada="Revisar e alinhar a numeração da tabela de rastreabilidade com PLANO_TESTES.md.",
                                automatica=False
                            ))
                            break

        # 8. Verificação do arquivo físico do Roteiro PDF referenciado pelos documentos
        if not fatos_codigo.get("pdf_roteiro_presente_no_disco", False):
            inconsistencias.append(Inconsistencia(
                id=proximo_id(),
                categoria="Rastreabilidade de Referências (Roteiro Oficial)",
                severidade="BAIXA",
                documento="docs/ (Diretório Geral)",
                localizacao="Referências a Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf",
                descricao=(
                    "Os documentos referenciam o arquivo 'docs/Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf', "
                    "porém esse arquivo PDF não está presente no diretório docs/ do repositório."
                ),
                evidencia_encontrada="Link quebrado para Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf",
                valor_referencia_factual="Arquivo ausente em docs/",
                acao_recomendada="Anexar o PDF oficial do roteiro na pasta docs/ ou indicar que o roteiro pertence ao AVA UNINTER.",
                automatica=False
            ))

        if self.logger:
            self.logger.info(f"Auditoria de consistência concluída: {len(inconsistencias)} inconsistência(s) encontrada(s).")

        return {
            "total_inconsistencias": len(inconsistencias),
            "automaticas": sum(1 for i in inconsistencias if i.automatica),
            "revisao_humana": sum(1 for i in inconsistencias if not i.automatica),
            "contagens_testes_por_documento": mapa_contagens_por_doc,
            "fatos_codigo": fatos_codigo,
            "inconsistencias": inconsistencias
        }
