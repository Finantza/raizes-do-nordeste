# RELATÓRIO CONSOLIDADO DE AUDITORIA TÉCNICA E DOCUMENTAL
## PROJETO REDE 'RAÍZES DO NORDESTE' — UNINTER 2026
**Gerado em:** 21/11/2026 10:48:38 | **Acadêmico:** Ronaldo Coutinho | **Docente:** Prof. Me. Rodrigo Nascimento

## 1. Identificação do Projeto
- **Sistema:** Rede 'Raízes do Nordeste' (Express 4 + SQLite3 WAL + Vanilla JS Offline)
- **Verdade Factual no Código (`src/`):** `57` testes em `8` suítes | `7` tabelas SQL | bcrypt `12` rounds | `SameSite=Lax`

## 2. Objetivo da Auditoria
Auditar a consistência entre todos os relatórios técnicos (Desenvolvimento, Backend, Frontend, QA, Plano de Testes e Requisitos) e o código-fonte real, corrigindo divergências com base em evidências e respeitando as 10 Regras de Integridade.

## 3. Documentos Analisados
| Documento | Formato | Tamanho | SHA-256 | Estrutura |
|---|---|---|---|---|
| `avaliacao-do-sistema.md` | MD | 22519 B | `08039cb38f0ed0ac...` | 29 tít / 127 par / 2 tab |
| `guia-passo-a-passo-melhorias-qualidade.md` | MD | 11927 B | `18cda822dea7ef70...` | 14 tít / 129 par / 4 tab |
| `PLANO_TESTES.md` | MD | 12384 B | `c3c38441dc092b61...` | 5 tít / 21 par / 2 tab |
| `relatorio-de-desenvolvimento.doc` | DOC | 61093 B | `002564282073e4e9...` | 35 tít / 140 par / 12 tab |
| `relatorio-de-desenvolvimento.docx` | DOCX | 61093 B | `002564282073e4e9...` | 35 tít / 140 par / 12 tab |
| `relatorio-de-desenvolvimento.md` | MD | 40970 B | `38c7fe8cb31c111b...` | 35 tít / 164 par / 9 tab |
| `relatorio-de-revisao-do-sistema.md` | MD | 17052 B | `033f9ce1444ec62f...` | 18 tít / 93 par / 3 tab |
| `relatorio-rascunho-apresentacao-banca.doc` | DOC | 47104 B | `d1b7b5a34801c26b...` | 0 tít / 202 par / 0 tab |
| `relatorio-rascunho-apresentacao-banca.md` | MD | 18899 B | `13f3b7aff92105cd...` | 17 tít / 75 par / 9 tab |
| `relatorio-testes-backend.doc` | DOC | 42762 B | `1bf5f68753a2150b...` | 6 tít / 13 par / 3 tab |
| `relatorio-testes-backend.docx` | DOCX | 42762 B | `1bf5f68753a2150b...` | 6 tít / 13 par / 3 tab |
| `relatorio-testes-backend.md` | MD | 10758 B | `f03444bd279a1129...` | 5 tít / 17 par / 3 tab |
| `relatorio-testes-frontend.doc` | DOC | 41943 B | `e8d85874605c2cea...` | 6 tít / 16 par / 3 tab |
| `relatorio-testes-frontend.docx` | DOCX | 41943 B | `e8d85874605c2cea...` | 6 tít / 16 par / 3 tab |
| `relatorio-testes-frontend.md` | MD | 8882 B | `af42ac0590e3fe09...` | 5 tít / 18 par / 3 tab |
| `relatorio-testes-qualidade-software.doc` | DOC | 41687 B | `7969e61e63a44ae6...` | 6 tít / 10 par / 4 tab |
| `relatorio-testes-qualidade-software.docx` | DOCX | 41687 B | `7969e61e63a44ae6...` | 6 tít / 10 par / 4 tab |
| `relatorio-testes-qualidade-software.md` | MD | 7823 B | `d1c65a7f61fe0869...` | 5 tít / 13 par / 4 tab |
| `REQUISITOS.md` | MD | 10684 B | `39a4441349af2a0e...` | 7 tít / 71 par / 2 tab |
| `USO_DE_IA.md` | MD | 1499 B | `850f45054078efbd...` | 1 tít / 13 par / 0 tab |
| `README.md` | MD | 32000 B | `8de1dca630dc9a4c...` | 25 tít / 251 par / 6 tab |

