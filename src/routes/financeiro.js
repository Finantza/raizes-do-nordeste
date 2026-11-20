import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();

// Acesso restrito apenas aos perfis administrativo (admin) e loja
router.use(requireAuth, requireRole("admin", "loja"));

function toStrictNumber(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim() !== "") return Number(val);
  return NaN;
}

function isValidIsoDate(str) {
  if (typeof str !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const date = new Date(`${str}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === str;
}

function validateLancamento(body) {
  const tipo = typeof body?.tipo === "string" ? body.tipo.trim().toLowerCase() : "";
  const titulo = typeof body?.titulo === "string" ? body.titulo.replace(/[\u0000-\u001F\u007F]+/g, " ").trim() : "";
  const categoria = (typeof body?.categoria === "string" ? body.categoria.replace(/[\u0000-\u001F\u007F]+/g, " ").trim() : "") || "Geral";
  const valor = toStrictNumber(body?.valor);
  const dataVencimento = typeof body?.dataVencimento === "string" ? body.dataVencimento.trim() : "";
  const status = typeof body?.status === "string" && ["pendente", "pago"].includes(body.status.trim().toLowerCase())
    ? body.status.trim().toLowerCase()
    : "pendente";
  const dataPagamento = typeof body?.dataPagamento === "string" && body.dataPagamento.trim()
    ? body.dataPagamento.trim()
    : (status === "pago" ? new Date().toISOString().slice(0, 10) : null);
  const formaPagamento = (typeof body?.formaPagamento === "string" ? body.formaPagamento.replace(/[\u0000-\u001F\u007F]+/g, " ").trim() : "") || "Pix";
  const observacoes = typeof body?.observacoes === "string" ? body.observacoes.replace(/[\u0000-\u001F\u007F]+/g, " ").trim() : "";
  const loja = (typeof body?.loja === "string" ? body.loja.replace(/[\u0000-\u001F\u007F]+/g, " ").trim() : "") || "Loja Geral";

  if (!["pagar", "receber"].includes(tipo)) return null;
  if (!titulo || titulo.length > 150 || /[<>]/.test(titulo)) return null;
  if (categoria.length > 80 || /[<>]/.test(categoria)) return null;
  if (!Number.isFinite(valor) || valor <= 0 || valor > 10000000) return null;
  if (!isValidIsoDate(dataVencimento)) return null;
  if (dataPagamento && !isValidIsoDate(dataPagamento)) return null;
  if (formaPagamento.length > 60 || /[<>]/.test(formaPagamento)) return null;
  if (observacoes.length > 500 || /[<>]/.test(observacoes)) return null;
  if (loja.length > 100 || /[<>]/.test(loja)) return null;

  return {
    tipo,
    titulo,
    categoria,
    valor,
    dataVencimento,
    dataPagamento,
    status,
    formaPagamento,
    observacoes,
    loja
  };
}

router.get("/resumo", async (_req, res, next) => {
  try {
    const summary = await db.getFinanceiroSummary();
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { tipo, status, search, limit } = req.query;
    const entries = await db.listFinanceiro({ tipo, status, search, limit });
    return res.json(entries);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const lancamento = validateLancamento(req.body);
  if (!lancamento) {
    return res.status(400).json({ erro: "Dados de lançamento financeiro inválidos." });
  }

  try {
    const created = await db.createFinanceiroLancamento(lancamento);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  const id = Number(req.params.id);
  const status = typeof req.body?.status === "string" ? req.body.status.trim().toLowerCase() : "";
  const rawDataPagamento = typeof req.body?.dataPagamento === "string" ? req.body.dataPagamento.trim() : "";

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }
  if (!["pendente", "pago"].includes(status)) {
    return res.status(400).json({ erro: "Status deve ser 'pendente' ou 'pago'." });
  }
  if (rawDataPagamento && !isValidIsoDate(rawDataPagamento)) {
    return res.status(400).json({ erro: "Data de pagamento inválida." });
  }
  const dataPagamento = rawDataPagamento || null;

  try {
    const updated = await db.updateFinanceiroStatus(id, status, dataPagamento);
    if (!updated) return res.status(404).json({ erro: "Lançamento não encontrado." });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }

  try {
    const result = await db.deleteFinanceiroLancamento(id);
    if (result.changes || result.rowCount) {
      return res.status(204).end();
    }
    return res.status(404).json({ erro: "Lançamento não encontrado." });
  } catch (error) {
    return next(error);
  }
});

export default router;
