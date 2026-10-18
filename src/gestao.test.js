import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "raizes-gestao-tests-"));
process.env.RAIZES_DB_PATH = path.join(testDataDir, "raizes-gestao.sqlite");

const [{ default: app }, database] = await Promise.all([
  import("./app.js"),
  import("./db.js")
]);

test.after(async () => {
  await database.closeDatabase();
  fs.rmSync(testDataDir, { recursive: true, force: true });
  delete process.env.RAIZES_DB_PATH;
});

test.beforeEach(async () => {
  await database.resetDatabase();
});

let ipIndex = 100;
async function createAuthenticatedUser(name, email, role) {
  ipIndex += 1;
  await database.createUser({
    name,
    email,
    passwordHash: await bcrypt.hash("senha-teste-123", 4),
    role
  });
  const res = await request(app).post("/api/auth/login")
    .set("X-Forwarded-For", `198.51.100.${ipIndex}`)
    .send({ email, password: "senha-teste-123" });
  return res.headers["set-cookie"][0].split(";")[0];
}

test("Controle de Estoque: deve bloquear acesso não autenticado e perfil cliente", async () => {
  // Anônimo
  const anonResumo = await request(app).get("/api/estoque/resumo");
  assert.equal(anonResumo.status, 401);

  const anonMov = await request(app).post("/api/estoque/movimentacao").send({
    productId: 1, tipo: "entrada", quantidade: 5, motivo: "Teste"
  });
  assert.equal(anonMov.status, 401);

  // Cliente
  const clienteCookie = await createAuthenticatedUser("Cliente Estoque", "cliente.estoque@test.com", "cliente");
  const cliResumo = await request(app).get("/api/estoque/resumo").set("Cookie", clienteCookie);
  assert.equal(cliResumo.status, 403);

  const cliMov = await request(app).post("/api/estoque/movimentacao").set("Cookie", clienteCookie).send({
    productId: 1, tipo: "entrada", quantidade: 5, motivo: "Teste"
  });
  assert.equal(cliMov.status, 403);
});

test("Controle de Estoque: permite acesso a loja e admin para consultar e registrar movimentações", async () => {
  const lojaCookie = await createAuthenticatedUser("Operador Loja", "loja.estoque@test.com", "loja");
  const adminCookie = await createAuthenticatedUser("Admin Geral", "admin.estoque@test.com", "admin");

  // Consulta resumo pela Loja
  const resumo = await request(app).get("/api/estoque/resumo").set("Cookie", lojaCookie);
  assert.equal(resumo.status, 200);
  assert.ok(Number(resumo.body.totalItens) >= 0);
  assert.ok(Array.isArray(resumo.body.products));

  const prodId = resumo.body.products[0].id;
  const estoqueInicial = Number(resumo.body.products[0].estoque);

  // Registro de Entrada pela Loja
  const entrada = await request(app).post("/api/estoque/movimentacao").set("Cookie", lojaCookie).send({
    productId: prodId,
    tipo: "entrada",
    quantidade: 15,
    motivo: "Chegada de fornecedor"
  });
  assert.equal(entrada.status, 201);
  assert.equal(entrada.body.product.estoque, estoqueInicial + 15);
  assert.equal(entrada.body.movement.tipo, "entrada");

  // Registro de Saída pelo Admin
  const saida = await request(app).post("/api/estoque/movimentacao").set("Cookie", adminCookie).send({
    productId: prodId,
    tipo: "saida",
    quantidade: 5,
    motivo: "Ajuste de perda"
  });
  assert.equal(saida.status, 201);
  assert.equal(saida.body.product.estoque, estoqueInicial + 10);

  // Histórico de movimentações
  const historico = await request(app).get("/api/estoque/movimentacoes").set("Cookie", adminCookie);
  assert.equal(historico.status, 200);
  assert.ok(historico.body.length >= 2);
  assert.equal(historico.body[0].tipo, "saida");
});

