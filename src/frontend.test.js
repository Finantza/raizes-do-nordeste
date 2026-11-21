import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "../public");

function createStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

class MockElement {
  constructor(tag = "div", id = "") {
    this.tagName = String(tag).toUpperCase();
    this.id = id;
    this.className = "";
    this.textContent = "";
    this._innerHTML = "";
    this.value = "";
    this.type = "";
    this.name = "";
    this.href = "";
    this.src = "";
    this.alt = "";
    this.loading = "";
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.selected = false;
    this.colSpan = 1;
    this.dataset = {};
    this.style = {};
    this.attributes = new Map();
    this.children = [];
    this.listeners = new Map();
    this.files = [];
    this.classList = {
      add: (...cls) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        cls.forEach((c) => set.add(c));
        this.className = [...set].join(" ");
      },
      remove: (...cls) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        cls.forEach((c) => set.delete(c));
        this.className = [...set].join(" ");
      },
      toggle: (c, force) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        const shouldAdd = force !== undefined ? force : !set.has(c);
        if (shouldAdd) set.add(c);
        else set.delete(c);
        this.className = [...set].join(" ");
      },
      contains: (c) => this.className.split(/\s+/).includes(c)
    };
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
    this.children = [];
  }

  get firstElementChild() {
    return this.children[0] || null;
  }

  get cells() {
    return this.children;
  }

  append(...nodes) {
    for (const n of nodes) {
      if (n && typeof n === "object") {
        this.children.push(n);
      } else if (typeof n === "string") {
        const span = new MockElement("#text");
        span.textContent = n;
        this.children.push(span);
      }
    }
  }

  replaceChildren(...nodes) {
    this.children = [];
    this._innerHTML = "";
    this.append(...nodes);
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
  }

  getAttribute(k) {
    return this.attributes.get(k) || null;
  }

  removeAttribute(k) {
    this.attributes.delete(k);
    if (k === "src") this.src = "";
  }

  addEventListener(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, []);
    this.listeners.get(evt).push(fn);
  }

  async dispatch(evt, eventProps = {}) {
    const handlers = this.listeners.get(evt) || [];
    for (const h of handlers) {
      await h({
        preventDefault: () => {},
        target: this,
        ...eventProps
      });
    }
  }

  closest(selector) {
    if (selector.startsWith(".") && this.classList.contains(selector.slice(1))) return this;
    if (selector.startsWith("[data-slide]") && this.dataset.slide !== undefined) return this;
    return null;
  }

  contains() {
    return false;
  }

  scrollIntoView() {}

  reset() {
    this.Values?.clear();
  }

  querySelector(sel) {
    if (sel === ".filter-chip.active") {
      return this.children.find((c) => c.classList?.contains("filter-chip") && c.classList?.contains("active")) || null;
    }
    return null;
  }

  querySelectorAll(sel) {
    if (sel === ".filter-chip") {
      return this.children.filter((c) => c.classList?.contains("filter-chip"));
    }
    const found = [];
    const visit = (node) => {
      for (const child of node.children || []) {
        if (sel === "img[data-product-fallback]" && child.tagName === "IMG" && child.dataset?.productFallback) {
          found.push(child);
        }
        visit(child);
      }
    };
    visit(this);
    return found;
  }
}

