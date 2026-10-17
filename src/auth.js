import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import db from "./db.js";

const SESSION_COOKIE = "raizes_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const configuredSessionSecret = process.env.RAIZES_SESSION_SECRET;

if (process.env.NODE_ENV === "production" &&
    (!configuredSessionSecret || Buffer.byteLength(configuredSessionSecret) < 32)) {
  throw new Error("RAIZES_SESSION_SECRET deve conter ao menos 32 bytes em produção.");
}
const sessionSecret = configuredSessionSecret || randomBytes(32).toString("hex");

function signSessionId(sessionId) {
  return createHmac("sha256", sessionSecret).update(sessionId).digest("base64url");
}

function parseSignedSession(value) {
  if (!value) return null;
  const [sessionId, signature, extra] = value.split(".");
  if (!sessionId || !signature || extra) return null;
  const expected = Buffer.from(signSessionId(sessionId));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return sessionId;
}

function setSessionCookie(res, sessionId) {
  const value = `${sessionId}.${signSessionId(sessionId)}`;
  res.cookie(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/"
  });
}

function requireAuth(req, res, next) {
  const sessionId = parseSignedSession(req.cookies?.[SESSION_COOKIE]);
  if (!sessionId) return res.status(401).json({ erro: "Autenticação obrigatória." });

  db.findSession(sessionId).then((user) => {
    if (!user) return res.status(401).json({ erro: "Sessão inválida ou expirada." });
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  }).catch(next);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ erro: "Autenticação obrigatória." });
    if (!roles.includes(req.user.role)) return res.status(403).json({ erro: "Acesso não autorizado para este perfil." });
    return next();
  };
}

function createSessionId() {
  return randomBytes(32).toString("base64url");
}

export {
  SESSION_TTL_MS, clearSessionCookie, createSessionId, parseSignedSession, requireAuth,
  requireRole, setSessionCookie
};
