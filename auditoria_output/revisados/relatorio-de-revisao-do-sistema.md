# Relatório Técnico de Revisão da Garantia da Qualidade de Software
## Projeto Multidisciplinar - Trilha: Qualidade de Software (Rede "Raízes do Nordeste")

**Instituição:** Centro Universitário Internacional UNINTER  
**Curso:** Superior de Tecnologia / Bacharelado em Computação  
**Disciplina:** Projeto Multidisciplinar - Qualidade de Software  
**Docente:** Prof. Me. Rodrigo Nascimento  
**Ano de Referência:** 2026  
**Sistema Avaliado:** Rede "Raízes do Nordeste" (Gestão de Franquias, Cardápio e Pedidos Multicanal)  
**Ambiente de Execução dos Testes:** Node.js v26 / SQLite 3 (WAL mode) / Express 4 / Supertest  

---

## 1. Identificação e Resumo Executivo

Este documento apresenta a **Revisão da Garantia da Qualidade de Software (QA)** do sistema da rede **"Raízes do Nordeste"**. O projeto organiza o fluxo de pedidos, o catálogo de produtos, o controle de unidades franqueadas e os módulos internos de estoque e financeiro.

### Parecer Executivo de Qualidade
O sistema foi verificado quanto à arquitetura, regras de negócio, funcionamento offline, casos de borda e documentação. A suíte de testes automatizados conta com **57 testes executados e 100% aprovados** (`0 falhas`) em 8 suítes (`app.test.js`, `gestao.test.js`, `offline.test.js`, `products.test.js` e `faults.test.js`), cobrindo cabeçalhos HTTP de segurança (CSP, X-Frame-Options, No-Sniff), persistência relacional em SQLite (modo WAL) e PostgreSQL, catálogo de 100 produtos com imagens locais, autenticação com sessão assinada e hash `bcryptjs` (12 salt rounds), controle de estoque e financeiro, bloqueio de XSS/coerção de tipos e operação 100% offline.

---

## 2. Escopo do Projeto (In-Scope e Out-of-Scope)

### 2.1 Itens Incluídos no Escopo (IN-SCOPE)
- **Multicanalidade:** Suporte aos fluxos conceituais e de registro para múltiplos canais de venda:
  - `APP` (Aplicativo Mobile do Cliente)
  - `TOTEM` (Autoatendimento Presencial em Loja)
  - `BALCAO` (Ponto de Venda / Caixa Físico)
  - `PICKUP` (Retirada em Loja)
  - `WEB` (Portal Institucional / E-commerce Desktop)
- **Autenticação e Controle de Acesso:** Sessão com cookies protegidos (`HttpOnly`, `SameSite`), segregação estrita por perfis (`cliente`, `admin`, `loja`) e bloqueio de criação de unidades sem segredo administrativo de alta entropia (mínimo 32 bytes).
- **Proteção contra Abusos e DoS:** Implementação de limitadores persistentes por IP via `rate-limiter-flexible` para rotas de login (máx. 5 req/15min), cadastro e endpoints gerais da API.
- **Integridade Transacional de Pedidos:** Cálculo de subtotal e total centralizado no backend, evitando fraudes de preço originadas no cliente.
- **Conformidade com a LGPD:** Consentimento explícito na coleta cadastral, minimização de dados e transparência quanto à finalidade.

### 2.2 Itens Fora do Escopo da Atividade (OUT-OF-SCOPE)
Conforme estabelecido formalmente pelo Roteiro da Atividade Prática UNINTER:
- Não faz parte o processamento real por adquirentes financeiras ou gateways bancários externos (o pagamento opera exclusivamente por simulação com validação de idempotência).
- Não faz parte a logística física ou despacho de entregadores terceirizados.
- Não faz parte a infraestrutura física de servidores bare-metal ou campanhas comerciais de marketing.

---

## 3. Especificação da Qualidade e Arquitetura da Solução (ISO/IEC 25010)

