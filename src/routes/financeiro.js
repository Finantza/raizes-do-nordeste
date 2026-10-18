import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();

// Acesso restrito apenas aos perfis administrativo (admin) e loja
router.use(requireAuth, requireRole("admin", "loja"));

function validateLancamento(body) {
  const tipo = typeof body?.tipo === "string" ? body.tipo.trim().toLowerCase() : "";
  const titulo = typeof body?.titulo === "string" ? body.titulo.trim() : "";
  const categoria = typeof body?.categoria === "string" ? body.categoria.trim() : "Geral";
  const valor = Number(body?.valor);
  const dataVencimento = typeof body?.dataVencimento === "string" ? body.dataVencimento.trim() : "";
  const dataPagamento = typeof body?.dataPagamento === "string" && body.dataPagamento.trim() ? body.dataPagamento.trim() : null;
  const status = typeof body?.status === "string" && ["pendente", "pago"].includes(body.status.trim().toLowerCase())
    ? body.status.trim().toLowerCase()
    : "pendente";
  const formaPagamento = typeof body?.formaPagamento === "string" ? body.formaPagamento.trim() : "Pix";
  const observacoes = typeof body?.observacoes === "string" ? body.observacoes.trim() : "";
  const loja = typeof body?.loja === "string" ? body.loja.trim() : "Loja Geral";

  if (!["pagar", "receber"].includes(tipo)) return null;
  if (!titulo || titulo.length > 150 || /[<>]/.test(titulo)) return null;
  if (categoria.length > 80 || /[<>]/.test(categoria)) return null;
  if (!Number.isFinite(valor) || valor <= 0 || valor > 10000000) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataVencimento)) return null;
  if (dataPagamento && !/^\d{4}-\d{2}-\d{2}$/.test(dataPagamento)) return null;
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
  const dataPagamento = typeof req.body?.dataPagamento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.body.dataPagamento)
    ? req.body.dataPagamento
    : null;

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }
  if (!["pendente", "pago"].includes(status)) {
    return res.status(400).json({ erro: "Status deve ser 'pendente' ou 'pago'." });
  }

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
