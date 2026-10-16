# Guia passo a passo: aplicar melhorias de qualidade

## Finalidade deste guia

Este material é um roteiro de estudo e execução para ajudar você a analisar e melhorar o sistema. **Não é um relatório acadêmico pronto nem substitui suas decisões, implementação, testes ou análise.** Preencha os campos com o que você observar e fizer.

O roteiro da atividade restringe o uso de IA para produzir a solução, o código final e respostas prontas. Se utilizar este guia, declare o uso da ferramenta conforme as instruções do professor. Não apresente conteúdo sugerido por IA como se fosse uma análise ou evidência produzida por você.

## Etapa 1 — Entenda o problema e o sistema atual

1. Leia o roteiro da atividade por inteiro e destaque os itens obrigatórios.
2. Inicie a aplicação seguindo as instruções do `README.md`.
3. Percorra cada perfil e observe o comportamento real, sem presumir que uma função existe porque aparece na interface.
4. Consulte o código relacionado à função que está analisando e anote o que ele faz.
5. Diferencie os fatos observados das hipóteses.

**Anotações próprias**

- Funcionalidade analisada: __________________________________________
- Perfil ou usuário envolvido: ________________________________________
- Comportamento observado: ___________________________________________
- Evidência coletada (tela, arquivo, teste ou resposta): _______________
- Dúvidas a investigar: _______________________________________________

## Etapa 2 — Escolha uma funcionalidade e delimite o escopo

1. Escolha uma funcionalidade que possa ser analisada e testada no projeto.
2. Descreva onde ela começa e termina: dados de entrada, etapas, resultado e possíveis falhas.
3. Identifique os perfis, canais e unidades que podem participar do fluxo.
4. Separe o que será tratado nesta atividade do que não será implementado, como integrações reais que o protótipo não possui.
5. Confirme com o professor se a funcionalidade escolhida atende à proposta da atividade.

**Delimitação**

- Funcionalidade: ____________________________________________________
- Incluído no trabalho: ______________________________________________
- Fora do escopo: ____________________________________________________
- Perfis, canais ou unidades considerados: ___________________________
- Justificativa da escolha, escrita por você: _________________________

## Etapa 3 — Levante requisitos funcionais e de qualidade

1. Registre o que o usuário precisa conseguir fazer como requisito funcional.
2. Para cada necessidade, escreva uma condição que possa ser verificada objetivamente.
3. Para a funcionalidade escolhida, elabore os oito requisitos de qualidade mensuráveis exigidos no roteiro.
4. Considere atributos pertinentes, como desempenho, disponibilidade, segurança, usabilidade, confiabilidade, compatibilidade, observabilidade e manutenibilidade.
5. Defina para cada requisito como será medido, em qual ambiente e qual resultado será considerado aceitável.
6. Revise os requisitos para remover termos vagos, como “rápido”, “seguro” ou “fácil”, sem uma medida ou critério associado.

**Ficha para cada requisito**

- Identificador: __________
- Necessidade atendida: _______________________________________________
- Condição mensurável definida por mim: _______________________________
- Método de medição: __________________________________________________
- Critério de aceitação: ______________________________________________
- Risco se não for atendido: _________________________________________

Duplique a ficha até documentar os requisitos necessários. Não use metas sem justificar como elas serão medidas.

## Etapa 4 — Planeje a qualidade antes de alterar o sistema

1. Defina como mudanças serão revisadas antes de serem consideradas prontas.
2. Identifique quem será responsável por implementar, revisar, testar e aprovar cada mudança. Em um projeto individual, registre as responsabilidades que você acumulou.
3. Monte um cronograma realista de análise, implementação, testes, correções e revisão.
4. Estabeleça critérios para bloquear uma entrega, por exemplo, falha crítica ou requisito obrigatório não verificado.
5. Mantenha um registro de riscos, decisões e defeitos encontrados.

**Planejamento**

- Responsável pela implementação: ____________________________________
- Responsável pela revisão: __________________________________________
- Responsável pela validação de negócio: ______________________________
- Datas ou etapas do cronograma: ______________________________________
- Critérios para impedir a aprovação: __________________________________
- Principais riscos identificados: ____________________________________

## Etapa 5 — Desenhe os testes e a rastreabilidade

1. Escreva os casos de teste antes de executar as mudanças.
2. Inclua pelo menos dez cenários de sistema, positivos e negativos, como exige o roteiro. Os cenários devem vir dos requisitos e das regras que você observou.
3. Para cada cenário, registre pré-condições, entradas, passos, resultado esperado e mensagens de erro esperadas.
4. Planeje testes unitários, de integração, de sistema, regressão e aceitação.
5. Planeje também usabilidade, responsividade móvel, segurança e desempenho; indique quando algum teste não puder ser executado e por quê.
6. Associe cada requisito a um ou mais testes e a uma evidência identificável.

**Modelo de caso de teste em branco**

| Campo | Preenchimento próprio |
|---|---|
| ID e requisito relacionado | |
| Objetivo | |
| Pré-condições | |
| Entrada e passos | |
| Resultado esperado, incluindo erro ou mensagem | |
| Resultado observado | |
| Estado (aprovado, reprovado, bloqueado, não executado) | |
| Evidência e localização | |

**Rastreabilidade**

| Requisito | Caso(s) de teste | Evidência produzida | Estado |
|---|---|---|---|
| | | | |

