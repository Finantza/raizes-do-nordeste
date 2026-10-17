import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "raizes-api-tests-"));
process.env.RAIZES_DB_PATH = path.join(testDataDir, "raizes.json");
const previousAdminToken = process.env.RAIZES_API_ADMIN_TOKEN;
const testAdminToken = "test-only-admin-token-with-at-least-32-bytes";
process.env.RAIZES_API_ADMIN_TOKEN = testAdminToken;
const authorizationFor = (token) => ["Be", "arer ", token].join("");

const [{ default: app }, { resetDatabase }] = await Promise.all([
  import("./app.js"),
  import("./db.js")
]);
const database = await import("./db.js");
let databaseClosed = false;

test.after(async () => {
  if (!databaseClosed) await database.closeDatabase();
  fs.rmSync(testDataDir, { recursive: true, force: true });
  delete process.env.RAIZES_DB_PATH;
  if (previousAdminToken === undefined) {
    delete process.env.RAIZES_API_ADMIN_TOKEN;
  } else {
    process.env.RAIZES_API_ADMIN_TOKEN = previousAdminToken;
  }
});

test.beforeEach(async () => {
  await resetDatabase();
});

test("deve incluir headers básicos de segurança", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "SAMEORIGIN");
  assert.equal(response.headers["x-dns-prefetch-control"], "off");
  assert.match(response.headers["content-security-policy"], /default-src 'self'/);
  assert.match(response.headers["content-security-policy"], /object-src 'none'/);
});

test("deve servir imagens de produto da pasta src/imagens", async () => {
  const response = await request(app)
    .get("/imagens/Tapioca%20de%20Queijo%20Derretido%20no%20Sert%C3%A3o.png");

  assert.equal(response.status, 200);
  assert.match(response.headers["content-type"], /^image\/png/);
});

test("deve cadastrar e listar unidades com token administrativo", async () => {
  const cadastro = await request(app).post("/api/unidades").send({
    codigo: "RN-001",
    nome: "Unidade Central",
    cidade: "Natal",
    estado: "RN"
  }).set("Authorization", authorizationFor(testAdminToken));

  assert.equal(cadastro.status, 201);
  assert.equal(cadastro.body.codigo, "RN-001");

  const listagem = await request(app).get("/api/unidades");
  assert.equal(listagem.status, 200);
  assert.equal(listagem.body.length, 1);
  assert.equal(listagem.body[0].nome, "Unidade Central");
});

test("deve impedir cadastro duplicado", async () => {
  await request(app).post("/api/unidades").send({
    codigo: "RN-001",
    nome: "Unidade Central",
    cidade: "Natal",
    estado: "RN"
  }).set("Authorization", authorizationFor(testAdminToken));

  const duplicado = await request(app).post("/api/unidades").send({
    codigo: "RN-001",
    nome: "Outra unidade",
    cidade: "Mossoró",
    estado: "RN"
  }).set("Authorization", authorizationFor(testAdminToken));

  assert.equal(duplicado.status, 409);
  assert.match(duplicado.body.erro, /já existe/i);
});

test("deve recusar cadastro sem token ou com token inválido", async () => {
  const dados = {
    codigo: "RN-002",
    nome: "Unidade Protegida",
    cidade: "Natal",
    estado: "RN"
  };

  const semToken = await request(app)
    .post("/api/unidades")
    .set("X-Forwarded-For", "198.51.100.10")
    .send(dados);
  assert.equal(semToken.status, 401);

  const tokenInvalido = await request(app)
    .post("/api/unidades")
    .set("X-Forwarded-For", "198.51.100.11")
    .set("Authorization", authorizationFor("token-incorreto"));
  assert.equal(tokenInvalido.status, 401);

  const listagem = await request(app)
    .get("/api/unidades")
    .set("X-Forwarded-For", "198.51.100.13");
  assert.deepEqual(listagem.body, []);
});

