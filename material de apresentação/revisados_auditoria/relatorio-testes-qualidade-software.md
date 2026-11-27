# Relatório de Testes da Linha de Qualidade de Software (QA) - Rede "Raízes do Nordeste"

**Centro Universitário Internacional UNINTER**  
**Projeto Multidisciplinar - Trilha: Qualidade de Software (2026)**  
**Acadêmico / Responsável:** Ronaldo Coutinho | **Docente:** Prof. Me. Rodrigo Nascimento  

---

## 1. Resumo Executivo da Garantia da Qualidade de Software (QA)

Este relatório consolida a bateria completa de testes, métricas, matrizes de rastreabilidade e auditorias da linha de **Qualidade de Software (QA)** do projeto **"Raízes do Nordeste"**. A verificação abrange os **8 requisitos não funcionais mensuráveis da norma ABNT NBR ISO/IEC 25010**, os **8 requisitos funcionais de negócio**, a mitigação dos riscos **OWASP Top 10**, a conformidade com a **LGPD (Lei nº 13.709/2018)** e a execução automatizada de **57 casos de teste distribuídos em 8 suítes**.

| Parâmetro Consolidado de QA | Resultado Aferido na Bateria Oficial |
|---|---|
| **Total de Suítes Automatizadas no Projeto** | 8 suítes (`qualidade`, `backend`, `frontend`, `faults`, `app`, `gestao`, `offline`, `products`) |
| **Total de Casos de Teste Automatizados** | **57 testes executados - 57 aprovados (0 falhas / 100% de sucesso)** |
| **Suíte Específica ISO/IEC 25010 (`src/qualidade.test.js`)** | 7 auditorias de atributos de qualidade - **7 aprovadas (0 falhas)** |
| **Validação Sintática Estática (`node --check`)** | 9 de 9 scripts do frontend aprovados sem erros |
| **Integridade Física do Banco SQLite (WAL Mode)** | `PRAGMA integrity_check = ok` \| `PRAGMA foreign_key_check = 0 violações` |
| **Densidade de Defeitos Críticos Pendentes** | 0% (todos os bugs identificados nas auditorias foram corrigidos e cobertos por testes) |
| **Autonomia e Resiliência Offline** | 100% dos recursos estáticos, imagens e banco operando sem CDNs externos |

---

## 2. Aferição Automatizada dos 8 Requisitos de Qualidade (ISO/IEC 25010)

| ID | Atributo ISO 25010 | Meta / Critério de Aceitação | Resultado Medido em Teste (`src/qualidade.test.js`) | Situação |
|---|---|---|---|---|
| **RQ-01** | **Desempenho** | Latência p95 < `1500 ms` em lote de 20 pedidos consecutivos | Aprovado em **QA-01** (p95 < `150 ms`; média < `50 ms`) | **HOMOLOGADO** |
| **RQ-02** | **Disponibilidade** | Uptime ≥ `99,5%` e cabeçalho `Cache-Control: no-store` na API | Aprovado em **QA-02** (`100%` em 25 sondagens contínuas) | **HOMOLOGADO** |
| **RQ-03** | **Segurança (Anti-Fraude)** | Descarte total de preços/descontos manipulados pelo cliente | Aprovado em **QA-03** (`total: R$ 0,02` recalculado para `R$ 116,88`) | **HOMOLOGADO** |
| **RQ-04** | **Usabilidade** | Checkout em ≤ 3 passos e login demonstrativo em 1 clique | Aprovado em **QA-04** (fluxo direto e 3 botões demo validados) | **HOMOLOGADO** |
| **RQ-05** | **Confiabilidade** | Idempotência de migração (`legacyId`) e integridade ACID SQLite | Aprovado em **QA-05** (3 envios = 1 registro; `integrity_check = ok`) | **HOMOLOGADO** |
| **RQ-06** | **Compatibilidade** | Responsividade de `320px` a `1920px` e suporte a `reduced-motion` | Aprovado em **QA-04** e **FE-08** (breakpoints CSS verificados) | **HOMOLOGADO** |
| **RQ-07** | **Observabilidade e LGPD** | Erros JSON padronizados sem vazar senhas, hashes ou stack trace | Aprovado em **QA-06** (0 vazamentos em respostas `201`/`400`/`404`) | **HOMOLOGADO** |
| **RQ-08** | **Manutenibilidade** | Execução automatizada de toda a suíte e presença dos artefatos | Aprovado em **QA-07** (15 artefatos de documentação e 57 testes OK) | **HOMOLOGADO** |

---

## 3. Visão Consolidada das 8 Suítes de Testes Automatizados (57 Testes)

