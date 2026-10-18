# Raízes do Nordeste

Aplicação web didática para uma rede fictícia de lanchonetes. O projeto reúne uma vitrine, áreas de cliente, administração e operação de loja e uma API Express com autenticação e persistência.

> **Segurança:** contas, sessões, produtos, pedidos e unidades são persistidos no servidor. O carrinho continua local ao navegador. O backend aplica autenticação e autorização; ainda assim, antes de processar dados de pagamento reais, integre um provedor de pagamentos e faça a revisão operacional descrita em [Limitações para produção](#segurança-e-limitações).

## Conteúdo

- [Requisitos e execução](#requisitos-e-execução)
- [Identidade visual e página inicial](#identidade-visual-e-página-inicial)
- [Perfis e funcionalidades](#perfis-e-funcionalidades)
- [Configuração e arquitetura](#configuração-e-arquitetura)
- [Como os dados são armazenados](#como-os-dados-são-armazenados)
- [API de autenticação, produtos e pedidos](#api-de-autenticação-produtos-e-pedidos)
- [API de unidades](#api-de-unidades)
- [Publicação](#publicação)
- [Testes](#testes)
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

Copie o resultado aleatório para `RAIZES_SESSION_SECRET` no `.env`. Defina também `RAIZES_DEV_ADMIN_EMAIL`/`RAIZES_DEV_ADMIN_PASSWORD` e `RAIZES_DEV_STORE_EMAIL`/`RAIZES_DEV_STORE_PASSWORD` para criar contas de teste locais. Não reutilize essas senhas em produção.

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

O cadastro público cria somente perfis de cliente. Contas administrativas e de loja são semeadas a partir das variáveis `RAIZES_DEV_ADMIN_*` e `RAIZES_DEV_STORE_*`, somente fora de produção. Nenhuma senha demonstrativa é embutida no frontend ou no repositório.

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
| `RAIZES_CORS_ORIGINS` | Origens extras, separadas por vírgula, que podem acessar a API com credenciais | Sem origens extras |

`public/config.js` define a URL-base da API para a origem atual. Para hospedar o frontend separadamente, defina `window.__APP_CONFIG__.apiBaseUrl` antes dele e inclua a origem do frontend em `RAIZES_CORS_ORIGINS`. O GitHub Pages não executa o backend; login, pedidos e gerenciamento requerem uma API Express acessível.

### Imagens do catálogo

O catálogo tenta usar as imagens de produto geradas em `src/imagens`, disponibilizadas localmente na rota `/imagens/`. Se uma imagem não carregar, a interface usa fotos de fallback por categoria armazenadas em `public/images/products/`; fontes e licenças estão em [`public/images/products/SOURCES.md`](public/images/products/SOURCES.md). No GitHub Pages, o workflow copia as imagens geradas para a pasta estática `imagens/`.

Administrador e loja podem anexar JPG, PNG ou WebP de até 8 MB. O navegador redimensiona a imagem para no máximo 640 × 480 pixels, converte para JPEG e a envia ao servidor junto ao produto.

## Como os dados são armazenados

O banco armazena os dados do sistema; o navegador conserva somente o carrinho e os dados legados enquanto a migração estiver pendente:

| Dados | Local | Persistência |
|---|---|---|
| Unidades | SQLite ou PostgreSQL | Banco persistente |
| Usuários (hash bcrypt) e sessões | SQLite ou PostgreSQL | Banco persistente |
| Produtos e inventário | SQLite ou PostgreSQL | Banco persistente |
| Pedidos e estado operacional | SQLite ou PostgreSQL | Banco persistente |
| Carrinho | `localStorage` do navegador | Por navegador e origem |

Chaves antigas do navegador são usadas somente para migração de contas, produtos e pedidos quando os usuários autenticados acessam as telas. A migração mantém os dados locais se falhar. O carrinho continua disponível em `raizes-storefront-cart`.

O catálogo inicial fica em `public/products.js`; os 100 produtos são importados para o banco na primeira inicialização. O servidor recalcula os valores dos pedidos usando o catálogo persistido e associa cada pedido à conta autenticada.

## API de autenticação, produtos e pedidos

Base: `http://localhost:3000/api`. As rotas abaixo usam cookies de sessão assinados e mantidos no banco. O cadastro cria sempre `cliente`; o cliente não pode enviar um papel privilegiado. Senhas têm hash bcrypt e nunca são devolvidas pela API.

| Método | Rota | Acesso | Uso |
|---|---|---|---|
| POST | `/auth/register` | Público | Registrar cliente |
| POST | `/auth/login` | Público, limitado a 5 tentativas por IP/15 min | Autenticar e emitir cookie |
| POST | `/auth/logout` | Público | Revogar sessão atual |
| GET | `/auth/me` | Sessão válida | Consultar perfil do servidor |
| GET | `/products` | Público | Listar catálogo |
| POST, PUT, DELETE | `/products` | `admin` ou `loja` | Criar, atualizar e remover produto |
| GET | `/orders` | Sessão válida | Cliente consulta seus pedidos; `admin` e `loja` consultam todos |
| POST | `/orders` | `cliente` | Criar pedido; preços e identidade são definidos pelo servidor |
| PATCH | `/orders/:id/status` | `admin` ou `loja` | Atualizar estado operacional |

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

Os testes usam `node:test` e Supertest para verificar cabeçalhos/CSP, cadastro e login com hash, sessão/cookie/logout, credenciais erradas, autorização de rotas, rejeição de produto com marcação, API de unidades, integridade do catálogo e persistência SQLite após reabrir a conexão. A suíte usa um banco temporário isolado, sem alterar os dados locais.

Roteiro manual complementar:

1. Defina credenciais de desenvolvimento em `.env` para `RAIZES_DEV_ADMIN_*` e `RAIZES_DEV_STORE_*` (senhas com no mínimo 12 caracteres); inicie o servidor e abra <http://localhost:3000>.
2. Registre um cliente, faça login e confira a criação do pedido e o histórico. Teste também as contas de administrador e loja sem compartilhar as senhas.
3. Em cada painel, confirme que a sessão aparece e que **Sair** encerra a sessão.
4. Tente abrir diretamente um painel sem sessão ou com perfil incorreto; o navegador deve redirecionar e a API deve responder `401`/`403`.
5. Na página inicial, confira a marca, a paleta, o carrossel, controles e imagens; verifique o layout em tela estreita e com preferência por movimento reduzido.
6. No perfil de cliente, confira as imagens do catálogo, filtre os produtos, adicione um ao carrinho e confirme o preço promocional.
7. Nos perfis de administrador e loja, cadastre um produto com e sem foto e confirme que aparece no inventário e no cardápio; tente enviar marcação HTML no nome e confirme a rejeição.
8. No perfil de loja, altere o estado de um pedido; confirme que o cliente vê a atualização e não consegue atualizar o estado.
9. Com uma unidade de teste, consulte `/api/unidades`; depois tente cadastrá-la novamente e confirme o HTTP `409`.

## Avaliação acadêmica

O relatório de avaliação com resultados de testes, observações, limitações e melhorias priorizadas está em [`docs/avaliacao-do-sistema.md`](docs/avaliacao-do-sistema.md).

Um roteiro de estudo com etapas e campos para registrar sua própria análise e evidências está em [`docs/guia-passo-a-passo-melhorias-qualidade.md`](docs/guia-passo-a-passo-melhorias-qualidade.md). Ele não substitui a atividade nem apresenta resultados de testes.

## Estrutura do projeto

```text
raizes-do-nordeste/
├── data/
│   ├── raizes.json             # Fonte legada somente para migração inicial
│   └── raizes.sqlite           # Banco local de desenvolvimento (não versionado)
├── public/                     # Arquivos servidos pelo Express
│   ├── index.html              # Página inicial
│   ├── login.html              # Login compartilhado
│   ├── login.js                # Login e cadastro de cliente
│   ├── auth.js                 # Sessão, perfis e redirecionamento
│   ├── cliente.html
│   ├── cliente.js              # Cardápio, carrinho e pedidos
│   ├── products.js             # Catálogo inicial compartilhado de 100 produtos
│   ├── admin.html
│   ├── admin.js                # Painel e inventário do servidor
│   ├── operacional.html
│   ├── operacional.js          # Painel operacional da loja
│   ├── app.js                  # Carrossel e destaques da página inicial
│   ├── config.js               # Configuração de endereço da API
│   ├── images/
│   │   ├── raizes-logo.svg      # Logomarca vetorial e favicon
│   │   └── products/            # Fotos de fallback e fontes/licenças
│   └── style.css               # Paleta e componentes compartilhados
├── src/
│   ├── imagens/                # Imagens de produtos geradas por IA, servidas em /imagens/
│   ├── routes/
│   │   ├── auth.js             # Registro, login e sessão
│   │   ├── orders.js           # Pedidos e ações operacionais
│   │   ├── products.js         # Catálogo e validação de produtos
│   │   └── unidades.js         # Rotas e validações de unidades
│   ├── app.js                  # Middleware, arquivos estáticos e rotas Express
│   ├── auth.js                 # Sessões assinadas e middleware de papéis
│   ├── db.js                   # Adaptadores SQLite e PostgreSQL
│   ├── app.test.js             # Testes automatizados da API com banco temporário
│   ├── products.test.js        # Verificações de integridade do cardápio
│   └── server.js               # Inicialização HTTP
├── package.json
├── render.yaml                 # Serviço web e PostgreSQL no Render
├── .env.example                # Modelo local de configuração (sem segredos)
├── test-offline.bat            # Testes e inicialização local
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