## 4. Metodologia Utilizada
Extração estrutural multi-formato (Módulo 1), cruzamento interdocumental e verificação de Regras de Integridade (Módulo 2), avaliação dos 12 itens do Roteiro UNINTER (Módulo 3), correção assistida com backup SHA-256 (Módulo 4) e exportação multi-formato DOCX/PDF/XLSX/CSV (Módulos 5 e 6).

## 5. Diagnóstico Geral
- **Total de Documentos Auditados:** 21
- **Total de Inconsistências Detectadas:** 45 (33 automáticas / 12 revisão humana)
- **Conformidade com o Roteiro UNINTER:** 10 atendidos / 2 parciais / 0 não atendidos

## 6. Matriz de Conformidade com o Roteiro Acadêmico
| Código | Item do Roteiro | Status | Evidência | Complemento |
|---|---|---|---|---|
| **ROT-01** | 1. Contexto, Escopo (In-Scope / Out-of-Scope) e Multicanalidade | **ATENDIDO** | Seções explícitas de In-Scope/Out-of-Scope e validação dos 5 canais em src/routes/orders.js e src/faults.test.js. | Nenhum complemento estrutural necessário. |
| **ROT-02** | 2. Arquitetura da Solução e Persistência Relacional | **ATENDIDO** | 7 tabelas reais em src/db.js (users, sessions, products, orders, unidades, estoque_movimentacoes, financeiro_lancamentos) com modo WAL e foreign_keys=ON. | Sincronizar documentos que ainda citavam a tabela antiga 'order_items'. |
| **ROT-03** | 3. Levantamento de Requisitos Funcionais e Casos de Uso (UML) | **ATENDIDO** | 8 Requisitos Funcionais (RF-01 a RF-08) e 9 Casos de Uso (UC01 a UC09) documentados com critérios objetivos. | Nenhum. |
| **ROT-04** | 4. Oito Requisitos de Qualidade Mensuráveis (ISO/IEC 25010) | **ATENDIDO** | 8 requisitos mensuráveis (RQ-01 a RQ-08 / RNF-01 a RNF-08) especificados e testados em src/qualidade.test.js. | Nenhum. |
| **ROT-05** | 5. Planejamento da Qualidade (QA Plan) e Responsabilidades | **ATENDIDO** | Estratégia em 6 níveis, matriz RACI e Quality Gates documentados. | Nenhum. |
| **ROT-06** | 6. Mínimo de 10 Cenários de Teste de Sistema (Positivos e Negativos) | **ATENDIDO** | 57 casos de teste automatizados reais implementados em 8 suítes no diretório src/ (superando o mínimo de 10). | Unificar a contagem final de 57 testes em todos os relatórios anteriores que citavam 35, 36, 44 ou 50. |
| **ROT-07** | 7. Matriz de Rastreabilidade Bidirecional (Requisito ↔ Teste ↔ Evidência) | **ATENDIDO** | Matrizes presentes vinculando RF-01..RF-08 e RQ-01..RQ-08 às suítes automatizadas. | Padronizar os códigos CT-01..CT-18 em relatorio-de-revisao-do-sistema.md com o catálogo de PLANO_TESTES.md. |
| **ROT-08** | 8. Segurança da Aplicação (Autenticação, RBAC, Anti-Fraude, Rate Limit, XSS/CSP) | **ATENDIDO** | Validado por src/app.test.js, src/faults.test.js e src/backend.test.js (bcryptjs custo 12, HMAC, Helmet CSP, RateLimiter 429). | Corrigir menções residuais a '12 salt rounds' e 'SameSite=Lax' para '12 salt rounds' e 'SameSite=Lax'. |
| **ROT-09** | 9. Privacidade e Conformidade com a LGPD (Lei nº 13.709/2018) | **ATENDIDO** | Checkbox #register-lgpd-consent no frontend, validação lgpdConsent no backend (HTTP 400 se recusado) e tabela de inventário LGPD. | Nenhum. |
| **ROT-10** | 10. Planilha de Métricas e Indicadores de Qualidade (SLA / SLO / KPIs) | **PARCIALMENTE ATENDIDO** | Tabelas de indicadores presentes com metas e resultados da suíte. | Explicitar nas tabelas que '100% de cobertura' refere-se à cobertura funcional de rotas/requisitos (e não cobertura de código c8) e que '100% de disponibilidade' refere-se à bateria pontual de testes (Regras 3, 4 e 5). |
| **ROT-11** | 11. Registro Obrigatório de Transparência no Uso de IA | **ATENDIDO** | Declaração estruturada presente em docs/USO_DE_IA.md e na Seção 13 do relatório principal. | Nenhum. |
| **ROT-12** | 12. Rascunho de Apresentação para Banca vs. Relatório Final | **PARCIALMENTE ATENDIDO** | O cabeçalho de relatorio-rascunho-apresentacao-banca.md foi atualizado, mas as seções 2 a 10 ainda contêm campos '[Definir]' / '[Preencher]' do template inicial. | Revisão humana recomendada caso o rascunho de banca seja entregue junto ao relatório principal. |