test("deve desabilitar o cadastro se o token administrativo não estiver configurado", async () => {
  const configuredToken = process.env.RAIZES_API_ADMIN_TOKEN;

  try {
    delete process.env.RAIZES_API_ADMIN_TOKEN;
    const missingToken = await request(app)
      .post("/api/unidades")
      .set("X-Forwarded-For", "198.51.100.12")
      .set("Authorization", authorizationFor(testAdminToken))
      .send({
        codigo: "RN-003",
        nome: "Unidade Sem Configuração",
        cidade: "Natal",
        estado: "RN"
      });

    assert.equal(missingToken.status, 503);

    process.env.RAIZES_API_ADMIN_TOKEN = "weak";
    const weakToken = await request(app)
      .post("/api/unidades")
      .set("X-Forwarded-For", "198.51.100.14")
      .set("Authorization", authorizationFor(testAdminToken))
      .send({
        codigo: "RN-004",
        nome: "Unidade com Token Fraco",
        cidade: "Natal",
        estado: "RN"
      });

    assert.equal(weakToken.status, 503);
  } finally {
    process.env.RAIZES_API_ADMIN_TOKEN = configuredToken;
  }
});

test("deve registrar cliente com hash, autenticar, consultar sessão e sair", async () => {
  const registro = await request(app).post("/api/auth/register").send({
    name: "Cliente Seguro", email: "cliente.seguro@example.com", password: "senha-forte-123", role: "admin"
  });
  assert.equal(registro.status, 201);
  assert.equal(registro.body.user.role, "cliente");
  assert.equal(JSON.stringify(registro.body).includes("senha-forte"), false);

  const stored = await database.findUserByEmail("cliente.seguro@example.com");
  assert.match(stored.password_hash, /^\$2[aby]\$/);
  assert.notEqual(stored.password_hash, "senha-forte-123");

  const login = await request(app).post("/api/auth/login")
    .set("X-Forwarded-For", "198.51.100.50")
    .send({ email: "cliente.seguro@example.com", password: "senha-forte-123" });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, "cliente.seguro@example.com");
  assert.match(login.headers["set-cookie"][0], /HttpOnly/);
  assert.match(login.headers["set-cookie"][0], /Secure/);
  assert.match(login.headers["set-cookie"][0], /SameSite=Lax/i);
  const cookie = login.headers["set-cookie"][0].split(";")[0];

  const me = await request(app).get("/api/auth/me").set("Cookie", cookie);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.role, "cliente");

  const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie);
  assert.equal(logout.status, 204);
  const afterLogout = await request(app).get("/api/auth/me").set("Cookie", cookie);
  assert.equal(afterLogout.status, 401);
});

test("deve migrar contas antigas sem aceitar papéis privilegiados do navegador", async () => {
  const migrated = await request(app).post("/api/auth/migrate-local-users").send({
    users: [{
      name: "Conta migrada",
      email: "migrated.user@example.com",
      password: "senha-antiga-123",
      role: "admin"
    }]
  });
  assert.equal(migrated.status, 200);
  assert.equal(migrated.body.imported, 1);
  const user = await database.findUserByEmail("migrated.user@example.com");
  assert.equal(user.role, "cliente");
  assert.match(user.password_hash, /^\$2[aby]\$/);
});

test("deve rejeitar credenciais inválidas", async () => {
  await request(app).post("/api/auth/register").send({
    name: "Cliente", email: "wrong-password@example.com", password: "senha-correta-123"
  });
  const wrong = await request(app).post("/api/auth/login")
    .set("X-Forwarded-For", "198.51.100.51")
    .send({ email: "wrong-password@example.com", password: "incorreta" });
  assert.equal(wrong.status, 401);
});

test("deve limitar o login a cinco tentativas em quinze minutos por IP", async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request(app).post("/api/auth/login")
      .set("X-Forwarded-For", "198.51.100.54")
      .send({ email: "inexistente@example.com", password: "incorreta" });
    assert.equal(response.status, 401);
  }
  const limited = await request(app).post("/api/auth/login")
    .set("X-Forwarded-For", "198.51.100.54")
    .send({ email: "inexistente@example.com", password: "incorreta" });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers["retry-after"]) > 0);
});

test("deve exigir sessão e papel autorizado para criar produtos", async () => {
  const payload = { nome: "Produto protegido", categoria: "Lanches", preco: 12, estoque: 2 };
  const anonymous = await request(app).post("/api/products").send(payload);
  assert.equal(anonymous.status, 401);

  const registro = await request(app).post("/api/auth/register").send({
    name: "Cliente", email: "cliente.role@example.com", password: "senha-forte-123"
  });
  assert.equal(registro.status, 201);
  const login = await request(app).post("/api/auth/login")
    .set("X-Forwarded-For", "198.51.100.52")
    .send({ email: "cliente.role@example.com", password: "senha-forte-123" });
  const cookie = login.headers["set-cookie"][0].split(";")[0];
  const forbidden = await request(app).post("/api/products").set("Cookie", cookie).send(payload);
  assert.equal(forbidden.status, 403);
});

