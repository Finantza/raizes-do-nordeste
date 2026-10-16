// operacional.js — Operação interna da loja: checklist, entregas, rotas e acompanhamento do dia.
// Depende de auth.js (carregado antes no HTML) para readUsers / getCurrentUser / setCurrentUser.
const lojaSessionBox = document.querySelector("#loja-session-box");
const lojaList = document.querySelector("#loja-list");
const lojaRotas = document.querySelector("#loja-rotas");
const regioesList = document.querySelector("#regiao-list");
const vendasHoje = document.querySelector("#loja-vendas");
const pedidosHoje = document.querySelector("#loja-pedidos");
const atencaoHoje = document.querySelector("#loja-atencao");
const lojaDelivery = document.querySelector("#loja-delivery");
const lojaRetirada = document.querySelector("#loja-retirada");
const lojaRegiao = document.querySelector("#loja-regiao");
const lojasAtivas = document.querySelector("#loja-ativas");
const refreshButton = document.querySelector("#refresh-loja");
const storeProductForm = document.querySelector("#store-product-form");
const storeProductImageInput = document.querySelector("#store-product-image");
const storeProductImagePreview = document.querySelector("#store-product-image-preview");
const storeProductFeedback = document.querySelector("#store-product-feedback");
const storeProductsBody = document.querySelector("#store-products-body");
const PRODUCT_KEY = "raizes-storefront-products";

const storeTasks = [
  { title: "Reabastecimento de estoques", status: "OK", progress: 86, detail: "Produtos de maior giro já foram revisados." },
  { title: "Atendimento de clientes", status: "Em andamento", progress: 70, detail: "Fila de pedidos em processamento e entrega." },
  { title: "Conferência de vendas", status: "Pendente", progress: 45, detail: "Confirmar itens de kit promocional e delivery." }
];

const routes = [
  { nome: "Entrega Bairros",     status: "OK" },
  { nome: "Retirada na loja",    status: "OK" },
  { nome: "Atendimento interno", status: "Atenção" }
];

function renderSessionStatus() {
  if (!lojaSessionBox) return;

  const user = getCurrentUser();
  if (!user) {
    lojaSessionBox.textContent = "Nenhum usuário autenticado.";
    lojaSessionBox.className = "small text-muted";
    return;
  }

  lojaSessionBox.innerHTML = `<strong>${user.name}</strong><br><span>${user.email}</span><br><span class="badge bg-success-subtle text-success">${user.role}</span>`;
  lojaSessionBox.className = "small text-success";
}

