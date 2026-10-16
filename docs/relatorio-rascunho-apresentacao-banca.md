# Relatório de apoio à apresentação — Raízes do Nordeste

> **Rascunho de trabalho, não é uma avaliação independente pronta para entrega.** Este documento foi estruturado com apoio de IA a partir dos arquivos disponíveis no projeto. Revise as afirmações, execute os cenários marcados como pendentes, complete os campos em aberto com sua análise e declare o uso de IA conforme as regras do professor. Não apresente como observação própria o que não tiver verificado.
>
> **Limite dos critérios:** o guia do projeto referencia `Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf`, mas esse PDF não foi encontrado no workspace. Este rascunho segue `docs/guia-passo-a-passo-melhorias-qualidade.md` e consulta `docs/avaliacao-do-sistema.md`; confronte-o com o roteiro oficial antes de usar na banca.

## Identificação

| Campo | Preencher/confirmar |
|---|---|
| Instituição, curso e disciplina | [Preencher] |
| Título do trabalho | Raízes do Nordeste — protótipo de cardápio e gestão demonstrativa |
| Integrantes e matrícula | [Preencher] |
| Professor(a) | [Preencher] |
| Data e local da apresentação | [Preencher] |
| Versão/commit avaliado | [Preencher: não foi possível identificar um commit neste workspace] |

## Resumo executivo

Raízes do Nordeste é um protótipo web didático para uma rede fictícia de lanchonetes. A interface oferece vitrine, catálogo categorizado, login demonstrativo e áreas de cliente, administração e loja. O catálogo inicial contém 100 produtos; o cliente pode manter carrinho, pedidos e histórico no navegador. Há uma API Express para consulta e cadastro de unidades, e o servidor local disponibiliza imagens do diretório do projeto.

O sistema deve ser apresentado como **protótipo**, não como plataforma comercial. O login e os perfis são controlados no navegador; produtos, fotos enviadas, carrinho e pedidos ficam no `localStorage`; a API não integra esses dados de negócio. Não há processamento de pagamento, entrega real, autenticação segura no servidor ou sincronização entre usuários/dispositivos.

## 1. Objetivo e escopo avaliado

**Objetivo do sistema:** demonstrar uma experiência de cardápio e fluxos básicos de cliente e operação para uma lanchonete fictícia, além de uma API inicial de unidades.

**Escopo de avaliação sugerido — confirmar com o professor:**

- Abrir a aplicação pelo servidor local e navegar pelas telas.
- Consultar e filtrar o cardápio e carregar imagens de produtos.
- Percorrer os fluxos demonstrativos de conta, carrinho, pedido e histórico.
- Consultar/cadastrar unidades pela API.
- Inspecionar os limites de persistência, segurança, implantação estática e testes.

**Fora do escopo implementado:** venda comercial, pagamentos, integração real com entregadores, autorização de perfis no servidor, compartilhamento de pedidos/produtos entre navegadores e operação simultânea confiável.

**Justificativa da escolha do escopo, escrita pelo estudante:** [Completar com sua justificativa e confirmar a adequação com o professor.]

## 2. Arquitetura e funcionamento observado/documentado

- **Interface:** HTML, CSS e JavaScript em `public/`.
- **Servidor local:** Node.js/Express em `src/`; serve os arquivos da interface e imagens, além da API `/api/unidades`.
- **Catálogo:** 100 opções iniciais em `public/products.js`, categorizadas em lanches, pratos, bebidas, sobremesas e ofertas.
- **Imagens:** 14 arquivos gerados estão em `src/imagens`; as demais imagens usam fotos locais ilustrativas. O workflow de Pages copia as imagens para a publicação estática.
- **Dados demonstrativos:** contas, sessão, produtos, fotos enviadas, carrinho e pedidos são armazenados no `localStorage` do navegador.
- **Unidades:** a API Express mantém dados em `data/raizes.json` no servidor local.
- **Perfis:** cliente, administrador e loja são contas demonstrativas; os controles de perfil na interface não constituem autorização segura.
- **GitHub Pages:** publica somente conteúdo estático. A interface e recursos locais do navegador podem funcionar, mas Pages não executa Express nem oferece a API de unidades.

## 3. Requisitos funcionais a confirmar

Transforme as necessidades abaixo em requisitos verificáveis e confirme se correspondem ao roteiro oficial. Complete critérios e resultados observados durante sua própria execução.

