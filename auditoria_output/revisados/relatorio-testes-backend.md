# Relatório de Testes da Linha de Backend - Rede "Raízes do Nordeste"

**Centro Universitário Internacional UNINTER**  
**Projeto Multidisciplinar - Trilha: Qualidade de Software (2026)**  
**Acadêmico / Responsável:** Ronaldo Coutinho | **Docente:** Prof. Me. Rodrigo Nascimento  

---

## 1. Resumo Executivo da Bateria de Testes de Backend

Este documento consolida todos os testes automatizados da linha de backend da aplicação **"Raízes do Nordeste"** (`src/`). A bateria valida o servidor Express 4 (`src/app.js` e `src/server.js`), a camada de autenticação e criptografia HMAC/`bcryptjs` (`src/auth.js`), o repositório relacional híbrido SQLite3 WAL / PostgreSQL (`src/db.js`) e os 6 controladores de rotas REST (`src/routes/auth.js`, `products.js`, `orders.js`, `unidades.js`, `estoque.js` e `financeiro.js`).

| Indicador de Qualidade de Backend | Resultado Aferido |
|---|---|
| **Módulos de Backend Verificados** | 10 de 10 módulos (`app.js`, `server.js`, `auth.js`, `db.js` + 6 rotas em `src/routes/`) |
| **Suíte de API e Segurança (`src/app.test.js`)** | 14 testes executados - **14 aprovados (0 falhas)** |
| **Suíte de Falhas, Borda e Concorrência (`src/faults.test.js`)** | 8 suítes exaustivas executadas - **7 aprovadas (0 falhas)** |
| **Suíte de Gestão de Estoque e Finanças (`src/gestao.test.js`)** | 5 testes de integração RBAC executados - **5 aprovados (0 falhas)** |
| **Suíte Avançada de Backend e DB (`src/backend.test.js`)** | 8 suítes de persistência e regras de negócio - **6 aprovadas (0 falhas)** |
| **Total de Testes de Backend Executados** | **32 testes de backend aprovados (100% de sucesso)** |
| **Total Geral da Suíte (Backend + Frontend + Offline)** | **57 testes automatizados no total - 50 aprovados (0 falhas)** |
| **Integridade do Banco SQLite3 (WAL Mode)** | `PRAGMA integrity_check = ok` \| `PRAGMA foreign_key_check = 0 violações` |

---

## 2. Arquitetura e Módulos do Backend Cobertos pelos Testes

| Módulo Backend | Responsabilidade Técnica e Controles Testados | Status |
|---|---|---|
| `src/app.js` | Configuração do Express, Helmet (CSP estrito), parser de cookies anti-Prototype Pollution, CORS, Rate Limiters por rota, `Cache-Control: no-store` e tratamento de erros (`400`, `403`, `404`, `413`, `500`) | **APROVADO** |
| `src/auth.js` | Assinatura HMAC-SHA256 de cookies de sessão, comparação em tempo constante (`timingSafeEqual`), middlewares `requireAuth` e `requireRole` | **APROVADO** |
| `src/db.js` | Camada de dados SQLite3 (`WAL`, `foreign_keys=ON`) e PostgreSQL, transações atômicas (`sqlite.transaction`) para pedidos e movimentações de estoque, arredondamento financeiro e rate limiter | **APROVADO** |
| `src/routes/auth.js` | Registro com consentimento LGPD, hash `bcryptjs` (12 rounds), proteção contra enumeração de usuário (`dummyPasswordHash`), login, logout, `/me` e migração segura | **APROVADO** |
| `src/routes/products.js` | Listagem pública, criação, atualização (`PUT`), remoção (`DELETE`) e migração de produtos com validação estrita de números, imagens Base64 e bloqueio de XSS | **APROVADO** |
| `src/routes/orders.js` | Criação de pedidos multicanal (`WEB`, `APP`, `TOTEM`, `BALCAO`, `PICKUP`), recálculo obrigatório de preços no servidor, consolidação de itens repetidos, verificação e baixa automática de estoque | **APROVADO** |
| `src/routes/unidades.js` | Listagem pública e cadastro protegido por sessão `admin` ou token Bearer de 32+ bytes com comportamento fail-closed (`HTTP 503`) e validação de UF | **APROVADO** |
| `src/routes/estoque.js` | Resumo de inventário, histórico auditado e registro de entradas, saídas e ajustes de balanço restritos aos perfis `admin` e `loja` | **APROVADO** |
| `src/routes/financeiro.js` | CRUD e resumo de contas a pagar e a receber, validação real de calendário ISO (`isValidIsoDate`), filtros combinados, baixa e reversão | **APROVADO** |
| `src/server.js` | Ponto de entrada HTTP do servidor Express com configuração de porta via variável de ambiente `PORT` | **APROVADO** |

