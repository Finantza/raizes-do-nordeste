// admin.js — Painel administrativo: inventário, métricas e gestão de produtos.
// Depende de auth.js (carregado antes no HTML) para readUsers / getCurrentUser / setCurrentUser.
const STORAGE_KEY = "raizes-storefront-products";
const ORDER_KEY = "raizes-storefront-orders";

const adminSessionBox = document.querySelector("#admin-session-box");
const inventoryBody = document.querySelector("#admin-inventory-body");
const totalProdutos = document.querySelector("#admin-total-produtos");
const totalEstoque = document.querySelector("#admin-total-estoque");
const baixoEstoque = document.querySelector("#admin-baixo-estoque");
const faturamento = document.querySelector("#admin-faturamento");
const franquias = document.querySelector("#admin-franquias");
const pedidos = document.querySelector("#admin-pedidos");
const regioes = document.querySelector("#admin-regioes");
const ticket = document.querySelector("#admin-ticket");
const regionSummary = document.querySelector("#region-summary");
const reloadButton = document.querySelector("#reload-admin");
const productForm = document.querySelector("#admin-product-form");
const feedback = document.querySelector("#admin-feedback");
const productImageInput = document.querySelector("#admin-product-image");
const productImagePreview = document.querySelector("#admin-product-image-preview");

// Reúne a lista de produtos que o sistema usa. Se o navegador ainda não tiver dados,
// ele cria uma base inicial para que o painel funcione imediatamente.
function readProducts() {
  try {
    return window.readRaizesProducts(STORAGE_KEY);
  } catch {
    const defaults = window.mergeRaizesProducts(null);
    window.saveRaizesProducts(STORAGE_KEY, defaults);
    return defaults;
  }
}

