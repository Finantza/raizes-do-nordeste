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
      `CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
        id BIGSERIAL PRIMARY KEY,
        product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
        quantidade INTEGER NOT NULL,
        estoque_anterior INTEGER NOT NULL,
        estoque_novo INTEGER NOT NULL,
        motivo TEXT NOT NULL,
        usuario_nome TEXT NOT NULL,
        criado_em TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
        id BIGSERIAL PRIMARY KEY,
        tipo TEXT NOT NULL CHECK (tipo IN ('pagar','receber')),
        titulo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        valor DOUBLE PRECISION NOT NULL,
        data_vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        status TEXT NOT NULL CHECK (status IN ('pendente','pago')),
        forma_pagamento TEXT NOT NULL DEFAULT 'Pix',
        observacoes TEXT,
        loja TEXT NOT NULL DEFAULT 'Loja Geral',
        criado_em TEXT NOT NULL
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
      `CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
        quantidade INTEGER NOT NULL,
        estoque_anterior INTEGER NOT NULL,
        estoque_novo INTEGER NOT NULL,
        motivo TEXT NOT NULL,
        usuario_nome TEXT NOT NULL,
        criado_em TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK (tipo IN ('pagar','receber')),
        titulo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        valor REAL NOT NULL,
        data_vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        status TEXT NOT NULL CHECK (status IN ('pendente','pago')),
        forma_pagamento TEXT NOT NULL DEFAULT 'Pix',
        observacoes TEXT,
        loja TEXT NOT NULL DEFAULT 'Loja Geral',
        criado_em TEXT NOT NULL
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
      ["RAIZES_DEV_ADMIN_EMAIL", "RAIZES_DEV_ADMIN_PASSWORD", "Administrador", "admin", "admin@raizes.com", "admin12345678"],
      ["RAIZES_DEV_STORE_EMAIL", "RAIZES_DEV_STORE_PASSWORD", "Equipe da loja", "loja", "loja@raizes.com", "loja12345678"],
      ["RAIZES_DEV_CLIENT_EMAIL", "RAIZES_DEV_CLIENT_PASSWORD", "Cliente Teste", "cliente", "cliente@raizes.com", "cliente12345678"]
    ];
    for (const [emailKey, passwordKey, name, role, defaultEmail, defaultPassword] of seeds) {
      const email = process.env[emailKey]?.trim().toLowerCase() || (process.env.RAIZES_DB_PATH ? null : defaultEmail);
      const password = process.env[passwordKey] || (process.env.RAIZES_DB_PATH ? null : defaultPassword);
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

  const financeiroCount = await rows("SELECT COUNT(*) AS count FROM financeiro_lancamentos");
  if (Number(financeiroCount[0].count) === 0 && !process.env.RAIZES_DB_PATH) {
    const hoje = new Date().toISOString().slice(0, 10);
    const venc1 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    const venc2 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const venc3 = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    const venc4 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const defaultFinanceiro = [
      { tipo: "pagar", titulo: "Fornecedor Queijo de Coalho & Manteiga da Terra", categoria: "Ingredientes", valor: 1450.00, data_vencimento: venc1, data_pagamento: null, status: "pendente", forma_pagamento: "Boleto", observacoes: "Entrega semanal de laticínios regionais", loja: "Loja Centro" },
      { tipo: "pagar", titulo: "Distribuidora de Carnes & Charque do Sertão", categoria: "Fornecedores", valor: 2380.00, data_vencimento: venc2, data_pagamento: null, status: "pendente", forma_pagamento: "Pix", observacoes: "Lote especial de carne de sol e carne seca", loja: "Loja Centro" },
      { tipo: "pagar", titulo: "Energia Elétrica & Refrigeração das Câmaras", categoria: "Despesas Fixas", valor: 1120.50, data_vencimento: venc3, data_pagamento: venc3, status: "pago", forma_pagamento: "Débito", observacoes: "Conta mensal de energia", loja: "Loja Centro" },
      { tipo: "pagar", titulo: "Embalagens Biodegradáveis para Delivery", categoria: "Insumos", valor: 690.00, data_vencimento: venc4, data_pagamento: null, status: "pendente", forma_pagamento: "Pix", observacoes: "Sacolas kraft e caixas térmicas", loja: "Loja Centro" },
      { tipo: "receber", titulo: "Repasse Semanal Cartões e Maquininhas", categoria: "Vendas", valor: 5420.80, data_vencimento: venc3, data_pagamento: venc3, status: "pago", forma_pagamento: "Transferência", observacoes: "Vendas de balcão e salão", loja: "Loja Centro" },
      { tipo: "receber", titulo: "Encomenda Coffee Break Corporativo", categoria: "Eventos", valor: 1850.00, data_vencimento: venc1, data_pagamento: null, status: "pendente", forma_pagamento: "Pix", observacoes: "Kit tapiocas, cuscuz e bolos regionais", loja: "Loja Centro" },
      { tipo: "receber", titulo: "Repasse Delivery Aplicativo Parceiro", categoria: "Delivery", valor: 3190.00, data_vencimento: venc2, data_pagamento: null, status: "pendente", forma_pagamento: "Pix", observacoes: "Fechamento de pedidos online quinzenal", loja: "Loja Centro" }
    ];
    for (const item of defaultFinanceiro) {
      await execute(
        `INSERT INTO financeiro_lancamentos (tipo,titulo,categoria,valor,data_vencimento,data_pagamento,status,forma_pagamento,observacoes,loja,criado_em)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [item.tipo, item.titulo, item.categoria, item.valor, item.data_vencimento, item.data_pagamento, item.status, item.forma_pagamento, item.observacoes, item.loja, new Date().toISOString()]
      );
    }
  }

  const movimentacoesCount = await rows("SELECT COUNT(*) AS count FROM estoque_movimentacoes");
  if (Number(movimentacoesCount[0].count) === 0 && !process.env.RAIZES_DB_PATH) {
    const sampleProducts = await rows("SELECT id, nome, estoque FROM products LIMIT 3");
    for (const p of sampleProducts) {
      await execute(
        `INSERT INTO estoque_movimentacoes (product_id, tipo, quantidade, estoque_anterior, estoque_novo, motivo, usuario_nome, criado_em)
         VALUES (?,?,?,?,?,?,?,?)`,
        [p.id, "entrada", 10, Math.max(0, p.estoque - 10), p.estoque, "Reabastecimento inicial", "Administrador", new Date().toISOString()]
      );
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

async function listStockMovements(limit = 100) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 50), 200);
  return rows(
    `SELECT m.id, m.product_id, m.tipo, m.quantidade, m.estoque_anterior, m.estoque_novo,
            m.motivo, m.usuario_nome, m.criado_em, p.nome AS produto_nome, p.categoria AS produto_categoria
     FROM estoque_movimentacoes m
     JOIN products p ON p.id = m.product_id
     ORDER BY m.id DESC LIMIT ?`,
    [safeLimit]
  );
}

async function registerStockMovement({ productId, tipo, quantidade, motivo, usuarioNome }) {
  const productRows = await rows("SELECT * FROM products WHERE id = ?", [productId]);
  if (!productRows.length) {
    const error = new Error("Produto não encontrado.");
    error.status = 404;
    throw error;
  }
  const product = productRows[0];
  const estoqueAnterior = Number(product.estoque || 0);
  const qtd = Math.max(0, parseInt(quantidade, 10));

  let estoqueNovo = estoqueAnterior;
  if (tipo === "entrada") {
    estoqueNovo = estoqueAnterior + qtd;
  } else if (tipo === "saida") {
    estoqueNovo = Math.max(0, estoqueAnterior - qtd);
  } else if (tipo === "ajuste") {
    estoqueNovo = qtd;
  } else {
    const error = new Error("Tipo de movimentação inválido. Use 'entrada', 'saida' ou 'ajuste'.");
    error.status = 400;
    throw error;
  }

  await execute("UPDATE products SET estoque = ? WHERE id = ?", [estoqueNovo, productId]);
  const createdAt = new Date().toISOString();
  const insertResult = await execute(
    `INSERT INTO estoque_movimentacoes (product_id, tipo, quantidade, estoque_anterior, estoque_novo, motivo, usuario_nome, criado_em)
     VALUES (?,?,?,?,?,?,?,?)${usePostgres ? " RETURNING id" : ""}`,
    [productId, tipo, qtd, estoqueAnterior, estoqueNovo, motivo || "Ajuste manual", usuarioNome || "Operador", createdAt]
  );
  const movementId = usePostgres ? insertResult.rows[0].id : insertResult.lastInsertRowid;
  const movementRows = await rows(
    `SELECT m.*, p.nome AS produto_nome, p.categoria AS produto_categoria
     FROM estoque_movimentacoes m
     JOIN products p ON p.id = m.product_id
     WHERE m.id = ?`,
    [movementId]
  );
  return {
    product: mapProduct({ ...product, estoque: estoqueNovo }),
    movement: movementRows[0]
  };
}

async function getStockSummary() {
  const products = (await rows("SELECT * FROM products ORDER BY nome ASC")).map(mapProduct);
  const totalItens = products.reduce((acc, p) => acc + Number(p.estoque || 0), 0);
  const valorTotal = products.reduce((acc, p) => acc + (Number(p.preco || 0) * Number(p.estoque || 0)), 0);
  const criticos = products.filter((p) => Number(p.estoque || 0) <= 5);
  const atencao = products.filter((p) => Number(p.estoque || 0) > 5 && Number(p.estoque || 0) <= 10);
  const normais = products.filter((p) => Number(p.estoque || 0) > 10);

  return {
    totalProdutos: products.length,
    totalItens,
    valorTotal,
    totalCriticos: criticos.length,
    totalAtencao: atencao.length,
    totalNormais: normais.length,
    criticos,
    products
  };
}

async function listFinanceiro({ tipo, status, search, limit = 100 } = {}) {
  const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 500);
  const conditions = [];
  const params = [];

  if (tipo && ["pagar", "receber"].includes(tipo)) {
    conditions.push("tipo = ?");
    params.push(tipo);
  }
  if (status && ["pendente", "pago"].includes(status)) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (search && typeof search === "string" && search.trim()) {
    conditions.push("(titulo LIKE ? OR categoria LIKE ? OR observacoes LIKE ?)");
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(safeLimit);

  const entries = await rows(
    `SELECT * FROM financeiro_lancamentos ${whereClause} ORDER BY data_vencimento ASC, id DESC LIMIT ?`,
    params
  );
  return entries;
}

async function getFinanceiroSummary() {
  const entries = await rows("SELECT * FROM financeiro_lancamentos");
  let totalPagarPendente = 0;
  let totalPagarPago = 0;
  let totalReceberPendente = 0;
  let totalReceberPago = 0;
  let vencidosCount = 0;

  const hoje = new Date().toISOString().slice(0, 10);

  for (const item of entries) {
    const val = Number(item.valor || 0);
    if (item.tipo === "pagar") {
      if (item.status === "pago") totalPagarPago += val;
      else {
        totalPagarPendente += val;
        if (item.data_vencimento < hoje) vencidosCount += 1;
      }
    } else if (item.tipo === "receber") {
      if (item.status === "pago") totalReceberPago += val;
      else {
        totalReceberPendente += val;
        if (item.data_vencimento < hoje) vencidosCount += 1;
      }
    }
  }

  return {
    totalPagarPendente,
    totalPagarPago,
    totalReceberPendente,
    totalReceberPago,
    saldoRealizado: totalReceberPago - totalPagarPago,
    saldoProjetado: (totalReceberPago + totalReceberPendente) - (totalPagarPago + totalPagarPendente),
    vencidosCount,
    totalLancamentos: entries.length
  };
}

async function createFinanceiroLancamento(data) {
  const createdAt = new Date().toISOString();
  const insertResult = await execute(
    `INSERT INTO financeiro_lancamentos (tipo, titulo, categoria, valor, data_vencimento, data_pagamento, status, forma_pagamento, observacoes, loja, criado_em)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)${usePostgres ? " RETURNING id" : ""}`,
    [
      data.tipo,
      data.titulo,
      data.categoria,
      data.valor,
      data.dataVencimento,
      data.dataPagamento || null,
      data.status || "pendente",
      data.formaPagamento || "Pix",
      data.observacoes || "",
      data.loja || "Loja Geral",
      createdAt
    ]
  );
  const id = usePostgres ? insertResult.rows[0].id : insertResult.lastInsertRowid;
  const found = await rows("SELECT * FROM financeiro_lancamentos WHERE id = ?", [id]);
  return found[0];
}

async function updateFinanceiroStatus(id, status, dataPagamento = null) {
  const paymentDate = status === "pago" ? (dataPagamento || new Date().toISOString().slice(0, 10)) : null;
  await execute(
    "UPDATE financeiro_lancamentos SET status = ?, data_pagamento = ? WHERE id = ?",
    [status, paymentDate, id]
  );
  const found = await rows("SELECT * FROM financeiro_lancamentos WHERE id = ?", [id]);
  return found[0] || null;
}

async function deleteFinanceiroLancamento(id) {
  return execute("DELETE FROM financeiro_lancamentos WHERE id = ?", [id]);
}

async function resetDatabase() {
  for (const table of ["sessions", "orders", "users", "products", "unidades", "estoque_movimentacoes", "financeiro_lancamentos"]) await execute(`DELETE FROM ${table}`);
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
  closeDatabase, createFinanceiroLancamento, createOrder, createProduct, createRateLimiter, createSession,
  createUnidade, createUser, deleteFinanceiroLancamento, deleteProduct, deleteSession, findSession,
  findUserByEmail, findUserById, getFinanceiroSummary, getStockSummary, listFinanceiro, listOrders,
  listProducts, listStockMovements, listUnidades, registerStockMovement, resetDatabase,
  updateFinanceiroStatus, updateOrderStatus, updateProduct, upsertProduct
};
export default {
  closeDatabase, createFinanceiroLancamento, createOrder, createProduct, createRateLimiter, createSession,
  createUnidade, createUser, deleteFinanceiroLancamento, deleteProduct, deleteSession, findSession,
  findUserByEmail, findUserById, getFinanceiroSummary, getStockSummary, listFinanceiro, listOrders,
  listProducts, listStockMovements, listUnidades, registerStockMovement, resetDatabase,
  updateFinanceiroStatus, updateOrderStatus, updateProduct, upsertProduct
};
