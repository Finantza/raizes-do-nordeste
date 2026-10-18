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
const storeOrdersBody = document.querySelector("#store-orders-body");
let orders = [];

const storeTasks = [
  { title: "Reabastecimento de estoques", status: "OK", progress: 86, detail: "Produtos de maior giro já foram revisados." },
  { title: "Atendimento de clientes", status: "Em andamento", progress: 70, detail: "Fila de pedidos em processamento e entrega." },
  { title: "Conferência de vendas", status: "Pendente", progress: 45, detail: "Confirmar itens de kit promocional e delivery." }
];
const routes = [
  { nome: "Entrega Bairros", status: "OK" },
  { nome: "Retirada na loja", status: "OK" },
  { nome: "Atendimento interno", status: "Atenção" }
];
const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
};

function setProductFeedback(message, className) {
  if (!storeProductFeedback) return;
  storeProductFeedback.textContent = message;
  storeProductFeedback.className = `small mt-3 ${className}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function renderSessionStatus() {
  if (!lojaSessionBox) return;
  const user = getCurrentUser();
  if (!user) {
    lojaSessionBox.textContent = "Nenhum usuário autenticado.";
    lojaSessionBox.className = "small text-muted";
    return;
  }
  lojaSessionBox.replaceChildren(
    createElement("strong", "", user.name),
    document.createElement("br"),
    createElement("span", "", user.email),
    document.createElement("br"),
    createElement("span", "badge bg-success-subtle text-success", user.role)
  );
  lojaSessionBox.className = "small text-success";
}

function renderStoreProducts() {
  if (!storeProductsBody) return;
  storeProductsBody.replaceChildren(...window.raizesProducts.map((product) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const nameWrap = createElement("span", "admin-product-cell");
    const image = document.createElement("img");
    image.src = window.getRaizesProductImage(product);
    image.dataset.productFallback = window.getRaizesProductFallbackImage(product);
    image.alt = "";
    nameWrap.append(image, document.createTextNode(product.nome));
    nameCell.append(nameWrap);
    const photoLabel = createElement("label", "product-photo-upload", "Alterar");
    const fileInput = document.createElement("input");
    fileInput.className = "existing-product-image";
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp";
    fileInput.dataset.productId = product.id;
    fileInput.setAttribute("aria-label", `Alterar foto de ${product.nome}`);
    photoLabel.append(fileInput);
    const photoCell = document.createElement("td");
    photoCell.append(photoLabel);
    row.append(
      nameCell,
      createElement("td", "", product.categoria),
      createElement("td", "", new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.preco || 0))),
      createElement("td", "", product.estoque),
      photoCell
    );
    return row;
  }));
  window.bindRaizesProductImageFallbacks(storeProductsBody);
}

storeProductsBody?.addEventListener("change", async (event) => {
  const input = event.target.closest(".existing-product-image");
  if (!input?.files?.[0]) return;
  try {
    const product = window.raizesProducts.find((item) => String(item.id) === input.dataset.productId);
    if (!product) throw new Error("Produto não encontrado.");
    const imagem = await window.prepareRaizesProductImage(input.files[0]);
    await window.raizesApiRequest(`/products/${product.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...product, imagem })
    });
    await window.reloadRaizesProducts();
    setProductFeedback("Foto do produto atualizada.", "text-success");
    renderStoreProducts();
  } catch (error) {
    setProductFeedback(error.message || "Não foi possível atualizar a foto.", "text-danger");
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
    setProductFeedback(error.message, "text-danger");
  }
});

storeProductForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(storeProductForm);
  const product = {
    nome: String(formData.get("nome") || "").trim(),
    categoria: String(formData.get("categoria") || "").trim(),
    preco: Number(formData.get("preco")),
    estoque: Number(formData.get("estoque")),
    offer: 0
  };
  if (!product.nome || product.nome.length > 120 || !product.categoria ||
      !Number.isFinite(product.preco) || product.preco < 0 ||
      !Number.isInteger(product.estoque) || product.estoque < 0) {
    setProductFeedback("Informe nome, categoria, preço válido e estoque inteiro não negativo.", "text-danger");
    return;
  }

  try {
    product.imagem = await window.prepareRaizesProductImage(storeProductImageInput?.files?.[0]);
    await window.raizesApiRequest("/products", { method: "POST", body: JSON.stringify(product) });
    await window.reloadRaizesProducts();
    storeProductForm.reset();
    storeProductImagePreview?.removeAttribute("src");
    if (storeProductImagePreview) storeProductImagePreview.hidden = true;
    setProductFeedback("Produto cadastrado com sucesso.", "text-success");
    renderStoreProducts();
    if (window.carregarModuloProdutos) window.carregarModuloProdutos();
    if (window.carregarModuloEstoque) window.carregarModuloEstoque();
  } catch (error) {
    setProductFeedback(error.message || "Não foi possível salvar o produto.", "text-danger");
  }
});

