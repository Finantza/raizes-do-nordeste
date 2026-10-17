import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import pg from "pg";
import { RateLimiterPostgres, RateLimiterSQLite } from "rate-limiter-flexible";

const { Pool } = pg;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sqlitePath = process.env.RAIZES_DB_PATH
  ? path.resolve(process.env.RAIZES_DB_PATH)
  : path.resolve(currentDir, "../data/raizes.sqlite");
const usePostgres = Boolean(process.env.DATABASE_URL);
let execute;
let rows;
let pool;
let sqlite;

if (usePostgres) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  const query = async (sql, params = []) => {
    let index = 0;
    return pool.query(sql.replace(/\?/g, () => `$${++index}`), params);
  };
  execute = async (sql, params = []) => query(sql, params);
  rows = async (sql, params = []) => (await query(sql, params)).rows;
} else {
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  sqlite = new Database(sqlitePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  execute = async (sql, params = []) => sqlite.prepare(sql).run(...params);
  rows = async (sql, params = []) => sqlite.prepare(sql).all(...params);
}

const schema = usePostgres
  ? [
      `CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','loja','cliente')),
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id BIGSERIAL PRIMARY KEY, nome TEXT NOT NULL, categoria TEXT NOT NULL, descricao TEXT NOT NULL,
        preco DOUBLE PRECISION NOT NULL, estoque INTEGER NOT NULL, offer DOUBLE PRECISION NOT NULL,
        imagem TEXT NOT NULL, itens_inclusos TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), legacy_id TEXT,
        store TEXT NOT NULL,
        region TEXT NOT NULL, method TEXT NOT NULL, total DOUBLE PRECISION NOT NULL,
        items_json TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Em preparo', UNIQUE(user_id,legacy_id)
      )`,
      `CREATE TABLE IF NOT EXISTS unidades (
        id BIGSERIAL PRIMARY KEY, codigo TEXT NOT NULL UNIQUE, nome TEXT NOT NULL,
        cidade TEXT NOT NULL, estado TEXT NOT NULL, ativa INTEGER NOT NULL, criada_em TEXT NOT NULL
      )`,
    ]
  : [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','loja','cliente')),
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY, nome TEXT NOT NULL, categoria TEXT NOT NULL, descricao TEXT NOT NULL,
        preco REAL NOT NULL, estoque INTEGER NOT NULL, offer REAL NOT NULL,
        imagem TEXT NOT NULL, itens_inclusos TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), legacy_id TEXT,
        store TEXT NOT NULL,
        region TEXT NOT NULL, method TEXT NOT NULL, total REAL NOT NULL,
        items_json TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Em preparo', UNIQUE(user_id,legacy_id)
      )`,
      `CREATE TABLE IF NOT EXISTS unidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT NOT NULL UNIQUE, nome TEXT NOT NULL,
        cidade TEXT NOT NULL, estado TEXT NOT NULL, ativa INTEGER NOT NULL, criada_em TEXT NOT NULL
      )`,
    ];

async function loadDefaultProducts() {
  const browserContext = { window: {} };
  const catalogPath = path.resolve(currentDir, "../public/products.js");
  vm.runInNewContext(fs.readFileSync(catalogPath, "utf8"), browserContext);
  return browserContext.window.RAIZES_DEFAULT_PRODUCTS;
}

async function initializeDatabase() {
  for (const statement of schema) await execute(statement);

  const productCount = await rows("SELECT COUNT(*) AS count FROM products");
  if (Number(productCount[0].count) === 0) {
    const products = await loadDefaultProducts();
    for (const product of products) {
      await execute(
        `INSERT INTO products (id,nome,categoria,descricao,preco,estoque,offer,imagem,itens_inclusos)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          product.id, product.nome, product.categoria, product.descricao,
          product.preco, product.estoque, product.offer, product.imagem || "",
          JSON.stringify(product.itensInclusos || [])
        ]
      );
    }
  }
  if (usePostgres) {
    await execute("SELECT setval(pg_get_serial_sequence('products','id'), COALESCE((SELECT MAX(id) FROM products), 1))");
  }

  const unitCount = await rows("SELECT COUNT(*) AS count FROM unidades");
  const legacyPath = path.resolve(currentDir, "../data/raizes.json");
  if (Number(unitCount[0].count) === 0 && fs.existsSync(legacyPath)) {
    const legacyData = JSON.parse(fs.readFileSync(legacyPath, "utf8"));
    for (const unit of legacyData.unidades || []) {
      if (usePostgres) {
        await execute(
          `INSERT INTO unidades (codigo,nome,cidade,estado,ativa,criada_em) VALUES (?,?,?,?,?,?) ON CONFLICT (codigo) DO NOTHING`,
          [unit.codigo, unit.nome, unit.cidade, unit.estado, unit.ativa || 1, unit.criada_em || new Date().toISOString()]
        );
      } else {
        await execute(
          "INSERT OR IGNORE INTO unidades (id,codigo,nome,cidade,estado,ativa,criada_em) VALUES (?,?,?,?,?,?,?)",
          [unit.id, unit.codigo, unit.nome, unit.cidade, unit.estado, unit.ativa || 1, unit.criada_em || new Date().toISOString()]
        );
      }
    }
  }
  if (usePostgres) {
    await execute("SELECT setval(pg_get_serial_sequence('unidades','id'), COALESCE((SELECT MAX(id) FROM unidades), 1))");
  }

  if (process.env.NODE_ENV !== "production") {
    const seeds = [
      ["RAIZES_DEV_ADMIN_EMAIL", "RAIZES_DEV_ADMIN_PASSWORD", "Administrador", "admin"],
      ["RAIZES_DEV_STORE_EMAIL", "RAIZES_DEV_STORE_PASSWORD", "Equipe da loja", "loja"]
    ];
    for (const [emailKey, passwordKey, name, role] of seeds) {
      const email = process.env[emailKey]?.trim().toLowerCase();
      const password = process.env[passwordKey];
      if (!email && !password) continue;
      if (!email || !password || password.length < 12) {
        throw new Error(`${emailKey} e ${passwordKey} devem estar definidos, com senha de ao menos 12 caracteres.`);
      }
      const existing = await rows("SELECT id FROM users WHERE email = ?", [email]);
      if (!existing.length) {
        await execute(
          "INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)",
          [name, email, await bcrypt.hash(password, 12), role, new Date().toISOString()]
        );
      }
    }
  }
}