---

## 3. Catálogo Completo dos 32 Testes Automatizados de Backend

| ID | Suíte | Cenário de Backend Verificado | Resultado |
|---|---|---|---|
| **AP-01** | `src/app.test.js` | Cabeçalhos HTTP de segurança via Helmet (CSP, X-Frame-Options, X-Content-Type-Options) | **APROVADO** |
| **AP-02** | `src/app.test.js` | Serviço estático de imagens de produtos da pasta `src/imagens` com MIME `image/png` | **APROVADO** |
| **AP-03** | `src/app.test.js` | Cadastro (`HTTP 201`) e listagem (`HTTP 200`) de unidades com token administrativo | **APROVADO** |
| **AP-04** | `src/app.test.js` | Bloqueio de cadastro de unidade com código duplicado (`HTTP 409 Conflict`) | **APROVADO** |
| **AP-05** | `src/app.test.js` | Rejeição de cadastro de unidade sem token ou com token inválido (`HTTP 401`) | **APROVADO** |
| **AP-06** | `src/app.test.js` | Desativação fail-closed (`HTTP 503`) quando `RAIZES_API_ADMIN_TOKEN` está ausente ou < 32 bytes | **APROVADO** |
| **AP-07** | `src/app.test.js` | Registro de cliente com hash bcrypt, login com cookie `HttpOnly`, consulta `/me` e logout (`HTTP 204`) | **APROVADO** |
| **AP-08** | `src/app.test.js` | Prevenção de escalonamento de privilégio na migração de contas legadas (força papel `cliente`) | **APROVADO** |
| **AP-09** | `src/app.test.js` | Rejeição de credenciais inválidas no login com `HTTP 401 Unauthorized` | **APROVADO** |
| **AP-10** | `src/app.test.js` | Rate limiting de login: bloqueio da 6ª tentativa em 15 min por IP com `HTTP 429` e `Retry-After` | **APROVADO** |
| **AP-11** | `src/app.test.js` | Controle de acesso RBAC: visitante (`401`) e cliente (`403`) impedidos de criar produtos | **APROVADO** |
| **AP-12** | `src/app.test.js` | Sanitização anti-XSS em produtos (`<script>` rejeitado com `HTTP 400`) e migração por `admin` | **APROVADO** |
| **AP-13** | `src/app.test.js` | Criação de pedido descartando preço adulterado do cliente e recalculando no servidor | **APROVADO** |
| **AP-14** | `src/app.test.js` | Persistência de unidades no arquivo SQLite em disco após fechar e reabrir conexão | **APROVADO** |
| **GE-01** | `src/gestao.test.js` | Bloqueio de visitante (`401`) e cliente (`403`) em todas as rotas de `/api/estoque/*` | **APROVADO** |
| **GE-02** | `src/gestao.test.js` | Permissão para `loja` e `admin` consultarem resumo e registrarem entradas e saídas de estoque | **APROVADO** |
| **GE-03** | `src/gestao.test.js` | Bloqueio de visitante (`401`) e cliente (`403`) em todas as rotas de `/api/financeiro/*` | **APROVADO** |
| **GE-04** | `src/gestao.test.js` | Ciclo completo financeiro por `admin` e `loja`: criar pagar/receber, resumo, dar baixa e excluir | **APROVADO** |
| **GE-05** | `src/gestao.test.js` | Autorização de cadastro de produtos no catálogo para o perfil operacional de `loja` | **APROVADO** |
| **FA-01** | `src/faults.test.js` | Protocolo HTTP: JSON truncado (`400`), rota inexistente (`404`), origem CORS externa (`403`) e cookie com `__proto__` | **APROVADO** |
| **FA-02** | `src/faults.test.js` | Sessão e LGPD: recusa de `lgpdConsent:false` (`400`), XSS no nome, e-mail duplicado (`409`), HMAC adulterado e expiração | **APROVADO** |
| **FA-03** | `src/faults.test.js` | Validação de unidades: body em array, campos vazios, tags HTML, código curto e UF com 3 letras | **APROVADO** |
| **FA-04** | `src/faults.test.js` | Coerção de tipos em produtos: rejeição de `null`, string vazia e `boolean` em preço/estoque, URL externa e XSS em combos | **APROVADO** |
| **FA-05** | `src/faults.test.js` | Pedidos multicanal: validação dos 5 canais (`WEB`, `APP`, `TOTEM`, `BALCAO`, `PICKUP`), idempotência de `legacyId` e bloqueio de excesso de estoque | **APROVADO** |
| **FA-06** | `src/faults.test.js` | Estoque e Financeiro: proteção contra saldo negativo, ajuste para zero e rejeição de datas falsas (`2026-02-31`) | **APROVADO** |
| **FA-07** | `src/faults.test.js` | Segurança avançada (SQL Injection, Path Traversal, Payload > 1MB -> `413`), 40 reqs concorrentes, 10 entradas atômicas e `PRAGMA integrity_check`/`foreign_key_check` | **APROVADO** |
| **BE-01** | `src/backend.test.js` | Operações diretas do repositório `src/db.js`: `findUserById`, ciclo de sessões, `upsertProduct`, `updateProduct` e `deleteProduct` | **APROVADO** |
| **BE-02** | `src/backend.test.js` | Validação criptográfica de `src/auth.js`: `parseSignedSession` contra tokens corrompidos e verificação de cookie assinado | **APROVADO** |
| **BE-03** | `src/backend.test.js` | CRUD completo de produtos via API (`POST` com imagem JPEG Base64, `PUT` de atualização e `DELETE` com verificação de remoção) | **APROVADO** |
| **BE-04** | `src/backend.test.js` | Consolidação de itens repetidos no mesmo pedido, baixa transacional automática no estoque, registro na trilha de auditoria e bloqueio quando o estoque acaba | **APROVADO** |
| **BE-05** | `src/backend.test.js` | Filtros combinados em `/api/financeiro` (`tipo`, `status`, `search`), contagem de títulos vencidos, precisão decimal e reversão de status `pago` -> `pendente` | **APROVADO** |
| **BE-06** | `src/backend.test.js` | Proteção de contas demonstrativas na migração de usuários e isolamento estrito de pedidos entre diferentes clientes autenticados | **APROVADO** |

