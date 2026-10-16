# Avaliação acadêmica do sistema

**Data da avaliação:** 16/10/2026  
**Escopo:** aplicação publicada localmente pelo Express, interface no navegador, perfis demonstrativos, carrinho/pedidos locais e API de unidades.  
**Objetivo:** avaliar o protótipo como uma banca acadêmica, registrar evidências observadas e propor melhorias priorizadas. Esta avaliação não certifica o sistema para uso comercial ou produção.

> **Atualização de segurança — 16/10/2026:** o cadastro `POST /api/unidades` agora exige o segredo compartilhado `RAIZES_API_ADMIN_TOKEN`, com no mínimo 32 bytes; sem configuração suficiente o endpoint falha fechado. Os testes automatizados cobrem token válido, ausente, inválido e configuração ausente/fraca. Isso protege somente a criação de unidades e não transforma os perfis demonstrativos em autenticação/autorização individual de servidor. A avaliação abaixo foi atualizada nesses pontos; outros achados históricos ainda precisam ser revalidados contra o sistema atual.

## Parecer executivo

O projeto é um **protótipo navegável**, com identidade visual definida, três áreas por perfil, login demonstrativo, operações locais de catálogo/carrinho e uma API funcional para unidades. Os fluxos principais de demonstração foram percorridos no navegador e os testes existentes da API passaram.

O resultado **não deve ser apresentado como uma plataforma de vendas integrada nem como sistema pronto para uso real**. Autenticação e dados de negócio residem no navegador; pedidos, produtos e unidades pertencem a armazenamentos diferentes; parte dos indicadores é fictícia; há inconsistências no preço final e problemas de apresentação em celular.

### Síntese por critério

| Critério | Resultado | Observação |
|---|---|---|
| Inicialização e navegação | Atende parcialmente | O Express serve as telas; áreas de perfil encaminham visitantes sem sessão ao login. |
| Login e perfis demonstrativos | Atende no protótipo | Login comum, cadastro de cliente, redirecionamento por perfil e saída foram exercitados. Não é autenticação segura de servidor. |
| Funções do cliente | Atende parcialmente | Catálogo, filtros, carrinho, pedido e histórico funcionam localmente, mas o carrinho não aplica o preço promocional exibido. |
| Funções administrativas | Atende parcialmente | Inventário e inclusão de produto funcionam para valores positivos; o formulário contradiz sua própria aceitação de zero. |
| Funções da loja | Atende como demonstração | Checklist e indicadores aparecem; não são uma operação real nem todos os dados são provenientes de pedidos. |
| API de unidades | Atende ao escopo implementado | Listagem, cadastro, validações, duplicidade e limite foram exercitados com os status esperados. |
| Responsividade e acessibilidade | Atende parcialmente | Responsividade e estilos locais foram validados em larguras móveis e desktop; ainda há campos em alguns formulários sem associação explícita entre rótulo e controle. |
| Segurança e produção | Não atende para uso real | Perfis e sessão continuam controlados pelo cliente; o POST da API exige um segredo administrativo compartilhado, mas não há identidade individual nem autorização por perfil. |
| Qualidade automatizada | Parcial | A suíte possui 10 testes automatizados (API e catálogo); os fluxos de interface ainda dependem de teste manual. |

## Testes executados

### Suíte automatizada

Na execução de 16/10/2026, `npm test` concluiu com **10 testes aprovados, 0 falhas**:

1. Cabeçalhos HTTP básicos de segurança e serviço de imagem.
2. Cadastro/listagem de unidades usando o segredo administrativo de teste.
3. Rejeição de unidade duplicada.
4. Rejeição de cadastro sem token ou com token inválido.
5. Desativação segura do cadastro sem token configurado ou com segredo menor que 32 bytes.
6. Integridade do catálogo, descrições e itens incluídos nos combos.
7. Preservação de produtos personalizados e resolução das imagens/fallbacks.

