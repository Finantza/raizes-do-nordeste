# Plano de testes — roteiro de execução do estudante

## Tipos
Unitários (regras de desconto e pontos, a extrair para funções puras), integração (API/SQLite), sistema (fluxo ponta a ponta), regressão (a cada alteração), aceitação (com usuários), usabilidade (tarefas observadas), desempenho (carga controlada), segurança (autorização e entradas inválidas) e responsividade (larguras e navegadores).

## Cenários sugeridos (executar e guardar evidências)
| Caso | Ação | Resultado esperado |
|---|---|---|
| CT01 | Criar unidade válida | HTTP 201 |
| CT02 | Repetir código da unidade | HTTP 409 |
| CT03 | Criar produto com unidade inexistente | HTTP 400 |
| CT04 | Criar produto válido | HTTP 201 |
| CT05 | Criar cliente com e-mail inválido | HTTP 400 |
| CT06 | Criar promoção com 95% | HTTP 400 |
| CT07 | Criar pedido com item disponível | HTTP 201 e total correto |
| CT08 | Aplicar cupom de outra unidade | HTTP 400 |
| CT09 | Pular status de RECEBIDO para ENTREGUE | HTTP 400 |
| CT10 | Simular pagamento aprovado | HTTP 201 e pontos previstos |
| CT11 | Pagar mesmo pedido duas vezes | HTTP 409 |
| CT12 | Consultar pedido inexistente | HTTP 404 |

## Metas propostas para medição, não resultados alcançados
Cobertura automatizada ≥80%; tempo de resposta p95 <2s sob carga definida; disponibilidade mensal ≥99,5%; defeitos críticos corrigidos em <24h; satisfação de usuários >85%; taxa de falhas críticas ≤2%. Medir e documentar metodologia antes de alegar cumprimento.

## Rastreabilidade e Evidências Reais de Execução
| Requisito | Teste | Cenário / Ação | Resultado Esperado | Status / Evidência Real (`npm test`) |
|---|---|---|---|---|
| RF01 | CT01 | Criar unidade válida via API | HTTP 201 com código e nome | **Aprovado** (`deve cadastrar e listar unidades com token administrativo`) |
| RF01 | CT02 | Repetir código cadastrado de unidade | HTTP 409 Conflict | **Aprovado** (`deve impedir cadastro duplicado`) |
| RF02 | CT03 | Validar catálogo de 100 produtos únicos | Nomes únicos e dados íntegros | **Aprovado** (`o cardápio contém 100 produtos válidos e sem nomes repetidos`) |
| RF02 | CT04 | Validar combos e itens inclusos | 21 combos com itens descritos | **Aprovado** (`todos os combos informam seus itens inclusos`) |
| RF03 | CT05 | Cadastro de cliente com consentimento e hash | HTTP 201 e senha criptografada | **Aprovado** (`deve registrar cliente com hash, autenticar, consultar sessão e sair`) |
| RF04 | CT06 | Rejeição de escalonamento na migração | Impede papéis admin forjados | **Aprovado** (`deve migrar contas antigas sem aceitar papéis privilegiados`) |
| RF05 | CT07 | Criar pedido com cálculo centralizado | HTTP 201 e total recalculado | **Aprovado** (`deve salvar pedidos calculando preço no servidor`) |
| RF06 | CT08 | Proteção de criação de produtos por perfil | Apenas admin e loja autorizados | **Aprovado** (`deve exigir sessão e papel autorizado para criar produtos`) |
| RF07 | CT09 | Rejeição de autenticação com senha inválida | HTTP 401 Credenciais inválidas | **Aprovado** (`deve rejeitar credenciais inválidas`) |
| RF08 | CT10 | Proteção contra ataques de força bruta | HTTP 429 Too Many Requests | **Aprovado** (`deve limitar o login a cinco tentativas em 15min`) |
| RF09 | CT11 | Sanitização de dados de entrada | Neutralização de tags HTML | **Aprovado** (`deve validar dados de produto contra marcação executável`) |
| RF10 | CT12 | Persistência relacional em arquivo SQLite | Preservação após reconexão | **Aprovado** (`deve conservar unidades no arquivo SQLite após reabrir`) |

**Registro de Execução:**
- **Data da Execução:** 18/10/2026
- **Ambiente:** Node.js v26 / SQLite 3 (WAL mode) / Express 4 / Supertest
- **Executor:** Suíte de testes automatizados (`node --test`)
- **Total de Testes:** 18 executados / 18 aprovados (0 falhas)
- **Defeitos Associados:** Nenhum defeito crítico pendente de resolução na suíte.

