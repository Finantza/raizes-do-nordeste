# Plano de Testes e Matriz de Rastreabilidade — Rede "Raízes do Nordeste"

**Projeto Multidisciplinar — Trilha: Qualidade de Software (UNINTER 2026)**  
**Docente:** Prof. Me. Rodrigo Nascimento | **Responsável:** Ronaldo Coutinho

---

## 1. Estratégia e Tipos de Testes Implementados

1. **Testes Unitários (`src/products.test.js`):** Verificação isolada do catálogo de 100 produtos, unicidade de IDs e nomes, estrutura dos 21 combos promocionais, cálculo matemático de descontos, mesclagem de catálogo e função de escape HTML (`escapeRaizesHtml`).
2. **Testes de Integração de API e Segurança (`src/app.test.js`):** Validação da integração Express + SQLite (modo WAL), cabeçalhos Helmet/CSP, autenticação por sessão assinada, hashing `bcryptjs`, controle de acesso por perfil (RBAC), rate limiting contra força bruta (`HTTP 429`) e persistência em disco após reabertura da conexão.
3. **Testes dos Módulos de Gestão Operacional e Financeira (`src/gestao.test.js`):** Verificação de autorização e regras de negócio para Controle de Estoque (`/api/estoque/*`), Contas a Pagar e Receber (`/api/financeiro/*`) e gerenciamento de produtos por `admin` e `loja`.
4. **Testes de Resiliência e Autonomia Offline (`src/offline.test.js`):** Comprovação de que 100% das páginas HTML, folhas de estilo, scripts JS, banco SQLite e 100 imagens de produtos (e seus fallbacks) funcionam localmente sem dependência de CDNs ou conexão externa.
5. **Testes de Falhas, Casos de Borda e Abuso (`src/faults.test.js`):** Testes negativos exaustivos cobrindo JSON malformado (`HTTP 400`), rotas inexistentes (`HTTP 404`), bloqueio CORS (`HTTP 403`), cookies corrompidos/Prototype Pollution, sessões expiradas ou adulteradas, recusa LGPD, coerção de tipos (`null`, `boolean`, `""`), datas inválidas no calendário (`2026-02-31`), proteção contra estoque negativo, multicanalidade (`WEB`, `APP`, `TOTEM`, `BALCAO`, `PICKUP`) e idempotência na migração de pedidos.

---

## 2. Catálogo Completo dos 35 Casos de Teste Automatizados (`npm test`)

