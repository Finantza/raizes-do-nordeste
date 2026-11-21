# Relatório de Testes da Linha de Frontend - Rede "Raízes do Nordeste"

**Centro Universitário Internacional UNINTER**  
**Projeto Multidisciplinar - Trilha: Qualidade de Software (2026)**  
**Acadêmico / Responsável:** Ronaldo Coutinho | **Docente:** Prof. Me. Rodrigo Nascimento  

---

## 1. Resumo Executivo da Bateria de Testes de Frontend

Este documento registra a verificação completa de todos os arquivos e módulos da linha de frontend da aplicação **"Raízes do Nordeste"** (`public/`). A bateria cobre a validação sintática dos 9 scripts JavaScript, a inspeção estrutural e de acessibilidade das 5 páginas HTML5 e da folha de estilos `public/style.css`, a autonomia 100% offline sem CDNs externos e os testes funcionais automatizados de interface e componentes em `src/frontend.test.js`, `src/products.test.js` e `src/offline.test.js`.

| Indicador de Qualidade de Frontend | Resultado Aferido |
|---|---|
| **Arquivos JavaScript do Frontend Testados** | 9 de 9 aprovados em validação sintática (`node --check`) e funcional |
| **Páginas HTML5 e Folha de Estilos Verificadas** | 5 páginas HTML + 1 folha CSS + logomarca SVG + 100 imagens locais |
| **Suíte Específica de Componentes (`src/frontend.test.js`)** | 8 suítes de frontend executadas - **8 aprovadas (0 falhas)** |
| **Suíte de Catálogo e Imagens (`src/products.test.js`)** | 4 testes unitários executados - **4 aprovados (0 falhas)** |
| **Suíte de Autonomia Offline (`src/offline.test.js`)** | 6 testes de resiliência executados - **6 aprovados (0 falhas)** |
| **Suíte Completa do Projeto (Frontend + Backend)** | **44 testes automatizados no total - 44 aprovados (100% de sucesso)** |
| **Dependências Externas de CDN (Scripts/Fontes/CSS)** | 0 referências externas (operação 100% local e offline) |

---

## 2. Verificação Sintática e Estrutural dos Arquivos do Frontend

| Arquivo Frontend | Responsabilidade Técnica Testada | Status |
|---|---|---|
| `public/config.js` | Definição dinâmica de `window.__APP_CONFIG__.apiBaseUrl` para HTTP e `file://` | **APROVADO** |
| `public/products.js` | Catálogo padrão de 100 itens, 21 combos, imagens locais, fallback, merge e escape HTML | **APROVADO** |
| `public/auth.js` | Cliente HTTP `fetch` com credenciais, sessão `/auth/me`, visibilidade RBAC e logout | **APROVADO** |
| `public/app.js` | Carrossel acessível da vitrine, cálculo de descontos (2 casas decimais) e destaques | **APROVADO** |
| `public/login.js` | Formulário de login, cadastro com validação LGPD e botões de preenchimento rápido | **APROVADO** |
| `public/cliente.js` | Cardápio categorizado, bloqueio de esgotados, controles `[+]` e `[-]` do carrinho e checkout | **APROVADO** |
| `public/admin.js` | Indicadores executivos, resumo regional, inventário rápido e cadastro de produtos | **APROVADO** |
| `public/operacional.js` | Rotina da unidade, checklist operacional, fila de pedidos e atualização de status | **APROVADO** |
| `public/gestao.js` | Navegação por abas, controle de estoque auditado, contas a pagar/receber e catálogo | **APROVADO** |
| `public/index.html` | Vitrine institucional, carrossel de ofertas, atalhos de categorias e chamadas de ação | **APROVADO** |
| `public/login.html` | Interface de login único, cadastro com termo LGPD (Lei nº 13.709/2018) e contas demo | **APROVADO** |
| `public/cliente.html` | Interface de cardápio público, carrinho com 4 modalidades multicanal e histórico | **APROVADO** |
| `public/admin.html` | Painel administrativo restrito (`data-required-role="admin"`) com 4 abas integradas | **APROVADO** |
| `public/operacional.html` | Painel operacional da loja (`data-required-role="loja,admin"`) com 4 abas integradas | **APROVADO** |
| `public/style.css` | Variáveis de cor da paleta nordestina, layout responsivo (`320px-1920px`) e acessibilidade | **APROVADO** |

---

## 3. Detalhamento dos Casos de Teste Automatizados de Frontend