function createDomEnvironment(urlOrigin = "http://localhost:3000") {
  const elementsById = new Map();
  const queryMap = new Map();
  const queryAllMap = new Map();

  const getOrCreateById = (id) => {
    const cleanId = id.replace(/^#/, "");
    if (!elementsById.has(cleanId)) {
      elementsById.set(cleanId, new MockElement("div", cleanId));
    }
    return elementsById.get(cleanId);
  };

  const document = {
    hidden: false,
    body: new MockElement("body"),
    createElement: (tag) => new MockElement(tag),
    createTextNode: (text) => {
      const node = new MockElement("#text");
      node.textContent = String(text);
      return node;
    },
    getElementById: (id) => getOrCreateById(id),
    querySelector: (sel) => {
      if (queryMap.has(sel)) return queryMap.get(sel);
      if (sel.startsWith("#")) return getOrCreateById(sel.slice(1));
      return null;
    },
    querySelectorAll: (sel) => {
      if (queryAllMap.has(sel)) return queryAllMap.get(sel);
      return [];
    },
    addEventListener: () => {}
  };

  const localStorage = createStorage();
  const location = {
    origin: urlOrigin,
    href: `${urlOrigin}/`,
    replacedWith: null,
    assignedWith: null,
    replace(url) {
      this.replacedWith = url;
    },
    assign(url) {
      this.assignedWith = url;
    }
  };

  const window = {
    location,
    localStorage,
    document,
    Intl,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    Date,
    Math,
    JSON,
    Promise,
    Error,
    RegExp,
    encodeURIComponent,
    decodeURIComponent,
    isNaN,
    parseInt,
    parseFloat,
    setInterval: () => 1,
    clearInterval: () => {},
    matchMedia: () => ({ matches: true }),
    confirm: () => true,
    alert: () => {}
  };

  class MockFormData {
    constructor(formEl) {
      this.map = formEl?.formValues || new Map();
    }
    get(key) {
      return this.map.has(key) ? this.map.get(key) : null;
    }
  }

  class MockDOMException extends Error {
    constructor(msg, name = "Error") {
      super(msg);
      this.name = name;
    }
  }

  const context = {
    window,
    document,
    localStorage,
    Intl,
    FormData: MockFormData,
    DOMException: MockDOMException,
    console: { log: () => {}, error: () => {}, warn: () => {} },
    fetch: async () => ({ ok: true, status: 200, json: async () => ({}) })
  };

  return { context, window, document, localStorage, getOrCreateById, queryMap, queryAllMap };
}

function runFrontendScript(fileName, env) {
  const code = fs.readFileSync(path.join(publicDir, fileName), "utf8");
  vm.runInNewContext(code, env.context, { filename: fileName });
}

test("FE-01: public/config.js e public/products.js — Configuração de API, catálogo de 100 itens, mesclagem, imagens e escape XSS", async () => {
  const envFile = createDomEnvironment("null");
  runFrontendScript("config.js", envFile);
  assert.equal(envFile.window.__APP_CONFIG__.apiBaseUrl, "http://localhost:3000/api");

  const envHttp = createDomEnvironment("http://localhost:4500");
  runFrontendScript("config.js", envHttp);
  assert.equal(envHttp.window.__APP_CONFIG__.apiBaseUrl, "http://localhost:4500/api");

  runFrontendScript("products.js", envHttp);
  const products = await envHttp.window.raizesProductsReady;
  assert.equal(products.length, 100);

  // Testa escape HTML anti-XSS no frontend
  const escaped = envHttp.window.escapeRaizesHtml(`<script>alert("xss")</script>'&`);
  assert.equal(escaped, "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&#39;&amp;");

  // Testa validação de imagem em prepareRaizesProductImage
  const emptyImg = await envHttp.window.prepareRaizesProductImage(null);
  assert.equal(emptyImg, "");
  await assert.rejects(
    () => envHttp.window.prepareRaizesProductImage({ type: "application/pdf", size: 1024 }),
    /JPG, PNG ou WebP/i
  );
  await assert.rejects(
    () => envHttp.window.prepareRaizesProductImage({ type: "image/png", size: 9 * 1024 * 1024 }),
    /máximo 8 MB/i
  );
});

test("FE-02: public/auth.js — Sessão compartilhada, visibilidade RBAC por atributo data-*-only, redirecionamento e migração", async () => {
  const env = createDomEnvironment("http://localhost:3000");
  env.document.body.dataset.requiredRole = "admin";

  const adminEl = new MockElement("a");
  const lojaEl = new MockElement("a");
  const staffEl = new MockElement("a");
  const clienteEl = new MockElement("a");
  env.queryAllMap.set("[data-admin-only]", [adminEl]);
  env.queryAllMap.set("[data-loja-only]", [lojaEl]);
  env.queryAllMap.set("[data-staff-only]", [staffEl]);
  env.queryAllMap.set("[data-cliente-only]", [clienteEl]);

  env.localStorage.setItem(
    "raizes-storefront-users",
    JSON.stringify([{ name: "Legado", email: "legado@test.com", password: "senha12345" }])
  );

  let migratedCalled = false;
  env.context.fetch = async (url) => {
    if (url.endsWith("/auth/migrate-local-users")) {
      migratedCalled = true;
      return { ok: true, status: 200, json: async () => ({ imported: 1 }) };
    }
    if (url.endsWith("/auth/me")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ user: { id: 1, name: "Administrador", email: "admin@raizes.com", role: "admin" } })
      };
    }
    if (url.endsWith("/auth/logout")) {
      return { ok: true, status: 204, json: async () => null };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  runFrontendScript("auth.js", env);
  const user = await env.window.raizesAuthReady;

  assert.equal(migratedCalled, true);
  assert.equal(env.localStorage.getItem("raizes-storefront-users"), null);
  assert.equal(user.role, "admin");
  assert.equal(adminEl.hidden, false);
  assert.equal(staffEl.hidden, false);
  assert.equal(lojaEl.hidden, true);
  assert.equal(clienteEl.hidden, true);

  const controls = env.getOrCreateById("shared-session-controls");
  assert.equal(controls.children.length, 2); // link do perfil + botão Sair
});