Acrescente linhas até cobrir todos os requisitos. Não marque um teste como aprovado antes de executá-lo.

## Etapa 6 — Implemente em mudanças pequenas e verificáveis

1. Leia o código e identifique o ponto responsável por cada etapa do fluxo.
2. Descreva a mudança que você pretende fazer e o comportamento que não deve regredir.
3. Implemente uma mudança por vez, seguindo os padrões existentes no projeto.
4. Evite tratar dados do navegador como se fossem uma validação confiável do servidor.
5. Para integrações que não existem, mantenha a simulação identificada como simulação; não represente um pagamento, uma autorização ou uma persistência como reais.
6. Após cada mudança, execute os testes pertinentes e registre o resultado.
7. Se um teste falhar, investigue a causa antes de alterar outras partes.

**Registro da mudança**

- Problema que observei: ______________________________________________
- Arquivo ou componente que investiguei: ______________________________
- Alteração que decidi realizar: ______________________________________
- Comportamento existente a preservar: ________________________________
- Testes executados depois da mudança: ________________________________

## Etapa 7 — Trate dados pessoais e privacidade com cuidado

1. Faça um inventário dos dados solicitados, armazenados, exibidos e compartilhados.
2. Pergunte se cada dado é realmente necessário para a finalidade demonstrativa.
3. Explique ao usuário, em linguagem clara, a finalidade e o armazenamento que de fato existem.
4. Avalie como o usuário pode evitar fornecer dados ou remover dados demonstrativos, sem criar controles que não funcionem.
5. Teste os fluxos de aceitação, recusa, cancelamento e remoção, quando aplicável.
6. Não inclua senhas, dados reais de clientes ou informações sensíveis nas evidências.
7. Valide interpretações e obrigações legais com o professor ou pessoa qualificada. Este guia não é aconselhamento jurídico nem certificação de conformidade com a LGPD.

**Inventário próprio**

| Dado observado | Finalidade real no protótipo | Onde fica armazenado | É necessário? | Ação decidida |
|---|---|---|---|---|
| | | | | |

## Etapa 8 — Execute os testes e preserve evidências

1. Anote a versão do código, data, ambiente e navegador usados.
2. Preserve os dados locais antes de executar testes que possam redefini-los.
3. Execute primeiro os testes unitários e de integração; depois os de sistema e regressão.
4. Execute manualmente os cenários de aceitação e usabilidade com os perfis e dispositivos previstos.
5. Registre tempos, respostas, erros e limitações do ambiente.
6. Guarde evidências sem expor credenciais ou dados pessoais.
7. Ao fim, restaure os dados que deveriam ser preservados e confirme que a aplicação continua inicializando.

**Registro de execução**

- Data e hora: ___________________
- Versão ou estado do código: ___________________
- Ambiente e navegador: _________________________
- Testes executados e totais: ____________________
- Falhas encontradas: ___________________________
- Evidências e localização: ______________________
- Dados preservados/restaurados: _________________

## Etapa 9 — Meça indicadores sem inventar resultados

1. Para cada métrica obrigatória do roteiro, defina a fórmula, fonte dos dados, frequência de coleta, meta e responsável.
2. Meça cobertura com uma ferramenta ou método declarado; não estime cobertura a partir da quantidade de testes.
3. Meça desempenho em uma carga e ambiente descritos, registrando percentis e erros além da média.
4. Trate disponibilidade como uma medição contínua por período definido; uma verificação pontual não comprova disponibilidade mensal.
5. Colete satisfação com participantes e método declarados; não substitua opiniões reais por suposições.
6. Calcule MTTR apenas quando houver registros de identificação, correção e disponibilização de defeitos.
7. Separe metas planejadas de resultados efetivamente medidos.

| Indicador | Fórmula ou método definido por mim | Meta | Período/fonte | Resultado medido |
|---|---|---|---|---|
| Taxa de defeitos | | | | |
| Cobertura de testes | | | | |
| Tempo de resposta | | | | |
| Disponibilidade | | | | |
| Satisfação | | | | |
| MTTR | | | | |

## Etapa 10 — Faça revisão final e organize seu próprio material

1. Confirme a rastreabilidade requisito → teste → evidência.
2. Verifique se todo resultado apresentado foi realmente observado ou medido.
3. Identifique testes bloqueados, não executados e limitações, sem ocultá-los.
4. Faça uma regressão dos fluxos que já funcionavam antes das mudanças.
5. Organize o trabalho conforme as seções e exigências de entrega do roteiro e as orientações do professor.
6. Revise texto, referências, formatação e eventuais requisitos de ABNT por conta própria.
7. Declare o uso de IA se aproveitar este material, seguindo o formato solicitado pelo professor.

## Registro de uso de IA

Preencha com transparência conforme a orientação institucional:

- Ferramenta utilizada: __________________________________________________
- Prompt ou pedido feito: ________________________________________________
- Parte deste guia consultada: ___________________________________________
- Como a orientação foi usada e que análise própria foi realizada: _________

## Referência principal

Roteiro de Atividade Prática de Projeto Multidisciplinar — Trilha Qualidade de Software, Rede “Raízes do Nordeste”, revisão 0.3, 2026. Consulte o [arquivo fornecido pelo professor](../Roteiro_de_Atividade_Pratica_2026_Projeto_Qualidade_rev_0_3.pdf) para os requisitos, critérios e regras de entrega oficiais.