Antes da execução, o conteúdo de `data/raizes.json` foi guardado e restaurado depois, pois a suíte chama `resetDatabase()` e altera esse arquivo.

Também foi verificada a sintaxe JavaScript de `auth.js`, `login.js`, `cliente.js`, `admin.js` e `operacional.js`; todos passaram em `node --check`.

### API

Testes isolados da aplicação Express confirmaram:

| Cenário | Resultado |
|---|---:|
| `GET /api/health` | `200` |
| `GET /api/unidades` | `200` |
| Cadastro válido e normalização de UF para maiúsculas | `201` |
| Cadastro duplicado | `409` |
| Cadastro sem segredo ou com segredo incorreto | `401` |
| Segredo de servidor ausente ou curto | `503` |
| UF inválida | `400` |
| Sexta chamada na mesma janela de limite | `429` |

Os dados e o segredo de teste são isolados pela suíte; os registros de unidade são apagados no início dos testes. O segredo de teste não deve ser reutilizado fora deles.

### Interface e fluxos de perfil

Foram percorridos pelo navegador:

- A página inicial carrega os produtos em destaque, mas os três indicadores de unidades/estados permanecem como `—`.
- Acesso sem sessão a um painel encaminha ao login comum.
- Credenciais inválidas apresentam mensagem de erro.
- Login de cliente, administrador e loja direciona cada conta à área correspondente.
- Cadastro de cliente funciona; a tentativa de cadastrar novamente o mesmo e-mail é recusada.
- O botão **Sair** remove a sessão e retorna ao login.
- O cliente consegue filtrar o catálogo, adicionar produto, ver o carrinho, finalizar um pedido e encontrar o pedido no histórico.
- O administrador consegue adicionar um produto com preço e estoque positivos e vê-lo no inventário.
- A loja abre o painel operacional e reflete a quantidade do pedido local recém-criado.
- Foi testado o formulário administrativo com preço e estoque iguais a zero; o sistema rejeitou os valores embora os campos HTML declarem `min="0"`.
- Na tela de login, com viewport configurada para `390 px`, o documento apresentou `584 px` de largura rolável (`384 px` de largura útil), causando rolagem horizontal.
- **Correção posterior:** o layout de autenticação foi empilhado em telas menores e os utilitários responsivos de navegação, grids dos painéis e cartões de indicadores foram adicionados. Após a correção, login, cliente, administração e operação foram verificados em larguras móveis/tablet sem rolagem horizontal do documento.
- A página de login não contém elementos `<img>`; também não foram encontrados arquivos de imagem do catálogo em `public/`.
- **Correção posterior de CSS/CSP em 16/10/2026:** foram removidas referências a fontes e Bootstrap externos que a CSP bloqueava; os painéis passaram a usar os estilos locais. Também foram corrigidos o breakpoint de `.grid-3`, a seta nativa dos seletores e o foco por teclado dos modos de pedido. Validação posterior: sem overflow entre 320 e 1280 px nas páginas verificadas, sem recursos de estilo/script externos nos painéis e sem erros reportados pelo verificador de arquivos.

**Limites da avaliação:** não foram testados pagamentos reais, integração com serviço de entrega, concorrência entre usuários, implantação em Render, persistência entre dispositivos nem uma autenticação individual de usuários. A proteção por segredo compartilhado no POST foi testada pela suíte local; a configuração e operação do segredo em implantação pública não foram verificadas.

## Observações e melhorias priorizadas

As prioridades refletem o impacto para uma demonstração avaliada e, separadamente, o risco de uso real.

### P0 — Bloqueadores para qualquer uso real

#### 1. Autenticação individual dos perfis existe apenas no navegador

**Evidência:** as contas padrão e senhas estão no código de [auth.js](../public/auth.js); usuários e sessão são mantidos no `localStorage`; a exigência de perfil é aplicada em JavaScript. Como correção parcial, `POST /api/unidades` agora valida um segredo compartilhado configurado no servidor; `GET /api/unidades` continua público, e o segredo não representa identidade individual nem perfil.

