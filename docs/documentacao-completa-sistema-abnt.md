# DOCUMENTAÇÃO TÉCNICA COMPLETA E RELATÓRIO DE GARANTIA DA QUALIDADE (PADRÃO ABNT)
## SISTEMA DE GESTÃO INTEGRADA E CARDÁPIO MULTICANAL — REDE 'RAÍZES DO NORDESTE'
**Instituição:** Centro Universitário Internacional UNINTER — Escola Superior Politécnica  
**Disciplina:** Projeto Multidisciplinar — Trilha: Qualidade de Software (2026)  
**Docente Orientador:** Prof. Me. Rodrigo Nascimento  
**Acadêmico / Autor:** Ronaldo Coutinho

---
## RESUMO
Este documento apresenta a documentação técnica completa, nos padrões da Associação Brasileira de Normas Técnicas (ABNT NBR 14724, NBR 6023 e NBR ISO/IEC 25010), do sistema de software desenvolvido para a rede 'Raízes do Nordeste'. O projeto abrange uma plataforma web full-stack multicanal (WEB, APP, TOTEM, BALCÃO e PICKUP) em Node.js e Express 4 com persistência híbrida em SQLite3 (modo WAL) e PostgreSQL, 5 páginas HTML e 9 módulos JavaScript 100% locais (zero CDNs), catálogo de 100 produtos regionais (com 21 combos e 100 imagens locais), autenticação via cookies assinados por HMAC-SHA256 (`HttpOnly`, `Secure`, `SameSite=Lax`), hash `bcryptjs` (`12 salt rounds`), RBAC (`cliente`, `loja` e `admin`), recálculo obrigatório de preços e baixa atômica de estoque no servidor, módulos de Controle de Estoque e Contas a Pagar/Receber, **57 testes automatizados em 8 suítes Node.js (100% aprovados)** e uma **Ferramenta de Auditoria e Correção Documental em Python 3 (11 módulos e 5 testes automatizados)**.

**Palavras-chave:** Qualidade de Software. Engenharia de Requisitos. ISO/IEC 25010. LGPD. Node.js. SQLite WAL. Testes Automatizados. Auditoria Documental em Python.

---
## 1. ARQUITETURA E COMPOSIÇÃO COMPLETA DO SISTEMA
- **Backend (`src/`):** `server.js`, `app.js` (Helmet CSP, Anti-Prototype Pollution, CORS, 4 Rate Limiters, `Cache-Control: no-store`), `auth.js` (HMAC-SHA256 + `timingSafeEqual` + `SameSite=Lax`), `db.js` (7 tabelas SQLite WAL / PostgreSQL: `users`, `sessions`, `unidades`, `products`, `orders`, `estoque_movimentacoes`, `financeiro_lancamentos`) e 6 roteadores em `src/routes/` (`auth.js`, `products.js`, `orders.js`, `unidades.js`, `estoque.js`, `financeiro.js`) totalizando **21 endpoints REST**.
- **Frontend (`public/`):** 5 páginas HTML (`index.html`, `login.html`, `cliente.html`, `admin.html`, `operacional.html`), `style.css` e 9 módulos JavaScript (`config.js`, `products.js`, `auth.js`, `app.js`, `login.js`, `cliente.js`, `admin.js`, `operacional.js`, `gestao.js`) operando 100% offline.
- **Suíte Automatizada Node.js (`57 testes automatizados` em `8 suítes`):** `src/app.test.js` (14), `src/faults.test.js` (7), `src/gestao.test.js` (5), `src/offline.test.js` (6), `src/products.test.js` (4), `src/frontend.test.js` (8), `src/backend.test.js` (6) e `src/qualidade.test.js` (7) — **57 aprovados / 0 falhas**.
- **Ferramenta de Auditoria Documental Python (`11 módulos`):** `main.py`, `interface.py`, `leitor_documentos.py`, `consistencia.py`, `auditoria.py`, `correcao.py`, `gerador_relatorios.py`, `exportacao.py`, `backup.py`, `logs.py` e `test_auditoria.py` (**5 testes automatizados aprovados**).
