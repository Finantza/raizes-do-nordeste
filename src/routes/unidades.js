import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import db from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();

// Função para limpar textos de entrada. Ela remove caracteres estranhos e espaços extras,
// deixando os dados mais seguros e consistentes.
const normalizeText = (valor) => {
  if (typeof valor !== "string") {
    return "";
  }

  return valor.replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
};

const hasSuspiciousContent = (valor) => /[<>]/.test(valor);

const requireAdminToken = (req, res, next) => {
  const configuredToken = process.env.RAIZES_API_ADMIN_TOKEN;
  if (!configuredToken || Buffer.byteLength(configuredToken) < 32) {
    return res.status(503).json({ erro: "Cadastro de unidades desabilitado: token administrativo não configurado." });
  }

  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    return res.status(401).json({ erro: "Autenticação administrativa obrigatória." });
  }

  const receivedToken = Buffer.from(match[1]);
  const expectedToken = Buffer.from(configuredToken);
  if (receivedToken.length !== expectedToken.length || !timingSafeEqual(receivedToken, expectedToken)) {
    return res.status(401).json({ erro: "Token administrativo inválido." });
  }

  return next();
};

const requireAdmin = (req, res, next) => {
  if (req.get("authorization")) return requireAdminToken(req, res, next);
  return requireAuth(req, res, (error) => {
    if (error) return next(error);
    return requireRole("admin")(req, res, next);
  });
};

// Lista todas as unidades cadastradas.
router.get("/", async (_req, res, next) => {
  try {
    return res.json(await db.listUnidades());
  } catch (error) {
    return next(error);
  }
});

// Cria uma nova unidade. A validação aqui é importante porque bloqueia dados vazios,
// inválidos ou suspeitos antes de salvar qualquer coisa no sistema.
router.post("/", requireAdmin, async (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ erro: "O corpo da requisição deve ser um objeto JSON." });
  }

  const codigo = normalizeText(req.body.codigo);
  const nome = normalizeText(req.body.nome);
  const cidade = normalizeText(req.body.cidade);
  const estado = normalizeText(req.body.estado).toUpperCase();

  if ([codigo, nome, cidade, estado].some((valor) => valor === "")) {
    return res.status(400).json({ erro: "Informe código, nome, cidade e estado." });
  }

  if ([codigo, nome, cidade, estado].some((valor) => hasSuspiciousContent(valor))) {
    return res.status(400).json({ erro: "Há caracteres inválidos na entrada." });
  }

  const unidade = {
    codigo: codigo.toUpperCase(),
    nome,
    cidade,
    estado
  };

  if (!/^[A-Z0-9-]{2,20}$/.test(unidade.codigo)) {
    return res.status(400).json({ erro: "O código deve ter de 2 a 20 caracteres: letras, números ou hífen." });
  }

  if (!/^[A-Z]{2}$/.test(unidade.estado)) {
    return res.status(400).json({ erro: "Informe a sigla do estado com duas letras." });
  }

  if (unidade.nome.length > 120 || unidade.cidade.length > 100) {
    return res.status(400).json({ erro: "Nome deve ter até 120 caracteres e cidade até 100." });
  }

  try {
    const unidadeSalva = await db.createUnidade(unidade);

    return res.status(201).json({
      mensagem: "Unidade cadastrada com sucesso.",
      ...unidadeSalva
    });
  } catch (erro) {
    if (erro && (erro.code === "UNIQUE_CONSTRAINT" || erro.code === "23505")) {
      return res.status(409).json({ erro: "Já existe uma unidade com esse código." });
    }

    return next(erro);
  }
});

export default router;
