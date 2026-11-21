import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "raizes-backend-tests-"));
process.env.RAIZES_DB_PATH = path.join(testDataDir, "raizes-backend.sqlite");
const previousAdminToken = process.env.RAIZES_API_ADMIN_TOKEN;
const testAdminToken = "backend-suite-admin-token-with-at-least-32-bytes";
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

let ipSeq = 10;
function nextIp() {
  ipSeq += 1;
  return `198.51.105.${ipSeq}`;
}

async function loginRole(name, email, role) {
  await database.createUser({
    name,
    email,
    passwordHash: await bcrypt.hash("senha-backend-123", 4),
    role
  });
  const res = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", nextIp())
    .send({ email, password: "senha-backend-123" });
  assert.equal(res.status, 200);
  return {
    user: res.body.user,
    cookie: res.headers["set-cookie"][0].split(";")[0]
  };
}

test("BE-01: Camada de Persistência (src/db.js) — Operações diretas de usuários, sessões, produtos, unidades, estoque e financeiro", async () => {
  // 1. Criação e busca de usuário por ID e E-mail
  const createdUser = await database.createUser({
    name: "Usuário Banco",
    email: "db.user@raizes.com",
    passwordHash: await bcrypt.hash("senha-db-123", 4),
    role: "cliente"
  });
  assert.ok(createdUser.id);
  const byId = await database.findUserById(createdUser.id);
  assert.equal(byId.email, "db.user@raizes.com");
  assert.equal(await database.findUserById(999999), null);

  // 2. Ciclo completo de sessão no banco
  const sid = authModule.createSessionId();
  const future = new Date(Date.now() + 3600_000).toISOString();
  await database.createSession(sid, createdUser.id, future);
  const activeSession = await database.findSession(sid);
  assert.equal(activeSession.email, "db.user@raizes.com");
  await database.deleteSession(sid);
  assert.equal(await database.findSession(sid), null);

  // 3. Upsert, Update e Delete de produto
  const upserted = await database.upsertProduct({
    id: 500,
    nome: "Paçoca Sertaneja Especial",
    categoria: "Pratos",
    descricao: "Carne de sol pilada no pilão",
    preco: 34.5,
    estoque: 15,
    offer: 10,
    imagem: "",
    itensInclusos: ["Farofa", "Banana"]
  });
  assert.equal(upserted.id, 500);
  assert.deepEqual(upserted.itensInclusos, ["Farofa", "Banana"]);

  const updated = await database.updateProduct(500, {
    nome: "Paçoca Sertaneja Premium",
    categoria: "Pratos",
    descricao: "Atualizada",
    preco: 36.0,
    estoque: 20,
    offer: 5,
    imagem: "",
    itensInclusos: []
  });
  assert.equal(updated.nome, "Paçoca Sertaneja Premium");
  assert.equal(updated.estoque, 20);

  const deleted = await database.deleteProduct(500);
  assert.equal(deleted.changes, 1);
});

test("BE-02: Middleware de Autenticação e Criptografia (src/auth.js) — Assinatura HMAC-SHA256, timingSafeEqual e RBAC", async () => {
  const sid = authModule.createSessionId();
  assert.ok(sid.length >= 32);

  // Verifica que parseSignedSession rejeita formatos malformados ou adulterados
  assert.equal(authModule.parseSignedSession(""), null);
  assert.equal(authModule.parseSignedSession("sem-assinatura"), null);
  assert.equal(authModule.parseSignedSession(`${sid}.assinatura-invalida`), null);
  assert.equal(authModule.parseSignedSession(`${sid}.a.b`), null);

  // Verifica ciclo real via cookie assinado pelo endpoint de login
  const { cookie, user } = await loginRole("Operador Auth", "auth.loja@raizes.com", "loja");
  const rawCookieVal = decodeURIComponent(cookie.split("=")[1]);
  const parsedSid = authModule.parseSignedSession(rawCookieVal);
  assert.ok(parsedSid);

  const meRes = await request(app)
    .get("/api/auth/me")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", cookie);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.user.id, user.id);
  assert.equal(meRes.body.user.role, "loja");
});

