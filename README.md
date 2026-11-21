# Raízes do Nordeste

Aplicação web didática para uma rede fictícia de lanchonetes. O projeto reúne uma vitrine, áreas de cliente, administração e operação de loja e uma API Express com autenticação e persistência.

> **Segurança:** contas, sessões, produtos, pedidos e unidades são persistidos no servidor. O carrinho continua local ao navegador. O backend aplica autenticação e autorização; ainda assim, antes de processar dados de pagamento reais, integre um provedor de pagamentos e faça a revisão operacional descrita em [Limitações para produção](#segurança-e-limitações).

## Conteúdo

- [Requisitos e execução](#requisitos-e-execução)
- [Identidade visual e página inicial](#identidade-visual-e-página-inicial)
- [Perfis e funcionalidades](#perfis-e-funcionalidades)
- [Usuários e credenciais de teste](#usuários-e-credenciais-de-teste)
- [Configuração e arquitetura](#configuração-e-arquitetura)
- [Como os dados são armazenados](#como-os-dados-são-armazenados)
- [API de autenticação, produtos e pedidos](#api-de-autenticação-produtos-e-pedidos)
- [API de unidades](#api-de-unidades)
- [Publicação](#publicação)
- [Testes](#testes)
- [Ferramenta de Auditoria e Correção Documental (Python)](#ferramenta-de-auditoria-e-correção-documental-python)
- [Avaliação acadêmica](#avaliação-acadêmica)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Segurança e limitações](#segurança-e-limitações)

## Requisitos e execução

- Node.js 20 ou superior (recomendado)
- npm

Na pasta que contém `package.json`, copie `.env.example` para `.env`, preencha os segredos e inicie o servidor:

No PowerShell:

```powershell
Copy-Item .env.example .env
node -p "require('node:crypto').randomBytes(48).toString('base64url')"
```

Copie o resultado aleatório para `RAIZES_SESSION_SECRET` no `.env`. As contas de teste padrão já vêm pré-configuradas no banco local de desenvolvimento (veja [Usuários e credenciais de teste](#usuários-e-credenciais-de-teste)), ou você pode definir `RAIZES_DEV_ADMIN_*`, `RAIZES_DEV_STORE_*` e `RAIZES_DEV_CLIENT_*` caso queira customizá-las. Não reutilize essas senhas em produção.

```bash
npm ci
npm run dev
```

Abra <http://localhost:3000>. O Express serve a aplicação a partir de `public/`; a página inicial é `public/index.html`. Para iniciar sem o nodemon:

```bash
npm start
```

No Windows, também é possível executar [`iniciar-servidor.bat`](iniciar-servidor.bat) para iniciar o Express e abrir o navegador. O script [`test-offline.bat`](test-offline.bat) roda a suíte completa de testes automatizados, valida a integridade de sintaxe do frontend e dos arquivos estáticos locais e, em seguida, chama o iniciador do servidor (use o parâmetro `--no-server` para apenas rodar a bateria de testes e verificações offline sem abrir o navegador). Para usar a API e as imagens de `src/imagens`, acesse a aplicação pelo endereço servido pelo Express, não abra os HTMLs diretamente no navegador.

O servidor usa a variável de ambiente `PORT`, se definida; caso contrário, usa a porta `3000`. Em desenvolvimento, os dados são guardados em SQLite (`data/raizes.sqlite`); defina `DATABASE_URL` para usar PostgreSQL. Na primeira inicialização, o servidor importa unidades do antigo `data/raizes.json` se o novo banco estiver vazio.

## Identidade visual e página inicial

- A identidade usa uma paleta inspirada na paisagem e na culinária nordestina: areia e barro claro nos fundos, terracota na marca, amarelo-sol nos destaques e verde-cacto nos estados de sucesso.
- A logomarca vetorial própria está em [`public/images/raizes-logo.svg`](public/images/raizes-logo.svg). O mesmo símbolo é usado na navegação das páginas e como favicon.
- A página inicial (`public/index.html`) organiza a chamada principal, os links para categorias, produtos em oferta e acesso à área da loja.
- O carrossel de destaque da página inicial é montado a partir do catálogo: mostra até cinco produtos com desconto, imagem, descrição, preço promocional, indicadores e controles anterior/próximo. Ele avança automaticamente, pausa ao passar o mouse ou navegar por teclado e respeita a preferência do sistema por movimento reduzido.
- O CSS de todas as páginas está centralizado em [`public/style.css`](public/style.css); os tokens de cor e os componentes comuns (botões, navegação, cartões, formulários, métricas e estados) permitem manter uma aparência consistente entre os perfis.

## Perfis e funcionalidades

O fluxo normal começa na página inicial. A navegação leva ao cardápio, ao acesso de conta e às áreas de administração/operação. As três áreas compartilham a tela de login, a exibição da sessão, a navegação e a ação de sair.

- **Visitante:** explora a página inicial e o cardápio; o catálogo é carregado da API.
- **Cliente** ([`public/cliente.html`](public/cliente.html)): mantém o carrinho no navegador, cria pedidos autenticados no servidor e consulta seu histórico.
- **Administrador** ([`public/admin.html`](public/admin.html)): consulta métricas e inventário; pode cadastrar e atualizar produtos.
- **Loja** ([`public/operacional.html`](public/operacional.html)): acompanha pedidos e atualiza seus estados operacionais; também gerencia produtos.
- **Login compartilhado** ([`public/login.html`](public/login.html) e [`public/login.js`](public/login.js)): registra clientes e autentica no servidor.
- **Sessão e perfis** ([`public/auth.js`](public/auth.js)): consulta `/api/auth/me`; o cookie de sessão é `HttpOnly`, `Secure` e `SameSite=Lax`. As decisões de autorização são repetidas no backend.
- **Catálogo** ([`public/products.js`](public/products.js)): mantém os 100 produtos iniciais para exibição offline e carrega o catálogo persistido da API quando disponível.

O cadastro público cria novos perfis de cliente. Contas de administrador, loja e cliente demonstrativo são gerenciadas via banco de dados ou semeadas em desenvolvimento a partir das credenciais padrão e das variáveis `RAIZES_DEV_*`.

## Usuários e credenciais de teste

Para facilitar a exploração e os testes das três áreas da aplicação em ambiente de desenvolvimento, o sistema conta com os seguintes perfis e credenciais pré-configurados:

| Perfil | E-mail / Usuário | Senha | Área de Acesso | Funcionalidades Principais |
|---|---|---|---|---|
| **Administrador** | `admin@raizes.com` | `admin12345678` | [`public/admin.html`](public/admin.html) | Visão executiva completa: métricas de faturamento e ticket médio, catálogo geral, cadastro/exclusão de itens, controle de estoque (entradas, saídas e ajustes de balanço) e módulo financeiro de contas a pagar e receber |
| **Loja (Operacional)** | `loja@raizes.com` | `loja12345678` | [`public/operacional.html`](public/operacional.html) | Painel operacional: fila de pedidos em tempo real, atualização de status de pedidos (*Em preparo*, *Em rota*, *Concluído*, *Cancelado*), gestão de catálogo, controle de estoque e finanças |
| **Cliente** | `cliente@raizes.com` | `cliente12345678` | [`public/cliente.html`](public/cliente.html) | Cardápio visual com filtros, sacola de compras multicanal (*Delivery*, *Retirada*, *Balcão*, *Totem*), cálculo automático de pedidos e histórico de pedidos da conta *(também é possível cadastrar novos clientes com consentimento LGPD)* |

> **Preenchimento Rápido no Login:** Na tela [`public/login.html`](public/login.html), você encontra botões de atalho de demonstração para carregar os dados de **Administrador** (`admin@raizes.com`), **Perfil de Loja** (`loja@raizes.com`) e **Cliente** (`cliente@raizes.com`) com apenas um clique.
>
> **Personalização das credenciais:** Caso deseje utilizar credenciais personalizadas, configure as variáveis `RAIZES_DEV_ADMIN_EMAIL`/`RAIZES_DEV_ADMIN_PASSWORD`, `RAIZES_DEV_STORE_EMAIL`/`RAIZES_DEV_STORE_PASSWORD` e `RAIZES_DEV_CLIENT_EMAIL`/`RAIZES_DEV_CLIENT_PASSWORD` no arquivo `.env` (as senhas devem conter no mínimo 12 caracteres).


## Configuração e arquitetura

O sistema tem uma interface estática em `public/` e um serviço Express em `src/`. O servidor publica os arquivos do frontend, disponibiliza imagens de `src/imagens` na rota `/imagens/` e monta a API sob `/api`. Contas, sessões, catálogo, pedidos e unidades são armazenados no banco; apenas o carrinho e a migração temporária de dados antigos usam `localStorage`.

Configuração do processo Node:

| Variável | Uso | Padrão |
|---|---|---|
| `PORT` | Porta HTTP do servidor Express | `3000` |
| `DATABASE_URL` | Conexão PostgreSQL; quando ausente, usa SQLite | Não definido |
| `RAIZES_DB_PATH` | Caminho do arquivo SQLite (útil em desenvolvimento e testes) | `data/raizes.sqlite` |
| `RAIZES_SESSION_SECRET` | Chave de assinatura de sessões; pelo menos 32 bytes, obrigatória em produção | Aleatória por processo em desenvolvimento |
| `RAIZES_API_ADMIN_TOKEN` | Token Bearer legado para cadastro de unidades; pelo menos 32 bytes | Não definido |
| `RAIZES_DEV_ADMIN_EMAIL` / `RAIZES_DEV_ADMIN_PASSWORD` | Semeia um administrador somente em desenvolvimento; senha de pelo menos 12 caracteres | Não definido |
| `RAIZES_DEV_STORE_EMAIL` / `RAIZES_DEV_STORE_PASSWORD` | Semeia uma conta de loja somente em desenvolvimento; senha de pelo menos 12 caracteres | Não definido |
| `RAIZES_DEV_CLIENT_EMAIL` / `RAIZES_DEV_CLIENT_PASSWORD` | Semeia um cliente somente em desenvolvimento; senha de pelo menos 12 caracteres | Não definido |
| `RAIZES_CORS_ORIGINS` | Origens extras, separadas por vírgula, que podem acessar a API com credenciais | Sem origens extras |

`public/config.js` define a URL-base da API para a origem atual. Para hospedar o frontend separadamente, defina `window.__APP_CONFIG__.apiBaseUrl` antes dele e inclua a origem do frontend em `RAIZES_CORS_ORIGINS`. O GitHub Pages não executa o backend; login, pedidos e gerenciamento requerem uma API Express acessível.

### Imagens do catálogo

O catálogo tenta usar as imagens de produto geradas em `src/imagens`, disponibilizadas localmente na rota `/imagens/`. Se uma imagem não carregar, a interface usa fotos de fallback por categoria armazenadas em `public/images/products/`; fontes e licenças estão em [`public/images/products/SOURCES.md`](public/images/products/SOURCES.md). No GitHub Pages, o workflow copia as imagens geradas para a pasta estática `imagens/`.

Administrador e loja podem anexar JPG, PNG ou WebP de até 8 MB. O navegador redimensiona a imagem para no máximo 640 × 480 pixels, converte para JPEG e a envia ao servidor junto ao produto.

## Como os dados são armazenados

O banco armazena os dados do sistema; o navegador conserva somente o carrinho e os dados legados enquanto a migração estiver pendente:

| Dados | Local | Persistência |
|---|---|---|
| Unidades (`unidades`) | SQLite ou PostgreSQL | Banco persistente |
| Usuários (`users`, hash bcrypt) e sessões (`sessions`) | SQLite ou PostgreSQL | Banco persistente |
| Produtos e inventário (`products`) | SQLite ou PostgreSQL | Banco persistente |
| Pedidos e estado operacional (`orders`) | SQLite ou PostgreSQL | Banco persistente |
| Movimentações de estoque (`estoque_movimentacoes`) | SQLite ou PostgreSQL | Banco persistente |
| Lançamentos financeiros (`financeiro_lancamentos`) | SQLite ou PostgreSQL | Banco persistente |
| Carrinho | `localStorage` do navegador | Por navegador e origem |

Chaves antigas do navegador são usadas somente para migração de contas, produtos e pedidos quando os usuários autenticados acessam as telas. A migração mantém os dados locais se falhar. O carrinho continua disponível em `raizes-storefront-cart`.

O catálogo inicial fica em `public/products.js`; os 100 produtos são importados para o banco na primeira inicialização. O servidor recalcula os valores dos pedidos usando o catálogo persistido e associa cada pedido à conta autenticada.

## API de autenticação, produtos, pedidos, estoque e financeiro

Base: `http://localhost:3000/api`. As rotas abaixo usam cookies de sessão assinados (`HttpOnly`, `Secure`, `SameSite=Lax`) e mantidos no banco. O cadastro público cria sempre `cliente` com validação de consentimento LGPD; o cliente não pode enviar um papel privilegiado. Senhas têm hash `bcryptjs` (12 salt rounds) e nunca são devolvidas pela API.

| Método | Rota | Acesso | Uso |
|---|---|---|---|
| POST | `/auth/register` | Público (limite: 10 req/15 min) | Registrar cliente com consentimento LGPD |
| POST | `/auth/login` | Público (limite: 5 req/15 min por IP) | Autenticar e emitir cookie de sessão assinado |
| POST | `/auth/logout` | Público | Revogar sessão atual e limpar cookie |
| GET | `/auth/me` | Sessão válida | Consultar perfil autenticado no servidor |
| POST | `/auth/migrate-local-users` | Público (limite: 3 req/15 min) | Migrar contas legadas para o perfil `cliente` |
| GET | `/products` | Público | Listar catálogo de produtos |
| POST | `/products` | `admin` ou `loja` | Criar novo produto no catálogo |
| POST | `/products/migrate-local` | `admin` | Migrar/atualizar produto legado no banco |
| PUT, DELETE | `/products/:id` | `admin` ou `loja` | Atualizar ou remover produto existente |
| GET | `/orders` | Sessão válida | Cliente consulta seus pedidos; `admin` e `loja` consultam todos |
| POST | `/orders` | `cliente` | Criar pedido multicanal; preços e totais recalculados pelo servidor |
| POST | `/orders/migrate-local` | `cliente` | Migrar pedidos locais com idempotência por `legacyId` |
| PATCH | `/orders/:id/status` | `admin` ou `loja` | Atualizar estado operacional (`Em preparo`, `Em rota`, `Concluído`, `Cancelado`) |
| GET | `/estoque/resumo` | `admin` ou `loja` | Consultar indicadores consolidados e níveis de estoque |
| GET | `/estoque/movimentacoes` | `admin` ou `loja` | Listar histórico auditado de movimentações de estoque |
| POST | `/estoque/movimentacao` | `admin` ou `loja` | Registrar `entrada`, `saida` ou `ajuste` de estoque |
| GET | `/financeiro` | `admin` ou `loja` | Listar lançamentos de contas a pagar e a receber (com filtros) |
| GET | `/financeiro/resumo` | `admin` ou `loja` | Consultar saldos realizado/projetado e títulos vencidos |
| POST | `/financeiro` | `admin` ou `loja` | Criar lançamento financeiro (`pagar` ou `receber`) |
| PATCH | `/financeiro/:id/status` | `admin` ou `loja` | Dar baixa (`pago`) ou reabrir (`pendente`) lançamento |
| DELETE | `/financeiro/:id` | `admin` ou `loja` | Excluir lançamento financeiro |

Unidades continuam listáveis publicamente. Para criar uma unidade, pode-se usar o token administrativo legado ou uma sessão autenticada com perfil `admin`. A API aplica um limite geral persistente de 300 requisições por IP a cada 15 minutos, além do limite específico de login.

## API de unidades

Base local: `http://localhost:3000/api`.

| Método | Rota | Resposta de sucesso | Descrição |
|---|---|---|---|
| GET | `/health` | `200` | Estado da API e nome da aplicação |
| GET | `/unidades` | `200` | Lista unidades em ordem alfabética pelo nome |
| POST | `/unidades` | `201` | Valida e cadastra uma unidade; exige token ou sessão admin |

### Cadastrar unidade

Configure primeiro um segredo forte de pelo menos 32 bytes na variável de ambiente `RAIZES_API_ADMIN_TOKEN`. Não o coloque no JavaScript do navegador, em arquivos versionados, nem em capturas de tela. Em hospedagem, configure-o no painel de variáveis secretas do serviço. Se estiver ausente ou tiver menos de 32 bytes, o token legado é desabilitado (`503`); administradores autenticados ainda podem cadastrar unidades.

No PowerShell, para iniciar o servidor local com um token aleatório temporário:

```powershell
$env:RAIZES_API_ADMIN_TOKEN = node -p "require('node:crypto').randomBytes(32).toString('base64')"
npm start
```

Envie um objeto JSON com os quatro campos obrigatórios e o cabeçalho `Authorization` contendo o esquema Bearer e o token:

```json
{
  "codigo": "RN-001",
  "nome": "Unidade Central",
  "cidade": "Natal",
  "estado": "RN"
}
```

Exemplo usando PowerShell:

```powershell
$dados = @{
  codigo = "RN-001"
  nome = "Unidade Central"
  cidade = "Natal"
  estado = "RN"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/unidades -Method Post -ContentType "application/json" -Headers @{ Authorization = ("Be" + "arer " + $env:RAIZES_API_ADMIN_TOKEN) } -Body $dados
```

Regras de validação do cadastro:

- Os quatro valores são obrigatórios e devem ser textos.
- O código aceita de 2 a 20 letras, números ou hífens; é normalizado para maiúsculas e não pode se repetir.
- Nome e cidade aceitam até 120 e 100 caracteres, respectivamente.
- O estado deve conter exatamente duas letras; é normalizado para maiúsculas.
- Caracteres de controle e os sinais `<` e `>` são rejeitados.

Respostas de erro relevantes:

| HTTP | Situação |
|---|---|
| `400` | Corpo JSON inválido, campo ausente ou valor fora das regras |
| `403` | Origem não permitida pelo CORS |
| `401` | Token administrativo ausente ou inválido |
| `503` | Cadastro desabilitado porque o token não está configurado corretamente |
| `409` | Já existe uma unidade com o mesmo código |
| `429` | Limite de requisições da API excedido |
| `500` | Falha interna ao processar a requisição |

O CORS permite requisições sem `Origin`, origens locais `localhost`/`127.0.0.1` e origens explicitamente listadas em `RAIZES_CORS_ORIGINS`. O token é uma credencial administrativa compartilhada; prefira a sessão individual de administrador quando possível.

### Exemplo da verificação de saúde

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/health
```

Resposta:

```json
{
  "status": "ok",
  "aplicacao": "Rede Raízes do Nordeste"
}
```

## Publicação

### GitHub Pages

O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) prepara e publica a interface estática após cada envio à branch `main`; também pode ser executado manualmente pela aba **Actions**. Na primeira execução, ele tenta habilitar o GitHub Pages automaticamente. Se as permissões do workflow não permitirem essa alteração, um administrador deve selecionar **Settings → Pages → Build and deployment → Source → GitHub Actions** e executar o workflow novamente.

O artefato do Pages reúne os arquivos de `public/` e copia as imagens de `src/imagens` para `imagens/`. O catálogo inicial permanece visível como fallback, mas login, pedidos, inventário e dados de unidades requerem um backend Express; GitHub Pages não executa Node/Express.

Para este repositório, quando a implantação estiver concluída, o endereço esperado é <https://finantza.github.io/raizes-do-nordeste/>.

### Render

[`render.yaml`](render.yaml) declara um serviço Node e um PostgreSQL para o backend. O Render injeta `DATABASE_URL` e gera `RAIZES_SESSION_SECRET` e `RAIZES_API_ADMIN_TOKEN`; os dados não dependem do disco efêmero do serviço web. Para SQLite fora do Render, mantenha `data/raizes.sqlite` em um disco persistente e faça backups regulares. O plano gratuito do PostgreSQL do Render tem limites/expiração próprios; selecione um plano com retenção adequada para produção.

## Testes

Execute a suíte automatizada:

```bash
npm test
```

Os testes usam `node:test` e Supertest (totalizando **57 testes automatizados** distribuídos em 8 suítes: `app.test.js` [14], `faults.test.js` [7], `gestao.test.js` [5], `offline.test.js` [6], `products.test.js` [4], `frontend.test.js` [8], `backend.test.js` [6] e `qualidade.test.js` [7]) para verificar cabeçalhos/CSP, cadastro com LGPD e login com hash, sessão/cookie/logout, bloqueio de força bruta (HTTP 429), autorização RBAC de rotas, rejeição de payloads malformados/XSS/coerção de tipos, validação de estoque e financeiro, operação multicanal, funcionamento 100% offline, qualidade de software (ISO/IEC 25010) e persistência SQLite após reabrir a conexão. A suíte usa bancos temporários isolados, sem alterar os dados locais.

Roteiro manual complementar:

1. Inicie o servidor e abra <http://localhost:3000>. Você pode usar as credenciais padrão de teste (`admin@raizes.com`, `loja@raizes.com` ou `cliente@raizes.com`) ou definir credenciais personalizadas em `.env` para `RAIZES_DEV_*` (senhas com no mínimo 12 caracteres).
2. Faça login com o cliente de teste (`cliente@raizes.com` / `cliente12345678`) ou registre um novo cliente, confira a criação de pedido e o histórico. Teste também a navegação e permissões dos painéis de Administrador e Loja.
3. Em cada painel, confirme que a sessão aparece e que **Sair** encerra a sessão.
4. Tente abrir diretamente um painel sem sessão ou com perfil incorreto; o navegador deve redirecionar e a API deve responder `401`/`403`.
5. Na página inicial, confira a marca, a paleta, o carrossel, controles e imagens; verifique o layout em tela estreita e com preferência por movimento reduzido.
6. No perfil de cliente, confira as imagens do catálogo, filtre os produtos, adicione um ao carrinho e confirme o preço promocional.
7. Nos perfis de administrador e loja, cadastre um produto com e sem foto e confirme que aparece no inventário e no cardápio; tente enviar marcação HTML no nome e confirme a rejeição.
8. No perfil de loja, altere o estado de um pedido; confirme que o cliente vê a atualização e não consegue atualizar o estado.
9. Com uma unidade de teste, consulte `/api/unidades`; depois tente cadastrá-la novamente e confirme o HTTP `409`.

## Ferramenta de Auditoria e Correção Documental (Python)

O repositório inclui uma aplicação modular em Python (3.10+) para analisar, auditar, verificar a conformidade com o Roteiro Acadêmico da UNINTER (Qualidade de Software — 2026), identificar inconsistências entre relatórios e produzir versões revisadas rastreáveis sem inventar métricas ou resultados.

### Arquitetura e Módulos (`raiz do projeto`)

- [`main.py`](main.py) — Orquestrador CLI e pipeline completo dos 6 módulos.
- [`interface.py`](interface.py) — Interface gráfica em Português Brasileiro compatível com **Streamlit** (`streamlit run interface.py`) e com **Painel Web HTTP Local** integrado (`python interface.py` na porta `8501`).
- [`leitor_documentos.py`](leitor_documentos.py) — **Módulo 1:** Leitura e extração de arquivos `DOCX`, `DOC`, `PDF`, `TXT`, `MD`, `CSV` e `XLSX`, além de inspeção direta da verdade física do código-fonte (`src/*.test.js`, `src/db.js`, `src/auth.js`).
- [`consistencia.py`](consistencia.py) — **Módulo 2:** Auditoria de consistência interdocumental e aplicação rigorosa das 10 Regras de Integridade.
- [`auditoria.py`](auditoria.py) — **Módulo 3:** Matriz de conformidade com o roteiro acadêmico oficial da UNINTER (`ROT-01` a `ROT-12`).
- [`correcao.py`](correcao.py) — **Módulo 4:** Correção documental não destrutiva após criação de backup SHA-256, separando correções automáticas comprovadas de pendências para revisão humana.
- [`gerador_relatorios.py`](gerador_relatorios.py) — **Módulo 5:** Geração do Relatório Consolidado de Auditoria com as 12 seções obrigatórias.
- [`exportacao.py`](exportacao.py) — **Módulo 6:** Exportação automática de relatórios revisados em `DOCX` e `PDF`, relatório consolidado em `DOCX` e `PDF`, planilha de auditoria em `XLSX` (4 abas), registro de alterações em `JSON` e inconsistências em `CSV`.
- [`backup.py`](backup.py) — Gestão de backups imutáveis com manifesto `SHA-256` antes de qualquer alteração.
- [`logs.py`](logs.py) — Logs estruturados e trilha de auditoria persistente.
- [`test_auditoria.py`](test_auditoria.py) — Suíte de testes automatizados (`unittest`) da própria ferramenta de auditoria.

### Instalação e Execução da Ferramenta de Auditoria

1. Instale as dependências no ambiente virtual Python (`.venv`):

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

2. Execute a auditoria completa via linha de comando:

```powershell
.\.venv\Scripts\python.exe main.py --dir docs --output auditoria_output
```

3. Execute a interface gráfica (Streamlit ou Painel Web HTTP Local na porta 8501):

```powershell
# Via Streamlit (se instalado no ambiente):
.\.venv\Scripts\streamlit.exe run interface.py

# Ou diretamente via Python (inicia o Painel Web Local caso Streamlit não esteja instalado):
.\.venv\Scripts\python.exe interface.py
```

4. Execute os testes automatizados da ferramenta de auditoria:

```powershell
.\.venv\Scripts\python.exe -m unittest test_auditoria.py -v
```

## Avaliação acadêmica

O relatório de avaliação com resultados de testes, observações, limitações e melhorias priorizadas está em [`docs/avaliacao-do-sistema.md`](docs/avaliacao-do-sistema.md).

Um roteiro de estudo com etapas e campos para registrar sua própria análise e evidências está em [`docs/guia-passo-a-passo-melhorias-qualidade.md`](docs/guia-passo-a-passo-melhorias-qualidade.md). Ele não substitui a atividade nem apresenta resultados de testes.

## Estrutura do projeto

```text
raizes-do-nordeste/
├── data/
│   ├── raizes.json             # Fonte legada somente para migração inicial
│   └── raizes.sqlite           # Banco local de desenvolvimento (modo WAL)
├── docs/                       # Documentação acadêmica, planos de QA e relatórios
│   ├── PLANO_TESTES.md         # Plano de testes, cenários e matriz de rastreabilidade
│   ├── REQUISITOS.md           # Mapeamento de requisitos funcionais e não funcionais
│   ├── USO_DE_IA.md            # Registro de transparência sobre uso de IA
│   ├── avaliacao-do-sistema.md # Diagnóstico inicial e registro histórico de evolução
│   ├── guia-passo-a-passo-melhorias-qualidade.md
│   ├── relatorio-de-desenvolvimento.md   # Relatório técnico completo de desenvolvimento e QA
│   ├── relatorio-de-desenvolvimento.docx # Versão ABNT em Word (.docx / .doc)
│   └── relatorio-de-revisao-do-sistema.md
├── public/                     # Arquivos servidos localmente pelo Express (zero CDNs)
│   ├── index.html              # Página inicial
│   ├── login.html              # Login compartilhado e cadastro com termo LGPD
│   ├── login.js                # Lógica de login, cadastro e atalhos de demonstração
│   ├── auth.js                 # Sessão, controle de perfis e redirecionamento
│   ├── cliente.html            # Interface de cardápio e checkout multicanal
│   ├── cliente.js              # Cardápio, carrinho local e pedidos
│   ├── products.js             # Catálogo inicial compartilhado de 100 produtos + fallback offline
│   ├── admin.html              # Painel executivo e abas de gestão da rede
│   ├── admin.js                # Métricas administrativas e inventário rápido
│   ├── operacional.html        # Painel operacional da franquia/loja
│   ├── operacional.js          # Fila de pedidos, rotina e checklists da loja
│   ├── gestao.js               # Módulos compartilhados: Estoque, Financeiro e Catálogo
│   ├── app.js                  # Carrossel acessível e destaques da página inicial
│   ├── config.js               # Configuração de endereço da API
│   ├── images/
│   │   ├── raizes-logo.svg     # Logomarca vetorial e favicon
│   │   └── products/           # Fotos locais de fallback por categoria e licenças
│   └── style.css               # Design system e componentes responsivos
├── scripts/
│   └── build_full_report.py    # Gerador automatizado dos relatórios .docx/.doc/.md
├── src/
│   ├── imagens/                # 100 imagens de produtos regionais servidas em /imagens/
│   ├── routes/
│   │   ├── auth.js             # Registro (LGPD), login, sessão e migração de contas
│   │   ├── estoque.js          # Resumo, histórico e movimentações de estoque
│   │   ├── financeiro.js       # Contas a pagar/receber, resumo, baixa e exclusão
│   │   ├── orders.js           # Pedidos multicanal, cálculo no servidor e status
│   │   ├── products.js         # Catálogo CRUD e validação estrita de produtos
│   │   └── unidades.js         # Rotas e validações de unidades franqueadas
│   ├── app.js                  # Middleware Helmet/CSP, CORS, Rate Limiters e rotas Express
│   ├── auth.js                 # Cookies HMAC assinados e middlewares requireAuth/requireRole
│   ├── db.js                   # Camada de persistência híbrida (SQLite WAL e PostgreSQL)
│   ├── app.test.js             # Testes de integração da API, autenticação e segurança (14 testes)
│   ├── gestao.test.js          # Testes de controle de estoque, financeiro e RBAC (5 testes)
│   ├── offline.test.js         # Testes de autonomia 100% offline e assets locais (6 testes)
│   ├── products.test.js        # Testes unitários de integridade do catálogo e combos (4 testes)
│   ├── faults.test.js          # Testes negativos, casos de borda, falhas e coerção (6 testes)
│   └── server.js               # Inicialização HTTP
├── package.json
├── render.yaml                 # Serviço web e PostgreSQL no Render
├── .env.example                # Modelo local de configuração (sem segredos)
├── iniciar-servidor.bat        # Inicializador rápido do servidor para Windows
├── test-offline.bat            # Verificador completo de testes e integridade offline
└── .github/workflows/pages.yml # Publicação da interface no GitHub Pages
```

O servidor Express publica `public/`. A pasta `docs/` contém outra cópia de páginas do protótipo e não é a pasta servida pelo servidor atual.

## Segurança e limitações

- Configure `RAIZES_SESSION_SECRET` forte e persistente em produção; sem isso, as sessões ficam inválidas após reinício. O servidor recusa inicialização de produção quando o segredo está ausente/fraco.
- O cadastro público só pode criar clientes. Provisionar a primeira conta `admin`/`loja` de produção ainda exige um procedimento operacional seguro; não habilite variáveis `RAIZES_DEV_*` em produção.
- Configure HTTPS no proxy e origens CORS explícitas quando a interface estiver em outro domínio. O cookie é sempre marcado `Secure`.
- O esquema suporta contas, catálogo, pedidos e unidades, mas não integra pagamento, estoque transacional/concorrente, emissão fiscal nem isolamento multiunidade.
- As fotos do produto são aceitas em JPEG base64 limitado no corpo JSON; para catálogo grande, substitua por armazenamento de objetos com URL assinada e limites de upload.
- O plano gratuito de banco hospedado pode expirar ou ter limites de backup; escolha armazenamento gerenciado com retenção e monitoração adequadas para dados reais.
- O token administrativo de unidades permanece por compatibilidade; prefira autenticação individual, guarde-o como segredo e implemente rotação se terceiros ainda dependerem dele.

Este projeto continua sendo didático. Antes de uso comercial, realize revisão de segurança, provisionamento formal de perfis, backups/restauração testados, monitoramento, política de retenção e integração de pagamentos.
