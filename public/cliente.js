const CART_KEY = "raizes-storefront-cart";
const ORDER_KEY = "raizes-storefront-orders";

const feedback = document.querySelector("#customer-feedback");
const catalog = document.querySelector("#customer-catalog");
const cartItems = document.querySelector("#cart-items-list");
const cartTotal = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-order");
const checkoutLoginNotice = document.querySelector("#checkout-login-notice");
const clearCartButton = document.querySelector("#clear-cart");
const customerRegion = document.querySelector("#customer-region");
const customerStore = document.querySelector("#customer-store");
const categoryFilter = document.querySelector("#category-filter");
const orderModeInputs = document.querySelectorAll('input[name="order-mode"]');
const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
};

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function getProductPrice(product) {
  const price = Number(product.preco || 0);
  const offer = Number(product.offer || 0);
  return Math.round(price * (1 - offer / 100) * 100) / 100;
}

function readProducts() {
  return window.raizesProducts;
}

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("O carrinho local está inválido.", error);
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getSelectedCategory() {
  const activeButton = categoryFilter?.querySelector(".filter-chip.active");
  return activeButton ? activeButton.dataset.category : "Todos";
}

function getSelectedOrderMode() {
  const selected = document.querySelector('input[name="order-mode"]:checked');
  return selected ? selected.value : "Delivery";
}

function createProductCard(product) {
  const card = createElement("article", "product-card product-card-small");
  card.append(createElement("div", "product-label", `-${Number(product.offer || 0)}%`));
  const imageBox = createElement("div", "product-image");
  const image = document.createElement("img");
  image.src = window.getRaizesProductImage(product);
  image.dataset.productFallback = window.getRaizesProductFallbackImage(product);
  image.alt = product.nome;
  image.loading = "lazy";
  imageBox.append(image);

  const info = createElement("div", "product-info");
  info.append(
    createElement("span", "product-category", product.categoria),
    createElement("h3", "", product.nome),
    createElement("p", "product-description", product.descricao || "")
  );
  if (product.itensInclusos?.length) {
    const inclusions = createElement("p", "product-inclusions");
    inclusions.append(createElement("strong", "", "Inclui: "));
    inclusions.append(document.createTextNode(product.itensInclusos.join(" + ")));
    info.append(inclusions);
  }
  const prices = createElement("div", "product-price");
  prices.append(createElement("strong", "", money(getProductPrice(product))));
  prices.append(createElement("small", "", money(product.preco)));
  const meta = createElement("div", "product-meta");
  meta.append(createElement("span", "", `Estoque: ${product.estoque}`));
  const addButton = createElement("button", "btn btn-success w-100 mt-3 add-to-cart", "Adicionar");
  addButton.type = "button";
  addButton.dataset.id = String(product.id);
  addButton.addEventListener("click", () => addToCart(Number(product.id)));
  info.append(prices, meta, addButton);
  card.append(imageBox, info);
  return card;
}

function renderCatalog() {
  if (!catalog) return;
  const products = readProducts();
  const selectedCategory = getSelectedCategory();
  const categories = ["Lanches", "Pratos", "Bebidas", "Sobremesas", "Ofertas"]
    .filter((category) => selectedCategory === "Todos" || category === selectedCategory);
  const available = products.filter((product) => categories.includes(product.categoria));
  if (!available.length) {
    const empty = createElement("div", "col-12");
    empty.append(createElement("div", "alert alert-light border", "Nenhum produto encontrado nesta categoria."));
    catalog.replaceChildren(empty);
    return;
  }

  catalog.replaceChildren(...categories.flatMap((category) => {
    const matching = products.filter((product) => product.categoria === category);
    if (!matching.length) return [];
    const categoryId = `catalog-${category.toLowerCase()}`;
    const section = createElement("section", "catalog-category");
    section.id = categoryId;
    section.setAttribute("aria-labelledby", `${categoryId}-title`);
    const heading = createElement("div", "catalog-category-heading");
    const title = createElement("h3", "", category);
    title.id = `${categoryId}-title`;
    heading.append(title, createElement("span", "", `${matching.length} produtos`));
    const grid = createElement("div", "catalog-product-grid");
    grid.replaceChildren(...matching.map(createProductCard));
    section.append(heading, grid);
    return [section];
  }));
  window.bindRaizesProductImageFallbacks(catalog);
}

function addToCart(productId) {
  const cart = readCart();
  const product = readProducts().find((item) => Number(item.id) === productId);
  if (!product) return;
  const existing = cart.find((item) => Number(item.id) === productId);
  if (existing) existing.quantity = Math.min(100, Number(existing.quantity || 0) + 1);
  else cart.push({ id: product.id, quantity: 1 });
  writeCart(cart);
  renderCart();
}

function renderCart() {
  if (!cartItems) return;
  const products = readProducts();
  const cart = readCart();
  if (!cart.length) {
    cartItems.replaceChildren(createElement("p", "text-muted", "Seu carrinho está vazio."));
    if (cartTotal) cartTotal.textContent = money(0);
    return;
  }
  let total = 0;
  cartItems.replaceChildren(...cart.map((item) => {
    const product = products.find((candidate) => Number(candidate.id) === Number(item.id));
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const price = product ? getProductPrice(product) : Number(item.preco || 0);
    total += price * quantity;
    const row = createElement("div", "cart-item");
    row.append(
      createElement("span", "cart-item-icon", "🍽️"),
      createElement("span", "cart-item-name", product?.nome || "Produto indisponível"),
      createElement("span", "cart-item-qty", `x${quantity}`),
      createElement("span", "cart-item-price", money(price * quantity))
    );
    return row;
  }));
  if (cartTotal) cartTotal.textContent = money(total);
}

