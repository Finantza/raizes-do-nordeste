import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();

// Acesso restrito apenas aos perfis administrativo (admin) e loja
router.use(requireAuth, requireRole("admin", "loja"));

router.get("/resumo", async (_req, res, next) => {
  try {
    const summary = await db.getStockSummary();
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
});

router.get("/movimentacoes", async (req, res, next) => {
  try {
    const movements = await db.listStockMovements(req.query.limit);
    return res.json(movements);
  } catch (error) {
    return next(error);
  }
});

function toStrictNumber(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim() !== "") return Number(val);
  return NaN;
}

router.post("/movimentacao", async (req, res, next) => {
  const productId = toStrictNumber(req.body?.productId);
  const tipo = typeof req.body?.tipo === "string" ? req.body.tipo.trim().toLowerCase() : "";
  const quantidade = toStrictNumber(req.body?.quantidade);
  const motivo = (typeof req.body?.motivo === "string"
    ? req.body.motivo.replace(/[\u0000-\u001F\u007F]+/g, " ").trim()
    : "") || "Ajuste manual";

  if (!Number.isSafeInteger(productId) || productId < 1) {
    return res.status(400).json({ erro: "Identificador de produto inválido." });
  }
  if (!["entrada", "saida", "ajuste"].includes(tipo)) {
    return res.status(400).json({ erro: "Tipo de movimentação deve ser 'entrada', 'saida' ou 'ajuste'." });
  }
  const minQty = tipo === "ajuste" ? 0 : 1;
  if (!Number.isInteger(quantidade) || quantidade < minQty || quantidade > 100000) {
    return res.status(400).json({ erro: `Quantidade deve ser um número inteiro de ${minQty} até 100.000.` });
  }
  if (motivo.length > 255 || /[<>]/.test(motivo)) {
    return res.status(400).json({ erro: "Motivo com caracteres inválidos ou muito longo." });
  }

  try {
    const result = await db.registerStockMovement({
      productId,
      tipo,
      quantidade,
      motivo,
      usuarioNome: req.user?.name || "Operador"
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status === 404) return res.status(404).json({ erro: error.message });
    return next(error);
  }
});

export default router;