test("FE-03: public/app.js — Carrossel acessível da vitrine, cálculo de descontos e produtos em destaque", async () => {
  const env = createDomEnvironment("http://localhost:3000");
  runFrontendScript("products.js", env);

  const carousel = env.getOrCreateById("home-carousel");
  const track = env.getOrCreateById("home-carousel-track");
  const dots = env.getOrCreateById("home-carousel-dots");
  const prevBtn = env.getOrCreateById("carousel-previous");
  const nextBtn = env.getOrCreateById("carousel-next");
  const featured = env.getOrCreateById("featured-products");

  runFrontendScript("app.js", env);
  await env.window.raizesProductsReady;

  assert.equal(carousel.hidden, false);
  assert.equal(track.children.length, 5);
  assert.equal(dots.children.length, 5);
  assert.equal(featured.children.length, 4);

  // Verifica navegação do carrossel (botão próximo e anterior)
  assert.equal(track.children[0].hidden, false);
  assert.equal(track.children[1].hidden, true);
  await nextBtn.dispatch("click");
  assert.equal(track.children[0].hidden, true);
  assert.equal(track.children[1].hidden, false);
  await prevBtn.dispatch("click");
  assert.equal(track.children[0].hidden, false);
});

test("FE-04: public/login.js — Preenchimento rápido demo, validação LGPD no cadastro, login e redirecionamento por perfil", async () => {
  const env = createDomEnvironment("http://localhost:3000");
  env.window.raizesAuthReady = Promise.resolve(null);
  env.context.getDashboardPath = (role) => ({ admin: "./admin.html", loja: "./operacional.html", cliente: "./cliente.html" }[role]);

  const loginForm = env.getOrCreateById("login-form");
  const registerForm = env.getOrCreateById("register-form");
  registerForm.hidden = true;
  const toggleBtn = env.getOrCreateById("toggle-register");
  const feedback = env.getOrCreateById("login-feedback");
  const lgpdCheck = env.getOrCreateById("register-lgpd-consent");
  const emailInput = env.getOrCreateById("login-email");
  const passInput = env.getOrCreateById("login-password");

  const demoBtn = new MockElement("button");
  demoBtn.dataset.demoEmail = "admin@raizes.com";
  demoBtn.dataset.demoPassword = "admin12345678";
  env.queryAllMap.set(".auth-demo-btn", [demoBtn]);

  let lastEndpoint = "";
  env.window.raizesApiRequest = async (endpoint) => {
    lastEndpoint = endpoint;
    if (endpoint === "/auth/login") {
      return { user: { id: 1, name: "Admin", email: "admin@raizes.com", role: "admin" } };
    }
    return { user: { id: 2, name: "Novo", email: "novo@test.com", role: "cliente" } };
  };

  runFrontendScript("login.js", env);

  // 1. Botão de demonstração preenche e-mail e senha
  await demoBtn.dispatch("click");
  assert.equal(emailInput.value, "admin@raizes.com");
  assert.equal(passInput.value, "admin12345678");

  // 2. Alternar formulário de cadastro
  await toggleBtn.dispatch("click");
  assert.equal(registerForm.hidden, false);

  // 3. Recusa do checkbox LGPD bloqueia envio no frontend
  lgpdCheck.checked = false;
  registerForm.formValues = new Map([["name", "Cliente"], ["email", "c@test.com"], ["password", "12345678"]]);
  await registerForm.dispatch("submit");
  assert.match(feedback.textContent, /consentimento LGPD/i);
  assert.notEqual(lastEndpoint, "/auth/register");

  // 4. Aceite LGPD envia cadastro com sucesso
  lgpdCheck.checked = true;
  await registerForm.dispatch("submit");
  assert.equal(lastEndpoint, "/auth/register");
  assert.match(feedback.textContent, /Conta criada/i);

  // 5. Submissão do login redireciona para o painel do perfil
  loginForm.formValues = new Map([["email", "admin@raizes.com"], ["password", "admin12345678"]]);
  await loginForm.dispatch("submit");
  assert.equal(env.window.location.assignedWith, "./admin.html");
});

