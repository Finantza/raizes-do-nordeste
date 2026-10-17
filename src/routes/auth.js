import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import {
  clearSessionCookie, createSessionId, parseSignedSession, requireAuth, SESSION_TTL_MS, setSessionCookie
} from "../auth.js";

const router = Router();
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dummyPasswordHash = bcrypt.hashSync("non-existent-account-password", 12);

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function validateRegistration(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!name || name.length > 120 || !validEmail.test(email) || email.length > 254 || password.length < 8 || password.length > 128) {
    return null;
  }
  return { name, email, password };
}

router.post("/register", async (req, res, next) => {
  const input = validateRegistration(req.body);
  if (!input) return res.status(400).json({ erro: "Informe nome, e-mail válido e senha entre 8 e 128 caracteres." });

  try {
    const user = await db.createUser({
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "cliente"
    });
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "23505") {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!validEmail.test(email) || !password || password.length > 128) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  try {
    const user = await db.findUserByEmail(email);
    const validPassword = await bcrypt.compare(password, user?.password_hash || dummyPasswordHash);
    if (!user || !validPassword) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos." });
    }
    const sessionId = createSessionId();
    await db.createSession(sessionId, user.id, new Date(Date.now() + SESSION_TTL_MS).toISOString());
    setSessionCookie(res, sessionId);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res, next) => {
  const sessionId = parseSignedSession(req.cookies?.raizes_session);
  if (!sessionId) {
    clearSessionCookie(res);
    return res.status(204).end();
  }

  db.deleteSession(sessionId).then(() => {
    clearSessionCookie(res);
    return res.status(204).end();
  }).catch(next);
});

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

router.post("/migrate-local-users", async (req, res, next) => {
  const input = Array.isArray(req.body?.users) ? req.body.users : [];
  if (input.length > 200) return res.status(400).json({ erro: "A migração excede o limite de contas permitido." });
  const demonstrationEmails = new Set([
    "cliente@raizes.com", "admin@raizes.com", "loja@raizes.com"
  ]);
  let imported = 0;

  try {
    for (const legacyUser of input) {
      const validated = validateRegistration(legacyUser);
      if (!validated || demonstrationEmails.has(validated.email) || await db.findUserByEmail(validated.email)) continue;
      await db.createUser({
        name: validated.name,
        email: validated.email,
        passwordHash: await bcrypt.hash(validated.password, 12),
        role: "cliente"
      });
      imported += 1;
    }
    return res.json({ imported });
  } catch (error) {
    return next(error);
  }
});

export default router;