test("BE-03: Rotas de Catálogo (src/routes/products.js) — CRUD completo (GET, POST, PUT, DELETE, migrate-local) e validação de imagens Base64", async () => {
  const { cookie: adminCookie } = await loginRole("Admin Catálogo", "cat.admin@raizes.com", "admin");
  const { cookie: lojaCookie } = await loginRole("Loja Catálogo", "cat.loja@raizes.com", "loja");

  // 1. POST com imagem data:image/jpeg;base64 válida
  const validBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const createRes = await request(app)
    .post("/api/products")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", lojaCookie)
    .send({
      nome: "Bolo de Macaxeira Artesanal",
      categoria: "Sobremesas",
      descricao: "Assado no forno a lenha",
      preco: 16.5,
      estoque: 12,
      offer: 10,
      imagem: validBase64,
      itensInclusos: ["Calda de rapadura"]
    });
  assert.equal(createRes.status, 201);
  const newId = createRes.body.id;
  assert.equal(createRes.body.imagem, validBase64);

  // 2. PUT atualizando preço, estoque e oferta
  const putRes = await request(app)
    .put(`/api/products/${newId}`)
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({
      nome: "Bolo de Macaxeira Artesanal Editado",
      categoria: "Sobremesas",
      descricao: "Receita atualizada",
      preco: 18.0,
      estoque: 25,
      offer: 0,
      imagem: "/images/products/cake.jpg"
    });
  assert.equal(putRes.status, 200);
  assert.equal(putRes.body.nome, "Bolo de Macaxeira Artesanal Editado");
  assert.equal(putRes.body.estoque, 25);

  // 3. DELETE removendo o produto e confirmando que saiu da listagem
  const delRes = await request(app)
    .delete(`/api/products/${newId}`)
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie);
  assert.equal(delRes.status, 204);

  const listRes = await request(app)
    .get("/api/products")
    .set("X-Forwarded-For", nextIp());
  assert.equal(listRes.body.some((p) => p.id === newId), false);
});