| Arquivo de Suíte | Qtd. Testes | Escopo Principal de Verificação | Status |
|---|---|---|---|
| `src/qualidade.test.js` | **7** | Auditoria dos 8 requisitos mensuráveis ISO/IEC 25010 (desempenho p95, disponibilidade, anti-fraude, usabilidade, idempotência, observabilidade/LGPD e governança documental) | **7 / 7 OK** |
| `src/backend.test.js` | **6** | Testes profundos de backend: repositório `db.js`, assinatura HMAC em `auth.js`, CRUD com Base64, consolidação e baixa automática de estoque em pedidos, filtros financeiros e isolamento entre clientes | **6 / 6 OK** |
| `src/frontend.test.js` | **8** | Testes de todos os 9 scripts de `public/` e 5 páginas HTML: carrossel, login demo, bloqueio LGPD, controles `[+]` e `[-]` do carrinho, bloqueio de esgotados, painéis admin/loja e abas de gestão | **8 / 8 OK** |
| `src/faults.test.js` | **7** | Testes negativos, casos de borda e estresse: JSON truncado, CORS, Prototype Pollution, coerção de tipos (`null`/`boolean`/`""`), datas impossíveis (`31/02`), SQLi, Path Traversal, Payload > 1MB (`413`) e 40 reqs concorrentes | **7 / 7 OK** |
| `src/app.test.js` | **14** | Integração da API Express: Helmet/CSP, imagens estáticas, unidades com token 32+ bytes (fail-closed `503`), registro/login/logout, rate limit (`HTTP 429`), RBAC, XSS e persistência após reconexão | **14 / 14 OK** |
| `src/gestao.test.js` | **5** | Regras de negócio e autorização RBAC dos módulos internos de Controle de Estoque (`/api/estoque/*`) e Contas a Pagar e Receber (`/api/financeiro/*`) | **5 / 5 OK** |
| `src/offline.test.js` | **6** | Resiliência e autonomia 100% offline: fallback automático de 100 produtos sem rede, zero CDNs externos em HTML/CSS, 100 imagens físicas no disco e paridade matemática de preços | **6 / 6 OK** |
| `src/products.test.js` | **4** | Testes unitários do catálogo: 100 produtos únicos, 21 combos com `itensInclusos`, mesclagem não destrutiva (`mergeRaizesProducts`) e escape HTML anti-XSS | **4 / 4 OK** |

---

## 4. Matriz de Rastreabilidade Bidirecional Completa

| Requisito | Suítes e Casos de Teste Vinculados | Evidência Técnica Comprovada | Situação |
|---|---|---|---|
| **RF-01** (Unidades) | `app.test` (CT-03..06), `faults.test` (FA-03) | Cadastro `201`, duplicado `409`, sem token `401`, token fraco `503` e validação UF | **100% Coberto** |
| **RF-02** (Catálogo/Combos) | `products.test` (PR-01..04), `backend.test` (BE-01, BE-03), `frontend.test` (FE-01) | 100 produtos únicos, 21 combos, CRUD com Base64 e 100 imagens locais | **100% Coberto** |
| **RF-03** (Cadastro/LGPD) | `app.test` (CT-07), `faults.test` (FA-02), `frontend.test` (FE-04), `qualidade.test` (QA-06) | Consentimento LGPD obrigatório no front/back, hash bcrypt (12 rounds) e zero vazamento | **100% Coberto** |
| **RF-04** (Sessão/RBAC) | `app.test` (CT-08..11), `backend.test` (BE-02, BE-06), `frontend.test` (FE-02) | Cookies `HttpOnly` assinados HMAC, rate limit `429` e isolamento por perfil | **100% Coberto** |
| **RF-05** (Pedidos Multicanal) | `app.test` (CT-13), `faults.test` (FA-05), `backend.test` (BE-04), `frontend.test` (FE-05), `qualidade.test` (QA-03) | 5 canais (`WEB`, `APP`, `TOTEM`, `BALCAO`, `PICKUP`), recálculo no servidor e baixa automática de estoque | **100% Coberto** |
| **RF-06** (Status do Pedido) | `app.test` (CT-13), `faults.test` (FA-05), `frontend.test` (FE-07) | Transições de status por `loja`/`admin` e bloqueio `403` para clientes | **100% Coberto** |
| **RF-07** (Estoque Auditado) | `gestao.test` (GE-01..02), `faults.test` (FA-06..07), `backend.test` (BE-04) | Entradas, saídas, ajuste zero, transações atômicas e histórico de auditoria | **100% Coberto** |
| **RF-08** (Financeiro) | `gestao.test` (GE-03..04), `faults.test` (FA-06), `backend.test` (BE-05) | Contas a pagar/receber, filtros combinados, datas ISO reais, baixa e estorno | **100% Coberto** |
| **RQ-01 a RQ-08** (ISO 25010) | `qualidade.test` (QA-01..07), `offline.test` (OF-01..06), `faults.test` (FA-07) | Latência p95 < `1500ms`, uptime `100%`, anti-fraude, idempotência e operação 100% offline | **100% Coberto** |
