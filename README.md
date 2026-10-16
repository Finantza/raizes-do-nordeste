# Raízes do Nordeste

Aplicação web didática para uma rede fictícia de lanchonetes. O projeto reúne uma vitrine, áreas de cliente, administração e operação de loja, além de uma API Express para consultar e cadastrar unidades.

> **Importante:** as telas de perfil e o login são uma demonstração no navegador. Usuários, sessão, produtos, carrinho e pedidos ficam no `localStorage`; esses dados não são autenticados nem autorizados pelo servidor e não devem ser usados com informações reais. A API de unidades é um módulo separado e também não tem autenticação.

## Conteúdo

- [Requisitos e execução](#requisitos-e-execução)
- [Perfis e funcionalidades](#perfis-e-funcionalidades)
- [Como os dados são armazenados](#como-os-dados-são-armazenados)
- [API de unidades](#api-de-unidades)
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

No Windows, também é possível executar [`iniciar-servidor.bat`](raizes-do-nordeste/iniciar-servidor.bat) para iniciar o Express e abrir o navegador. O script `test-offline.bat` roda os testes de API e depois chama o iniciador do servidor; não abra o HTML diretamente, pois isso não inicia a API nem disponibiliza as imagens em `src/imagens`.

O servidor usa a variável de ambiente `PORT`, se definida; caso contrário, usa a porta `3000`. Os dados da API são guardados em `data/raizes.json`, criado automaticamente se ainda não existir.

### Publicação no GitHub Pages

O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) prepara e publica a interface estática após cada envio para a branch `main` (ou manualmente pela aba **Actions**). Na primeira execução, ele tenta habilitar o GitHub Pages automaticamente; se as permissões do repositório não permitirem, um administrador deve selecionar **Settings → Pages → Build and deployment → Source → GitHub Actions** e executar novamente o workflow. A publicação inclui as imagens de `src/imagens` e os caminhos relativos funcionam também em repositórios publicados em subdiretórios.

O GitHub Pages não executa o servidor Node/Express. No Pages funcionam as páginas, catálogo, login demonstrativo, carrinho, pedidos e cadastros guardados no `localStorage` daquele navegador; a API de unidades e os indicadores que dependem dela só ficam disponíveis com o servidor local ou um backend hospedado.

### Contas demonstrativas

Abra **Entrar** ou qualquer área de perfil. Sem sessão, as áreas protegidas encaminham para o login compartilhado. Informe uma das contas abaixo; o sistema identifica o perfil pela conta e abre o respectivo painel.

| Perfil | E-mail | Senha | Área |
|---|---|---|---|
| Cliente | `cliente@raizes.com` | `123456` | Cardápio e pedidos |
| Administrador | `admin@raizes.com` | `admin123` | Estoque e gestão da rede |
| Loja | `loja@raizes.com` | `loja123` | Operação local |

Novas contas criadas no formulário compartilhado são sempre de cliente. A sessão pode ser encerrada pelo botão **Sair** na navegação.

## Perfis e funcionalidades

As três áreas compartilham a tela de login, a exibição da sessão, a navegação da aplicação e a ação de sair. Cada perfil tem uma área própria:

- **Cliente** ([`public/cliente.html`](public/cliente.html)): consulta o cardápio organizado em seções e colunas por categoria, filtra categorias, adiciona produtos ao carrinho, seleciona região, loja, modo de atendimento e pagamento, finaliza pedidos e consulta o histórico local.
- **Cardápio** ([`public/products.js`](public/products.js)): catálogo inicial compartilhado com 100 opções inspiradas em comidas e bebidas tradicionais nordestinas, cada uma com descrição própria; os combos informam os itens incluídos. Os nomes e textos são combinações próprias de pratos e ingredientes, sem copiar descrições de outros estabelecimentos.
- **Administrador** ([`public/admin.html`](public/admin.html)): consulta indicadores e inventário demonstrativos, cadastra produtos (inclusive com preço ou estoque zero) e envia fotos.
- **Loja** ([`public/operacional.html`](public/operacional.html)): consulta indicadores da operação, checklist, rotas e pedidos agrupados por região; também cadastra produtos e envia fotos.
- **Página inicial** ([`public/index.html`](public/index.html)): apresenta a rede e os produtos em destaque.
- **Login compartilhado** ([`public/login.html`](public/login.html) e [`public/login.js`](public/login.js)): autentica as contas demonstrativas, direciona conforme o perfil e permite criar uma conta de cliente.
- **Sessão e perfis** ([`public/auth.js`](public/auth.js)): mantém a sessão no navegador, decide para qual painel cada perfil é encaminhado, protege a navegação entre as áreas no cliente e exibe os controles de sessão.

O link **Administração** é mostrado apenas para o perfil administrativo; o link **Cardápio** está disponível também nos painéis de cliente, loja e administração.

O bloqueio de páginas por perfil acontece somente no JavaScript do navegador. Não constitui controle de acesso seguro: uma pessoa pode alterar os dados locais ou chamar a API diretamente.

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

O catálogo inicial fica em `public/products.js` e é compartilhado pela vitrine, pelo cardápio e pelo inventário. Em navegadores que já tinham a lista demonstrativa anterior, os itens que faltavam são incluídos sem remover produtos personalizados já cadastrados.

O catálogo prioriza as imagens geradas por IA que existirem em `src/imagens`, disponibilizadas pelo Express na rota `/imagens/`. Para os produtos ainda sem imagem gerada, usa fotos locais por categoria; as fontes e licenças dessas fotos estão em [`public/images/products/SOURCES.md`](public/images/products/SOURCES.md). As fotos de fallback são ilustrativas e não garantem representar exatamente o prato servido. Para associar novas imagens, salve-as como PNG, JPG ou WebP usando o nome do produto (por exemplo, `Tapioca de Queijo.png`); as associações explícitas aos arquivos já existentes estão em `public/products.js`. Administrador e loja podem anexar uma foto JPG, PNG ou WebP de até 8 MB ao cadastrar um produto e substituir a foto dos itens existentes; o navegador redimensiona a imagem e a converte para JPEG antes de armazená-la localmente. Produtos e fotos enviadas ficam no `localStorage` do navegador e não são sincronizados ao servidor.

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

## Testes

Execute a suíte automatizada:

```bash
npm test
```

Os testes usam `node:test` e Supertest para verificar cabeçalhos HTTP básicos, cadastro/listagem, rejeição de unidade duplicada e integridade do catálogo. A suíte da API usa um arquivo temporário isolado, sem alterar `data/raizes.json`.

Roteiro manual complementar:

1. Abra <http://localhost:3000> e selecione **Entrar**.
2. Faça login com cada conta demonstrativa e confirme que cada uma abre o painel correto.
3. Em cada painel, confirme que a sessão aparece e que **Sair** encerra a sessão.
4. Tente abrir diretamente um painel sem sessão; deve ser exibido o login.
5. No perfil de cliente, confira as imagens do catálogo, filtre os produtos, adicione um ao carrinho e confirme o preço promocional.
6. Nos perfis de administrador e loja, cadastre um produto com e sem foto e confirme que aparece no inventário e no cardápio.
7. Com uma unidade de teste, consulte `/api/unidades`; depois tente cadastrá-la novamente e confirme o HTTP `409`.

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
│   ├── app.js                  # Produtos em destaque da página inicial
│   ├── config.js               # Configuração de endereço da API
│   └── style.css               # Estilos compartilhados
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
└── test-offline.bat            # Verificações e abertura local da interface
```

O servidor Express publica `public/`. A pasta `docs/` contém outra cópia de páginas do protótipo e não é a pasta servida pelo servidor atual.

## Segurança e limitações

- O login demonstrativo compara credenciais no navegador e armazena senhas em texto simples no `localStorage`. Não use senhas reais.
- Não há sessão autenticada no servidor, hash de senha, autorização da API ou isolamento de dados por perfil/unidade.
- As telas de produtos, pedidos e operação usam dados locais e/ou demonstrativos; não representam um sistema transacional integrado.
- A API de unidades não exige autenticação e guarda os dados em um arquivo JSON local, não em um banco de dados gerenciado.
- A vitrine consulta os indicadores de unidades na API da mesma origem; produtos e pedidos continuam locais e não são sincronizados com o servidor.
- O limitador de requisições mantém o histórico em memória e é reiniciado quando o servidor reinicia.

Este projeto é destinado a estudo e demonstração. Antes de qualquer uso real, implemente autenticação e autorização no servidor, armazenamento seguro de credenciais, validações e persistência apropriadas, além de testes para cada novo recurso.