await initializeDatabase();

function mapProduct(product) {
  return { ...product, itensInclusos: JSON.parse(product.itens_inclusos || "[]") };
}

async function listUnidades() {
  return rows("SELECT id,codigo,nome,cidade,estado,ativa,criada_em FROM unidades ORDER BY nome");
}

async function createUnidade(novaUnidade) {
  const result = await execute(
    `INSERT INTO unidades (codigo,nome,cidade,estado,ativa,criada_em) VALUES (?,?,?,?,?,?)`,
    [novaUnidade.codigo, novaUnidade.nome, novaUnidade.cidade, novaUnidade.estado, 1, new Date().toISOString()]
  ).catch((error) => {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "23505") error.code = "UNIQUE_CONSTRAINT";
    throw error;
  });

  if (usePostgres) return (await rows("SELECT * FROM unidades WHERE codigo = ?", [novaUnidade.codigo]))[0];
  return rows("SELECT * FROM unidades WHERE id = ?", [result.lastInsertRowid]).then((found) => found[0]);
}

async function findUserByEmail(email) {
  const found = await rows("SELECT id,name,email,password_hash,role FROM users WHERE email = ?", [email]);
  return found[0] || null;
}

async function findUserById(id) {
  const found = await rows("SELECT id,name,email,role FROM users WHERE id = ?", [id]);
  return found[0] || null;
}

async function createUser({ name, email, passwordHash, role = "cliente" }) {
  await execute(
    "INSERT INTO users (name,email,password_hash,role,created_at) VALUES (?,?,?,?,?)",
    [name, email, passwordHash, role, new Date().toISOString()]
  );
  return findUserByEmail(email);
}

async function createSession(id, userId, expiresAt) {
  await execute("INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)", [id, userId, expiresAt]);
}

async function findSession(id) {
  const found = await rows(
    `SELECT users.id,users.name,users.email,users.role,sessions.expires_at
     FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.id=?`,
    [id]
  );
  if (!found.length || Date.parse(found[0].expires_at) <= Date.now()) {
    await execute("DELETE FROM sessions WHERE id=?", [id]);
    return null;
  }
  return found[0];
}

async function deleteSession(id) {
  await execute("DELETE FROM sessions WHERE id=?", [id]);
}

async function listProducts() {
  return (await rows("SELECT * FROM products ORDER BY id")).map(mapProduct);
}

async function createProduct(product) {
  const result = await execute(
    `INSERT INTO products (nome,categoria,descricao,preco,estoque,offer,imagem,itens_inclusos)
     VALUES (?,?,?,?,?,?,?,?)${usePostgres ? " RETURNING id" : ""}`,
    [product.nome, product.categoria, product.descricao || "", product.preco, product.estoque, product.offer || 0, product.imagem || "", JSON.stringify(product.itensInclusos || [])]
  );
  const found = usePostgres
    ? await rows("SELECT * FROM products WHERE id=?", [result.rows[0].id])
    : await rows("SELECT * FROM products WHERE id=?", [result.lastInsertRowid]);
  return mapProduct(found[0]);
}

