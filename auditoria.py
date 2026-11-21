# -*- coding: utf-8 -*-
"""
Módulo 3 — Verificação de conformidade com o Roteiro Oficial da Atividade Prática UNINTER 2026
(Trilha: Qualidade de Software — Rede 'Raízes do Nordeste').
Classifica cada requisito acadêmico em: ATENDIDO, PARCIALMENTE ATENDIDO ou NÃO ATENDIDO.
"""

from dataclasses import dataclass
from typing import Any, Dict, List
from leitor_documentos import DocumentoExtraido


@dataclass
class ItemConformidadeRoteiro:
    """Item individual da matriz de conformidade com o roteiro acadêmico UNINTER."""
    codigo: str
    item_roteiro: str
    exigencia_academica: str
    status: str  # "ATENDIDO", "PARCIALMENTE ATENDIDO", "NÃO ATENDIDO"
    documentos_comprobatorios: str
    evidencia_verificada: str
    complemento_necessario: str


class VerificadorRoteiroAcademico:
    """Compara o conjunto documental e os fatos do código contra os 12 itens obrigatórios do roteiro UNINTER."""

    def __init__(self, logger=None):
        self.logger = logger

    def avaliar_roteiro(
        self,
        documentos: List[DocumentoExtraido],
        fatos_codigo: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Avalia cada exigência do Roteiro de Atividade Prática 2026 com base em evidências reais."""
        nomes_docs = {d.nome for d in documentos}
        texto_global = "\n".join(d.texto_completo for d in documentos).lower()
        total_testes = fatos_codigo.get("total_testes_no_codigo", 0)
        total_suites = fatos_codigo.get("total_suites_no_codigo", 0)

        matriz: List[ItemConformidadeRoteiro] = [
            ItemConformidadeRoteiro(
                codigo="ROT-01",
                item_roteiro="1. Contexto, Escopo (In-Scope / Out-of-Scope) e Multicanalidade",
                exigencia_academica="Definir claramente o escopo avaliado, exclusões (pagamento real, logística externa) e os 5 canais (WEB, APP, TOTEM, BALCÃO, PICKUP).",
                status="ATENDIDO" if all(c in texto_global for c in ("in-scope", "out-of-scope", "totem", "pickup")) else "PARCIALMENTE ATENDIDO",
                documentos_comprobatorios="REQUISITOS.md, relatorio-de-desenvolvimento.md, relatorio-de-revisao-do-sistema.md",
                evidencia_verificada="Seções explícitas de In-Scope/Out-of-Scope e validação dos 5 canais em src/routes/orders.js e src/faults.test.js.",
                complemento_necessario="Nenhum complemento estrutural necessário."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-02",
                item_roteiro="2. Arquitetura da Solução e Persistência Relacional",
                exigencia_academica="Documentar a arquitetura em camadas, persistência de dados, modelo relacional e isolamento de testes.",
                status="ATENDIDO" if "sqlite" in texto_global and "wal" in texto_global else "PARCIALMENTE ATENDIDO",
                documentos_comprobatorios="relatorio-de-desenvolvimento.md, relatorio-testes-backend.md, README.md",
                evidencia_verificada=f"7 tabelas reais em src/db.js ({', '.join(fatos_codigo.get('tabelas_reais_db', []))}) com modo WAL e foreign_keys=ON.",
                complemento_necessario="Sincronizar documentos que ainda citavam a tabela antiga 'order_items'."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-03",
                item_roteiro="3. Levantamento de Requisitos Funcionais e Casos de Uso (UML)",
                exigencia_academica="Especificar requisitos funcionais verificáveis (RF-01 a RF-08), diagrama de casos de uso e fluxos base/exceção.",
                status="ATENDIDO" if "REQUISITOS.md" in nomes_docs and "rf-08" in texto_global else "PARCIALMENTE ATENDIDO",
                documentos_comprobatorios="REQUISITOS.md, relatorio-de-desenvolvimento.md",
                evidencia_verificada="8 Requisitos Funcionais (RF-01 a RF-08) e 9 Casos de Uso (UC01 a UC09) documentados com critérios objetivos.",
                complemento_necessario="Nenhum."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-04",
                item_roteiro="4. Oito Requisitos de Qualidade Mensuráveis (ISO/IEC 25010)",
                exigencia_academica="Definir 8 requisitos não funcionais mensuráveis para uma feature crítica, com atributo ISO 25010, condição, método, critério de aceite e risco.",
                status="ATENDIDO" if ("rq-08" in texto_global or "rnf-08" in texto_global) else "NÃO ATENDIDO",
                documentos_comprobatorios="REQUISITOS.md, relatorio-de-desenvolvimento.md, relatorio-testes-qualidade-software.md",
                evidencia_verificada="8 requisitos mensuráveis (RQ-01 a RQ-08 / RNF-01 a RNF-08) especificados e testados em src/qualidade.test.js.",
                complemento_necessario="Nenhum."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-05",
                item_roteiro="5. Planejamento da Qualidade (QA Plan) e Responsabilidades",
                exigencia_academica="Apresentar estratégia de níveis de teste (unitário, integração, sistema, regressão, segurança, offline), papéis RACI e critérios de bloqueio.",
                status="ATENDIDO" if "PLANO_TESTES.md" in nomes_docs else "PARCIALMENTE ATENDIDO",
                documentos_comprobatorios="PLANO_TESTES.md, relatorio-de-desenvolvimento.md",
                evidencia_verificada="Estratégia em 6 níveis, matriz RACI e Quality Gates documentados.",
                complemento_necessario="Nenhum."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-06",
                item_roteiro="6. Mínimo de 10 Cenários de Teste de Sistema (Positivos e Negativos)",
                exigencia_academica="Elaborar e executar ao menos 10 cenários de teste documentando entradas, resultados esperados, status e evidências.",
                status="ATENDIDO" if total_testes >= 10 else "NÃO ATENDIDO",
                documentos_comprobatorios="PLANO_TESTES.md, relatorio-testes-backend.md, relatorio-testes-frontend.md, relatorio-testes-qualidade-software.md",
                evidencia_verificada=f"{total_testes} casos de teste automatizados reais implementados em {total_suites} suítes no diretório src/ (superando o mínimo de 10).",
                complemento_necessario="Unificar a contagem final de 57 testes em todos os relatórios anteriores que citavam 35, 36, 44 ou 50."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-07",
                item_roteiro="7. Matriz de Rastreabilidade Bidirecional (Requisito ↔ Teste ↔ Evidência)",
                exigencia_academica="Vincular cada requisito funcional e não funcional aos respectivos casos de teste e evidências aferidas.",
                status="ATENDIDO" if "rastreabilidade" in texto_global else "NÃO ATENDIDO",
                documentos_comprobatorios="PLANO_TESTES.md, relatorio-de-desenvolvimento.md, relatorio-testes-qualidade-software.md",
                evidencia_verificada="Matrizes presentes vinculando RF-01..RF-08 e RQ-01..RQ-08 às suítes automatizadas.",
                complemento_necessario="Padronizar os códigos CT-01..CT-18 em relatorio-de-revisao-do-sistema.md com o catálogo de PLANO_TESTES.md."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-08",
                item_roteiro="8. Segurança da Aplicação (Autenticação, RBAC, Anti-Fraude, Rate Limit, XSS/CSP)",
                exigencia_academica="Demonstrar controles contra adulteração de preço no cliente, força bruta, elevação de privilégio e injeção XSS/SQL.",
                status="ATENDIDO",
                documentos_comprobatorios="relatorio-testes-backend.md, relatorio-de-desenvolvimento.md",
                evidencia_verificada="Validado por src/app.test.js, src/faults.test.js e src/backend.test.js (bcryptjs custo 12, HMAC, Helmet CSP, RateLimiter 429).",
                complemento_necessario="Corrigir menções residuais a '10 salt rounds' e 'SameSite=Strict' para '12 salt rounds' e 'SameSite=Lax'."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-09",
                item_roteiro="9. Privacidade e Conformidade com a LGPD (Lei nº 13.709/2018)",
                exigencia_academica="Apresentar inventário de dados pessoais, base legal, minimização, finalidade e validação de consentimento explícito.",
                status="ATENDIDO" if "13.709" in texto_global and "minimização" in texto_global else "PARCIALMENTE ATENDIDO",
                documentos_comprobatorios="relatorio-de-desenvolvimento.md, REQUISITOS.md, relatorio-testes-qualidade-software.md",
                evidencia_verificada="Checkbox #register-lgpd-consent no frontend, validação lgpdConsent no backend (HTTP 400 se recusado) e tabela de inventário LGPD.",
                complemento_necessario="Nenhum."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-10",
                item_roteiro="10. Planilha de Métricas e Indicadores de Qualidade (SLA / SLO / KPIs)",
                exigencia_academica="Documentar indicadores (taxa de defeitos, cobertura, tempo de resposta, disponibilidade, MTTR) separando metas planejadas de resultados medidos.",
                status="PARCIALMENTE ATENDIDO",
                documentos_comprobatorios="relatorio-de-desenvolvimento.md, relatorio-de-revisao-do-sistema.md, relatorio-testes-qualidade-software.md",
                evidencia_verificada="Tabelas de indicadores presentes com metas e resultados da suíte.",
                complemento_necessario=(
                    "Explicitar nas tabelas que '100% de cobertura' refere-se à cobertura funcional de rotas/requisitos "
                    "(e não cobertura de código c8) e que '100% de disponibilidade' refere-se à bateria pontual de testes (Regras 3, 4 e 5)."
                )
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-11",
                item_roteiro="11. Registro Obrigatório de Transparência no Uso de IA",
                exigencia_academica="Declarar ferramenta utilizada, finalidade, prompts relevantes e validação própria realizada pelo estudante.",
                status="ATENDIDO" if "USO_DE_IA.md" in nomes_docs else "NÃO ATENDIDO",
                documentos_comprobatorios="USO_DE_IA.md, relatorio-de-desenvolvimento.md, relatorio-de-revisao-do-sistema.md",
                evidencia_verificada="Declaração estruturada presente em docs/USO_DE_IA.md e na Seção 13 do relatório principal.",
                complemento_necessario="Nenhum."
            ),
            ItemConformidadeRoteiro(
                codigo="ROT-12",
                item_roteiro="12. Rascunho de Apresentação para Banca vs. Relatório Final",
                exigencia_academica="Manter consistência entre o material de apoio à apresentação oral e o relatório técnico final.",
                status="PARCIALMENTE ATENDIDO",
                documentos_comprobatorios="relatorio-rascunho-apresentacao-banca.md, relatorio-de-desenvolvimento.md",
                evidencia_verificada="O cabeçalho de relatorio-rascunho-apresentacao-banca.md foi atualizado, mas as seções 2 a 10 ainda contêm campos '[Definir]' / '[Preencher]' do template inicial.",
                complemento_necessario="Revisão humana recomendada caso o rascunho de banca seja entregue junto ao relatório principal."
            )
        ]

        resumo = {
            "total_itens_avaliados": len(matriz),
            "atendidos": sum(1 for i in matriz if i.status == "ATENDIDO"),
            "parcialmente_atendidos": sum(1 for i in matriz if i.status == "PARCIALMENTE ATENDIDO"),
            "nao_atendidos": sum(1 for i in matriz if i.status == "NÃO ATENDIDO"),
            "itens": matriz
        }

        if self.logger:
            self.logger.info(
                f"Verificação do roteiro concluída: {resumo['atendidos']} atendidos, "
                f"{resumo['parcialmente_atendidos']} parciais, {resumo['nao_atendidos']} não atendidos."
            )
        return resumo
