import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();
const categories = new Set(["Lanches", "Pratos", "Bebidas", "Sobremesas", "Ofertas"]);

function validateProduct(body) {
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const categoria = typeof body?.categoria === "string" ? body.categoria.trim() : "";
  const descricao = typeof body?.descricao === "string" ? body.descricao.trim() : "";
  const preco = Number(body?.preco);
  const estoque = Number(body?.estoque);
  const offer = body?.offer === undefined ? 0 : Number(body.offer);
  if (!nome || nome.length > 120 || /[<>]/.test(nome) ||
      !categories.has(categoria) || descricao.length > 1000 || /[<>]/.test(descricao) ||
      !Number.isFinite(preco) || preco < 0 || preco > 100000 ||
      !Number.isInteger(estoque) || estoque < 0 || estoque > 1000000 ||
      !Number.isFinite(offer) || offer < 0 || offer > 100) return null;
  const imagem = typeof body.imagem === "string" ? body.imagem : "";
  const allowedImage = !imagem ||
    /^\.\/(imagens|images\/products)\/[A-Za-z0-9._%/-]+$/.test(imagem) ||
    /^\/images\/products\/[a-z0-9-]+\.jpg$/.test(imagem) ||
    (imagem.length <= 900000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(imagem));
  if (!allowedImage) return null;
  const itensInclusos = Array.isArray(body.itensInclusos) &&
    body.itensInclusos.length <= 20 &&
    body.itensInclusos.every((item) => typeof item === "string" && item.length <= 100 && !/[<>]/.test(item))
    ? body.itensInclusos : [];
  return { nome, categoria, descricao, preco, estoque, offer, imagem, itensInclusos };
}

router.get("/", async (_req, res, next) => {
  try {
    return res.json(await db.listProducts());
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, requireRole("admin", "loja"), async (req, res, next) => {
  const product = validateProduct(req.body);
  if (!product) return res.status(400).json({ erro: "Dados do produto inválidos ou com caracteres não permitidos." });
  try {
    return res.status(201).json(await db.createProduct(product));
  } catch (error) {
    return next(error);
  }
});

router.post("/migrate-local", requireAuth, requireRole("admin"), async (req, res, next) => {
  const id = Number(req.body?.product?.id);
  const product = validateProduct(req.body?.product);
  if (!Number.isSafeInteger(id) || id < 1 || !product) {
    return res.status(400).json({ erro: "Produto local inválido para migração." });
  }
  try {
    return res.json(await db.upsertProduct({ id, ...product }));
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", requireAuth, requireRole("admin", "loja"), async (req, res, next) => {
  const id = Number(req.params.id);
  const product = validateProduct(req.body);
  if (!Number.isSafeInteger(id) || id < 1 || !product) {
    return res.status(400).json({ erro: "Identificador ou dados do produto inválidos." });
  }
  try {
    const updated = await db.updateProduct(id, product);
    return updated ? res.json(updated) : res.status(404).json({ erro: "Produto não encontrado." });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "loja"), async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ erro: "Identificador de produto inválido." });
  try {
    const deleted = await db.deleteProduct(id);
    return (deleted.changes || deleted.rowCount) ? res.status(204).end() : res.status(404).json({ erro: "Produto não encontrado." });
  } catch (error) {
    return next(error);
  }
});

export default router;