test("deve validar dados de produto contra marcação executável", async () => {
  await database.createUser({
    name: "Admin de teste",
    email: "admin.xss@example.com",
    passwordHash: await (await import("bcryptjs")).default.hash("senha-forte-admin", 4),
    role: "admin"
  });
  const login = await request(app).post("/api/auth/login")
    .set("X-Forwarded-For", "198.51.100.53")
    .send({ email: "admin.xss@example.com", password: "senha-forte-admin" });
  const cookie = login.headers["set-cookie"][0].split(";")[0];
    const unit = await request(app).post("/api/unidades")
      .set("Cookie", cookie)
      .send({ codigo: "PB-003", nome: "Unidade pela sessão", cidade: "João Pessoa", estado: "PB" });
    assert.equal(unit.status, 201);
    const safeProduct = await request(app).post("/api/products").set("Cookie", cookie).send({
      nome: "Produto seguro", categoria: "Lanches", preco: 10, estoque: 1
    });
    assert.equal(safeProduct.status, 201);
    assert.equal(safeProduct.body.nome, "Produto seguro");
    const migratedProduct = await request(app).post("/api/products/migrate-local")
      .set("Cookie", cookie)
      .send({ product: { id: 1000, nome: "Produto legado", categoria: "Lanches", preco: 8, estoque: 2 } });
    assert.equal(migratedProduct.status, 200);
    assert.equal(migratedProduct.body.id, 1000);
    const response = await request(app).post("/api/products").set("Cookie", cookie).send({
      nome: "<script>alert(1)</script>", categoria: "Lanches", preco: 10, estoque: 1
    });
    assert.equal(response.status, 400);
});

test("deve salvar pedidos calculando preço no servidor e autorizar a operação por papel", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Cliente de pedidos", email: "orders.customer@example.com", password: "senha-forte-123"
    });
    const customerLogin = await request(app).post("/api/auth/login")
      .set("X-Forwarded-For", "198.51.100.55")
      .send({ email: "orders.customer@example.com", password: "senha-forte-123" });
    const customerCookie = customerLogin.headers["set-cookie"][0].split(";")[0];

    const unauthorizedList = await request(app).get("/api/orders");
    assert.equal(unauthorizedList.status, 401);
    const created = await request(app).post("/api/orders").set("Cookie", customerCookie).send({
      items: [{ id: 1, quantity: 2, preco: 0 }],
      store: "Loja Centro",
      region: "Nordeste",
      method: "Delivery",
      total: 0,
      email: "outro@example.com"
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.total, 116.88);
    assert.equal(created.body.userId, undefined);
    const ownOrders = await request(app).get("/api/orders").set("Cookie", customerCookie);
    assert.equal(ownOrders.body.length, 1);
    const deniedAction = await request(app).patch(`/api/orders/${created.body.id}/status`)
      .set("Cookie", customerCookie).send({ status: "Em rota" });
    assert.equal(deniedAction.status, 403);

    await database.createUser({
      name: "Operador", email: "orders.store@example.com",
      passwordHash: await (await import("bcryptjs")).default.hash("senha-forte-loja", 4),
      role: "loja"
    });
    const storeLogin = await request(app).post("/api/auth/login")
      .set("X-Forwarded-For", "198.51.100.56")
      .send({ email: "orders.store@example.com", password: "senha-forte-loja" });
    const storeCookie = storeLogin.headers["set-cookie"][0].split(";")[0];
    const updated = await request(app).patch(`/api/orders/${created.body.id}/status`)
      .set("Cookie", storeCookie).send({ status: "Em rota" });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.status, "Em rota");
});

test("deve conservar unidades no arquivo SQLite após reabrir a conexão", async () => {
  const added = await database.createUnidade({
    codigo: "PE-009", nome: "Unidade Persistida", cidade: "Recife", estado: "PE"
  });
  assert.equal(added.codigo, "PE-009");
  await database.closeDatabase();
  databaseClosed = true;
  const reopened = new (await import("better-sqlite3")).default(process.env.RAIZES_DB_PATH);
  const persisted = reopened.prepare("SELECT nome FROM unidades WHERE codigo=?").get("PE-009");
  assert.equal(persisted.nome, "Unidade Persistida");
  reopened.close();
});
