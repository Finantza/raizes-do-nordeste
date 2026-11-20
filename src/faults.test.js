import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "raizes-faults-tests-"));
process.env.RAIZES_DB_PATH = path.join(testDataDir, "raizes-faults.sqlite");
const previousAdminToken = process.env.RAIZES_API_ADMIN_TOKEN;
const testAdminToken = "fault-test-admin-token-with-at-least-32-bytes";
process.env.RAIZES_API_ADMIN_TOKEN = testAdminToken;

const [{ default: app }, database, authModule] = await Promise.all([
  import("./app.js"),
  import("./db.js"),
  import("./auth.js")
]);

test.after(async () => {
  await database.closeDatabase();
  fs.rmSync(testDataDir, { recursive: true, force: true });
  delete process.env.RAIZES_DB_PATH;
  if (previousAdminToken === undefined) {
    delete process.env.RAIZES_API_ADMIN_TOKEN;
  } else {
    process.env.RAIZES_API_ADMIN_TOKEN = previousAdminToken;
  }
});

test.beforeEach(async () => {
  await database.resetDatabase();
});

let ipCounter = 10;
function nextIp() {
  ipCounter += 1;
  return `198.51.101.${ipCounter}`;
}

async function createAuthCookie(name, email, role) {
  await database.createUser({
    name,
    email,
    passwordHash: await bcrypt.hash("senha-valida-123", 4),
    role
  });
  const res = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", nextIp())
    .send({ email, password: "senha-valida-123" });
  assert.equal(res.status, 200);
  return res.headers["set-cookie"][0].split(";")[0];
}

test("Falhas de Protocolo e Segurança HTTP: JSON malformado (400), Rota inexistente (404), Origem CORS inválida (403) e Cookie corrompido", async () => {
  // 1. JSON malformado deve retornar 400 sem derrubar o servidor
  const badJson = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", nextIp())
    .set("Content-Type", "application/json")
    .send('{"email": "incompleto"');
  assert.equal(badJson.status, 400);
  assert.match(badJson.body.erro, /JSON inválido/i);

  // 2. Rota inexistente deve retornar 404 padronizado em JSON
  const notFound = await request(app)
    .get("/api/rota-que-nao-existe")
    .set("X-Forwarded-For", nextIp());
  assert.equal(notFound.status, 404);
  assert.match(notFound.body.erro, /não encontrado/i);

  // 3. Origem externa não autorizada no CORS deve retornar 403
  const forbiddenCors = await request(app)
    .get("/api/health")
    .set("X-Forwarded-For", nextIp())
    .set("Origin", "https://dominio-malicioso-externo.evil");
  assert.equal(forbiddenCors.status, 403);
  assert.match(forbiddenCors.body.erro, /Origem não permitida/i);

  // 4. Origem localhost deve ser aceita pelo CORS
  const allowedCors = await request(app)
    .get("/api/health")
    .set("X-Forwarded-For", nextIp())
    .set("Origin", "http://localhost:3000");
  assert.equal(allowedCors.status, 200);
  assert.equal(allowedCors.headers["access-control-allow-origin"], "http://localhost:3000");

  // 5. Cookie com URL encoding inválido ou tentativa de Prototype Pollution não deve causar erro 500
  const malformedCookie = await request(app)
    .get("/api/auth/me")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", "__proto__=polluted; constructor=bad; raizes_session=%E0%A4%A");
  assert.equal(malformedCookie.status, 401);
});