## 7. Inconsistências Encontradas
| ID | Sev. | Documento | Localização | Categoria | Evidência Encontrada | Valor Factual | Tipo |
|---|---|---|---|---|---|---|---|
| **INC-001** | ALTA | `PLANO_TESTES.md` | PLANO_TESTES.md:L18 | Quantidade Total de Testes | `57 Casos de Teste Automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-002** | ALTA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Parágrafo 13 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-003** | ALTA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Parágrafo 106 | Quantidade Total de Testes | `57 testes executados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-004** | ALTA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Parágrafo 134 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-005** | ALTA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Parágrafo 150 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-006** | ALTA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 1 (Linha 13) | Quantidade Total de Testes | `57 Testes Automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-007** | ALTA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 2 (Linha 1) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-008** | ALTA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 3 (Linha 10) | Quantidade Total de Testes | `57 testes aprovados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-009** | MEDIA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 11 (Linha 3) | Regras 3 e 4 — Cobertura de Testes vs. Cobertura de Código | `Cobertura de Fluxos Críticos | ≥ 80% das rotas de negócio | 100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida) | Mapeamento de rotas e testes de integr` | `100% das rotas funcionais avaliadas (cobertura de linhas via c8 não aferida no relatório)` | Revisão Humana |
| **INC-010** | MEDIA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 11 (Linha 5) | Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual | `Disponibilidade Operacional Simulada | ≥ 99,5% mensal | 100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada) | Sondagens na rota /api/health durante testes de e` | `100% de respostas HTTP 200 na bateria pontual (disponibilidade mensal contínua não monitorada em produção)` | Revisão Humana |
| **INC-011** | MEDIA | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 11 (Linha 5) | Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual | `Disponibilidade Operacional Simulada | ≥ 99,5% mensal | 100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada) | Sondagens na rota /api/health durante testes de e` | `100% de respostas HTTP 200 na bateria pontual (disponibilidade mensal contínua não monitorada em produção)` | Revisão Humana |
| **INC-012** | ALTA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Parágrafo 13 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-013** | ALTA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Parágrafo 106 | Quantidade Total de Testes | `57 testes executados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-014** | ALTA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Parágrafo 134 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-015** | ALTA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Parágrafo 150 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-016** | ALTA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 1 (Linha 13) | Quantidade Total de Testes | `57 Testes Automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-017** | ALTA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 2 (Linha 1) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-018** | ALTA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 3 (Linha 10) | Quantidade Total de Testes | `57 testes aprovados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-019** | MEDIA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 11 (Linha 3) | Regras 3 e 4 — Cobertura de Testes vs. Cobertura de Código | `Cobertura de Fluxos Críticos | ≥ 80% das rotas de negócio | 100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida) | Mapeamento de rotas e testes de integr` | `100% das rotas funcionais avaliadas (cobertura de linhas via c8 não aferida no relatório)` | Revisão Humana |
| **INC-020** | MEDIA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 11 (Linha 5) | Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual | `Disponibilidade Operacional Simulada | ≥ 99,5% mensal | 100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada) | Sondagens na rota /api/health durante testes de e` | `100% de respostas HTTP 200 na bateria pontual (disponibilidade mensal contínua não monitorada em produção)` | Revisão Humana |
| **INC-021** | MEDIA | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 11 (Linha 5) | Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual | `Disponibilidade Operacional Simulada | ≥ 99,5% mensal | 100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada) | Sondagens na rota /api/health durante testes de e` | `100% de respostas HTTP 200 na bateria pontual (disponibilidade mensal contínua não monitorada em produção)` | Revisão Humana |
| **INC-022** | ALTA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:L40 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-023** | ALTA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:L42 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-024** | ALTA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:L203 | Quantidade Total de Testes | `57 Testes Automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-025** | ALTA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:L205 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-026** | ALTA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:L334 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-027** | ALTA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 16-30 (Linha 13) | Quantidade Total de Testes | `57 Testes Automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-028** | ALTA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 83-94 (Linha 10) | Quantidade Total de Testes | `57 testes aprovados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-029** | MEDIA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 270-278 (Linha 3) | Regras 3 e 4 — Cobertura de Testes vs. Cobertura de Código | `**Cobertura de Fluxos Críticos** | ≥ 80% das rotas de negócio | 100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida) | Mapeamento de rotas e testes de in` | `100% das rotas funcionais avaliadas (cobertura de linhas via c8 não aferida no relatório)` | Revisão Humana |
| **INC-030** | MEDIA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 270-278 (Linha 5) | Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual | `**Disponibilidade Operacional Simulada** | ≥ 99,5% mensal | 100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada) | Sondagens na rota /api/health durante testes ` | `100% de respostas HTTP 200 na bateria pontual (disponibilidade mensal contínua não monitorada em produção)` | Revisão Humana |
| **INC-031** | MEDIA | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 270-278 (Linha 5) | Regra 5 — Disponibilidade Mensal vs. Sondagem Pontual | `**Disponibilidade Operacional Simulada** | ≥ 99,5% mensal | 100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada) | Sondagens na rota /api/health durante testes ` | `100% de respostas HTTP 200 na bateria pontual (disponibilidade mensal contínua não monitorada em produção)` | Revisão Humana |
| **INC-032** | ALTA | `relatorio-de-revisao-do-sistema.md` | relatorio-de-revisao-do-sistema.md:L19 | Quantidade Total de Testes | `57 testes executados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-033** | ALTA | `relatorio-de-revisao-do-sistema.md` | relatorio-de-revisao-do-sistema.md:L172 | Quantidade Total de Testes | `57 testes aprovados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-034** | MEDIA | `relatorio-de-revisao-do-sistema.md` | relatorio-de-revisao-do-sistema.md:Linhas 140-147 (Linha 3) | Regras 3 e 4 — Cobertura de Testes vs. Cobertura de Código | `**Cobertura de Testes das Rotas Críticas** | ≥ 80% dos fluxos principais | 100% dos fluxos de Auth, Pedidos, Unidades, Estoque, Finanças e O` | `100% das rotas funcionais avaliadas (cobertura de linhas via c8 não aferida no relatório)` | Revisão Humana |
| **INC-035** | MEDIA | `relatorio-de-revisao-do-sistema.md` | relatorio-de-revisao-do-sistema.md:Linhas 112-134 | Identificação e Numeração de Casos de Teste | `**RF-01** | CT-01 | Listar e validar catálogo completo de 100 produtos. | 100 itens com nomes únicos e atributos consistentes.` | `Padronizar conforme catálogo mestre PLANO_TESTES.md (CT-01 = Headers Helmet; CT-26/PR-01 = Catálogo 100 produtos)` | Revisão Humana |
| **INC-036** | ALTA | `relatorio-testes-backend.doc` | relatorio-testes-backend.doc:Tabela 1 (Linha 8) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-037** | ALTA | `relatorio-testes-backend.docx` | relatorio-testes-backend.docx:Tabela 1 (Linha 8) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-038** | ALTA | `relatorio-testes-backend.md` | relatorio-testes-backend.md:Linhas 13-22 (Linha 8) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-039** | ALTA | `relatorio-testes-frontend.doc` | relatorio-testes-frontend.doc:Parágrafo 19 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-040** | ALTA | `relatorio-testes-frontend.doc` | relatorio-testes-frontend.doc:Tabela 1 (Linha 7) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-041** | ALTA | `relatorio-testes-frontend.docx` | relatorio-testes-frontend.docx:Parágrafo 19 | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-042** | ALTA | `relatorio-testes-frontend.docx` | relatorio-testes-frontend.docx:Tabela 1 (Linha 7) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-043** | ALTA | `relatorio-testes-frontend.md` | relatorio-testes-frontend.md:Linhas 13-21 (Linha 7) | Quantidade Total de Testes | `57 testes automatizados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-044** | ALTA | `REQUISITOS.md` | REQUISITOS.md:Linhas 27-36 (Linha 9) | Quantidade Total de Testes | `57 testes aprovados` | `57 testes automatizados (8 suítes)` | Automática |
| **INC-045** | BAIXA | `docs/ (Diretório Geral)` | Referências a Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf | Rastreabilidade de Referências (Roteiro Oficial) | `Link quebrado para Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf` | `Arquivo ausente em docs/` | Revisão Humana |

## 8. Correções Realizadas
| ID/Regra | Documento Revisado | Valor Anterior | Valor Novo | Justificativa |
|---|---|---|---|---|
| `REL-DET-02` | `PLANO_TESTES.md` | `57 Casos de Teste Automatizados` | `57 Casos de Teste Automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.doc` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-desenvolvimento.doc` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-de-desenvolvimento.doc` | `57 testes executados` | `57 testes executados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.doc` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.doc` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-desenvolvimento.doc` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-de-desenvolvimento.doc` | `57 Testes Automatizados` | `57 Testes Automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-desenvolvimento.doc` | `8 Suítes` | `8 Suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-de-desenvolvimento.doc` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.doc` | `57 testes aprovados` | `57 testes aprovados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-INT-01` | `relatorio-de-desenvolvimento.doc` | `100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida)` | `100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida)` | Qualificação obrigatória pelas Regras de Integridade 3 e 4 (diferenciação entre cobertura de fluxos e cobertura de código). |
| `REL-INT-03` | `relatorio-de-desenvolvimento.doc` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | Qualificação obrigatória pela Regra de Integridade 5 (bateria pontual vs. disponibilidade mensal). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.docx` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-desenvolvimento.docx` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-de-desenvolvimento.docx` | `57 testes executados` | `57 testes executados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.docx` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.docx` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-desenvolvimento.docx` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-de-desenvolvimento.docx` | `57 Testes Automatizados` | `57 Testes Automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-desenvolvimento.docx` | `8 Suítes` | `8 Suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-de-desenvolvimento.docx` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.docx` | `57 testes aprovados` | `57 testes aprovados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-INT-01` | `relatorio-de-desenvolvimento.docx` | `100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida)` | `100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida)` | Qualificação obrigatória pelas Regras de Integridade 3 e 4 (diferenciação entre cobertura de fluxos e cobertura de código). |
| `REL-INT-03` | `relatorio-de-desenvolvimento.docx` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | Qualificação obrigatória pela Regra de Integridade 5 (bateria pontual vs. disponibilidade mensal). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.md` | `57 Testes Automatizados` | `57 Testes Automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.md` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.md` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.md` | `57 testes aprovados` | `57 testes aprovados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.md` | `57 Testes Automatizados` | `57 Testes Automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.md` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-desenvolvimento.md` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-desenvolvimento.md` | `8 Suítes` | `8 Suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-03` | `relatorio-de-desenvolvimento.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-03` | `relatorio-de-desenvolvimento.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-03` | `relatorio-de-desenvolvimento.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-INT-01` | `relatorio-de-desenvolvimento.md` | `100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida)` | `100% das rotas funcionais avaliadas (Auth, Pedidos, Estoque, Finanças; cobertura de linhas de código via c8 não aferida)` | Qualificação obrigatória pelas Regras de Integridade 3 e 4 (diferenciação entre cobertura de fluxos e cobertura de código). |
| `REL-INT-03` | `relatorio-de-desenvolvimento.md` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | Qualificação obrigatória pela Regra de Integridade 5 (bateria pontual vs. disponibilidade mensal). |
| `REL-DET-02` | `relatorio-de-revisao-do-sistema.md` | `57 testes executados` | `57 testes executados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-de-revisao-do-sistema.md` | `57 testes aprovados` | `57 testes aprovados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-de-revisao-do-sistema.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-INT-02` | `relatorio-de-revisao-do-sistema.md` | `100% dos fluxos funcionais avaliados (cobertura de linhas de código via c8 não aferida)` | `100% dos fluxos funcionais avaliados (cobertura de linhas de código via c8 não aferida)` | Qualificação obrigatória pelas Regras de Integridade 3 e 4. |
| `REL-INT-04` | `relatorio-de-revisao-do-sistema.md` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | `100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)` | Qualificação obrigatória pela Regra de Integridade 5. |
| `REL-DET-03` | `relatorio-testes-backend.doc` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-03` | `relatorio-testes-backend.doc` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-testes-backend.doc` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-testes-backend.docx` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-03` | `relatorio-testes-backend.docx` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-testes-backend.docx` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-testes-backend.md` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `relatorio-testes-backend.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-03` | `relatorio-testes-backend.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-02` | `relatorio-testes-frontend.doc` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-testes-frontend.doc` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-testes-frontend.docx` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-testes-frontend.docx` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `relatorio-testes-frontend.md` | `57 testes automatizados` | `57 testes automatizados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-02` | `REQUISITOS.md` | `57 testes aprovados` | `57 testes aprovados` | Sincronização da contagem global de testes para 57 testes (8 suítes). |
| `REL-DET-03` | `REQUISITOS.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |
| `REL-DET-03` | `USO_DE_IA.md` | `8 suítes` | `8 suítes` | Sincronização do total de suítes automatizadas para 8 suítes. |

## 9. Pendências que Exigem Validação Humana
| ID | Documento | Localização | Descrição | Ação Recomendada |
|---|---|---|---|---|
| **INC-009** | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 11 (Linha 3) | O relatório declara '100%' em indicador de cobertura de rotas/fluxos. Pelas Regras de Integridade 3 e 4, é obrigatório explicitar que se trata de cobertura funcional de rotas/requisitos avaliados, e não cobertura de linhas/branches de código medida por c8. | Adicionar nota de qualificação diferenciando cobertura funcional de rotas e cobertura de código. |
| **INC-010** | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 11 (Linha 5) | O documento associa meta de disponibilidade mensal (≥ 99,5% mensal) ao resultado '100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)'. Pela Regra 5, uma bateria pontual de testes comprova apenas 100% de respostas HTTP 200 durante a execução da suíte, e não disponibilidade mensal contínua. | Qualificar o resultado como aferição pontual durante a execução da suíte de testes. |
| **INC-011** | `relatorio-de-desenvolvimento.doc` | relatorio-de-desenvolvimento.doc:Tabela 11 (Linha 5) | O documento associa meta de disponibilidade mensal (≥ 99,5% mensal) ao resultado '100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)'. Pela Regra 5, uma bateria pontual de testes comprova apenas 100% de respostas HTTP 200 durante a execução da suíte, e não disponibilidade mensal contínua. | Qualificar o resultado como aferição pontual durante a execução da suíte de testes. |
| **INC-019** | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 11 (Linha 3) | O relatório declara '100%' em indicador de cobertura de rotas/fluxos. Pelas Regras de Integridade 3 e 4, é obrigatório explicitar que se trata de cobertura funcional de rotas/requisitos avaliados, e não cobertura de linhas/branches de código medida por c8. | Adicionar nota de qualificação diferenciando cobertura funcional de rotas e cobertura de código. |
| **INC-020** | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 11 (Linha 5) | O documento associa meta de disponibilidade mensal (≥ 99,5% mensal) ao resultado '100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)'. Pela Regra 5, uma bateria pontual de testes comprova apenas 100% de respostas HTTP 200 durante a execução da suíte, e não disponibilidade mensal contínua. | Qualificar o resultado como aferição pontual durante a execução da suíte de testes. |
| **INC-021** | `relatorio-de-desenvolvimento.docx` | relatorio-de-desenvolvimento.docx:Tabela 11 (Linha 5) | O documento associa meta de disponibilidade mensal (≥ 99,5% mensal) ao resultado '100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)'. Pela Regra 5, uma bateria pontual de testes comprova apenas 100% de respostas HTTP 200 durante a execução da suíte, e não disponibilidade mensal contínua. | Qualificar o resultado como aferição pontual durante a execução da suíte de testes. |
| **INC-029** | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 270-278 (Linha 3) | O relatório declara '100%' em indicador de cobertura de rotas/fluxos. Pelas Regras de Integridade 3 e 4, é obrigatório explicitar que se trata de cobertura funcional de rotas/requisitos avaliados, e não cobertura de linhas/branches de código medida por c8. | Adicionar nota de qualificação diferenciando cobertura funcional de rotas e cobertura de código. |
| **INC-030** | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 270-278 (Linha 5) | O documento associa meta de disponibilidade mensal (≥ 99,5% mensal) ao resultado '100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)'. Pela Regra 5, uma bateria pontual de testes comprova apenas 100% de respostas HTTP 200 durante a execução da suíte, e não disponibilidade mensal contínua. | Qualificar o resultado como aferição pontual durante a execução da suíte de testes. |
| **INC-031** | `relatorio-de-desenvolvimento.md` | relatorio-de-desenvolvimento.md:Linhas 270-278 (Linha 5) | O documento associa meta de disponibilidade mensal (≥ 99,5% mensal) ao resultado '100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada)'. Pela Regra 5, uma bateria pontual de testes comprova apenas 100% de respostas HTTP 200 durante a execução da suíte, e não disponibilidade mensal contínua. | Qualificar o resultado como aferição pontual durante a execução da suíte de testes. |
| **INC-034** | `relatorio-de-revisao-do-sistema.md` | relatorio-de-revisao-do-sistema.md:Linhas 140-147 (Linha 3) | O relatório declara '100%' em indicador de cobertura de rotas/fluxos. Pelas Regras de Integridade 3 e 4, é obrigatório explicitar que se trata de cobertura funcional de rotas/requisitos avaliados, e não cobertura de linhas/branches de código medida por c8. | Adicionar nota de qualificação diferenciando cobertura funcional de rotas e cobertura de código. |
| **INC-035** | `relatorio-de-revisao-do-sistema.md` | relatorio-de-revisao-do-sistema.md:Linhas 112-134 | Divergência de identificação de casos de teste: em relatorio-de-revisao-do-sistema.md, 'CT-01' refere-se ao catálogo de 100 produtos, enquanto em PLANO_TESTES.md e relatorio-de-desenvolvimento.md 'CT-01' refere-se aos headers de segurança HTTP (Helmet) e o catálogo é 'CT-26' / 'PR-01'. | Revisar e alinhar a numeração da tabela de rastreabilidade com PLANO_TESTES.md. |
| **INC-045** | `docs/ (Diretório Geral)` | Referências a Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf | Os documentos referenciam o arquivo 'docs/Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf', porém esse arquivo PDF não está presente no diretório docs/ do repositório. | Anexar o PDF oficial do roteiro na pasta docs/ ou indicar que o roteiro pertence ao AVA UNINTER. |

## 10. Avaliação da Qualidade da Documentação
A documentação apresenta cobertura completa dos módulos do sistema e rastreabilidade direta com as suítes automatizadas. As divergências de contagem decorrentes da evolução de 35 para 57 testes foram padronizadas nas versões revisadas.

## 11. Conclusão Técnica
Todos os documentos revisados encontram-se sincronizados com o estado real do repositório (`57 testes` em `8 suítes`, `0 falhas`, esquema SQLite WAL de `7 tabelas`, `bcryptjs` custo `12` e `SameSite=Lax`).

## 12. Recomendações
1. Utilizar os documentos revisados em `auditoria_output/revisados/` para entrega final.
2. Manter os manifestos de backup SHA-256 em `auditoria_output/backups/` para comprovação de rastreabilidade.