function readOrders() {
  try {
    const raw = localStorage.getItem("raizes-storefront-orders");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readProducts() {
  try {
    return window.readRaizesProducts(PRODUCT_KEY);
  } catch {
    const products = window.mergeRaizesProducts(null);
    window.saveRaizesProducts(PRODUCT_KEY, products);
    return products;
  }
}

function renderStoreProducts() {
  if (!storeProductsBody) return;
  storeProductsBody.innerHTML = readProducts().map((product) => `
    <tr>
      <td><span class="admin-product-cell"><img src="${window.getRaizesProductImage(product)}" data-product-fallback="${window.getRaizesProductFallbackImage(product)}" alt="">${window.escapeRaizesHtml(product.nome)}</span></td>
      <td>${window.escapeRaizesHtml(product.categoria)}</td>
      <td>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.preco || 0))}</td>
      <td>${product.estoque}</td>
      <td><label class="product-photo-upload">Alterar<input class="existing-product-image" type="file" accept="image/jpeg,image/png,image/webp" data-product-id="${product.id}" aria-label="Alterar foto de ${window.escapeRaizesHtml(product.nome)}"></label></td>
    </tr>
  `).join("");
  window.bindRaizesProductImageFallbacks(storeProductsBody);
}

storeProductsBody?.addEventListener("change", async (event) => {
  const input = event.target.closest(".existing-product-image");
  if (!input?.files?.[0]) return;
  try {
    await window.updateRaizesProductImage(PRODUCT_KEY, input.dataset.productId, input.files[0]);
    if (storeProductFeedback) {
      storeProductFeedback.textContent = "Foto do produto atualizada.";
      storeProductFeedback.className = "small mt-3 text-success";
    }
    renderStoreProducts();
  } catch (error) {
    if (storeProductFeedback) {
      storeProductFeedback.textContent = error instanceof DOMException && error.name === "QuotaExceededError"
        ? "Não há espaço disponível para salvar esta foto neste navegador."
        : error.message || "Não foi possível atualizar a foto.";
      storeProductFeedback.className = "small mt-3 text-danger";
    }
  }
});

storeProductImageInput?.addEventListener("change", async () => {
  const file = storeProductImageInput.files?.[0];
  if (!file || !storeProductImagePreview) return;
  try {
    storeProductImagePreview.src = await window.prepareRaizesProductImage(file);
    storeProductImagePreview.hidden = false;
  } catch (error) {
    storeProductImageInput.value = "";
    if (storeProductFeedback) {
      storeProductFeedback.textContent = error.message;
      storeProductFeedback.className = "small mt-3 text-danger";
    }
  }
});

storeProductForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(storeProductForm);
  const nome = String(formData.get("nome") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim();
  const precoInput = String(formData.get("preco") || "").trim();
  const estoqueInput = String(formData.get("estoque") || "").trim();
  const preco = Number(precoInput);
  const estoque = Number(estoqueInput);

  if (
    !nome || nome.length > 120 || !categoria ||
    precoInput === "" || estoqueInput === "" ||
    !Number.isFinite(preco) || preco < 0 ||
    !Number.isInteger(estoque) || estoque < 0
  ) {
    if (storeProductFeedback) {
      storeProductFeedback.textContent = "Informe nome, categoria, preço válido e estoque inteiro não negativo.";
      storeProductFeedback.className = "small mt-3 text-danger";
    }
    return;
  }

  try {
    const products = readProducts();
    const imagem = await window.prepareRaizesProductImage(storeProductImageInput?.files?.[0]);
    products.push({
      id: Math.max(Date.now(), ...products.map((product) => Number(product.id) + 1)),
      nome,
      categoria,
      preco,
      estoque,
      offer: 0,
      imagem
    });
    window.saveRaizesProducts(PRODUCT_KEY, products);
    storeProductForm.reset();
    if (storeProductImagePreview) {
      storeProductImagePreview.removeAttribute("src");
      storeProductImagePreview.hidden = true;
    }
    if (storeProductFeedback) {
      storeProductFeedback.textContent = "Produto cadastrado com sucesso.";
      storeProductFeedback.className = "small mt-3 text-success";
    }
    renderStoreProducts();
  } catch (error) {
    if (storeProductFeedback) {
      storeProductFeedback.textContent = error instanceof DOMException && error.name === "QuotaExceededError"
        ? "Não há espaço disponível para salvar o produto e a foto neste navegador."
        : error.message || "Não foi possível salvar o produto.";
      storeProductFeedback.className = "small mt-3 text-danger";
    }
  }
});

// Monta os dados da loja com base nos pedidos do cliente.
// Isso mostra o que o time precisa priorizar e em qual região a operação está mais ativa.
function renderStore() {
  const orders = readOrders();
  const todayOrders = orders.length ? orders : [
    { total: 128, method: "Delivery",  region: "Sudeste",  store: "Loja Centro" },
    { total: 88,  method: "Retirada",  region: "Nordeste", store: "Loja Shopping" },
    { total: 94,  method: "Delivery",  region: "Sudeste",  store: "Loja Aeroporto" }
  ];

  const totalSales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const deliveries = todayOrders.filter((o) => (o.method || "Delivery") === "Delivery").length;
  const retirada = todayOrders.filter((o) => (o.method || "") === "Retirada").length;
  const regionCounts = {};
  todayOrders.forEach((o) => {
    const region = o.region || "Sudeste";
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  if (lojaList) {
    lojaList.innerHTML = storeTasks.map((task) => `
      <div class="task-item">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong>${task.title}</strong>
          <span class="status-pill ${task.status === "OK" ? "success" : task.status === "Pendente" ? "warning" : "danger"}">${task.status}</span>
        </div>
        <p class="text-muted mb-2">${task.detail}</p>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" style="width: ${task.progress}%" aria-valuenow="${task.progress}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `).join("");
  }

  if (lojaRotas) {
    lojaRotas.innerHTML = routes.map((route) => `
      <div class="task-item d-flex justify-content-between align-items-center">
        <strong>${route.nome}</strong>
        <span class="status-pill ${route.status === "OK" ? "success" : "warning"}">${route.status}</span>
      </div>
    `).join("");
  }

  if (regioesList) {
    regioesList.innerHTML = Object.entries(regionCounts).map(([region, count]) => `
      <div class="task-item d-flex justify-content-between align-items-center">
        <strong>${region}</strong>
        <span class="badge bg-light text-dark">${count} pedidos</span>
      </div>
    `).join("");
  }

  if (vendasHoje) vendasHoje.textContent = String(Math.round(totalSales / 10));
  if (pedidosHoje) pedidosHoje.textContent = String(todayOrders.length);
  if (atencaoHoje) atencaoHoje.textContent = String(Math.max(1, todayOrders.length - 2));
  if (lojaDelivery) lojaDelivery.textContent = String(deliveries || 12);
  if (lojaRetirada) lojaRetirada.textContent = String(retirada || 7);
  if (lojaRegiao) lojaRegiao.textContent = Object.keys(regionCounts)[0] || "Sudeste";
  if (lojasAtivas) lojasAtivas.textContent = String(new Set(todayOrders.map((o) => o.store || "Loja Centro")).size || 4);
}

refreshButton?.addEventListener("click", renderStore);
renderSessionStatus();
renderStore();
renderStoreProducts();