async function upsertProduct(product) {
  await execute(
    `INSERT INTO products (id,nome,categoria,descricao,preco,estoque,offer,imagem,itens_inclusos)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT (id) DO UPDATE SET nome=excluded.nome,categoria=excluded.categoria,
     descricao=excluded.descricao,preco=excluded.preco,estoque=excluded.estoque,
     offer=excluded.offer,imagem=excluded.imagem,itens_inclusos=excluded.itens_inclusos`,
    [product.id, product.nome, product.categoria, product.descricao || "", product.preco, product.estoque, product.offer || 0, product.imagem || "", JSON.stringify(product.itensInclusos || [])]
  );
  if (usePostgres) {
    await execute("SELECT setval(pg_get_serial_sequence('products','id'), GREATEST((SELECT MAX(id) FROM products), 1))");
  }
  const found = await rows("SELECT * FROM products WHERE id=?", [product.id]);
  return mapProduct(found[0]);
}

async function updateProduct(id, product) {
  await execute(
    `UPDATE products SET nome=?,categoria=?,descricao=?,preco=?,estoque=?,offer=?,imagem=?,itens_inclusos=? WHERE id=?`,
    [product.nome, product.categoria, product.descricao || "", product.preco, product.estoque, product.offer || 0, product.imagem || "", JSON.stringify(product.itensInclusos || []), id]
  );
  const found = await rows("SELECT * FROM products WHERE id=?", [id]);
  return found[0] ? mapProduct(found[0]) : null;
}

async function deleteProduct(id) {
  return execute("DELETE FROM products WHERE id=?", [id]);
}

async function createOrder(order) {
  const id = globalThis.crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await execute(
    `INSERT INTO orders (id,user_id,legacy_id,store,region,method,total,items_json,details_json,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT (user_id,legacy_id) DO NOTHING`,
    [id, order.userId, order.legacyId || null, order.store, order.region, order.method, order.total, JSON.stringify(order.items), JSON.stringify(order.details || {}), createdAt]
  );
  const found = await rows(
    order.legacyId
      ? "SELECT id,created_at FROM orders WHERE user_id=? AND legacy_id=?"
      : "SELECT id,created_at FROM orders WHERE id=?",
    order.legacyId ? [order.userId, order.legacyId] : [id]
  );
  return { id: found[0].id, ...order, createdAt: found[0].created_at };
}

async function listOrders(userId) {
  const found = await rows(
    `SELECT id,user_id,store,region,method,total,items_json,details_json,created_at,status FROM orders
     ${userId ? "WHERE user_id=?" : ""} ORDER BY created_at DESC`,
    userId ? [userId] : []
  );
  return found.map((order) => {
    const { user_id: _userId, legacy_id: _legacyId, items_json, details_json, ...publicOrder } = order;
    return {
      ...publicOrder,
      items: JSON.parse(items_json),
      details: JSON.parse(details_json),
      timestamp: order.created_at
    };
  });
}

async function updateOrderStatus(id, status) {
  await execute("UPDATE orders SET status=? WHERE id=?", [status, id]);
  const found = await rows("SELECT id,status FROM orders WHERE id=?", [id]);
  return found[0] || null;
}

function createRateLimiter({ keyPrefix, points, duration }) {
  let readyResolve;
  let readyReject;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  const Limiter = usePostgres ? RateLimiterPostgres : RateLimiterSQLite;
  const limiter = new Limiter({
    storeClient: usePostgres ? pool : sqlite,
    ...(usePostgres ? {} : { storeType: "better-sqlite3" }),
    tableName: "rate_limiter_flexible",
    keyPrefix,
    points,
    duration
  }, (error) => error ? readyReject(error) : readyResolve());
  return {
    async consume(key) {
      await ready;
      return limiter.consume(key);
    }
  };
}

async function resetDatabase() {
  for (const table of ["sessions", "orders", "users", "products", "unidades"]) await execute(`DELETE FROM ${table}`);
  const products = await loadDefaultProducts();
  for (const product of products) {
    await execute(
      "INSERT INTO products (id,nome,categoria,descricao,preco,estoque,offer,imagem,itens_inclusos) VALUES (?,?,?,?,?,?,?,?,?)",
      [product.id, product.nome, product.categoria, product.descricao, product.preco, product.estoque, product.offer, product.imagem || "", JSON.stringify(product.itensInclusos || [])]
    );
  }
}

async function closeDatabase() {
  if (usePostgres) await pool.end();
  else sqlite.close();
}

export {
  closeDatabase, createOrder, createProduct, createRateLimiter, createSession, createUnidade, createUser,
  deleteProduct, deleteSession, findSession, findUserByEmail, findUserById, listOrders,
  listProducts, listUnidades, resetDatabase, updateOrderStatus, updateProduct, upsertProduct
};
export default {
  closeDatabase, createOrder, createProduct, createRateLimiter, createSession, createUnidade, createUser,
  deleteProduct, deleteSession, findSession, findUserByEmail, findUserById, listOrders,
  listProducts, listUnidades, resetDatabase, updateOrderStatus, updateProduct, upsertProduct
};