**Risco/impacto:** as credenciais demonstrativas podem ser lidas por qualquer visitante e os dados locais podem ser alterados; um segredo compartilhado também não identifica qual operador realizou o cadastro e pode ser repassado. Os controles visuais de perfil não são autorização de servidor.

**Melhoria restante:** implementar autenticação individual no servidor, hash de senhas, sessões/tokens seguros e autorização por perfil em cada rota; proteger o segredo administrativo em variável de ambiente, com política de rotação. Remover as senhas padrão de qualquer implantação pública.

#### 2. Dados de pedidos e produtos não constituem uma operação integrada

**Evidência:** catálogo, inventário, carrinho e pedidos são salvos no `localStorage`; a API persistente implementada só trata unidades em `data/raizes.json`.

**Risco/impacto:** outro dispositivo ou usuário não vê as alterações; a loja não recebe pedidos de forma confiável; os painéis não são fonte operacional única.

**Melhoria:** definir API e armazenamento persistente para produtos, estoque e pedidos; validar preço, disponibilidade, identidade do cliente e transições do pedido no servidor.

### P1 — Corrigir antes de considerar o protótipo funcionalmente coerente

#### 3. O carrinho cobra preço diferente do preço promocional anunciado

**Evidência:** o cartão de produto calcula e exibe o valor com desconto em [cliente.js](../public/cliente.js), mas `addToCart()` guarda `product.preco` sem descontar a promoção. Para o Combo Nordeste, o catálogo mostra aproximadamente **R$ 58,44**, enquanto o carrinho e o pedido usam **R$ 89,90**.

**Impacto:** divergência visível entre oferta e total final; o usuário não recebe no carrinho o preço anunciado.

**Melhoria:** calcular o preço promocional uma vez em uma função comum, exibir esse preço no carrinho e validar o total novamente na API ao finalizar.

#### 4. Login não era responsivo em celular — corrigido

**Evidência original:** [login.html](../public/login.html) fixava duas colunas mínimas de `280 px` e `260 px` em uma tela de `390 px`; a medição no navegador encontrou conteúdo com `584 px` de largura rolável.

**Impacto original:** parte do conteúdo ficava fora da tela e exigia rolagem horizontal em um fluxo essencial.

**Correção e verificação:** cartões de autenticação agora empilham em telas menores; início, login e painéis foram verificados em larguras de 320, 390, 768, 991, 1024 e 1280 px sem overflow horizontal.

#### 5. Política CSP bloqueava estilos externos declarados pelas páginas — corrigido

**Evidência original:** a política definida em [src/app.js](../src/app.js) autoriza estilos somente de `'self'` e `'unsafe-inline'`; o console confirmou bloqueio da fonte do Google Fonts e do Bootstrap via CDN. As classes de componentes como `.top-card`, `.store-card` e `.status-pill` também não tinham estilos locais.

**Impacto original:** a fonte externa era substituída pelo fallback, os painéis ficavam sem regras visuais para componentes próprios e a navegação registrava violações da CSP.

**Correção e verificação:** removidas as importações externas de fontes e Bootstrap; adicionados estilos locais necessários aos painéis e removido o JavaScript externo não utilizado. A pilha de fontes agora utiliza o fallback local do sistema. As páginas de administração e operação foram verificadas em tamanhos móveis e desktop, sem overflow e sem dependências externas de estilo/script. Também foi corrigida a ordem dos breakpoints de `.grid-3`, que fazia duas colunas prevalecerem indevidamente abaixo de 768 px. A navegação por teclado nos modos de pedido e os seletores nativos também foram corrigidos. O achado está corrigido para a interface atual; a política CSP do servidor não foi ampliada.

#### 6. Formulário de produto declara aceitar zero e o JavaScript rejeita