| ID | Suíte | Caso de Teste Automatizado | Tipo | Resultado Esperado | Status Real |
|---|---|---|---|---|---|
| **CT-01** | `src/app.test.js` | `deve incluir headers básicos de segurança` | Segurança | `HTTP 200` com `CSP`, `X-Frame-Options: SAMEORIGIN` e `nosniff` | **Aprovado** |
| **CT-02** | `src/app.test.js` | `deve servir imagens de produto da pasta src/imagens` | Integração | `HTTP 200` e `Content-Type: image/png` | **Aprovado** |
| **CT-03** | `src/app.test.js` | `deve cadastrar e listar unidades com token administrativo` | Funcional | `HTTP 201` no cadastro e `HTTP 200` na listagem | **Aprovado** |
| **CT-04** | `src/app.test.js` | `deve impedir cadastro duplicado` | Negativo | `HTTP 409 Conflict` para código de unidade repetido | **Aprovado** |
| **CT-05** | `src/app.test.js` | `deve recusar cadastro sem token ou com token inválido` | Segurança | `HTTP 401 Unauthorized` | **Aprovado** |
| **CT-06** | `src/app.test.js` | `deve desabilitar o cadastro se o token administrativo não estiver configurado` | Segurança | Fail-closed com `HTTP 503 Service Unavailable` | **Aprovado** |
| **CT-07** | `src/app.test.js` | `deve registrar cliente com hash, autenticar, consultar sessão e sair` | Sistema | `HTTP 201`, hash `$2b$`, cookie `HttpOnly/Secure/SameSite=Lax` e logout `204` | **Aprovado** |
| **CT-08** | `src/app.test.js` | `deve migrar contas antigas sem aceitar papéis privilegiados do navegador` | Segurança | Contas migradas recebem obrigatoriamente papel `cliente` | **Aprovado** |
| **CT-09** | `src/app.test.js` | `deve rejeitar credenciais inválidas` | Negativo | `HTTP 401` ao informar senha incorreta | **Aprovado** |
| **CT-10** | `src/app.test.js` | `deve limitar o login a cinco tentativas em quinze minutos por IP` | Segurança | 6ª tentativa bloqueada com `HTTP 429` e header `Retry-After` | **Aprovado** |
| **CT-11** | `src/app.test.js` | `deve exigir sessão e papel autorizado para criar produtos` | Segurança | Visitante recebe `401`; Cliente recebe `403` | **Aprovado** |
| **CT-12** | `src/app.test.js` | `deve validar dados de produto contra marcação executável` | Segurança | Rejeita `<script>` com `HTTP 400` e aceita produto válido com `201` | **Aprovado** |
| **CT-13** | `src/app.test.js` | `deve salvar pedidos calculando preço no servidor e autorizar a operação por papel` | Sistema | Ignora `total: 0` do cliente, recalcula `R$ 116,88` e valida RBAC no status | **Aprovado** |
| **CT-14** | `src/app.test.js` | `deve conservar unidades no arquivo SQLite após reabrir a conexão` | Confiabilidade | Registro permanece gravado no SQLite após `closeDatabase()` | **Aprovado** |
| **CT-15** | `src/gestao.test.js` | `Controle de Estoque: deve bloquear acesso não autenticado e perfil cliente` | Segurança | Visitante recebe `401`; Cliente recebe `403` em `/api/estoque/*` | **Aprovado** |
| **CT-16** | `src/gestao.test.js` | `Controle de Estoque: permite acesso a loja e admin para consultar e registrar movimentações` | Funcional | Entrada (`+15`) e saída (`-5`) atualizam saldo e histórico auditado | **Aprovado** |
| **CT-17** | `src/gestao.test.js` | `Contas a Pagar e Receber: deve bloquear acesso não autenticado e perfil cliente` | Segurança | Visitante recebe `401`; Cliente recebe `403` em `/api/financeiro/*` | **Aprovado** |
| **CT-18** | `src/gestao.test.js` | `Contas a Pagar e Receber: permite que admin e loja cadastrem, consultem, dêem baixa e excluam lançamentos` | Sistema | Cria títulos a pagar/receber, valida saldo projetado, dá baixa e exclui (`204`) | **Aprovado** |
| **CT-19** | `src/gestao.test.js` | `Cadastro de Produtos: restrito a admin e loja` | Segurança | Cliente bloqueado (`403`); Loja autorizada (`201`) | **Aprovado** |
| **CT-20** | `src/offline.test.js` | `o catálogo em public/products.js recupera dados padrão offline caso a API falhe` | Resiliência | Fallback mantém os 100 produtos disponíveis sem rede | **Aprovado** |
| **CT-21** | `src/offline.test.js` | `todas as páginas HTML e scripts do frontend são 100% locais sem CDNs externos` | Resiliência | 0 tags `<script>`/`<link>`/`@import` apontando para `http://` ou `https://` | **Aprovado** |
| **CT-22** | `src/offline.test.js` | `todos os recursos estáticos essenciais existem no disco e são servidos offline pelo Express` | Integração | Todas as 12 rotas estáticas retornam `HTTP 200` e MIME correto | **Aprovado** |
| **CT-23** | `src/offline.test.js` | `o banco de dados local SQLite funciona isolado sem conexão com a internet` | Confiabilidade | Consultas locais de catálogo, unidades, estoque e finanças operam offline | **Aprovado** |
| **CT-24** | `src/offline.test.js` | `todas as 100 imagens de catálogo e fallbacks por categoria existem localmente no sistema de arquivos` | Integridade | 100% das imagens em `src/imagens/` e `public/images/products/` existem | **Aprovado** |
| **CT-25** | `src/offline.test.js` | `o cálculo de preços com ofertas funciona offline e é idêntico à regra do backend` | Unitário | Paridade matemática exata entre frontend offline e backend | **Aprovado** |
| **CT-26** | `src/products.test.js` | `o cardápio contém 100 produtos válidos e sem nomes repetidos` | Unitário | 100 produtos com IDs e nomes únicos e preços/estoques íntegros | **Aprovado** |
| **CT-27** | `src/products.test.js` | `todos os combos informam seus itens inclusos` | Unitário | 21 combos possuem array não vazio `itensInclusos` | **Aprovado** |
| **CT-28** | `src/products.test.js` | `a migração inclui o catálogo novo sem perder alterações ou produtos personalizados` | Unitário | `mergeRaizesProducts` preserva edições e itens customizados | **Aprovado** |
| **CT-29** | `src/products.test.js` | `cada produto resolve para uma imagem gerada ou foto local de fallback` | Unitário | Resolução determinística de fotos e teste de `escapeRaizesHtml` | **Aprovado** |
| **CT-30** | `src/faults.test.js` | `Falhas de Protocolo e Segurança HTTP: JSON malformado (400), Rota inexistente (404), Origem CORS inválida (403) e Cookie corrompido` | Negativo / Segurança | Rejeita JSON truncado (`400`), rota inexistente (`404`), CORS externo (`403`) e `__proto__` em cookie | **Aprovado** |
| **CT-31** | `src/faults.test.js` | `Falhas de Sessão e Autenticação: assinatura adulterada, sessão expirada, recusa LGPD e XSS no cadastro` | Negativo / LGPD | Rejeita `lgpdConsent: false` (`400`), XSS no nome (`400`), e-mail duplicado (`409`), cookie forjado (`401`) e sessão expirada | **Aprovado** |
| **CT-32** | `src/faults.test.js` | `Falhas de Validação em Unidades: tipos inválidos, códigos fora do padrão, UF inválida e XSS` | Negativo | Rejeita body em array, campos vazios, `< >`, código de 1 caractere e UF de 3 letras (`HTTP 400`) | **Aprovado** |
| **CT-33** | `src/faults.test.js` | `Falhas de Coerção de Tipos e Limites em Produtos: null, boolean, strings vazias, imagens maliciosas e itensInclusos XSS` | Negativo / Borda | Bloqueia `preco: null`, `estoque: ""`, `boolean`, imagem externa, XSS em `itensInclusos` (`400`) e ID inexistente (`404`) | **Aprovado** |
| **CT-34** | `src/faults.test.js` | `Falhas em Pedidos Multicanal: carrinho vazio, produto inexistente, quantidade inválida, XSS em endereço e idempotência de migração` | Sistema / Multicanal | Valida canais `WEB`, `APP`, `TOTEM`, `BALCAO`, `PICKUP`, idempotência de `legacyId` e rejeita itens/status inválidos | **Aprovado** |
| **CT-35** | `src/faults.test.js` | `Falhas de Estoque e Financeiro: estoque nunca fica negativo, ajuste para zero, datas inválidas (2026-02-31) e limites` | Negativo / Borda | Trava saída excessiva em `0`, permite ajuste `0`, bloqueia entrada `0`/`null`, rejeita `2026-02-31` (`400`) e IDs ausentes (`404`) | **Aprovado** |