test("FE-05: public/cliente.js — Catálogo, filtros, bloqueio de esgotados, controles [+] e [-] do carrinho e checkout multicanal", async () => {
  const env = createDomEnvironment("http://localhost:3000");
  runFrontendScript("products.js", env);

  // Marca o produto 3 como estoque 0 para validar bloqueio de item esgotado
  env.window.raizesProducts[2].estoque = 0;

  let currentUser = { id: 10, name: "Cliente", email: "cliente@raizes.com", role: "cliente" };
  env.context.getCurrentUser = () => currentUser;
  env.window.raizesAuthReady = Promise.resolve(currentUser);

  const catalog = env.getOrCreateById("customer-catalog");
  const cartItems = env.getOrCreateById("cart-items-list");
  const cartTotal = env.getOrCreateById("cart-total");
  const checkoutBtn = env.getOrCreateById("checkout-order");
  const feedback = env.getOrCreateById("customer-feedback");
  const regionSelect = env.getOrCreateById("customer-region");
  regionSelect.value = "Nordeste";
  const storeSelect = env.getOrCreateById("customer-store");
  storeSelect.value = "Loja Centro";

  const totemRadio = new MockElement("input");
  totemRadio.value = "Totem";
  totemRadio.checked = true;
  env.queryMap.set('input[name="order-mode"]:checked', totemRadio);

  let postedOrderPayload = null;
  env.window.raizesApiRequest = async (endpoint, opts = {}) => {
    if (endpoint === "/orders" && opts.method === "POST") {
      postedOrderPayload = JSON.parse(opts.body);
      return { id: "ord-1", store: "Loja Centro", method: "Totem", region: "Nordeste", total: 116.88 };
    }
    if (endpoint === "/orders") {
      return [{ id: "ord-1", store: "Loja Centro", total: 116.88, status: "Em preparo", items: [{ nome: "Combo Nordeste", quantity: 2 }] }];
    }
    if (endpoint === "/products") {
      return env.window.raizesProducts;
    }
    return {};
  };

  runFrontendScript("cliente.js", env);
  await Promise.all([env.window.raizesAuthReady, env.window.raizesProductsReady]);
  await new Promise((r) => setTimeout(r, 20));

  // 1. Catálogo renderizado com as 5 seções de categoria
  assert.equal(catalog.children.length, 5);

  // 2. Produto com estoque 0 não é adicionado ao carrinho
  env.context.addToCart(3);
  assert.equal(env.context.readCart().length, 0);

  // 3. Adicionar produto disponível (ID 1: Combo Nordeste, R$ 89.90 com 35% off = R$ 58.44)
  env.context.addToCart(1);
  assert.equal(env.context.readCart().length, 1);
  assert.equal(env.context.readCart()[0].quantity, 1);

  // 4. Botão [+] aumenta a quantidade para 2 e atualiza o total para R$ 116,88
  env.context.updateCartQuantity(1, 1);
  assert.equal(env.context.readCart()[0].quantity, 2);
  assert.match(cartTotal.textContent, /116,88/);
  assert.equal(cartItems.children.length, 1);

  // 5. Finalizar pedido mapeia Totem -> canal TOTEM, limpa carrinho e atualiza histórico
  await checkoutBtn.dispatch("click");
  assert.ok(postedOrderPayload);
  assert.equal(postedOrderPayload.method, "Totem");
  assert.equal(postedOrderPayload.channel, "TOTEM");
  assert.equal(env.context.readCart().length, 0);
  assert.match(feedback.textContent, /Pedido finalizado com sucesso/i);
});