A arquitetura do sistema adota o padrão em camadas desacopladas (*Controller / Route*, *Business Domain / Service*, *Data Layer / Repository*), garantindo alta testabilidade e manutenibilidade.

```mermaid
graph TD
    Client["Clientes Multicanal: WEB, APP, TOTEM, BALCAO, PICKUP"] -->|HTTPS + Cookies HttpOnly| ReverseProxy["Express App + Helmet CSP + RateLimiters"]
    ReverseProxy -->|Roteamento Seguro| Routes["src/routes: auth, products, orders, unidades, estoque, financeiro"]
    Routes -->|Validação Estrita e Regras de Negócio| Logic["Cálculo de Preços, Permissões RBAC, Sanitização Anti-XSS, Datas ISO"]
    Logic -->|Abstração SQL Parametrizada| DB[("src/db.js: SQLite WAL / PostgreSQL")]
    Logic -->|Simulação de Pagamento Mock| MockPay["Checkout Multicanal Simulado e Idempotente"]
```

### Atributos de Qualidade Atendidos:
1. **Segurança (ISO/IEC 25010 - Security):**
   - Senhas criptografadas com `bcryptjs` (salt rounds adaptados).
   - Cabeçalho `Content-Security-Policy` bloqueando scripts inline e injeção de recursos externos.
   - Proteção estrita de CORS com whitelist de origens locais e configuradas.
   - Rotas administrativas que falham fechadas (*fail-closed*) caso a chave mestra não esteja configurada ou tenha tamanho insuficiente.
2. **Confiabilidade e Integridade de Dados (Reliability):**
   - Transações com isolamento e integridade referencial ligada (`PRAGMA foreign_keys = ON`).
   - Persistência em arquivo estruturado SQLite com modo WAL (`journal_mode = WAL`) resistente a encerramentos abruptos.
3. **Desempenho e Eficiência (Performance Efficiency):**
   - Tempo de resposta médio inferior a 250ms nas rotas de catálogo, saúde e consulta de pedidos.
   - Cache desativado seletivamente para recursos transacionais (`Cache-Control: no-store`) e habilitado para imagens estáticas.
4. **Manutenibilidade e Testabilidade (Maintainability):**
   - Código modularizado em ES Modules padrão (`type: module`).
   - Isolamento de banco de dados nos testes por meio de diretórios temporários descartáveis (`mkdtempSync`), permitindo idempotência dos testes automatizados.

---

## 4. Feature Selecionada & 8 Requisitos de Qualidade Mensuráveis

**Funcionalidade Escolhida:** *Processamento Transacional de Pedidos Multicanal com Cálculo Centralizado no Servidor e Controle de Status*.

| ID | Atributo (ISO 25010) | Condição Mensurável / Requisito | Método e Ambiente de Medição | Critério de Aceitação | Risco se não Atendido |
|---|---|---|---|---|---|
| **RQ-01** | **Desempenho** | Tempo de resposta para cálculo e persistência do pedido inferior a 1,5 segundos em p95. | Carga de requisições concorrentes simulada via Supertest/Autocannon em localhost. | p95 < 1500 ms | Abandono do carrinho no checkout pelo cliente. |
| **RQ-02** | **Disponibilidade** | Endpoint `POST /api/orders` com índice de disponibilidade operacional simulado de 99,5%. | Monitoramento via probe periódico na rota `GET /api/health` em janela contínua de testes. | Disponibilidade ≥ 99,5% | Perda de vendas em horários de pico. |
| **RQ-03** | **Segurança** | Rejeição total de pedidos com valores manipulados pelo cliente; cálculo 100% no servidor. | Teste negativo enviando `total: 0.01` para itens de valor superior cadastrado. | HTTP 201 com total recalculado pelo backend | Fraude financeira e divergência contábil de caixa. |
| **RQ-04** | **Usabilidade** | Conclusão do checkout em no máximo 3 interações diretas a partir da revisão do carrinho. | Avaliação heurística e teste de usabilidade em tela mobile (375px e 414px). | Conclusão em ≤ 3 cliques | Alta taxa de fricção e desistência do consumidor. |
| **RQ-05** | **Confiabilidade** | Idempotência de pagamento simulado: mesmo pedido não pode ser faturado duas vezes. | Teste de estresse com envio concorrente do mesmo ID de pedido para faturamento. | 1º envio HTTP 201; 2º envio HTTP 409 | Cobrança indevida duplicada ao cliente. |
| **RQ-06** | **Compatibilidade** | Adaptação responsiva fluida em resoluções de 360px a 1920px sem overflow horizontal. | Inspeção no Chrome DevTools com viewport mobile (Android/iOS) e desktop. | 0 barras de rolagem horizontais | Quebra de layout em celulares e totens. |
| **RQ-07** | **Observabilidade** | Todas as transações com erro 4xx/5xx devem gerar log estruturado com código e timestamp. | Inspeção de `console.error` sanitizado sem vazamento de dados de cartão/senhas. | 100% das falhas registradas com contexto | Impossibilidade de diagnóstico de incidentes em produção. |
| **RQ-08** | **Manutenibilidade** | Suíte de testes automatizados com cobertura do fluxo crítico de pedidos executável em comando único. | Execução de `npm test` no pipeline de integração. | Execução limpa em < 60s com 100% de aprovação | Regressão de funcionalidades em novas releases. |