---

## 3. Matriz de Rastreabilidade (Requisito ↔ Casos de Teste ↔ Evidência)

| Requisito | Casos de Teste Associados | Onde e Como Foi Validado (Evidência) | Status |
|---|---|---|---|
| **RF-01** (Unidades) | CT-03, CT-04, CT-05, CT-06, CT-32 | `src/app.test.js` e `src/faults.test.js` via requisições Supertest contra `/api/unidades` | **100% Aprovado** |
| **RF-02** (Catálogo e Combos) | CT-02, CT-11, CT-12, CT-19, CT-24, CT-26, CT-27, CT-28, CT-29, CT-33 | `src/products.test.js`, `src/app.test.js`, `src/gestao.test.js` e `src/faults.test.js` | **100% Aprovado** |
| **RF-03** (Cadastro e LGPD) | CT-07, CT-31 | `src/app.test.js` e `src/faults.test.js` validando hash bcrypt, bloqueio de `lgpdConsent: false` e duplicidade `409` | **100% Aprovado** |
| **RF-04** (Sessão e RBAC) | CT-07, CT-08, CT-09, CT-11, CT-15, CT-17, CT-31 | `src/app.test.js`, `src/gestao.test.js` e `src/faults.test.js` testando assinatura HMAC, expiração e perfis | **100% Aprovado** |
| **RF-05** (Pedidos Multicanal) | CT-13, CT-25, CT-34 | `src/app.test.js`, `src/offline.test.js` e `src/faults.test.js` validando recálculo no servidor e 5 canais | **100% Aprovado** |
| **RF-06** (Status Operacional) | CT-13, CT-34 | `src/app.test.js` e `src/faults.test.js` validando transição de status por `loja`/`admin` e bloqueio de `cliente` | **100% Aprovado** |
| **RF-07** (Controle de Estoque) | CT-15, CT-16, CT-35 | `src/gestao.test.js` e `src/faults.test.js` validando entradas, saídas, ajuste zero e proteção contra saldo negativo | **100% Aprovado** |
| **RF-08** (Financeiro) | CT-17, CT-18, CT-35 | `src/gestao.test.js` e `src/faults.test.js` validando criação, baixa, exclusão e bloqueio de datas falsas (`2026-02-31`) | **100% Aprovado** |
| **RNF-01 a RNF-08** (Qualidade ISO 25010) | CT-01 a CT-35 | Execução integral de `npm test` e `test-offline.bat --no-server` | **100% Aprovado** |

---

## 4. Registro Consolidado de Execução
- **Data da Última Execução:** 13/11/2026
- **Ambiente:** Windows / Node.js Test Runner (`node --test`) / SQLite3 (WAL Mode) / Express 4 / Supertest
- **Total de Suítes:** 5 (`app.test.js`, `gestao.test.js`, `offline.test.js`, `products.test.js`, `faults.test.js`)
- **Total de Casos de Teste Executados:** 35 executados / **35 aprovados (100%)** / 0 falhas
- **Verificação Sintática de Frontend (`node --check`):** 9/9 arquivos aprovados (`config.js`, `products.js`, `auth.js`, `app.js`, `gestao.js`, `admin.js`, `operacional.js`, `cliente.js`, `login.js`).
