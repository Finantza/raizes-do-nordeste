import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import "./db.js";
import unidadesRouter from "./routes/unidades.js";

// Este arquivo cria a API principal da aplicação.
// Ele é o "portão de entrada" do sistema: recebe pedidos do frontend,
// valida quem pode acessar, protege a aplicação e entrega respostas em JSON.
const app = express();
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const publicDir = path.resolve(currentDir, "../public");
const productImagesDir = path.resolve(currentDir, "imagens");
const requestHistory = new Map();
const RATE_LIMIT = Object.freeze({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5
});

// Limite de requisições: impede que alguém envie muitos pedidos em sequência,
// como uma tentativa de ataque ou abuso da API.
const apiLimiter = (req, res, next) => {
  const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const previousRequests = requestHistory.get(clientIp) || [];
  const recentRequests = previousRequests.filter((timestamp) => timestamp > now - RATE_LIMIT.windowMs);

  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    return res.status(429).json({
      erro: "Muitas requisições recebidas. Tente novamente em alguns minutos."
    });
  }

  recentRequests.push(now);
  requestHistory.set(clientIp, recentRequests);
  return next();
};

// Diz ao Express para confiar no IP do proxy quando a app estiver atrás de um servidor externo.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Cabeçalhos de segurança: deixam a aplicação mais difícil de ser explorada por terceiros.
app.use((_req, res, next) => {
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
  );
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = [
        /^https?:\/\/localhost(?::\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(?::\d+)?$/
      ];

      if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origem não permitida."));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);
app.options("*", cors());
app.use("/api", apiLimiter);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use("/imagens", express.static(productImagesDir, { index: false }));
app.use(express.static(publicDir));

// Verificação simples da API: mostra se o backend está vivo.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aplicacao: "Rede Raízes do Nordeste" });
});

app.use("/api/unidades", unidadesRouter);

app.use((req, res) => {
  res.status(404).json({ erro: "Recurso não encontrado." });
});

app.use((erro, _req, res, _next) => {
  if (erro instanceof SyntaxError && "body" in erro) {
    return res.status(400).json({ erro: "JSON inválido." });
  }

  if (erro && erro.message === "Origem não permitida.") {
    return res.status(403).json({ erro: "Origem não permitida." });
  }

  console.error("Erro não tratado da aplicação:", erro);
  return res.status(500).json({ erro: "Erro interno do servidor." });
});

export default app;