test("Falhas de Sessão e Autenticação: assinatura adulterada, sessão expirada, recusa LGPD e XSS no cadastro", async () => {
  // 1. Recusa explícita do consentimento LGPD deve bloquear cadastro (HTTP 400)
  const noLgpd = await request(app)
    .post("/api/auth/register")
    .set("X-Forwarded-For", nextIp())
    .send({
      name: "Cliente Sem LGPD",
      email: "sem.lgpd@example.com",
      password: "senha-forte-123",
      lgpdConsent: false
    });
  assert.equal(noLgpd.status, 400);

  // 2. Tentativa de XSS no nome do cliente deve ser rejeitada (HTTP 400)
  const xssName = await request(app)
    .post("/api/auth/register")
    .set("X-Forwarded-For", nextIp())
    .send({
      name: "<script>alert('xss')</script>",
      email: "xss.user@example.com",
      password: "senha-forte-123"
    });
  assert.equal(xssName.status, 400);

  // 3. Cadastro duplicado de mesmo e-mail deve retornar HTTP 409 Conflict
  const validReg = await request(app)
    .post("/api/auth/register")
    .set("X-Forwarded-For", nextIp())
    .send({
      name: "Cliente Único",
      email: "unico@example.com",
      password: "senha-forte-123",
      lgpdConsent: true
    });
  assert.equal(validReg.status, 201);

  const dupReg = await request(app)
    .post("/api/auth/register")
    .set("X-Forwarded-For", nextIp())
    .send({
      name: "Cliente Duplicado",
      email: "UNICO@example.com",
      password: "outra-senha-123"
    });
  assert.equal(dupReg.status, 409);

  // 4. Sessão com assinatura HMAC adulterada deve ser rejeitada (HTTP 401)
  const forgedCookie = "raizes_session=sessao-falsa.assinatura-invalida";
  const forgedRes = await request(app)
    .get("/api/auth/me")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", forgedCookie);
  assert.equal(forgedRes.status, 401);
  assert.equal(authModule.parseSignedSession("token.extra.parts"), null);
  assert.equal(authModule.parseSignedSession(null), null);

  // 5. Sessão expirada no banco deve ser removida e rejeitada com HTTP 401
  const user = await database.findUserByEmail("unico@example.com");
  const expiredSessionId = authModule.createSessionId();
  const pastDate = new Date(Date.now() - 60_000).toISOString();
  await database.createSession(expiredSessionId, user.id, pastDate);
  const foundExpired = await database.findSession(expiredSessionId);
  assert.equal(foundExpired, null);
});

test("Falhas de Validação em Unidades: tipos inválidos, códigos fora do padrão, UF inválida e XSS", async () => {
  const adminCookie = await createAuthCookie("Admin Unidades", "admin.unit@test.com", "admin");

  // Corpo como Array em vez de Objeto JSON
  const arrayBody = await request(app)
    .post("/api/unidades")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send(["invalido"]);
  assert.equal(arrayBody.status, 400);

  // Campos vazios
  const emptyFields = await request(app)
    .post("/api/unidades")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ codigo: "", nome: "Unidade", cidade: "Recife", estado: "PE" });
  assert.equal(emptyFields.status, 400);

  // Caracteres suspeitos (< >)
  const xssUnit = await request(app)
    .post("/api/unidades")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ codigo: "PE-01", nome: "Unidade <b>XSS</b>", cidade: "Recife", estado: "PE" });
  assert.equal(xssUnit.status, 400);

  // Código curto ou com caracteres especiais inválidos
  const badCode = await request(app)
    .post("/api/unidades")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ codigo: "A", nome: "Unidade Curta", cidade: "Recife", estado: "PE" });
  assert.equal(badCode.status, 400);

  // UF com 3 letras ou números
  const badState = await request(app)
    .post("/api/unidades")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ codigo: "PE-100", nome: "Unidade UF", cidade: "Recife", estado: "PER" });
  assert.equal(badState.status, 400);
});

test("Falhas de Coerção de Tipos e Limites em Produtos: null, boolean, strings vazias, imagens maliciosas e itensInclusos XSS", async () => {
  const adminCookie = await createAuthCookie("Admin Prod", "admin.prod.fault@test.com", "admin");

  // 1. Coerção de null/string vazia/boolean em preço e estoque (não deve aceitar null como 0)
  const nullPrice = await request(app)
    .post("/api/products")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ nome: "Produto Null", categoria: "Lanches", preco: null, estoque: 10 });
  assert.equal(nullPrice.status, 400);

  const emptyStock = await request(app)
    .post("/api/products")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ nome: "Produto Vazio", categoria: "Lanches", preco: 15, estoque: "" });
  assert.equal(emptyStock.status, 400);

  const boolPrice = await request(app)
    .post("/api/products")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ nome: "Produto Bool", categoria: "Lanches", preco: true, estoque: false });
  assert.equal(boolPrice.status, 400);

  // 2. Categoria inexistente, oferta > 100%, preço negativo, estoque fracionário
  for (const invalidPayload of [
    { nome: "Cat Inválida", categoria: "Bebidas Alcoólicas", preco: 10, estoque: 5 },
    { nome: "Oferta 150", categoria: "Ofertas", preco: 20, estoque: 5, offer: 150 },
    { nome: "Preço Negativo", categoria: "Pratos", preco: -5, estoque: 5 },
    { nome: "Estoque Decimal", categoria: "Pratos", preco: 25, estoque: 3.5 },
    { nome: "Imagem Externa", categoria: "Pratos", preco: 25, estoque: 5, imagem: "https://evil.com/hack.jpg" },
    { nome: "Combo XSS", categoria: "Ofertas", preco: 45, estoque: 5, itensInclusos: ["Item válido", "<script>xss()</script>"] }
  ]) {
    const res = await request(app)
      .post("/api/products")
      .set("X-Forwarded-For", nextIp())
      .set("Cookie", adminCookie)
      .send(invalidPayload);
    assert.equal(res.status, 400, `Deveria rejeitar payload inválido: ${ invalidPayload.nome }`);
  }

  // 3. Atualização e exclusão de produto inexistente (HTTP 404) e ID inválido (HTTP 400)
  const updateNotFound = await request(app)
    .put("/api/products/999999")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ nome: "Fantasma", categoria: "Lanches", preco: 10, estoque: 1 });
  assert.equal(updateNotFound.status, 404);

  const deleteNotFound = await request(app)
    .delete("/api/products/999999")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie);
  assert.equal(deleteNotFound.status, 404);

  const deleteInvalidId = await request(app)
    .delete("/api/products/abc")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie);
  assert.equal(deleteInvalidId.status, 400);
});