async function renderOrderHistory() {
  const tableBody = document.querySelector("#order-history-body");
  if (!tableBody) return;
  const currentUser = getCurrentUser();
  const historySection = document.querySelector("#order-history-section");
  if (historySection) historySection.hidden = !currentUser;
  if (!currentUser) return;

  try {
    const orders = await window.raizesApiRequest("/orders");
    if (!orders.length) {
      const row = document.createElement("tr");
      const cell = createElement("td", "text-center text-muted py-4", "Nenhum pedido registrado ainda.");
      cell.colSpan = 5;
      row.append(cell);
      tableBody.replaceChildren(row);
      return;
    }
    tableBody.replaceChildren(...orders.map((order) => {
      const row = document.createElement("tr");
      const itemNames = (order.items || []).map((item) => `${item.nome} x${item.quantity}`).join(", ") || "Pedido";
      const date = new Date(order.timestamp || Date.now()).toLocaleDateString("pt-BR");
      row.append(
        createElement("td", "", date),
        createElement("td", "", order.store || "Loja Centro"),
        createElement("td", "", itemNames),
        createElement("td", "", money(order.total || 0))
      );
      const statusCell = document.createElement("td");
      statusCell.append(createElement("span", "badge bg-success-subtle text-success", order.status || "Em preparo"));
      row.append(statusCell);
      return row;
    }));
  } catch (error) {
    setFeedback(error.message || "Não foi possível carregar o histórico de pedidos.", "text-danger");
  }
}

function setFeedback(text, type) {
  if (!feedback) return;
  feedback.textContent = text;
  feedback.className = `small ${type}`;
}

async function migrateLocalOrders(user) {
  if (!user || user.role !== "cliente") return;
  const raw = localStorage.getItem(ORDER_KEY);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) throw new Error("O histórico local está inválido.");
    const ownOrders = stored.flatMap((order, index) =>
      String(order.email || "").toLowerCase() === user.email.toLowerCase()
        ? [{ ...order, legacyId: `${order.timestamp || "sem-data"}:${index}`, legacyIndex: index }]
        : []
    );
    for (let offset = 0; offset < ownOrders.length; offset += 5) {
      await window.raizesApiRequest("/orders/migrate-local", {
        method: "POST",
        body: JSON.stringify({ orders: ownOrders.slice(offset, offset + 5) })
      });
    }
    const ownIndexes = new Set(ownOrders.map((order) => order.legacyIndex));
    const remaining = stored.filter((_order, index) => !ownIndexes.has(index));
    if (remaining.length) localStorage.setItem(ORDER_KEY, JSON.stringify(remaining));
    else localStorage.removeItem(ORDER_KEY);
  } catch (error) {
    console.error("A migração do histórico local não foi concluída; os dados foram mantidos.", error);
    setFeedback("A migração do histórico local falhou; os dados antigos foram mantidos no navegador.", "text-warning");
  }
}

checkoutButton?.addEventListener("click", async () => {
  const cart = readCart();
  if (!cart.length) {
    setFeedback("Seu carrinho está vazio.", "text-warning");
    return;
  }
  if (!getCurrentUser()) {
    setFeedback("Entre ou crie uma conta para concluir o pedido. Seu carrinho foi mantido.", "text-warning");
    return;
  }

  checkoutButton.disabled = true;
  try {
    const response = await window.raizesApiRequest("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: cart.map(({ id, quantity }) => ({ id, quantity })),
        region: customerRegion?.value || "Sudeste",
        store: customerStore?.value || "Loja Centro",
        method: getSelectedOrderMode(),
        address: document.querySelector("#delivery-address")?.value?.trim() || "",
        paymentMethod: document.querySelector("#payment-method")?.value || "Pix"
      })
    });
    localStorage.removeItem(CART_KEY);
    renderCart();
    await renderOrderHistory();
    setFeedback(`Pedido finalizado com sucesso em ${response.store} (${response.method} / ${response.region}).`, "text-success");
  } catch (error) {
    setFeedback(error.message || "Não foi possível finalizar o pedido.", "text-danger");
  } finally {
    checkoutButton.disabled = false;
  }
});

clearCartButton?.addEventListener("click", () => {
  localStorage.removeItem(CART_KEY);
  renderCart();
});

categoryFilter?.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-chip");
  if (!button) return;
  categoryFilter.querySelectorAll(".filter-chip").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  renderCatalog();
});

orderModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    setFeedback(`Modo de atendimento: ${getSelectedOrderMode()}.`, "text-success");
  });
});

Promise.all([window.raizesAuthReady, window.raizesProductsReady]).then(async ([user]) => {
  await migrateLocalOrders(user);
  renderCatalog();
  renderCart();
  await renderOrderHistory();
  if (checkoutLoginNotice) checkoutLoginNotice.hidden = Boolean(user);
}).catch((error) => {
  setFeedback(error.message || "Não foi possível carregar o cardápio.", "text-danger");
});