**Evidência:** os campos preço e estoque em [admin.html](../public/admin.html) têm `min="0"`, mas a validação de [admin.js](../public/admin.js) usa `!preco || !estoque`, tratando zero como campo ausente. O cenário foi reproduzido no navegador.

**Impacto:** não é possível cadastrar produtos gratuitos ou itens sem estoque, apesar do contrato HTML indicar que esses valores são válidos.

**Melhoria:** validar campos vazios separadamente de números e verificar que preço/estoque sejam números finitos e não negativos.

#### 7. Indicadores da página inicial não são preenchidos

**Evidência:** os campos de unidades, lojas ativas e estados aparecem como `—` em [index.html](../public/index.html). [app.js](../public/app.js) apenas renderiza produtos em destaque e não consulta `/api/unidades`.

**Impacto:** a página apresenta métricas sem valor e dá impressão de funcionalidade inacabada.

**Melhoria:** integrar esses indicadores à API, exibir estado de carregamento/erro e documentar a origem e a regra de cálculo de cada total.

### P2 — Melhorias importantes de UX, qualidade e conteúdo

#### 8. Números operacionais são simulados e podem contradizer os pedidos

**Evidência:** [operacional.js](../public/operacional.js) injeta três pedidos fictícios quando não há pedidos e usa valores de fallback para vendas, delivery e retirada. O painel administrativo também apresenta números de demonstração quando não existem pedidos em [admin.js](../public/admin.js).

**Impacto:** os números podem ser interpretados como resultados reais, inclusive em uma avaliação do funcionamento da aplicação.

**Melhoria:** marcar claramente os dados como demonstração ou apresentar zero/estado vazio quando não houver dados reais; separar amostras da informação operacional.

#### 9. Preços, estoque e pagamento não têm validação transacional

**Evidência:** no perfil do cliente, a quantidade cresce sem limite, não há verificação de estoque no `addToCart()` e os dados do pedido são persistidos localmente. O meio de pagamento é registrado como texto, sem integração com provedor.

**Impacto:** estoque pode ficar negativo ou ser vendido acima do disponível; a confirmação local não significa que houve pagamento ou aceitação da loja.

**Melhoria:** verificar estoque no servidor no momento da finalização, evitar dupla venda, validar endereço conforme o modo escolhido e distinguir pedido criado de pagamento confirmado.

#### 10. Links de navegação mostram painéis de outros perfis

**Evidência:** cada painel inclui links para as outras áreas, mas [auth.js](../public/auth.js) redireciona de volta ao painel da sessão quando o perfil não corresponde.

**Impacto:** o link parece navegável, mas retorna o usuário ao mesmo lugar, confundindo a navegação.

**Melhoria:** mostrar links comuns (início, perfil atual, sair) e ocultar áreas exclusivas de outros perfis; caso exista uma troca legítima de conta, oferecer saída/login de forma explícita.

#### 11. Imagens de produtos e alternativas textuais estão ausentes

**Evidência:** não há arquivos de imagem do catálogo em `public/`; os cartões usam a inicial da categoria como ilustração e não há elementos `<img>` no login.

**Impacto:** o catálogo não oferece apoio visual dos produtos, reduzindo a qualidade de uma vitrine de alimentação.

**Melhoria:** incluir imagens locais otimizadas, dimensões reservadas para evitar deslocamento da página e texto alternativo descritivo; atualizar `img-src` da CSP somente se houver necessidade justificada de outra origem.

#### 12. Acessibilidade de formulários e feedback pode melhorar

**Evidência:** campos administrativos e operacionais têm rótulos sem `for`/`id` explícitos; mensagens de vários formulários não compartilham um padrão de anúncio para leitor de tela. O login comum tem associações melhores.

**Impacto:** associação de rótulo, navegação assistiva e compreensão de erro podem variar conforme navegador e tecnologia assistiva.