function renderSessionStatus() {
  if (!adminSessionBox) return;

  const user = getCurrentUser();
  if (!user) {
    adminSessionBox.textContent = "Nenhum usuário autenticado.";
    adminSessionBox.className = "small text-muted";
    return;
  }

  adminSessionBox.innerHTML = `<strong>${user.name}</strong><br><span>${user.email}</span><br><span class="badge bg-success-subtle text-success">${user.role}</span>`;
  adminSessionBox.className = "small text-success";
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function readOrders() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderRegionSummary() {
  if (!regionSummary) return;

  const orders = readOrders();
  const groups = {};

  orders.forEach((order) => {
    const region = order.region || "Nordeste";
    if (!groups[region]) {
      groups[region] = { pedidos: 0, total: 0, lojas: new Set() };
    }
    groups[region].pedidos += 1;
    groups[region].total += Number(order.total || 0);
    if (order.store) groups[region].lojas.add(order.store);
  });

  const regions = Object.entries(groups).length ? Object.entries(groups) : [
    ["Nordeste", { pedidos: 14, total: 4860, lojas: new Set(["Loja Centro", "Loja Shopping"]) }],
    ["Sudeste",  { pedidos: 9,  total: 3240, lojas: new Set(["Loja Aeroporto"]) }],
    ["Sul",      { pedidos: 6,  total: 2190, lojas: new Set(["Loja Jardim"]) }]
  ];

  regionSummary.innerHTML = regions.map(([region, stats]) => `
    <div class="col-md-4">
      <div class="region-card">
        <h3>${region}</h3>
        <p>${stats.pedidos} pedidos • ${stats.lojas.size} lojas</p>
        <p class="fw-semibold text-success">${formatMoney(stats.total)}</p>
      </div>
    </div>
  `).join("");
}

// Atualiza os números do dashboard e a tabela de produtos.
function renderAdmin() {
  const products = readProducts();
  const orders = readOrders();
  const total = products.length;
  const estoqueTotal = products.reduce((sum, p) => sum + Number(p.estoque || 0), 0);
  const lowStock = products.filter((p) => Number(p.estoque || 0) <= 5).length;
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const distinctRegions = new Set(orders.map((o) => o.region || "Nordeste")).size || 4;

  if (totalProdutos) totalProdutos.textContent = total;
  if (totalEstoque) totalEstoque.textContent = estoqueTotal;
  if (baixoEstoque) baixoEstoque.textContent = lowStock;
  if (faturamento) faturamento.textContent = formatMoney(totalSales || products.reduce((s, p) => s + Number(p.preco || 0) * Number(p.estoque || 0), 0) * 0.38);
  if (franquias) franquias.textContent = orders.length ? Math.max(4, new Set(orders.map((o) => o.store || "Loja Central")).size) : 4;
  if (pedidos) pedidos.textContent = orders.length || 39;
  if (regioes) regioes.textContent = distinctRegions;
  if (ticket) ticket.textContent = formatMoney(orders.length ? totalSales / orders.length : 235.5);

  if (!inventoryBody) return;

  inventoryBody.innerHTML = products.map((product) => {
    const estoque = Number(product.estoque || 0);
    const status = estoque <= 5 ? "Baixo" : estoque <= 10 ? "Médio" : "OK";
    const statusClass = status === "Baixo" ? "warning" : status === "Médio" ? "secondary" : "success";

    return `
      <tr>
        <td class="fw-semibold"><span class="admin-product-cell"><img src="${window.getRaizesProductImage(product)}" data-product-fallback="${window.getRaizesProductFallbackImage(product)}" alt="">${window.escapeRaizesHtml(product.nome)}</span></td>
        <td>${window.escapeRaizesHtml(product.categoria)}</td>
        <td>${formatMoney(product.preco)}</td>
        <td>${product.estoque}</td>
        <td><span class="status-pill ${statusClass}">${status}</span></td>
        <td><label class="product-photo-upload">Alterar<input class="existing-product-image" type="file" accept="image/jpeg,image/png,image/webp" data-product-id="${product.id}" aria-label="Alterar foto de ${window.escapeRaizesHtml(product.nome)}"></label></td>
      </tr>
    `;
  }).join("");

  window.bindRaizesProductImageFallbacks(inventoryBody);
  renderRegionSummary();
}

productImageInput?.addEventListener("change", async () => {
  const file = productImageInput.files?.[0];
  if (!file || !productImagePreview) return;
  try {
    productImagePreview.src = await window.prepareRaizesProductImage(file);
    productImagePreview.hidden = false;
  } catch (error) {
    productImageInput.value = "";
    if (feedback) {
      feedback.textContent = error.message;
      feedback.className = "small mt-3 text-danger";
    }
  }
});

inventoryBody?.addEventListener("change", async (event) => {
  const input = event.target.closest(".existing-product-image");
  if (!input?.files?.[0]) return;
  try {
    await window.updateRaizesProductImage(STORAGE_KEY, input.dataset.productId, input.files[0]);
    if (feedback) {
      feedback.textContent = "Foto do produto atualizada.";
      feedback.className = "small mt-3 text-success";
    }
    renderAdmin();
  } catch (error) {
    if (feedback) {
      feedback.textContent = error instanceof DOMException && error.name === "QuotaExceededError"
        ? "Não há espaço disponível para salvar esta foto neste navegador."
        : error.message || "Não foi possível atualizar a foto.";
      feedback.className = "small mt-3 text-danger";
    }
  }
});

productForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const nome = String(formData.get("nome") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim();
  const precoInput = String(formData.get("preco") || "").trim();
  const estoqueInput = String(formData.get("estoque") || "").trim();
  const preco = Number(precoInput);
  const estoque = Number(estoqueInput);

  if (
    !nome ||
    !categoria ||
    precoInput === "" ||
    estoqueInput === "" ||
    !Number.isFinite(preco) ||
    !Number.isFinite(estoque) ||
    preco < 0 ||
    !Number.isInteger(estoque) ||
    estoque < 0
  ) {
    if (feedback) {
      feedback.textContent = "Informe nome e categoria, um preço válido e um estoque inteiro não negativo.";
      feedback.className = "small text-danger";
    }
    return;
  }

  try {
    const products = readProducts();
    const imagem = await window.prepareRaizesProductImage(productImageInput?.files?.[0]);
    products.push({
      id: Math.max(Date.now(), ...products.map((product) => Number(product.id) + 1)),
      nome,
      categoria,
      preco,
      estoque,
      offer: 0,
      imagem
    });
    window.saveRaizesProducts(STORAGE_KEY, products);
  } catch (error) {
    if (feedback) {
      feedback.textContent = error instanceof DOMException && error.name === "QuotaExceededError"
        ? "Não há espaço disponível para salvar o produto e a foto neste navegador."
        : error.message || "Não foi possível salvar o produto.";
      feedback.className = "small mt-3 text-danger";
    }
    return;
  }

  productForm.reset();
  if (productImagePreview) {
    productImagePreview.removeAttribute("src");
    productImagePreview.hidden = true;
  }

  if (feedback) {
    feedback.textContent = "Produto adicionado com sucesso.";
    feedback.className = "small text-success";
  }

  renderAdmin();
});

reloadButton?.addEventListener("click", renderAdmin);
renderSessionStatus();
renderAdmin();