| ID | Necessidade/requisito funcional proposto | Critério de aceitação definido pelo estudante | Evidência/estado |
|---|---|---|---|
| RF-01 | Consultar produtos agrupados por categoria. | [Definir] | Catálogo de 100 itens validado pela suíte automatizada; confirmar visualmente. |
| RF-02 | Adicionar produtos e concluir um pedido demonstrativo. | [Definir] | [Executar e registrar] |
| RF-03 | Administrador/loja cadastrar produto e foto no navegador. | [Definir] | [Executar e registrar] |
| RF-04 | Consultar e cadastrar unidades pela API. | [Definir] | Testes automatizados de cadastro/listagem aprovados. |
| RF-05 | Exibir imagens dos produtos no servidor local e no site estático. | [Definir] | Resposta HTTP 200 da rota de imagem local verificada; Pages ainda não foi implantado neste trabalho. |

## 4. Requisitos não funcionais mensuráveis — completar

O guia exige **oito requisitos de qualidade mensuráveis**. Os espaços abaixo são intencionais: defina metas justificadas, método, ambiente e risco com base na atividade e valide com o professor. Não trate metas propostas como resultados medidos.

| ID | Atributo/necessidade | Condição mensurável definida pelo estudante | Método e ambiente | Critério de aceitação | Risco se não atender |
|---|---|---|---|---|---|
| RNF-01 | Desempenho | [Definir] | [Definir] | [Definir] | [Definir] |
| RNF-02 | Disponibilidade | [Definir] | [Definir] | [Definir] | [Definir] |
| RNF-03 | Segurança | [Definir] | [Definir] | [Definir] | [Definir] |
| RNF-04 | Usabilidade | [Definir] | [Definir] | [Definir] | [Definir] |
| RNF-05 | Acessibilidade | [Definir] | [Definir] | [Definir] | [Definir] |
| RNF-06 | Compatibilidade/responsividade | [Definir] | [Definir] | [Definir] | [Definir] |
| RNF-07 | Confiabilidade dos dados | [Definir] | [Definir] | [Definir] | [Definir] |
| RNF-08 | Manutenibilidade/observabilidade | [Definir] | [Definir] | [Definir] | [Definir] |

## 5. Estratégia e evidências de teste

### Execução automatizada registrada

Na execução mais recente registrada para esta revisão, `npm test` concluiu com **7 aprovados e 0 falhas**:

1. Cabeçalhos básicos de segurança HTTP.
2. Servir uma imagem da pasta do projeto.
3. Cadastrar e listar unidades.
4. Recusar cadastro duplicado.
5. Validar os 100 produtos e a ausência de nomes duplicados.
6. Mesclar o catálogo sem apagar alterações nem produtos personalizados.
7. Resolver imagens geradas existentes e fotos locais de fallback.

O arquivo `src/products.test.js` contém as validações de catálogo e imagens; `src/app.test.js` contém os testes da API. A quantidade de testes **não é cobertura de código**. Cobertura, desempenho prolongado e disponibilidade não foram medidos.

Verificações pontuais também registradas: o iniciador local respondeu em `http://localhost:3000`, `/api/health` retornou estado `ok`, e uma imagem de produto foi servida com HTTP 200 e MIME `image/png`. Isso comprova somente essas requisições naquela execução, não disponibilidade contínua.

### Plano de pelo menos dez cenários de sistema

Os primeiros sete cenários abaixo correspondem aos testes automatizados citados. Os demais estão pendentes de execução manual/automatizada. Complete entradas, resultados observados e evidências; não marque pendências como aprovadas sem executar.

| ID | Cenário, pré-condição e ação | Resultado esperado | Estado/evidência |
|---|---|---|---|
| CT-01 | Iniciar a suíte automatizada da API. | Cabeçalhos de segurança esperados presentes. | Aprovado na última execução registrada; `src/app.test.js`. |
| CT-02 | Solicitar uma imagem existente pela rota local `/imagens/`. | HTTP 200 e tipo de conteúdo de imagem. | Aprovado; `src/app.test.js`. |
| CT-03 | Enviar unidade válida e depois consultar listagem. | Cadastro aceito e unidade retornada. | Aprovado; `src/app.test.js`. |
| CT-04 | Cadastrar duas unidades com o mesmo código. | Segunda solicitação recusada como duplicada. | Aprovado; `src/app.test.js`. |
| CT-05 | Validar catálogo inicial carregado. | 100 produtos, IDs e nomes sem repetição, campos válidos. | Aprovado; `src/products.test.js`. |
| CT-06 | Combinar catálogo anterior com defaults. | Preservar customizações e incluir defaults ausentes. | Aprovado; `src/products.test.js`. |
| CT-07 | Resolver imagens do catálogo. | Arquivos gerados existentes identificados e fallback local válido. | Aprovado; `src/products.test.js`. |
| CT-08 | Sem sessão, abrir a área do cliente; depois autenticar como cliente e sair. | Redirecionar ao login; após login abrir área; sair encerra sessão. | Pendente; executar e anexar evidência própria. |
| CT-09 | Adicionar item com oferta ao carrinho e concluir pedido demonstrativo. | Preço e total devem corresponder ao valor exibido; registrar qualquer divergência observada. | Pendente; executar e registrar. |
| CT-10 | Como administrador/loja, cadastrar produto com valores válidos e foto; tentar formato inválido. | Cadastro válido persistido no navegador; formato inválido informado/recusado. | Pendente; executar e registrar. |
| CT-11 | Abrir o cardápio em celular e desktop e percorrer filtros. | Categorias/imagens visíveis, navegação utilizável e sem rolagem horizontal inesperada. | Pendente para esta execução; medir larguras e navegador. |
| CT-12 | Abrir a publicação do GitHub Pages (se publicada). | Interface e imagens estáticas carregam; API de unidades é identificada como indisponível sem backend. | Pendente; Pages não foi implantado/verificado. |