function renderTasks() {
  if (lojaList) {
    lojaList.replaceChildren(...storeTasks.map((task) => {
      const item = createElement("div", "task-item");
      const heading = createElement("div", "d-flex justify-content-between align-items-center mb-2");
      const statusClass = task.status === "OK" ? "success" : task.status === "Pendente" ? "warning" : "danger";
      heading.append(createElement("strong", "", task.title), createElement("span", `status-pill ${statusClass}`, task.status));
      const progress = createElement("div", "progress");
      const bar = createElement("div", "progress-bar bg-success");
      bar.setAttribute("role", "progressbar");
      bar.style.width = `${task.progress}%`;
      bar.setAttribute("aria-valuenow", String(task.progress));
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      progress.append(bar);
      item.append(heading, createElement("p", "text-muted mb-2", task.detail), progress);
      return item;
    }));
  }
  if (lojaRotas) {
    lojaRotas.replaceChildren(...routes.map((route) => {
      const item = createElement("div", "task-item d-flex justify-content-between align-items-center");
      item.append(
        createElement("strong", "", route.nome),
        createElement("span", `status-pill ${route.status === "OK" ? "success" : "warning"}`, route.status)
      );
      return item;
    }));
  }
}

function renderOrderList() {
  if (!storeOrdersBody) return;
  storeOrdersBody.replaceChildren(...orders.map((order) => {
    const row = document.createElement("tr");
    const statusCell = document.createElement("td");
    const statusSelect = document.createElement("select");
    statusSelect.className = "form-control order-status";
    statusSelect.dataset.orderId = order.id;
    ["Em preparo", "Em rota", "Concluído", "Cancelado"].forEach((status) => {
      const option = createElement("option", "", status);
      option.value = status;
      option.selected = status === order.status;
      statusSelect.append(option);
    });
    statusCell.append(statusSelect);
    row.append(
      createElement("td", "", new Date(order.timestamp).toLocaleString("pt-BR")),
      createElement("td", "", order.store),
      createElement("td", "", (order.items || []).map((item) => `${item.nome} x${item.quantity}`).join(", ")),
      createElement("td", "", new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(order.total || 0))),
      statusCell
    );
    return row;
  }));
}

storeOrdersBody?.addEventListener("change", async (event) => {
  const select = event.target.closest(".order-status");
  if (!select) return;
  try {
    const result = await window.raizesApiRequest(`/orders/${encodeURIComponent(select.dataset.orderId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: select.value })
    });
    const order = orders.find((item) => item.id === select.dataset.orderId);
    if (order) order.status = result.status;
    renderStore();
  } catch (error) {
    setProductFeedback(error.message || "Não foi possível atualizar o pedido.", "text-danger");
    renderOrderList();
  }
});

function renderStore() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((order) => new Date(order.timestamp).getTime() >= today.getTime());
  const totalSales = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const deliveries = todayOrders.filter((order) => order.method === "Delivery").length;
  const pickup = todayOrders.filter((order) => order.method === "Retirada").length;
  const regionCounts = {};
  orders.forEach((order) => {
    regionCounts[order.region] = (regionCounts[order.region] || 0) + 1;
  });
  const attentionCount = todayOrders.filter((order) => !["Concluído", "Cancelado"].includes(order.status)).length;

  if (regioesList) {
    regioesList.replaceChildren(...Object.entries(regionCounts).map(([region, count]) => {
      const item = createElement("div", "task-item d-flex justify-content-between align-items-center");
      item.append(createElement("strong", "", region), createElement("span", "badge bg-light text-dark", `${count} pedidos`));
      return item;
    }));
  }
  if (vendasHoje) vendasHoje.textContent = formatMoney(totalSales);
  if (pedidosHoje) pedidosHoje.textContent = String(todayOrders.length);
  if (atencaoHoje) atencaoHoje.textContent = String(attentionCount);
  if (lojaDelivery) lojaDelivery.textContent = String(deliveries);
  if (lojaRetirada) lojaRetirada.textContent = String(pickup);
  if (lojaRegiao) lojaRegiao.textContent = Object.keys(regionCounts)[0] || "—";
  if (lojasAtivas) lojasAtivas.textContent = String(new Set(orders.map((order) => order.store)).size);
  renderOrderList();
}

async function refreshStore() {
  try {
    orders = await window.raizesApiRequest("/orders");
    await window.reloadRaizesProducts();
    renderStoreProducts();
    renderStore();
  } catch (error) {
    setProductFeedback(error.message || "Não foi possível carregar os dados operacionais.", "text-danger");
  }
}

refreshButton?.addEventListener("click", refreshStore);
Promise.all([window.raizesAuthReady, window.raizesProductsReady]).then(async ([user]) => {
  if (!user || !["loja", "admin"].includes(user.role)) return;
  renderSessionStatus();
  renderTasks();
  await refreshStore();
  if (window.carregarModuloProdutos) window.carregarModuloProdutos();
}).catch((error) => console.error("Não foi possível inicializar a área operacional.", error));
