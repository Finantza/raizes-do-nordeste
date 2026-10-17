// admin.js — Painel administrativo: inventário, métricas e gestão de produtos.
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
let orders = [];
const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
};

function readProducts() {
  return window.raizesProducts;
}

function renderSessionStatus() {
  if (!adminSessionBox) return;

  const user = getCurrentUser();
  if (!user) {
    adminSessionBox.textContent = "Nenhum usuário autenticado.";
    adminSessionBox.className = "small text-muted";
    return;
  }

  adminSessionBox.replaceChildren(
    createElement("strong", "", user.name),
    document.createElement("br"),
    createElement("span", "", user.email),
    document.createElement("br"),
    createElement("span", "badge bg-success-subtle text-success", user.role)
  );
  adminSessionBox.className = "small text-success";
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function renderRegionSummary() {
  if (!regionSummary) return;

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

  const regions = Object.entries(groups);
  regionSummary.replaceChildren(...regions.map(([region, stats]) => {
    const column = createElement("div", "col-md-4");
    const card = createElement("div", "region-card");
    card.append(
      createElement("h3", "", region),
      createElement("p", "", `${stats.pedidos} pedidos • ${stats.lojas.size} lojas`),
      createElement("p", "fw-semibold text-success", formatMoney(stats.total))
    );
    column.append(card);
    return column;
  }));
}

// Atualiza os números do dashboard e a tabela de produtos.
function renderAdmin() {
  const products = readProducts();
  const total = products.length;
  const estoqueTotal = products.reduce((sum, p) => sum + Number(p.estoque || 0), 0);
  const lowStock = products.filter((p) => Number(p.estoque || 0) <= 5).length;
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const distinctRegions = new Set(orders.map((o) => o.region)).size;

  if (totalProdutos) totalProdutos.textContent = total;
  if (totalEstoque) totalEstoque.textContent = estoqueTotal;
  if (baixoEstoque) baixoEstoque.textContent = lowStock;
  if (faturamento) faturamento.textContent = formatMoney(totalSales);
  if (franquias) franquias.textContent = new Set(orders.map((o) => o.store).filter(Boolean)).size;
  if (pedidos) pedidos.textContent = orders.length;
  if (regioes) regioes.textContent = distinctRegions;
  if (ticket) ticket.textContent = formatMoney(orders.length ? totalSales / orders.length : 0);

  if (!inventoryBody) return;

  inventoryBody.replaceChildren(...products.map((product) => {
    const estoque = Number(product.estoque || 0);
    const status = estoque <= 5 ? "Baixo" : estoque <= 10 ? "Médio" : "OK";
    const statusClass = status === "Baixo" ? "warning" : status === "Médio" ? "secondary" : "success";
    const row = document.createElement("tr");
    const productCell = createElement("td", "fw-semibold");
    const nameWrap = createElement("span", "admin-product-cell");
    const image = document.createElement("img");
    image.src = window.getRaizesProductImage(product);
    image.dataset.productFallback = window.getRaizesProductFallbackImage(product);
    image.alt = "";
    nameWrap.append(image, document.createTextNode(product.nome));
    productCell.append(nameWrap);
    const statusPill = createElement("span", `status-pill ${statusClass}`, status);
    const photoLabel = createElement("label", "product-photo-upload", "Alterar");
    const fileInput = document.createElement("input");
    fileInput.className = "existing-product-image";
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp";
    fileInput.dataset.productId = product.id;
    fileInput.setAttribute("aria-label", `Alterar foto de ${product.nome}`);
    photoLabel.append(fileInput);
    row.append(
      productCell,
      createElement("td", "", product.categoria),
      createElement("td", "", formatMoney(product.preco)),
      createElement("td", "", product.estoque),
      document.createElement("td"),
      createElement("td")
    );
    row.cells[4].append(statusPill);
    row.cells[5].append(photoLabel);
    return row;
  }));

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
    const product = readProducts().find((item) => String(item.id) === input.dataset.productId);
    if (!product) throw new Error("Produto não encontrado.");
    const imagem = await window.prepareRaizesProductImage(input.files[0]);
    await window.raizesApiRequest(`/products/${product.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...product, imagem })
    });
    await window.reloadRaizesProducts();
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
    const imagem = await window.prepareRaizesProductImage(productImageInput?.files?.[0]);
    await window.raizesApiRequest("/products", {
      method: "POST",
      body: JSON.stringify({
      nome,
      categoria,
      preco,
      estoque,
      offer: 0,
      imagem
      })
    });
    await window.reloadRaizesProducts();
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

async function migrateLocalProducts() {
  const raw = localStorage.getItem("raizes-storefront-products");
  if (!raw) return;
  try {
    const products = JSON.parse(raw);
    if (!Array.isArray(products)) throw new Error("O catálogo local está inválido.");
    for (const product of products) {
      await window.raizesApiRequest("/products/migrate-local", {
        method: "POST",
        body: JSON.stringify({ product })
      });
    }
    localStorage.removeItem("raizes-storefront-products");
    await window.reloadRaizesProducts();
  } catch (error) {
    console.error("A migração do catálogo local não foi concluída; os dados locais foram mantidos.", error);
    if (feedback) {
      feedback.textContent = "A migração do catálogo local não foi concluída; os dados locais foram mantidos.";
      feedback.className = "small mt-3 text-warning";
    }
  }
}

Promise.all([window.raizesAuthReady, window.raizesProductsReady]).then(async ([user]) => {
  if (!user || user.role !== "admin") return;
  renderSessionStatus();
  await migrateLocalProducts();
  try {
    orders = await window.raizesApiRequest("/orders");
  } catch (error) {
    if (feedback) {
      feedback.textContent = error.message || "Não foi possível carregar pedidos do servidor.";
      feedback.className = "small mt-3 text-danger";
    }
  }
  renderAdmin();
}).catch((error) => console.error("Não foi possível inicializar o painel administrativo.", error));