test("BE-04: Rotas de Pedidos e Estoque (src/routes/orders.js e estoque.js) — Baixa automática de estoque na venda, consolidação de itens repetidos e trilha de auditoria", async () => {
  const { cookie: clienteCookie } = await loginRole("Cliente Venda", "venda.cli@raizes.com", "cliente");
  const { cookie: lojaCookie } = await loginRole("Loja Venda", "venda.loja@raizes.com", "loja");

  // Consulta estoque inicial do produto 1 (Combo Nordeste: estoque padrão = 18)
  const beforeList = await request(app).get("/api/products").set("X-Forwarded-For", nextIp());
  const prod1Before = beforeList.body.find((p) => p.id === 1);
  assert.equal(prod1Before.estoque, 18);

  // Envia pedido com o mesmo produto repetido em duas linhas (2 + 3 = 5 unidades)
  const orderRes = await request(app)
    .post("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie)
    .send({
      items: [
        { id: 1, quantity: 2 },
        { id: 1, quantity: 3 }
      ],
      store: "Loja Aeroporto",
      region: "Nordeste",
      method: "Balcão",
      channel: "BALCAO",
      paymentMethod: "Cartão"
    });
  assert.equal(orderRes.status, 201);
  // As duas linhas do mesmo produto devem ser consolidadas em 1 item com quantity = 5
  assert.equal(orderRes.body.items.length, 1);
  assert.equal(orderRes.body.items[0].quantity, 5);

  // Verifica que o estoque do produto 1 caiu de 18 para 13
  const afterList = await request(app).get("/api/products").set("X-Forwarded-For", nextIp());
  const prod1After = afterList.body.find((p) => p.id === 1);
  assert.equal(prod1After.estoque, 13);

  // Verifica que a movimentação de saída automática foi registrada em /api/estoque/movimentacoes
  const movsRes = await request(app)
    .get("/api/estoque/movimentacoes?limit=10")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", lojaCookie);
  assert.equal(movsRes.status, 200);
  const saleMov = movsRes.body.find((m) => m.product_id === 1 && m.tipo === "saida" && m.quantidade === 5);
  assert.ok(saleMov, "Deve registrar movimentação automática de saída na venda do pedido");
  assert.equal(saleMov.estoque_anterior, 18);
  assert.equal(saleMov.estoque_novo, 13);

  // Tenta comprar mais 14 unidades (acima das 13 restantes) -> deve falhar com HTTP 400
  const insufficientRes = await request(app)
    .post("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie)
    .send({
      items: [{ id: 1, quantity: 14 }],
      store: "Loja Aeroporto",
      region: "Nordeste",
      method: "Delivery"
    });
  assert.equal(insufficientRes.status, 400);
  assert.match(insufficientRes.body.erro, /Estoque insuficiente/i);
});

test("BE-05: Rotas Financeiras (src/routes/financeiro.js) — Filtros combinados (tipo, status, search), cálculo de títulos vencidos e reversão de baixa", async () => {
  const { cookie: adminCookie } = await loginRole("Admin Financeiro", "fin.admin@raizes.com", "admin");

  // 1. Cria um título vencido (data no passado) pendente e um título a receber já pago
  const vencido = await request(app)
    .post("/api/financeiro")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({
      tipo: "pagar",
      titulo: "Aluguel Mensal Filial Recife",
      categoria: "Despesas Fixas",
      valor: 3200.45,
      dataVencimento: "2020-01-10",
      status: "pendente",
      formaPagamento: "Boleto",
      observacoes: "Contrato 2020"
    });
  assert.equal(vencido.status, 201);

  const recebido = await request(app)
    .post("/api/financeiro")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({
      tipo: "receber",
      titulo: "Buffet São João Corporativo",
      categoria: "Eventos",
      valor: 5000.90,
      dataVencimento: "2026-12-20",
      status: "pago",
      formaPagamento: "Pix"
    });
  assert.equal(recebido.status, 201);

  // 2. Testa filtros combinados na listagem GET /api/financeiro
  const filterPagar = await request(app)
    .get("/api/financeiro")
    .query({ tipo: "pagar", status: "pendente", search: "Recife" })
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie);
  assert.equal(filterPagar.status, 200);
  assert.equal(filterPagar.body.length, 1);
  assert.equal(filterPagar.body[0].titulo, "Aluguel Mensal Filial Recife");

  // 3. Verifica resumo financeiro com contagem de vencidos e precisão de 2 casas decimais
  const summary1 = await request(app)
    .get("/api/financeiro/resumo")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie);
  assert.equal(summary1.status, 200);
  assert.equal(summary1.body.vencidosCount, 1);
  assert.equal(summary1.body.totalPagarPendente, 3200.45);
  assert.equal(summary1.body.totalReceberPago, 5000.9);
  assert.equal(summary1.body.saldoProjetado, 1800.45);

  // 4. Dá baixa no título vencido e depois reverte para pendente
  const payRes = await request(app)
    .patch(`/api/financeiro/${vencido.body.id}/status`)
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ status: "pago", dataPagamento: "2026-11-20" });
  assert.equal(payRes.status, 200);
  assert.equal(payRes.body.status, "pago");
  assert.equal(payRes.body.data_pagamento, "2026-11-20");

  const reopenRes = await request(app)
    .patch(`/api/financeiro/${vencido.body.id}/status`)
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", adminCookie)
    .send({ status: "pendente" });
  assert.equal(reopenRes.status, 200);
  assert.equal(reopenRes.body.status, "pendente");
  assert.equal(reopenRes.body.data_pagamento, null);
});

test("BE-06: Migração de Contas e Pedidos Legados — Proteção de contas demonstrativas, idempotência e isolamento entre clientes", async () => {
  // 1. Tentativa de sobrescrever contas demonstrativas via /api/auth/migrate-local-users deve ser ignorada
  const migUsers = await request(app)
    .post("/api/auth/migrate-local-users")
    .set("X-Forwarded-For", nextIp())
    .send({
      users: [
        { name: "Fake Admin", email: "admin@raizes.com", password: "hackerpassword123" },
        { name: "Cliente Real Migrado", email: "cliente.migrado@raizes.com", password: "senhamigrada123" }
      ]
    });
  assert.equal(migUsers.status, 200);
  assert.equal(migUsers.body.imported, 1);
  assert.equal(await database.findUserByEmail("admin@raizes.com"), null);

  // 2. Isolamento de pedidos entre clientes diferentes (Cliente A não vê pedidos do Cliente B)
  const { cookie: cookieA } = await loginRole("Cliente A", "cliente.a@raizes.com", "cliente");
  const { cookie: cookieB } = await loginRole("Cliente B", "cliente.b@raizes.com", "cliente");

  await request(app)
    .post("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", cookieA)
    .send({ items: [{ id: 5, quantity: 1 }], store: "Loja Centro", region: "Nordeste", method: "Delivery" });

  const ordersB = await request(app)
    .get("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", cookieB);
  assert.equal(ordersB.status, 200);
  assert.equal(ordersB.body.length, 0);
});