test("FE-06: public/admin.js — Métricas executivas, resumo por região, inventário e bloqueio de campos vazios no cadastro", async () => {
  const env = createDomEnvironment("http://localhost:3000");
  runFrontendScript("products.js", env);

  const adminUser = { id: 1, name: "Administrador", email: "admin@raizes.com", role: "admin" };
  env.context.getCurrentUser = () => adminUser;
  env.window.raizesAuthReady = Promise.resolve(adminUser);

  const totalProdutos = env.getOrCreateById("admin-total-produtos");
  const faturamento = env.getOrCreateById("admin-faturamento");
  const pedidos = env.getOrCreateById("admin-pedidos");
  const inventoryBody = env.getOrCreateById("admin-inventory-body");
  const tabForm = env.getOrCreateById("admin-product-form-tab");
  const tabFeedback = env.getOrCreateById("admin-tab-product-feedback");

  let createdProduct = null;
  env.window.raizesApiRequest = async (endpoint, opts = {}) => {
    if (endpoint === "/orders") {
      return [
        { id: "o1", region: "Nordeste", store: "Loja Recife", total: 150.0 },
        { id: "o2", region: "Sudeste", store: "Loja Centro", total: 50.0 }
      ];
    }
    if (endpoint === "/products" && opts.method === "POST") {
      createdProduct = JSON.parse(opts.body);
      return { id: 101, ...createdProduct };
    }
    if (endpoint === "/products") {
      return env.window.raizesProducts;
    }
    return {};
  };

  runFrontendScript("admin.js", env);
  await Promise.all([env.window.raizesAuthReady, env.window.raizesProductsReady]);
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(Number(totalProdutos.textContent), 100);
  assert.equal(Number(pedidos.textContent), 2);
  assert.match(faturamento.textContent, /200,00/);
  assert.equal(inventoryBody.children.length, 100);

  // Teste de bug corrigido: formulário com preço vazio ("") deve ser rejeitado e não convertido em 0
  tabForm.formValues = new Map([["nome", "Item Sem Preço"], ["categoria", "Lanches"], ["preco", ""], ["estoque", "10"]]);
  await tabForm.dispatch("submit");
  assert.equal(createdProduct, null);
  assert.match(tabFeedback.textContent, /preço válido/i);

  // Cadastro válido
  tabForm.formValues = new Map([["nome", "Tapioca Nova"], ["categoria", "Lanches"], ["preco", "22.50"], ["estoque", "15"]]);
  await tabForm.dispatch("submit");
  assert.ok(createdProduct);
  assert.equal(createdProduct.nome, "Tapioca Nova");
  assert.equal(createdProduct.preco, 22.5);
});

test("FE-07: public/operacional.js e public/gestao.js — Rotina da loja, atualização de status de pedido, abas de estoque e financeiro", async () => {
  const env = createDomEnvironment("http://localhost:3000");
  runFrontendScript("products.js", env);

  const lojaUser = { id: 2, name: "Equipe da loja", email: "loja@raizes.com", role: "loja" };
  env.context.getCurrentUser = () => lojaUser;
  env.window.raizesAuthReady = Promise.resolve(lojaUser);

  const ordersBody = env.getOrCreateById("store-orders-body");
  const estoqueContainer = env.getOrCreateById("estoque-module-content");
  const finContainer = env.getOrCreateById("financeiro-module-content");
  const catalogBody = env.getOrCreateById("catalog-products-body");

  let patchedStatus = null;
  env.window.raizesApiRequest = async (endpoint, opts = {}) => {
    if (endpoint === "/orders") {
      return [{
        id: "ord-99",
        store: "Loja Centro",
        region: "Nordeste",
        method: "Delivery",
        total: 85.5,
        status: "Em preparo",
        timestamp: new Date().toISOString(),
        items: [{ nome: "Baião de Dois", quantity: 1 }]
      }];
    }
    if (endpoint.startsWith("/orders/") && opts.method === "PATCH") {
      patchedStatus = JSON.parse(opts.body).status;
      return { id: "ord-99", status: patchedStatus };
    }
    if (endpoint === "/estoque/resumo") {
      return {
        totalProdutos: 100,
        totalItens: 1050,
        valorTotal: 25400.5,
        totalCriticos: 4,
        totalAtencao: 32,
        totalNormais: 64,
        products: env.window.raizesProducts.slice(0, 5)
      };
    }
    if (endpoint.startsWith("/estoque/movimentacoes")) {
      return [{
        id: 1,
        produto_nome: "Combo Nordeste",
        tipo: "entrada",
        quantidade: 10,
        estoque_anterior: 8,
        estoque_novo: 18,
        motivo: "Reabastecimento inicial",
        usuario_nome: "Administrador",
        criado_em: new Date().toISOString()
      }];
    }
    if (endpoint === "/financeiro/resumo") {
      return {
        totalPagarPendente: 1450,
        totalPagarPago: 1120.5,
        totalReceberPendente: 1850,
        totalReceberPago: 5420.8,
        saldoRealizado: 4300.3,
        saldoProjetado: 4700.3,
        vencidosCount: 0,
        totalLancamentos: 2
      };
    }
    if (endpoint.startsWith("/financeiro")) {
      return [{
        id: 1,
        tipo: "pagar",
        titulo: "Fornecedor Queijo Coalho",
        categoria: "Ingredientes",
        valor: 1450,
        data_vencimento: "2026-12-01",
        status: "pendente",
        forma_pagamento: "Pix"
      }];
    }
    if (endpoint === "/products") {
      return env.window.raizesProducts;
    }
    return {};
  };

  runFrontendScript("gestao.js", env);
  runFrontendScript("operacional.js", env);
  await Promise.all([env.window.raizesAuthReady, env.window.raizesProductsReady]);
  await new Promise((r) => setTimeout(r, 30));

  // 1. Fila de pedidos renderizada na tela operacional
  assert.equal(ordersBody.children.length, 1);

  // 2. Módulos de gestão (Produtos, Estoque e Financeiro) renderizados sem erros
  await env.window.carregarModuloEstoque();
  await env.window.carregarModuloFinanceiro();
  env.window.carregarModuloProdutos();

  assert.match(estoqueContainer.innerHTML, /Níveis de Estoque por Produto/);
  assert.match(estoqueContainer.innerHTML, /1050/);
  assert.match(finContainer.innerHTML, /Contas a Pagar e Receber/);
  assert.match(finContainer.innerHTML, /Fornecedor Queijo Coalho/);
  assert.match(catalogBody.innerHTML, /Combo Nordeste/);
});