| ID | Suíte | Cenário de Frontend Verificado | Resultado |
|---|---|---|---|
| **FE-01** | `src/frontend.test.js` | Configuração de `apiBaseUrl`, carregamento dos 100 produtos, `escapeRaizesHtml` contra XSS e validação de tamanho/formato de imagem em `prepareRaizesProductImage` | **APROVADO** |
| **FE-02** | `src/frontend.test.js` | Consulta de sessão `/auth/me`, migração automática de contas legadas do `localStorage` e aplicação de visibilidade RBAC nos elementos `[data-admin-only]`, `[data-staff-only]`, `[data-loja-only]` e `[data-cliente-only]` | **APROVADO** |
| **FE-03** | `src/frontend.test.js` | Renderização dos 5 slides do carrossel de ofertas na página inicial, 4 cartões de destaque e alternância de slides pelos botões anterior e próximo | **APROVADO** |
| **FE-04** | `src/frontend.test.js` | Preenchimento automático via botões de demonstração, bloqueio de cadastro quando o termo LGPD é desmarcado, criação de conta e redirecionamento pós-login | **APROVADO** |
| **FE-05** | `src/frontend.test.js` | Renderização das 5 categorias do cardápio, bloqueio de adição de item com estoque zero, incremento/decremento com botões `[+]` e `[-]` no carrinho e mapeamento de canal (`Totem` -> `TOTEM`) no checkout | **APROVADO** |
| **FE-06** | `src/frontend.test.js` | Cálculo de indicadores do painel administrativo (total de produtos, pedidos, faturamento e ticket médio), tabela de inventário e bloqueio de envio com preço vazio (`""`) | **APROVADO** |
| **FE-07** | `src/frontend.test.js` | Renderização da fila de pedidos na tela operacional da loja e carregamento dinâmico das abas de Controle de Estoque, Contas a Pagar/Receber e Catálogo de Produtos em `gestao.js` | **APROVADO** |
| **FE-08** | `src/frontend.test.js` | Inspeção estrutural de acessibilidade (`lang="pt-BR"`, `meta viewport`, `aria-live="polite"`), presença do termo LGPD, opções multicanal e breakpoints responsivos no CSS | **APROVADO** |
| **PR-01** | `src/products.test.js` | Validação dos 100 produtos do cardápio sem IDs ou nomes duplicados e com preços, estoques e descontos dentro dos limites | **APROVADO** |
| **PR-02** | `src/products.test.js` | Verificação dos 21 combos promocionais com lista estruturada de `itensInclusos` e descrições preenchidas | **APROVADO** |
| **PR-03** | `src/products.test.js` | Mesclagem não destrutiva do catálogo (`mergeRaizesProducts`) preservando edições e produtos personalizados | **APROVADO** |
| **PR-04** | `src/products.test.js` | Resolução determinística das 100 imagens locais em `/imagens/` e das fotos de fallback por categoria em `/images/products/` | **APROVADO** |
| **OF-01** | `src/offline.test.js` | Recuperação automática dos 100 produtos padrão no navegador quando a requisição à API falha por falta de conexão | **APROVADO** |
| **OF-02** | `src/offline.test.js` | Ausência total de scripts, folhas de estilo ou `@import` apontando para CDNs externos (`http`/`https`) nas páginas HTML e CSS | **APROVADO** |
| **OF-03** | `src/offline.test.js` | Serviço `HTTP 200` e MIME type correto para todas as 12 rotas estáticas principais do frontend pelo Express | **APROVADO** |
| **OF-04** | `src/offline.test.js` | Existência física no disco de todas as 100 imagens de produtos e fotos de fallback referenciadas pelo frontend | **APROVADO** |
| **OF-05** | `src/offline.test.js` | Paridade matemática exata no cálculo de preços com desconto entre o frontend (`cliente.js` e `app.js`) e o backend (`orders.js`) | **APROVADO** |

---

## 4. Melhorias e Correções Aplicadas na Linha de Frontend

1. **Arredondamento Financeiro na Vitrine (`public/app.js`):** `getDiscountedPrice()` arredonda o preço promocional em duas casas decimais (`Math.round(... * 100) / 100`), mantendo paridade com o carrinho e o servidor.
2. **Bloqueio de Coerção Silenciosa em Formulários (`public/admin.js`, `public/operacional.js`, `public/gestao.js`):** Campos numéricos em branco (`""`) são convertidos para `NaN` antes da validação, impedindo que strings vazias sejam tratadas como `0`.
3. **Usabilidade do Cardápio e Controle de Estoque no Carrinho (`public/cliente.js`):** Ocultação da etiqueta `-0%` quando não há desconto, bloqueio visual e funcional de produtos com `estoque === 0` (**"Esgotado"** / **"Indisponível"**) e adição dos botões `[-]` e `[+]` no carrinho respeitando o limite de estoque disponível.
4. **Mapeamento Multicanal e Atualização Pós-Compra (`public/cliente.js`):** Envio automático do canal (`WEB`, `PICKUP`, `BALCAO`, `TOTEM`) conforme a modalidade selecionada e recarregamento imediato dos saldos de estoque no cardápio após finalizar o pedido.
5. **Sincronização Entre Abas (`public/admin.js`, `public/operacional.js`, `public/gestao.js`):** Atualização conjunta das tabelas de visão geral, catálogo, estoque e financeiro ao cadastrar, alterar foto ou remover produtos.
