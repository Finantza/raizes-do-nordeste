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

test.after(() => {
  fs.rmSync(testDataDir, { recursive: true, force: true });
  delete process.env.RAIZES_DB_PATH;
  if (previousAdminToken === undefined) {
    delete process.env.RAIZES_API_ADMIN_TOKEN;
  } else {
    process.env.RAIZES_API_ADMIN_TOKEN = previousAdminToken;
  }
});

test.beforeEach(() => {
  resetDatabase();
});

test("deve incluir headers básicos de segurança", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "SAMEORIGIN");
  assert.equal(response.headers["x-dns-prefetch-control"], "off");
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
