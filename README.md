# Raízes do Nordeste

Aplicação web didática para uma rede fictícia de lanchonetes. O projeto reúne uma vitrine, áreas de cliente, administração e operação de loja, além de uma API Express para consultar e cadastrar unidades.

> **Importante:** as telas de perfil e o login são uma demonstração no navegador. Usuários, sessão, produtos, carrinho e pedidos ficam no `localStorage`; esses dados não são autenticados nem autorizados pelo servidor e não devem ser usados com informações reais. A API de unidades é separada: a listagem é pública e o cadastro usa um token administrativo compartilhado.

## Conteúdo

- [Requisitos e execução](#requisitos-e-execução)
- [Identidade visual e página inicial](#identidade-visual-e-página-inicial)
- [Perfis e funcionalidades](#perfis-e-funcionalidades)
- [Configuração e arquitetura](#configuração-e-arquitetura)
- [Como os dados são armazenados](#como-os-dados-são-armazenados)
- [API de unidades](#api-de-unidades)
- [Publicação](#publicação)
- [Testes](#testes)
- [Avaliação acadêmica](#avaliação-acadêmica)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Segurança e limitações](#segurança-e-limitações)

## Requisitos e execução

- Node.js 20 ou superior (recomendado)
- npm

Na pasta que contém `package.json`, instale as dependências e inicie o servidor:

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. O Express serve a aplicação a partir de `public/`; a página inicial é `public/index.html`. Para iniciar sem o nodemon:

```bash
npm start
```

No Windows, também é possível executar [`iniciar-servidor.bat`](iniciar-servidor.bat) para iniciar o Express e abrir o navegador. O script `test-offline.bat` roda os testes de API e depois chama o iniciador do servidor. Para usar a API e as imagens de `src/imagens`, acesse a aplicação pelo endereço servido pelo Express, não abra os HTMLs diretamente no navegador.

O servidor usa a variável de ambiente `PORT`, se definida; caso contrário, usa a porta `3000`. Os dados da API são guardados em `data/raizes.json`, criado automaticamente se ainda não existir.

## Identidade visual e página inicial

- A identidade usa uma paleta inspirada na paisagem e na culinária nordestina: areia e barro claro nos fundos, terracota na marca, amarelo-sol nos destaques e verde-cacto nos estados de sucesso.
- A logomarca vetorial própria está em [`public/images/raizes-logo.svg`](public/images/raizes-logo.svg). O mesmo símbolo é usado na navegação das páginas e como favicon.
- A página inicial (`public/index.html`) organiza a chamada principal, os links para categorias, produtos em oferta e acesso à área da loja.
- O carrossel de destaque da página inicial é montado a partir do catálogo: mostra até cinco produtos com desconto, imagem, descrição, preço promocional, indicadores e controles anterior/próximo. Ele avança automaticamente, pausa ao passar o mouse ou navegar por teclado e respeita a preferência do sistema por movimento reduzido.
- O CSS de todas as páginas está centralizado em [`public/style.css`](public/style.css); os tokens de cor e os componentes comuns (botões, navegação, cartões, formulários, métricas e estados) permitem manter uma aparência consistente entre os perfis.

## Perfis e funcionalidades

O fluxo normal começa na página inicial. A navegação leva ao cardápio, ao acesso de conta e às áreas de administração/operação. As três áreas compartilham a tela de login, a exibição da sessão, a navegação e a ação de sair.

- **Visitante:** explora a página inicial, as categorias e o cardápio sem entrar. O carrossel e os destaques usam produtos com desconto do catálogo local.
- **Cliente** ([`public/cliente.html`](public/cliente.html)): filtra o cardápio por categoria, adiciona produtos ao carrinho, seleciona região, loja, modo de atendimento e pagamento, finaliza um pedido demonstrativo e consulta seu histórico local. É necessário entrar para concluir o pedido.
- **Administrador** ([`public/admin.html`](public/admin.html)): acompanha indicadores demonstrativos e o inventário, cadastra produtos e substitui fotos.
- **Loja** ([`public/operacional.html`](public/operacional.html)): acompanha indicadores demonstrativos, tarefas, rotas e distribuição regional de pedidos; também cadastra produtos e substitui fotos.
- **Login compartilhado** ([`public/login.html`](public/login.html) e [`public/login.js`](public/login.js)): autentica as contas demonstrativas no próprio navegador, abre o painel correspondente e permite criar contas de cliente.
- **Sessão e perfis** ([`public/auth.js`](public/auth.js)): guarda a sessão no navegador, mostra os controles de entrar/sair e direciona páginas protegidas ao login ou ao painel do perfil atual.
- **Catálogo** ([`public/products.js`](public/products.js)): fornece 100 produtos iniciais com descrições, categorias, preços, ofertas e itens dos combos. A migração do catálogo adiciona itens padrão que faltarem sem apagar produtos personalizados.

**Contas demonstrativas** — abra **Entrar** e use uma destas contas:

| Perfil | E-mail | Senha | Área |
|---|---|---|---|
| Cliente | `cliente@raizes.com` | `123456` | Cardápio e pedidos |
| Administrador | `admin@raizes.com` | `admin123` | Estoque e gestão da rede |
| Loja | `loja@raizes.com` | `loja123` | Operação local |

Novas contas criadas no formulário compartilhado são sempre de cliente. A sessão pode ser encerrada pelo botão **Sair**. Os perfis são uma demonstração visual: o bloqueio de páginas ocorre somente no JavaScript do navegador e não constitui autorização segura.

## Configuração e arquitetura

O sistema tem uma interface estática em `public/` e um serviço Express em `src/`. O servidor publica os arquivos do frontend, disponibiliza imagens de `src/imagens` na rota `/imagens/` e monta a API sob `/api`. O frontend e a API têm dados separados: pedidos, produtos e sessões permanecem no navegador; somente unidades são gravadas pelo servidor.

Configuração do processo Node:

| Variável | Uso | Padrão |
|---|---|---|
| `PORT` | Porta HTTP do servidor Express | `3000` |
| `RAIZES_DB_PATH` | Caminho alternativo do arquivo de dados JSON (útil para testes) | `data/raizes.json` |
| `RAIZES_API_ADMIN_TOKEN` | Segredo para autorizar criação de unidades; deve ter ao menos 32 bytes | Não definido; criação desabilitada |

`public/config.js` define a URL-base da API para a origem atual. Pode-se definir `window.__APP_CONFIG__.apiBaseUrl` antes dele para apontar a um backend hospedado; esse serviço também deve ser configurado para aceitar o domínio do frontend no CORS. O GitHub Pages substitui a configuração por uma URL vazia porque não fornece backend.

### Imagens do catálogo

O catálogo tenta usar as imagens de produto geradas em `src/imagens`, disponibilizadas localmente na rota `/imagens/`. Se uma imagem não carregar, a interface usa fotos de fallback por categoria armazenadas em `public/images/products/`; fontes e licenças estão em [`public/images/products/SOURCES.md`](public/images/products/SOURCES.md). No GitHub Pages, o workflow copia as imagens geradas para a pasta estática `imagens/`.

Administrador e loja podem anexar JPG, PNG ou WebP de até 8 MB. O navegador redimensiona a imagem para no máximo 640 × 480 pixels, converte para JPEG e guarda o resultado no `localStorage`. Essa foto é local ao navegador e não é enviada ao servidor.

## Como os dados são armazenados

O projeto tem dois armazenamentos independentes:

| Dados | Local | Persistência |
|---|---|---|
| Unidades da API | `data/raizes.json` no servidor | Arquivo JSON local |
| Contas e sessão | `localStorage` do navegador | Por navegador e origem |
| Produtos e inventário demonstrativo | `localStorage` do navegador | Por navegador e origem |
| Carrinho e pedidos demonstrativos | `localStorage` do navegador | Por navegador e origem |

Chaves do navegador usadas pela interface:

- `raizes-storefront-users`: contas demonstrativas e novas contas de cliente.
- `raizes-storefront-current-user`: usuário da sessão atual.
- `raizes-storefront-products`: produtos e inventário compartilhados entre as telas no mesmo navegador.
- `raizes-storefront-cart`: carrinho do cliente.
- `raizes-storefront-orders`: histórico demonstrativo de pedidos.

Os pedidos e produtos não são enviados à API e não são compartilhados entre navegadores. A API armazena apenas unidades.

O catálogo inicial fica em `public/products.js` e é compartilhado pela vitrine, pelo carrossel, pelo cardápio e pelos painéis de estoque. O estado é guardado por origem e navegador; limpar os dados do site ou trocar de navegador remove/oculta as alterações locais. Os pedidos não são enviados à API nem compartilhados entre usuários/dispositivos.

## API de unidades

Base local: `http://localhost:3000/api`.

| Método | Rota | Resposta de sucesso | Descrição |
|---|---|---|---|
| GET | `/health` | `200` | Estado da API e nome da aplicação |
| GET | `/unidades` | `200` | Lista unidades em ordem alfabética pelo nome |
| POST | `/unidades` | `201` | Valida e cadastra uma unidade; exige token administrativo |

### Cadastrar unidade

Configure primeiro um segredo forte de pelo menos 32 bytes na variável de ambiente `RAIZES_API_ADMIN_TOKEN`. Não o coloque no JavaScript do navegador, em arquivos versionados, nem em capturas de tela. Em hospedagem, configure-o no painel de variáveis secretas do serviço. Se estiver ausente ou tiver menos de 32 bytes, o servidor desabilita o cadastro e responde `503`.

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

A API limita cada endereço IP a cinco requisições em uma janela de 15 minutos. O CORS permite requisições sem `Origin` e origens locais `localhost` ou `127.0.0.1`. A listagem de unidades continua pública; o token protege apenas a criação. O token é uma credencial administrativa compartilhada, não substitui autenticação individual nem oferece rotação/expiração automática.

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

O artefato do Pages reúne os arquivos de `public/` e copia as imagens de `src/imagens` para `imagens/`. A interface, as imagens locais, o catálogo e os dados demonstrativos do navegador funcionam publicados em um subdiretório. GitHub Pages não executa Node/Express: a API e os indicadores de unidades dependem de um backend separado.

Para este repositório, quando a implantação estiver concluída, o endereço esperado é <https://finantza.github.io/raizes-do-nordeste/>.

### Render

[`render.yaml`](render.yaml) descreve um serviço Node para hospedar o backend Express. Configure `RAIZES_API_ADMIN_TOKEN` como variável secreta do serviço antes de habilitar cadastro de unidades. A API guarda unidades em arquivo JSON local; ambientes que não garantem disco persistente podem perder esse arquivo ao reiniciar ou redeployar. Para uso duradouro, configure armazenamento persistente ou um banco de dados gerenciado.

## Testes

Execute a suíte automatizada:

```bash
npm test
```

Os testes usam `node:test` e Supertest para verificar cabeçalhos HTTP básicos, a rota de imagens, cadastro/listagem de unidades, rejeição de duplicidade, exigência/configuração de token, integridade do catálogo, migração de produtos, imagens e escape de HTML. A suíte da API usa um arquivo temporário isolado, sem alterar `data/raizes.json`.

Roteiro manual complementar:

1. Abra <http://localhost:3000> e selecione **Entrar**.
2. Faça login com cada conta demonstrativa e confirme que cada uma abre o painel correto.
3. Em cada painel, confirme que a sessão aparece e que **Sair** encerra a sessão.
4. Tente abrir diretamente um painel sem sessão; deve ser exibido o login.
5. Na página inicial, confira a marca, a paleta, o carrossel, controles e imagens; verifique o layout em tela estreita e com preferência por movimento reduzido.
6. No perfil de cliente, confira as imagens do catálogo, filtre os produtos, adicione um ao carrinho e confirme o preço promocional.
7. Nos perfis de administrador e loja, cadastre um produto com e sem foto e confirme que aparece no inventário e no cardápio.
8. Com uma unidade de teste, consulte `/api/unidades`; depois tente cadastrá-la novamente e confirme o HTTP `409`.

## Avaliação acadêmica

O relatório de avaliação com resultados de testes, observações, limitações e melhorias priorizadas está em [`docs/avaliacao-do-sistema.md`](docs/avaliacao-do-sistema.md).

Um roteiro de estudo com etapas e campos para registrar sua própria análise e evidências está em [`docs/guia-passo-a-passo-melhorias-qualidade.md`](docs/guia-passo-a-passo-melhorias-qualidade.md). Ele não substitui a atividade nem apresenta resultados de testes.

## Estrutura do projeto

```text
raizes-do-nordeste/
├── data/
│   └── raizes.json             # Dados persistentes da API de unidades
├── public/                     # Arquivos servidos pelo Express
│   ├── index.html              # Página inicial
│   ├── login.html              # Login compartilhado
│   ├── login.js                # Login e cadastro de cliente
│   ├── auth.js                 # Sessão, perfis e redirecionamento
│   ├── cliente.html
│   ├── cliente.js              # Cardápio, carrinho e pedidos
│   ├── products.js             # Catálogo inicial compartilhado de 100 produtos
│   ├── admin.html
│   ├── admin.js                # Painel e inventário demonstrativo
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
│   │   └── unidades.js         # Rotas e validações da API
│   ├── app.js                  # Middleware, arquivos estáticos e rotas Express
│   ├── db.js                   # Leitura e gravação de data/raizes.json
│   ├── app.test.js             # Testes automatizados da API com banco temporário
│   ├── products.test.js        # Verificações de integridade do cardápio
│   └── server.js               # Inicialização HTTP
├── package.json
├── render.yaml                 # Configuração de implantação de demonstração
├── test-offline.bat            # Testes e inicialização local
└── .github/workflows/pages.yml # Publicação da interface no GitHub Pages
```

O servidor Express publica `public/`. A pasta `docs/` contém outra cópia de páginas do protótipo e não é a pasta servida pelo servidor atual.

## Segurança e limitações

- O login demonstrativo compara credenciais no navegador e armazena senhas em texto simples no `localStorage`. Não use senhas reais.
- Não há sessão autenticada no servidor, hash de senha ou isolamento de dados por perfil/unidade. A única proteção da API é o token compartilhado exigido para cadastrar unidades; a listagem é pública.
- As telas de produtos, pedidos e operação usam dados locais e/ou demonstrativos; não representam um sistema transacional integrado.
- A API de unidades guarda os dados em um arquivo JSON local, não em um banco de dados gerenciado.
- A página inicial consulta os indicadores de unidades quando a API está configurada; produtos, sessões e pedidos continuam locais e não são sincronizados com o servidor.
- O limitador de requisições mantém o histórico em memória e é reiniciado quando o servidor reinicia.

Este projeto é destinado a estudo e demonstração. Antes de qualquer uso real, implemente autenticação e autorização no servidor, armazenamento seguro de credenciais, validações e persistência apropriadas, além de testes para cada novo recurso.