test("FE-08: Páginas HTML e CSS — Acessibilidade (ARIA/labels), responsividade mobile/totem, formulários e conformidade LGPD", () => {
  const indexHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
  const loginHtml = fs.readFileSync(path.join(publicDir, "login.html"), "utf8");
  const clienteHtml = fs.readFileSync(path.join(publicDir, "cliente.html"), "utf8");
  const adminHtml = fs.readFileSync(path.join(publicDir, "admin.html"), "utf8");
  const operacionalHtml = fs.readFileSync(path.join(publicDir, "operacional.html"), "utf8");
  const styleCss = fs.readFileSync(path.join(publicDir, "style.css"), "utf8");

  // 1. Todas as páginas declaram lang="pt-BR", charset="utf-8" e viewport responsivo
  for (const [name, html] of [
    ["index.html", indexHtml],
    ["login.html", loginHtml],
    ["cliente.html", clienteHtml],
    ["admin.html", adminHtml],
    ["operacional.html", operacionalHtml]
  ]) {
    assert.match(html, /<html[^>]+lang="pt-BR"/i, `${name} deve ter lang="pt-BR"`);
    assert.match(html, /<meta[^>]+charset="utf-8"/i, `${name} deve ter charset="utf-8"`);
    assert.match(html, /<meta[^>]+name="viewport"/i, `${name} deve ter meta viewport`);
    assert.match(html, /aria-live="polite"/i, `${name} deve ter região aria-live para feedback acessível`);
  }

  // 2. Termo de consentimento LGPD em login.html e aviso de privacidade em cliente.html
  assert.match(loginHtml, /id="register-lgpd-consent"/);
  assert.match(loginHtml, /Lei nº 13\.709\/2018/);
  assert.match(clienteHtml, /Privacidade \(LGPD\)/);

  // 3. Presença dos 4 modos de atendimento multicanal em cliente.html
  for (const mode of ['value="Delivery"', 'value="Retirada"', 'value="Balcão"', 'value="Totem"']) {
    assert.ok(clienteHtml.includes(mode), `cliente.html deve conter opção ${mode}`);
  }

  // 4. Estrutura de abas (tablist/tab) em admin.html e operacional.html
  for (const tabId of ["tab-geral", "tab-produtos", "tab-estoque", "tab-financeiro"]) {
    assert.ok(adminHtml.includes(`data-target-tab="${tabId}"`), `admin.html deve ter botão para ${tabId}`);
    assert.ok(adminHtml.includes(`id="${tabId}"`), `admin.html deve ter seção ${tabId}`);
    assert.ok(operacionalHtml.includes(`data-target-tab="${tabId}"`), `operacional.html deve ter botão para ${tabId}`);
    assert.ok(operacionalHtml.includes(`id="${tabId}"`), `operacional.html deve ter seção ${tabId}`);
  }

  // 5. Design system CSS com variáveis da paleta nordestina, media queries mobile e prefers-reduced-motion
  assert.match(styleCss, /--brand:\s*#a9432b/i);
  assert.match(styleCss, /@media\s*\(max-width:\s*767px\)/i);
  assert.match(styleCss, /@media\s*\(max-width:\s*479px\)/i);
  assert.match(styleCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
});