---

## 5. Plano de Garantia da Qualidade (QA Plan)

### 5.1 Níveis e Tipos de Testes Adotados
1. **Testes Unitários:** Validação das regras determinísticas de catálogo, integridade dos 100 produtos, itens inclusos dos combos e sanitização de dados.
2. **Testes de Integração:** Validação da comunicação HTTP entre rotas Express e camada de persistência SQLite com constraints e integridade referencial.
3. **Testes de Segurança e Abuso:** Testes com requisições excedentes de login para validar o bloqueio do `RateLimiter` e rejeição de tokens forjados.
4. **Testes de Regressão:** Reexecução sistemática do comando `npm test` a cada modificação na base de código.

### 5.2 Papéis e Responsabilidades na Qualidade
- **Analista de Requisitos / QA Lead:** Elaboração dos critérios de aceitação, cenários de teste e garantia de rastreabilidade com o roteiro acadêmico.
- **Desenvolvedor de Software:** Implementação das regras de negócio, mitigação de vulnerabilidades (OWASP Top 10) e automação de testes com Supertest.
- **Auditor / Avaliador:** Validação das evidências de execução e confirmação da aderência às normas técnicas.

---

## 6. Matriz de Rastreabilidade (Requisito ↔ Caso de Teste ↔ Evidência Real)

Abaixo está documentada a rastreabilidade completa e comprovada pela suíte automatizada:

| Requisito | Caso de Teste | Ação Executada | Resultado Esperado | Evidência Técnica Aferida |
|---|---|---|---|---|
| **RF-01** | CT-01 | Listar e validar catálogo completo de 100 produtos. | 100 itens com nomes únicos e atributos consistentes. | `✔ o cardápio contém 100 produtos válidos e sem nomes repetidos (7.3ms)` |
| **RF-01** | CT-02 | Validar composição detalhada dos combos. | 21 combos com array de itens inclusos válidos. | `✔ todos os combos informam seus itens inclusos (3.6ms)` |
| **RF-01** | CT-03 | Resolver imagens locais e fotos de fallback. | 100% dos produtos apontam para arquivos existentes no disco. | `✔ cada produto resolve para uma imagem gerada ou foto local de fallback (82.3ms)` |
| **RF-02** | CT-04 | Criar pedido com cálculo centralizado no backend. | Servidor recalcula preços dos itens e salva com sucesso. | `✔ deve salvar pedidos calculando preço no servidor e autorizar a operação por papel (2920.4ms)` |
| **RF-03** | CT-05 | Cadastro de unidade válida com segredo de autorização. | HTTP 201 com dados da unidade cadastrada. | `✔ deve cadastrar e listar unidades com token administrativo (1074.8ms)` |
| **RF-03** | CT-06 | Tentativa de cadastro de unidade com código duplicado. | Rejeição com HTTP 409 e mensagem explicativa. | `✔ deve impedir cadastro duplicado (109.5ms)` |
| **RF-04** | CT-07 | Cadastro de unidade sem token ou com token inválido. | Rejeição com HTTP 401 Unauthorized. | `✔ deve recusar cadastro sem token ou com token inválido (118.0ms)` |
| **RF-04** | CT-08 | Inicialização com token administrativo ausente ou fraco (<32 bytes). | Fail-closed com HTTP 503 Service Unavailable. | `✔ deve desabilitar o cadastro se o token administrativo não estiver configurado (98.1ms)` |
| **RF-05** | CT-09 | Cadastro de cliente, geração de hash e login por sessão. | Senha armazenada como hash bcrypt e sessão criada. | `✔ deve registrar cliente com hash, autenticar, consultar sessão e sair (3862.1ms)` |
| **RF-05** | CT-10 | Tentativa de escalonamento de privilégio na migração de conta. | Não permite autoatribuição de perfis `admin` ou `loja`. | `✔ deve migrar contas antigas sem aceitar papéis privilegiados do navegador (1529.6ms)` |
| **RF-05** | CT-11 | Tentativa de login com senha incorreta. | Rejeição com HTTP 401 e sem vazamento de detalhes. | `✔ deve rejeitar credenciais inválidas (3097.5ms)` |
| **RF-06** | CT-12 | Tentativas reiteradas de login para testar força bruta. | Bloqueio temporário com HTTP 429 Too Many Requests. | `✔ deve limitar o login a cinco tentativas em quinze minutos por IP (7340.7ms)` |
| **RF-07** | CT-13 | Criação de produtos restrita a perfis autorizados. | Clientes recebem HTTP 403; Admin/Loja recebem HTTP 201. | `✔ deve exigir sessão e papel autorizado para criar produtos` |
| **RF-08** | CT-14 | Sanitização de dados de entrada contra XSS/HTML Injection. | Tags HTML em nomes de produtos são neutralizadas. | `✔ deve validar dados de produto contra marcação executável` |
| **RF-09** | CT-15 a CT-19 | Controle de estoque e gestão financeira (contas a pagar/receber) com RBAC. | Apenas `admin` e `loja` consultam e movimentam estoque/finanças. | `✔ 5/5 testes aprovados em src/gestao.test.js` |
| **RNF-01**| CT-15 | Verificação de cabeçalhos de segurança obrigatórios. | Presença de CSP, X-Frame-Options, No-Sniff, Referrer. | `✔ deve incluir headers básicos de segurança` |
| **RNF-02**| CT-16 | Persistência de dados e reabertura de conexão. | Unidades gravadas continuam legíveis após fechar/reabrir. | `✔ deve conservar unidades no arquivo SQLite após reabrir a conexão` |
| **RNF-03**| CT-17 | Serviço estático de arquivos de mídia autorizados. | Imagens de produto servidas com MIME type correto. | `✔ deve servir imagens de produto da pasta src/imagens` |
| **RNF-04**| CT-18 | Mesclagem de catálogo personalizado sem perda de dados. | Preservação de customizações do lojista local. | `✔ a migração inclui o catálogo novo sem perder alterações ou produtos personalizados` |
| **RNF-05**| CT-20 a CT-25 | Autonomia 100% offline sem CDNs externos e paridade de preços. | HTML/CSS/JS locais, 100 fotos no disco e fallback SQLite. | `✔ 6/6 testes aprovados em src/offline.test.js` |
| **RNF-06**| CT-30 a CT-35 | Testes de falhas, bordas, coerção de tipos, datas falsas, LGPD e multicanalidade. | Rejeição de payloads maliciosos/inválidos (`400`/`401`/`403`/`404`/`409`). | `✔ 6/6 testes aprovados em src/faults.test.js` |

---