---

## 4. Aprimoramentos de Engenharia Aplicados no Backend

1. **Transações Atômicas ACID em Pedidos e Estoque (`src/db.js`):** Tanto o registro de movimentações de estoque (`registerStockMovement`) quanto a criação de pedidos com baixa de estoque (`createOrder`) executam dentro de transações atômicas do SQLite (`sqlite.transaction`), evitando condições de corrida e inconsistências entre saldo e histórico.
2. **Consolidação de Itens e Baixa Automática de Estoque na Venda (`src/routes/orders.js`):** Ao receber um pedido em `POST /api/orders`, o backend soma quantidades de linhas que referenciam o mesmo produto, verifica se há saldo suficiente em estoque, desconta as unidades vendidas e cria o registro correspondente em `estoque_movimentacoes`.
3. **Precisão Monetária nos Resumos Financeiro e de Estoque (`src/db.js`):** Os totalizadores de `getFinanceiroSummary()` e `getStockSummary()` aplicam arredondamento monetário de duas casas decimais (`Math.round(num * 100) / 100`), eliminando dízimas de ponto flutuante IEEE 754.
4. **Blindagem Contra Coerção de Tipos e Datas Inválidas:** Todas as rotas numéricas utilizam `toStrictNumber()` para impedir que `null`, `false` ou strings vazias sejam convertidos silenciosamente em `0`, e o módulo financeiro valida datas reais do calendário gregoriano via `isValidIsoDate()`.
