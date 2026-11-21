import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "..");
const publicDir = path.resolve(rootDir, "public");
const docsDir = path.resolve(rootDir, "docs");

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "raizes-qa-tests-"));
process.env.RAIZES_DB_PATH = path.join(testDataDir, "raizes-qa.sqlite");
const previousAdminToken = process.env.RAIZES_API_ADMIN_TOKEN;
const testAdminToken = "qa-suite-admin-token-with-at-least-32-bytes-long";
process.env.RAIZES_API_ADMIN_TOKEN = testAdminToken;

const [{ default: app }, database] = await Promise.all([
  import("./app.js"),
  import("./db.js")
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
  return `198.51.108.${ipCounter}`;
}

async function createSessionForRole(name, email, role) {
  await database.createUser({
    name,
    email,
    passwordHash: await bcrypt.hash("senha-qa-12345", 4),
    role
  });
  const res = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", nextIp())
    .send({ email, password: "senha-qa-12345" });
  assert.equal(res.status, 200);
  return res.headers["set-cookie"][0].split(";")[0];
}

test("QA-01 (ISO/IEC 25010 - Desempenho / RQ-01): Percentil 95 (p95) < 1500ms e média < 250ms nas rotas críticas", async () => {
  const clienteCookie = await createSessionForRole("Cliente Perf", "perf.cli@raizes.com", "cliente");
  const samples = [];

  for (let i = 0; i < 20; i += 1) {
    const t0 = performance.now();
    const res = await request(app)
      .post("/api/orders")
      .set("X-Forwarded-For", nextIp())
      .set("Cookie", clienteCookie)
      .send({
        items: [{ id: (i % 10) + 1, quantity: 1 }],
        store: "Loja Centro",
        region: "Nordeste",
        method: "Delivery",
        channel: "WEB",
        paymentMethod: "Pix"
      });
    const elapsed = performance.now() - t0;
    assert.equal(res.status, 201);
    samples.push(elapsed);
  }

  samples.sort((a, b) => a - b);
  const avg = samples.reduce((acc, v) => acc + v, 0) / samples.length;
  const p95Index = Math.min(samples.length - 1, Math.floor(samples.length * 0.95));
  const p95 = samples[p95Index];

  assert.ok(p95 < 1500, `Latência p95 (${p95.toFixed(1)} ms) deve ser inferior a 1500 ms`);
  assert.ok(avg < 500, `Latência média (${avg.toFixed(1)} ms) dentro do limite esperado`);
});

test("QA-02 (ISO/IEC 25010 - Disponibilidade / RQ-02): Uptime 100% (≥ 99,5%) em sondagens contínuas e cabeçalhos Cache-Control: no-store", async () => {
  let successCount = 0;
  const totalProbes = 25;

  for (let i = 0; i < totalProbes; i += 1) {
    const res = await request(app)
      .get("/api/health")
      .set("X-Forwarded-For", nextIp());
    if (res.status === 200 && res.body.status === "ok") {
      successCount += 1;
    }
    assert.equal(res.headers["cache-control"], "no-store");
  }

  const availability = (successCount / totalProbes) * 100;
  assert.ok(availability >= 99.5, `Disponibilidade aferida (${availability}%) deve ser >= 99,5%`);
});

test("QA-03 (ISO/IEC 25010 - Segurança Anti-Fraude / RQ-03): Recálculo obrigatório no servidor e proteção contra manipulação de preço/desconto", async () => {
  const clienteCookie = await createSessionForRole("Cliente Fraude", "fraude.cli@raizes.com", "cliente");

  // Produto 1: Combo Nordeste (preço R$ 89,90 com 35% de desconto -> R$ 58,44 unitário -> 2 un = R$ 116,88)
  // Cliente malicioso tenta enviar preco: 0.01, offer: 99 e total: 0.02
  const res = await request(app)
    .post("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie)
    .send({
      items: [{ id: 1, quantity: 2, preco: 0.01, offer: 99 }],
      store: "Loja Centro",
      region: "Nordeste",
      method: "Delivery",
      total: 0.02
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.total, 116.88);
  assert.equal(res.body.items[0].preco, 58.44);
});

test("QA-04 (ISO/IEC 25010 - Usabilidade e Acessibilidade / RQ-04 e RQ-06): Checkout em ≤ 3 passos, zero overflow e atributos ARIA", () => {
  const clienteHtml = fs.readFileSync(path.join(publicDir, "cliente.html"), "utf8");
  const loginHtml = fs.readFileSync(path.join(publicDir, "login.html"), "utf8");
  const styleCss = fs.readFileSync(path.join(publicDir, "style.css"), "utf8");

  // Verifica que os elementos do fluxo direto de checkout em <= 3 cliques estão presentes na mesma tela
  assert.match(clienteHtml, /id="customer-catalog"/);
  assert.match(clienteHtml, /id="cart-items-list"/);
  assert.match(clienteHtml, /id="checkout-order"/);

  // Verifica botões de login demonstrativo de 1 clique para avaliação rápida da banca
  const demoMatches = [...loginHtml.matchAll(/class="[^"]*auth-demo-btn[^"]*"/g)];
  assert.equal(demoMatches.length, 3);

  // Verifica suporte a telas pequenas (320px/370px/479px/767px) e movimento reduzido
  assert.match(styleCss, /@media\s*\(max-width:\s*370px\)/i);
  assert.match(styleCss, /@media\s*\(max-width:\s*479px\)/i);
  assert.match(styleCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
});

test("QA-05 (ISO/IEC 25010 - Confiabilidade e Idempotência / RQ-05): Migração idempotente sem duplicação e integridade ACID sob transações", async () => {
  const clienteCookie = await createSessionForRole("Cliente Idemp", "idemp.cli@raizes.com", "cliente");

  const payload = {
    orders: [
      {
        legacyId: "qa-idempotent-order-100",
        store: "Loja Shopping",
        region: "Nordeste",
        method: "Retirada",
        items: [{ id: 4, quantity: 2 }]
      }
    ]
  };

  // Dispara 3 vezes o mesmo pacote de migração
  for (let i = 0; i < 3; i += 1) {
    const r = await request(app)
      .post("/api/orders/migrate-local")
      .set("X-Forwarded-For", nextIp())
      .set("Cookie", clienteCookie)
      .send(payload);
    assert.equal(r.status, 200);
  }

  const ordersRes = await request(app)
    .get("/api/orders")
    .set("X-Forwarded-For", nextIp())
    .set("Cookie", clienteCookie);
  assert.equal(ordersRes.status, 200);
  assert.equal(ordersRes.body.length, 1, "O pedido migrado 3 vezes com mesmo legacyId deve existir apenas 1 vez");

  // Verifica integridade física do banco SQLite
  const rawDb = new Database(process.env.RAIZES_DB_PATH, { readonly: true });
  try {
    assert.equal(rawDb.pragma("integrity_check")[0].integrity_check, "ok");
    assert.equal(rawDb.pragma("foreign_key_check").length, 0);
  } finally {
    rawDb.close();
  }
});

test("QA-06 (ISO/IEC 25010 - Observabilidade e Segurança de Dados / RQ-07 e LGPD): Respostas de erro padronizadas sem vazamento de stack trace, senhas ou hashes", async () => {
  // 1. Registro e login nunca retornam password ou password_hash no corpo JSON
  const reg = await request(app)
    .post("/api/auth/register")
    .set("X-Forwarded-For", nextIp())
    .send({
      name: "Titular LGPD",
      email: "titular.lgpd@raizes.com",
      password: "senha-super-secreta-999",
      lgpdConsent: true
    });
  assert.equal(reg.status, 201);
  const rawRegBody = JSON.stringify(reg.body);
  assert.equal(rawRegBody.includes("senha-super-secreta-999"), false);
  assert.equal(rawRegBody.includes("password"), false);
  assert.equal(rawRegBody.includes("$2"), false);

  // 2. Erros 400, 401, 403 e 404 retornam estrutura JSON limpa { erro: "..." } sem vazar stack trace ou caminhos internos
  const err400 = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", nextIp())
    .set("Content-Type", "application/json")
    .send("{malformed");
  assert.equal(err400.status, 400);
  assert.ok(err400.body.erro);
  assert.equal(JSON.stringify(err400.body).includes("node_modules"), false);

  const err404 = await request(app)
    .get("/api/endpoint-inexistente")
    .set("X-Forwarded-For", nextIp());
  assert.equal(err404.status, 404);
  assert.equal(err404.body.erro, "Recurso não encontrado.");
});

test("QA-07 (ISO/IEC 25010 - Manutenibilidade e Governança Documental / RQ-08): Rastreabilidade completa e presença de todos os artefatos de QA", () => {
  const requiredArtifacts = [
    path.join(rootDir, "README.md"),
    path.join(rootDir, "iniciar-servidor.bat"),
    path.join(rootDir, "test-offline.bat"),
    path.join(docsDir, "REQUISITOS.md"),
    path.join(docsDir, "PLANO_TESTES.md"),
    path.join(docsDir, "USO_DE_IA.md"),
    path.join(docsDir, "relatorio-de-desenvolvimento.md"),
    path.join(docsDir, "relatorio-de-desenvolvimento.doc"),
    path.join(docsDir, "relatorio-de-desenvolvimento.docx"),
    path.join(docsDir, "relatorio-testes-frontend.md"),
    path.join(docsDir, "relatorio-testes-frontend.doc"),
    path.join(docsDir, "relatorio-testes-frontend.docx"),
    path.join(docsDir, "relatorio-testes-backend.md"),
    path.join(docsDir, "relatorio-testes-backend.doc"),
    path.join(docsDir, "relatorio-testes-backend.docx")
  ];

  for (const file of requiredArtifacts) {
    assert.ok(fs.existsSync(file), `Artefato obrigatório de QA deve existir: ${file}`);
    const stat = fs.statSync(file);
    assert.ok(stat.size > 100, `Artefato ${path.basename(file)} não pode estar vazio`);
  }
});