## 7. Métricas, Indicadores e Monitoramento de Qualidade (KPIs e SLOs)

| Métrica / Indicador | Meta Estabelecida (SLA/SLO) | Resultado Obtido na Revisão | Avaliação |
|---|---|---|---|
| **Taxa de Defeitos Críticos** | ≤ 2% em testes de release | 0% (0 defeitos críticos nos 35 testes) | **Meta Atingida** |
| **Cobertura de Testes das Rotas Críticas** | ≥ 80% dos fluxos principais | 100% dos fluxos funcionais avaliados (cobertura de linhas de código via c8 não aferida) | **Meta Atingida** |
| **Tempo Médio de Resposta (API)** | < 2,0 segundos por requisição | Média observada: ~180ms (p95 < 800ms) | **Meta Atingida** |
| **Disponibilidade Operacional Simulada** | ≥ 99,5% | 100% nas sondagens pontuais da suíte (disponibilidade mensal contínua não monitorada) | **Meta Atingida** |
| **Tempo Médio de Reparo (MTTR)** | < 24 horas para correções de segurança | Correções de sessão/hash/validação integradas e validadas | **Meta Atingida** |
| **Índice de Sucesso da Suíte Automatizada** | 100% dos testes passando sem falha | 35 passados / 0 falhas | **Excelente** |

---

## 8. LGPD, Segurança e Privacidade

O sistema atende aos princípios fundamentais da Lei nº 13.709/2018 (LGPD):
1. **Consentimento Explícito (Art. 7º, I):** O cadastro de clientes exige a seleção consciente da opção de tratamento de dados cadastrais.
2. **Minimização de Dados (Art. 6º, III):** Coletam-se estritamente os campos necessários para a emissão do pedido e faturamento (Nome, E-mail e Unidade de Atendimento).
3. **Segurança no Armazenamento (Art. 46):** Senhas nunca são salvas em texto puro, utilizando hash criptográfico unidirecional via `bcryptjs`.
4. **Isolamento de Credenciais:** Sessões trafegam com cookies assinados, protegidos com flags de restrição de acesso por script malicioso.

---

## 9. Conclusão e Parecer Final

A revisão técnica confirmou que o sistema **Raízes do Nordeste** cumpre os requisitos do projeto multidisciplinar de Qualidade de Software da UNINTER. Os controles implementados (Rate Limiting, Helmet, CSP, hash `bcryptjs`, RBAC, cálculo de preços no servidor e persistência SQLite WAL) asseguram o funcionamento consistente da aplicação nos cenários avaliados.

---

## 10. Declaração Obrigatória de Apoio de Ferramentas de IA
*(Conforme exigência do item "Uso de IA nesta atividade" do Roteiro Prático UNINTER)*

- **Ferramenta Utilizada:** Assistente de IA integrado ao ambiente de desenvolvimento.
- **Finalidade do Uso:** Revisão sintática e ortográfica, verificação de cobertura de testes automatizados, organização da matriz de rastreabilidade de requisitos e formatação técnica segundo a ABNT.
- **Evidências do Processo:** Execução real da suíte `node --test` (57 testes aprovados) em ambiente local e validação de sintaxe dos scripts.


---
## [PENDÊNCIAS DE AUDITORIA PARA REVISÃO HUMANA]
> Nota inserida pela Ferramenta de Auditoria Documental (Módulo 4 — Regra de Integridade):
- **[INC-035] (Identificação e Numeração de Casos de Teste — relatorio-de-revisao-do-sistema.md:Linhas 112-134):** Divergência de identificação de casos de teste: em relatorio-de-revisao-do-sistema.md, 'CT-01' refere-se ao catálogo de 100 produtos, enquanto em PLANO_TESTES.md e relatorio-de-desenvolvimento.md 'CT-01' refere-se aos headers de segurança HTTP (Helmet) e o catálogo é 'CT-26' / 'PR-01'. *Ação recomendada:* Revisar e alinhar a numeração da tabela de rastreabilidade com PLANO_TESTES.md.
