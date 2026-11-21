# Registro de Transparência no Uso de Ferramentas de IA

*(Em conformidade com o item "Uso de IA nesta atividade" do Roteiro de Atividade Prática UNINTER 2026)*

- **Ferramenta Utilizada:** Assistente de IA integrado ao ambiente de desenvolvimento.
- **Finalidade do Uso:**
  1. Revisão ortográfica, gramatical e adequação do estilo textual (remoção de vícios de linguagem automatizados, excesso de travessões e clichês com base no guia *Wikipedia:Signs of AI writing* / *Wikipédia:Sinais de texto gerado por inteligência artificial*).
  2. Apoio na verificação de casos de borda, coerção de tipos, validação de datas ISO e testes negativos automatizados (`src/faults.test.js`).
  3. Compilação e sincronização da matriz de rastreabilidade (Requisito ↔ Caso de Teste ↔ Evidência) a partir dos resultados reais da suíte `node --test`.
- **Prompts Relevantes Empregados:**
  - *"crie o relatorio de desenvolvimento em doc descrevendo todo o processo"*
  - *"teste todas as falha e bugs possiveis e aprimore as documentações"*
  - *"verifique no codigo usando a wikipedia palavras e indicios no codigo que indicam o uso de ia e humanize o codigo e aprimore"*
- **Evidências do Processo e Validação Própria:**
  - Todas as regras de negócio, arquitetura em camadas, persistência relacional SQLite (modo WAL), controles RBAC, consentimento LGPD e as 8 suítes de testes automatizados (`35 testes` com `0 falhas`) foram executados e verificados no repositório local.