test("Contas a Pagar e Receber: deve bloquear acesso não autenticado e perfil cliente", async () => {
  // Anônimo
  const anonFin = await request(app).get("/api/financeiro");
  assert.equal(anonFin.status, 401);

  // Cliente
  const clienteCookie = await createAuthenticatedUser("Cliente Financeiro", "cliente.fin@test.com", "cliente");
  const cliFin = await request(app).get("/api/financeiro").set("Cookie", clienteCookie);
  assert.equal(cliFin.status, 403);

  const cliPost = await request(app).post("/api/financeiro").set("Cookie", clienteCookie).send({
    tipo: "pagar", titulo: "Conta Inválida", categoria: "Geral", valor: 100, dataVencimento: "2026-10-20"
  });
  assert.equal(cliPost.status, 403);
});

test("Contas a Pagar e Receber: permite que admin e loja cadastrem, consultem, dêem baixa e excluam lançamentos", async () => {
  const adminCookie = await createAuthenticatedUser("Admin Fin", "admin.fin@test.com", "admin");
  const lojaCookie = await createAuthenticatedUser("Loja Fin", "loja.fin@test.com", "loja");

  // Cadastro de Conta a Pagar pelo Admin
  const novoPagar = await request(app).post("/api/financeiro").set("Cookie", adminCookie).send({
    tipo: "pagar",
    titulo: "Fornecedor Queijo de Coalho",
    categoria: "Ingredientes",
    valor: 850.50,
    dataVencimento: "2026-10-25",
    formaPagamento: "Boleto",
    status: "pendente",
    observacoes: "Lote semanal"
  });
  assert.equal(novoPagar.status, 201);
  assert.equal(novoPagar.body.tipo, "pagar");
  assert.equal(novoPagar.body.status, "pendente");
  const pagarId = novoPagar.body.id;

  // Cadastro de Conta a Receber pela Loja
  const novoReceber = await request(app).post("/api/financeiro").set("Cookie", lojaCookie).send({
    tipo: "receber",
    titulo: "Repasse Maquininha Cartão",
    categoria: "Vendas",
    valor: 2400.00,
    dataVencimento: "2026-10-22",
    formaPagamento: "Pix",
    status: "pendente"
  });
  assert.equal(novoReceber.status, 201);
  assert.equal(novoReceber.body.tipo, "receber");

  // Consulta resumo financeiro
  const resumo = await request(app).get("/api/financeiro/resumo").set("Cookie", lojaCookie);
  assert.equal(resumo.status, 200);
  assert.equal(resumo.body.totalPagarPendente, 850.50);
  assert.equal(resumo.body.totalReceberPendente, 2400.00);
  assert.equal(resumo.body.saldoProjetado, 2400.00 - 850.50);

  // Dar baixa (marcar como pago) pela Loja
  const baixa = await request(app).patch(`/api/financeiro/${pagarId}/status`).set("Cookie", lojaCookie).send({
    status: "pago"
  });
  assert.equal(baixa.status, 200);
  assert.equal(baixa.body.status, "pago");
  assert.ok(baixa.body.data_pagamento);

  // Excluir lançamento pelo Admin
  const exclusao = await request(app).delete(`/api/financeiro/${pagarId}`).set("Cookie", adminCookie);
  assert.equal(exclusao.status, 204);

  // Verificar que foi removido
  const listagem = await request(app).get("/api/financeiro").set("Cookie", adminCookie);
  assert.equal(listagem.body.some((item) => item.id === pagarId), false);
});

test("Cadastro de Produtos: restrito a admin e loja", async () => {
  const clienteCookie = await createAuthenticatedUser("Cliente Prod", "cliente.prod@test.com", "cliente");
  const lojaCookie = await createAuthenticatedUser("Loja Prod", "loja.prod@test.com", "loja");

  // Cliente não pode criar produto
  const cliProd = await request(app).post("/api/products").set("Cookie", clienteCookie).send({
    nome: "Novo Produto Cliente", categoria: "Lanches", preco: 25, estoque: 10
  });
  assert.equal(cliProd.status, 403);

  // Loja pode criar produto
  const lojaProd = await request(app).post("/api/products").set("Cookie", lojaCookie).send({
    nome: "Cuscuz Especial da Loja", categoria: "Pratos", preco: 18.50, estoque: 20
  });
  assert.equal(lojaProd.status, 201);
  assert.equal(lojaProd.body.nome, "Cuscuz Especial da Loja");
});