**Melhoria:** associar todos os rótulos aos campos por `for`/`id`, indicar obrigatoriedade e erro programaticamente, manter foco no primeiro campo inválido e testar com teclado e leitor de tela.

#### 13. Conteúdo dinâmico é inserido com `innerHTML`

**Evidência:** nomes/categorias de produto e dados de sessão/pedido, alguns editáveis ou persistidos no navegador, são interpolados em HTML em [admin.js](../public/admin.js), [cliente.js](../public/cliente.js) e [operacional.js](../public/operacional.js).

**Impacto:** dados não confiáveis podem ser interpretados como marcação HTML; a implementação dificulta garantir exibição segura após futura integração ou importação de dados.

**Melhoria:** construir nós de texto com `textContent` para valores e sanitizar somente quando HTML for realmente necessário. Repetir as validações no servidor.

#### 14. CORS e URL de API ainda são de demonstração

**Evidência:** [config.js](../public/config.js) contém `SEU-APP-RENDER.onrender.com`; a API aceita apenas origens locais conhecidas. O frontend atual não sincroniza pedidos/produtos com essa API.

**Impacto:** uma implantação com frontend em outra origem não consegue usar a API sem configuração; a configuração de exemplo não representa integração pronta.

**Melhoria:** parametrizar a URL por ambiente, listar origens autorizadas reais e verificar uma implantação de ponta a ponta antes de publicar.

#### 15. Cobertura automatizada concentra-se na API

**Evidência:** [src/app.test.js](../src/app.test.js) possui três testes de API; login, permissões visuais, cadastro, carrinho, preços, responsividade e painéis não têm cobertura automatizada.

**Impacto:** regressões nos fluxos que mais afetam a demonstração podem passar despercebidas.

**Melhoria:** criar testes de interface para os três logins, erros, redirecionamento e logout; incluir cenários de desconto/total, estoque zero, pedido e layout móvel.

#### 16. Limite da API pode interferir em uso compartilhado de avaliação

**Evidência:** [src/app.js](../src/app.js) permite cinco requisições por IP a cada 15 minutos; o teste confirmou HTTP `429` na sexta chamada, mesmo sendo uma chamada de saúde.

**Impacto:** pessoas em um mesmo IP podem esgotar o limite durante uma demonstração, aula ou laboratório.

**Melhoria:** aplicar limites por rota e ambiente, definir configuração adequada ao uso didático e, em implantação com múltiplas instâncias, usar armazenamento compartilhado para o contador.

## Plano de melhoria recomendado

1. **Antes de qualquer uso público:** substituir a autenticação local por autenticação e autorização individual no servidor; manter o segredo administrativo fora do cliente, configurar sua rotação e remover credenciais padrão públicas.
2. **Consertar a experiência demonstrativa:** corrigir preço promocional, validação de zero, layout móvel e carregamento local/permitido dos estilos externos.
3. **Eliminar sinais de dado real quando houver mocks:** preencher as métricas da página inicial e rotular claramente números operacionais demonstrativos.
4. **Integrar o fluxo de negócio:** persistir produtos, estoque e pedidos no servidor; validar preços, estoque, entrega e estado do pagamento de forma transacional.
5. **Elevar a qualidade de entrega:** melhorar rótulos/foco/feedback acessível, imagens do catálogo, navegação por perfil e testes automatizados de interface.
6. **Validar implantação:** configurar domínio da API, CORS, CSP e persistência real; executar roteiro de ponta a ponta no ambiente publicado.

## Conclusão da banca

**Recomendação:** adequado como exercício didático de interface e API inicial, desde que apresentado explicitamente como protótipo com dados simulados. Para alegar que os perfis representam permissões reais, que pedidos são processados, que as vendas são confiáveis ou que a aplicação pode operar comercialmente, os bloqueadores P0 e as inconsistências P1 acima precisam ser resolvidos e retestados.
