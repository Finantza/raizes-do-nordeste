import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();
const orderStatuses = new Set(["Em preparo", "Em rota", "Concluído", "Cancelado"]);

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await db.listOrders(req.user.role === "cliente" ? req.user.id : null);
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, requireRole("cliente"), async (req, res, next) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
    return res.status(400).json({ erro: "O pedido deve conter de 1 a 50 itens." });
  }

  try {
    const products = await db.listProducts();
    const orderItems = [];
    for (const item of items) {
      const id = Number(item?.id);
      const quantity = Number(item?.quantity);
      const product = products.find((candidate) => Number(candidate.id) === id);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return res.status(400).json({ erro: "Um ou mais itens do pedido são inválidos." });
      }
      orderItems.push({
        id: product.id,
        nome: product.nome,
        quantity,
        preco: Math.round(Number(product.preco) * (1 - Number(product.offer) / 100) * 100) / 100
      });
    }

    const store = typeof req.body.store === "string" ? req.body.store.trim() : "";
    const region = typeof req.body.region === "string" ? req.body.region.trim() : "";
    const method = typeof req.body.method === "string" ? req.body.method.trim() : "";
    if (!store || store.length > 120 || !region || region.length > 80 || !["Delivery", "Retirada", "Balcão"].includes(method)) {
      return res.status(400).json({ erro: "Informe loja, região e modo de atendimento válidos." });
    }
    const details = {
      address: typeof req.body.address === "string" ? req.body.address.trim().slice(0, 200) : "",
      neighborhood: typeof req.body.neighborhood === "string" ? req.body.neighborhood.trim().slice(0, 100) : "",
      paymentMethod: typeof req.body.paymentMethod === "string" && ["Pix", "Cartão", "Dinheiro"].includes(req.body.paymentMethod)
        ? req.body.paymentMethod : "Pix"
    };
    const total = Math.round(orderItems.reduce((sum, item) => sum + item.preco * item.quantity, 0) * 100) / 100;
    const order = await db.createOrder({
      userId: req.user.id, store, region, method, total, items: orderItems, details, status: "Em preparo"
    });
    const { userId: _userId, ...publicOrder } = order;
    return res.status(201).json(publicOrder);
  } catch (error) {
    return next(error);
  }
});

router.post("/migrate-local", requireAuth, requireRole("cliente"), async (req, res, next) => {
  const legacyOrders = Array.isArray(req.body?.orders) ? req.body.orders : [];
  if (legacyOrders.length > 100) return res.status(400).json({ erro: "A migração excede o limite de pedidos permitido." });
  try {
    const products = await db.listProducts();
    let migrated = 0;
    for (const legacyOrder of legacyOrders) {
      if (typeof legacyOrder?.legacyId !== "string" || legacyOrder.legacyId.length > 160 ||
          !Array.isArray(legacyOrder.items) || legacyOrder.items.length < 1 || legacyOrder.items.length > 50) {
        return res.status(400).json({ erro: "Um pedido local possui dados inválidos." });
      }
      const items = [];
      for (const item of legacyOrder.items) {
        const product = products.find((candidate) => Number(candidate.id) === Number(item?.id));
        const quantity = Number(item?.quantity);
        if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
          return res.status(400).json({ erro: "Um pedido local contém itens inválidos." });
        }
        items.push({
          id: product.id,
          nome: product.nome,
          quantity,
          preco: Math.round(Number(product.preco) * (1 - Number(product.offer) / 100) * 100) / 100
        });
      }
      const store = typeof legacyOrder.store === "string" ? legacyOrder.store.trim().slice(0, 120) : "";
      const region = typeof legacyOrder.region === "string" ? legacyOrder.region.trim().slice(0, 80) : "";
      const method = ["Delivery", "Retirada", "Balcão"].includes(legacyOrder.method) ? legacyOrder.method : "Delivery";
      if (!store || !region) return res.status(400).json({ erro: "Um pedido local não informa loja ou região." });
      const total = Math.round(items.reduce((sum, item) => sum + item.preco * item.quantity, 0) * 100) / 100;
      await db.createOrder({
        userId: req.user.id,
        legacyId: legacyOrder.legacyId,
        store,
        region,
        method,
        total,
        items,
        details: {},
        status: "Em preparo"
      });
      migrated += 1;
    }
    return res.json({ migrated });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", requireAuth, requireRole("admin", "loja"), async (req, res, next) => {
  const status = req.body?.status;
  if (!orderStatuses.has(status)) return res.status(400).json({ erro: "Status operacional inválido." });
  try {
    const updated = await db.updateOrderStatus(req.params.id, status);
    return updated ? res.json(updated) : res.status(404).json({ erro: "Pedido não encontrado." });
  } catch (error) {
    return next(error);
  }
});

export default router;