**Rastreabilidade inicial — completar após confirmar requisitos e executar cenários:**

| Requisito | Teste(s) | Evidência | Estado |
|---|---|---|---|
| RF-01 | CT-05, CT-11 | `src/products.test.js`; captura/teste visual a coletar | Parcial |
| RF-02 | CT-09 | Evidência manual a coletar | Pendente |
| RF-03 | CT-10 | Evidência manual a coletar | Pendente |
| RF-04 | CT-03, CT-04 | `src/app.test.js` | Aprovado para os cenários automatizados |
| RF-05 | CT-02, CT-07, CT-12 | `src/app.test.js`, `src/products.test.js`; Pages pendente | Parcial |
| RNF-01 a RNF-08 | [Associar cenários após definir requisitos] | [Indicar evidência mensurável] | Pendente |

## 6. Registro de defeitos, riscos e limitações

O sistema é adequado para demonstração didática, condicionado à apresentação transparente dos limites. A avaliação anterior em `docs/avaliacao-do-sistema.md` descreve riscos que continuam relevantes ao escopo:

| Risco/limitação | Evidência no sistema | Consequência e encaminhamento |
|---|---|---|
| Autenticação e perfis ficam no navegador. | Contas/sessão em JavaScript e `localStorage`; API sem autorização de usuário. | Não usar contas ou dados reais; autenticação/autorização de servidor fica como melhoria futura. |
| Dados de negócio são locais ao navegador. | Produtos, carrinho, fotos e pedidos ficam no `localStorage`; API trata unidades. | Não há sincronização entre dispositivos/usuários; backend persistente seria necessário. |
| Pagamentos e entregas não são reais. | Não há integração com provedor de pagamento ou serviço de entrega. | Não afirmar que o pedido foi pago, aceito por loja ou enviado. |
| GitHub Pages é somente estático. | Não executa Node/Express. | A API de unidades requer backend hospedado; implantação Pages não comprova integração de backend. |
| Métricas de qualidade não estão todas medidas. | Não há medição de cobertura, carga prolongada, disponibilidade contínua ou satisfação. | Registrar como não medido; não inferir resultado a partir da suíte. |
| Avaliação anterior pode conter fatos de versão anterior. | `docs/avaliacao-do-sistema.md` descreve descobertas antigas; código e testes foram alterados depois. | Revalidar cada achado e atualizar o parecer após os testes manuais pendentes. |

**Critério de bloqueio proposto para discutir com o professor:** não alegar aprovação de requisito obrigatório, segurança de produção ou integração real sem evidência repetível e verificável. Escreva aqui o critério oficial depois de consultar o PDF: [Preencher].

## 7. Plano de qualidade e responsabilidades

| Atividade | Responsável | Data/prazo | Evidência |
|---|---|---|---|
| Análise dos requisitos | [Preencher] | [Preencher] | [Preencher] |
| Implementação | [Preencher] | [Preencher] | [Preencher] |
| Revisão | [Preencher] | [Preencher] | [Preencher] |
| Testes funcionais e regressão | [Preencher] | [Preencher] | [Preencher] |
| Validação com usuário/professor | [Preencher] | [Preencher] | [Preencher] |
| Aprovação final | [Preencher] | [Preencher] | [Preencher] |

Em projeto individual, registre que a mesma pessoa acumulou responsabilidades distintas e descreva como fez revisão e validação independentes, quando aplicável.

## 8. Privacidade e dados demonstrativos

Não inserir dados reais de clientes na apresentação. O inventário abaixo descreve o funcionamento implementado; confirme no navegador e complete a decisão de minimização:

| Dado | Finalidade no protótipo | Armazenamento conhecido | Ação/necessidade a validar |
|---|---|---|---|
| E-mail e dados de conta demo | Entrar e identificar perfil demonstrativo | `localStorage` do navegador | Usar somente contas de demonstração; [avaliar necessidade] |
| Sessão/perfil | Manter navegação do perfil | `localStorage` do navegador | [Definir limpeza e explicar ao usuário] |
| Produtos e foto enviada | Catálogo/inventário demonstrativo | `localStorage` do navegador | Não sincronizado ao servidor; [definir retenção] |
| Carrinho e dados do pedido | Simular compra e histórico | `localStorage` do navegador | Usar endereço/telefone fictício; [definir remoção] |
| Unidades | Cadastro/listagem da API | `data/raizes.json` no servidor local | Usar dados fictícios na banca. |

**Observação:** este inventário não é avaliação jurídica nem certificação de conformidade com a LGPD.

## 9. Indicadores de qualidade — resultados não medidos

O guia pede fórmula, meta, período/fonte e resultado. Não há dados suficientes neste workspace para inventar metas ou declarar métricas. Defina e colete os valores conforme o roteiro oficial.

| Indicador | Fórmula/método definido pelo estudante | Meta justificada | Período/fonte | Resultado medido |
|---|---|---|---|---|
| Taxa de defeitos | [Definir] | [Definir] | [Definir] | Não medido |
| Cobertura de testes | Executar ferramenta de cobertura; não usar contagem de testes como substituto. | [Definir] | [Definir] | Não medido |
| Tempo de resposta | [Definir métrica/percentil, carga e ambiente] | [Definir] | [Definir] | Não medido; houve apenas verificação pontual HTTP 200. |
| Disponibilidade | Monitorar sucessos/checagens num intervalo definido. | [Definir] | [Definir] | Não medido continuamente. |
| Satisfação | Coletar respostas de participantes com método definido. | [Definir] | [Definir] | Não coletado. |
| MTTR | Calcular a partir de registros de detecção e resolução de defeitos. | [Definir] | [Definir] | Não medido; não há histórico de incidentes suficiente. |

## 10. Conclusão provisória para apresentação

As evidências automatizadas registradas sustentam que o catálogo contém 100 produtos válidos, que os recursos de imagem locais e as associações verificadas funcionam e que os fluxos testados da API de unidades respondem como esperado. O servidor local é o modo indicado para demonstrar as funcionalidades que dependem de Express. A publicação estática no GitHub Pages pode servir a interface, mas não substitui a API.

O parecer final depende de executar os cenários pendentes, definir e medir os oito requisitos de qualidade, completar a rastreabilidade e comparar o documento com o roteiro oficial. Até lá, a conclusão deve permanecer limitada: **protótipo didático demonstrável, sem evidência suficiente para alegar prontidão comercial, segurança de produção ou qualidade quantitativa abrangente.**

**Conclusão e reflexão do estudante, em palavras próprias:** [Completar após a validação.]

## 11. Roteiro curto para a apresentação oral

1. Apresentar problema, público e objetivo do protótipo.
2. Explicar arquitetura: interface, Express, API de unidades e armazenamento local.
3. Demonstrar a inicialização pelo `iniciar-servidor.bat`, cardápio, imagem, fluxo de cliente e uma função administrativa.
4. Apresentar evidências dos testes automatizados e diferenciar teste aprovado de cenário pendente.
5. Explicar riscos/limitações: perfis no cliente, `localStorage`, API não integrada ao pedido e limitações do Pages.
6. Apresentar os requisitos de qualidade e resultados medidos pelo grupo, sem confundir metas planejadas com resultados.
7. Encerrar com melhorias priorizadas e limitações assumidas.

## 12. Uso de IA e referências

**Declaração a adaptar conforme a política da disciplina:** foi utilizado um assistente de IA para ajudar a localizar e sintetizar documentos do projeto e estruturar este rascunho. O estudante deve informar o pedido realizado, as partes aproveitadas, as verificações e alterações próprias e a análise independente, conforme o formato solicitado pelo professor.

Referências internas:

- `docs/guia-passo-a-passo-melhorias-qualidade.md` — orientações de análise, oito requisitos mensuráveis, dez cenários de sistema, rastreabilidade, privacidade, métricas e transparência no uso de IA.
- `docs/avaliacao-do-sistema.md` — avaliação anterior; validar achados à luz da versão atual.
- `README.md` — execução, perfis, armazenamento e limites da publicação.
- `src/app.test.js` e `src/products.test.js` — testes automatizados existentes.
- Roteiro oficial da atividade, revisão 0.3 (2026) — **arquivo referenciado pelo guia, mas não localizado no workspace; consultar o professor/fornecer o PDF para conferência dos critérios oficiais.**