test("Falhas em Pedidos Multicanal: carrinho vazio, produto inexistente, quantidade inválida, XSS em endereço e idempotência de migração", async () => {
  const clienteCookie = await createAuthCookie("Cliente Pedidos", "cli.orders.fault@test.com", "cliente");
  const lojaCookie = await createAuthCookie("Loja Pedidos", "loja.orders.fault@test.com", "loja");

  // 1. Pedido sem itens ou com array vazio -> 400
  const emptyOrder = await request(app)
    .post("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie)
    .send({ items: [], store: "Loja Centro", region: "Nordeste", method: "Delivery" });
  assert.equal(emptyOrder.status, 400);

  // 2. Pedido com produto inexistente ou quantidade inválida (0, negativa, >100, boolean) -> 400
  for (const badItem of [
    { id: 999999, quantity: 1 },
    { id: 1, quantity: 0 },
    { id: 1, quantity: -2 },
    { id: 1, quantity: 101 },
    { id: 1, quantity: true },
    { id: 1, quantity: null }
  ]) {
    const res = await request(app)
      .post("/api/orders")
      .set("X-Forwarded-For", nextIp())
      .set("Cookie", clienteCookie)
      .send({ items: [badItem], store: "Loja Centro", region: "Nordeste", method: "Delivery" });
    assert.equal(res.status, 400);
  }

  // 3. Pedido com XSS no endereço, loja ou região -> 400
  const xssAddress = await request(app)
    .post("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie)
    .send({
      items: [{ id: 1, quantity: 1 }],
      store: "Loja Centro",
      region: "Nordeste",
      method: "Delivery",
      address: "Rua A <img src=x onerror=alert(1)>"
    });
  assert.equal(xssAddress.status, 400);

  // 4. Suporte explícito aos canais da Multicanalidade (WEB, APP, TOTEM, BALCAO, PICKUP)
  for (const [method, channel] of [
    ["Delivery", "APP"],
    ["Totem", "TOTEM"],
    ["Balcão", "BALCAO"],
    ["Retirada", "PICKUP"],
    ["Delivery", "WEB"]
  ]) {
    const orderRes = await request(app)
      .post("/api/orders")
      .set("X-Forwarded-For", nextIp())
      .set("Cookie", clienteCookie)
      .send({
        items: [{ id: 2, quantity: 1 }],
        store: "Loja Centro",
        region: "Nordeste",
        method,
        channel,
        paymentMethod: "Pix"
      });
    assert.equal(orderRes.status, 201);
    assert.equal(orderRes.body.details.channel, channel);
  }

  // 5. Idempotência na migração de pedidos locais (mesmo legacyId não duplica pedido)
  const legacyPayload = {
    orders: [{
      legacyId: "legacy-order-001",
      store: "Loja Centro",
      region: "Nordeste",
      method: "Delivery",
      items: [{ id: 1, quantity: 1 }]
    }]
  };
  const mig1 = await request(app)
    .post("/api/orders/migrate-local")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie)
    .send(legacyPayload);
  assert.equal(mig1.status, 200);

  const mig2 = await request(app)
    .post("/api/orders/migrate-local")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie)
    .send(legacyPayload);
  assert.equal(mig2.status, 200);

  const allOrders = await request(app)
    .get("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie);
  // 5 pedidos multicanal + 1 pedido migrado (sem duplicar na 2ª chamada) = 6 pedidos
  assert.equal(allOrders.body.length, 6);

  // 6. Status operacional inválido (400) e pedido inexistente (404)
  const invalidStatus = await request(app)
    .patch(`/api/orders/${allOrders.body[0].id}/status`)
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", lojaCookie)
    .send({ status: "Status Inexistente" });
  assert.equal(invalidStatus.status, 400);

  const missingOrder = await request(app)
    .patch("/api/orders/id-inexistente-999/status")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", lojaCookie)
    .send({ status: "Concluído" });
  assert.equal(missingOrder.status, 404);
});

test("Falhas de Estoque e Financeiro: estoque nunca fica negativo, ajuste para zero, datas inválidas (2026-02-31) e limites", async () => {
  const adminCookie = await createAuthCookie("Admin Gestao", "admin.gestao.fault@test.com", "admin");

  // 1. Saída maior que o estoque disponível deve travar em 0 (nunca ficar negativo)
  const saidaExcessiva = await request(app)
    .post("/api/estoque/movimentacao")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ productId: 1, tipo: "saida", quantidade: 99999, motivo: "Esgotamento total" });
  assert.equal(saidaExcessiva.status, 201);
  assert.equal(saidaExcessiva.body.product.estoque, 0);

  // 2. Ajuste explícito para 0 deve ser aceito, mas entrada/saída de 0 ou null deve ser recusada (400)
  const ajusteZero = await request(app)
    .post("/api/estoque/movimentacao")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ productId: 1, tipo: "ajuste", quantidade: 0, motivo: "Inventário zerado" });
  assert.equal(ajusteZero.status, 201);
  assert.equal(ajusteZero.body.product.estoque, 0);

  const entradaZero = await request(app)
    .post("/api/estoque/movimentacao")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ productId: 1, tipo: "entrada", quantidade: 0, motivo: "Entrada nula" });
  assert.equal(entradaZero.status, 400);

  const ajusteNull = await request(app)
    .post("/api/estoque/movimentacao")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ productId: 1, tipo: "ajuste", quantidade: null, motivo: "Null não é zero" });
  assert.equal(ajusteNull.status, 400);

  // 3. Produto inexistente na movimentação de estoque -> 404
  const prodNotFound = await request(app)
    .post("/api/estoque/movimentacao")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ productId: 999999, tipo: "entrada", quantidade: 10, motivo: "Teste" });
  assert.equal(prodNotFound.status, 404);

  // 4. Financeiro: datas inexistentes no calendário (ex: 2026-02-31, 2026-13-01), valores <= 0 e XSS em formaPagamento
  for (const badFin of [
    { tipo: "pagar", titulo: "Data Impossível", valor: 100, dataVencimento: "2026-02-31" },
    { tipo: "pagar", titulo: "Mês 13", valor: 100, dataVencimento: "2026-13-01" },
    { tipo: "pagar", titulo: "Valor Zero", valor: 0, dataVencimento: "2026-10-20" },
    { tipo: "pagar", titulo: "Valor Negativo", valor: -50, dataVencimento: "2026-10-20" },
    { tipo: "pagar", titulo: "XSS Forma Pagamento", valor: 100, dataVencimento: "2026-10-20", formaPagamento: "<script>alert(1)</script>" },
    { tipo: "invalido", titulo: "Tipo Inválido", valor: 100, dataVencimento: "2026-10-20" }
  ]) {
    const res = await request(app)
      .post("/api/financeiro")
      .set("X-Forwarded-For", nextIp())
      .set("Cookie", adminCookie)
      .send(badFin);
    assert.equal(res.status, 400, `Deveria rejeitar lançamento inválido: ${ badFin.titulo }`);
  }

  // 5. Baixa ou exclusão de lançamento financeiro inexistente -> 404
  const patchMissingFin = await request(app)
    .patch("/api/financeiro/999999/status")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ status: "pago" });
  assert.equal(patchMissingFin.status, 404);

  const delMissingFin = await request(app)
    .delete("/api/financeiro/999999")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie);
  assert.equal(delMissingFin.status, 404);
});

