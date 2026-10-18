# Mapeamento de requisitos — protótipo de referência

| ID | Requisito | Endpoint | Situação |
|---|---|---|---|
| RF01 | Unidades | GET/POST /api/unidades; PATCH /api/unidades/:id | Protótipo |
| RF02 | Produtos por unidade | GET /api/unidades/:id/produtos; POST/PATCH /api/produtos | Protótipo |
| RF03 | Clientes e consentimento | POST /api/clientes | Parcial (sem ciclo LGPD) |
| RF04 | Promoções | POST /api/promocoes | Parcial (sem validade temporal) |
| RF05 | Pedidos multicanal | POST /api/pedidos | Protótipo |
| RF06 | Acompanhamento de pedido | GET /api/pedidos/:id; PATCH /api/pedidos/:id/status | Protótipo |
| RF07 | Pagamento simulado | POST /api/pagamentos/simular | Protótipo |
| RF08 | Pontuação de fidelidade | GET /api/clientes/:id/pontos | Parcial (sem resgate) |
| RF09 | Indicadores | GET /api/indicadores | Protótipo |
| RNF01 | Responsividade | public/style.css | Implementação inicial, não validada em dispositivos |
| RNF02 | Segurança e LGPD | Validação básica; aviso no README | **Não atendido integralmente** |
| RNF03 | Testabilidade | tests/api.test.js | Parcial |

**Atenção:** não declarar conformidade completa com o roteiro ou com a LGPD sem evidências e implementação dos controles ausentes.
