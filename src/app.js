import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import db from "./db.js";
import unidadesRouter from "./routes/unidades.js";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "../public");
const productImagesDir = path.resolve(currentDir, "imagens");

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  referrerPolicy: { policy: "no-referrer" }
}));

app.use((req, _res, next) => {
  const cookies = {};
  for (const part of (req.headers.cookie || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    try {
      cookies[name] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      cookies[name] = "";
    }
  }
  req.cookies = cookies;
  next();
});

const configuredOrigins = (process.env.RAIZES_CORS_ORIGINS || "")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const localOrigins = [/^https?:\/\/localhost(?::\d+)?$/, /^https?:\/\/127\.0\.0\.1(?::\d+)?$/];
app.use(cors({
  origin(origin, callback) {
    if (!origin || localOrigins.some((pattern) => pattern.test(origin)) || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origem não permitida."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

const apiLimiter = db.createRateLimiter({ keyPrefix: "api", points: 300, duration: 900 });
const loginLimiter = db.createRateLimiter({ keyPrefix: "login", points: 5, duration: 900 });
const registrationLimiter = db.createRateLimiter({ keyPrefix: "register", points: 10, duration: 900 });
const migrationLimiter = db.createRateLimiter({ keyPrefix: "account-migration", points: 3, duration: 900 });
const limitRequests = (limiter, errorMessage) => async (req, res, next) => {
  try {
    await limiter.consume(req.ip || req.socket?.remoteAddress || "unknown");
    return next();
  } catch (error) {
    if (Number.isFinite(error?.msBeforeNext)) {
      res.setHeader("Retry-After", Math.ceil(error.msBeforeNext / 1000));
      return res.status(429).json({ erro: errorMessage });
    }
    return next(error);
  }
};

app.use("/api", limitRequests(apiLimiter, "Muitas requisições recebidas. Tente novamente em alguns minutos."));
app.use("/api/auth/login", limitRequests(loginLimiter, "Muitas tentativas de login. Tente novamente em 15 minutos."));
app.use("/api/auth/register", limitRequests(registrationLimiter, "Muitos cadastros. Tente novamente em 15 minutos."));
app.use("/api/auth/migrate-local-users", limitRequests(migrationLimiter, "Muitas solicitações de migração. Tente novamente mais tarde."));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/imagens", express.static(productImagesDir, { index: false }));
app.use(express.static(publicDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aplicacao: "Rede Raízes do Nordeste" });
});

app.use("/api/auth", authRouter);
app.use("/api/unidades", unidadesRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

app.use((req, res) => {
  res.status(404).json({ erro: "Recurso não encontrado." });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ erro: "JSON inválido." });
  }
  if (error?.message === "Origem não permitida.") {
    return res.status(403).json({ erro: "Origem não permitida." });
  }
  console.error("Erro não tratado da aplicação:", error);
  return res.status(500).json({ erro: "Erro interno do servidor." });
});

export default app;
