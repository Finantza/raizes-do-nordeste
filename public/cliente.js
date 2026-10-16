// cliente.js — Catálogo, login, carrinho e finalização de pedido.
// Depende de auth.js (carregado antes no HTML) para readUsers / getCurrentUser / setCurrentUser.
const PRODUCT_KEY = "raizes-storefront-products";
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

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function getProductPrice(product) {
  const price = Number(product.preco || 0);
  const offer = Number(product.offer || 0);
  return Math.round(price * (1 - offer / 100) * 100) / 100;
}

// Busca os produtos na memória do navegador. Se não houver nada salvo,
// o sistema cria uma lista inicial para que a loja funcione mesmo sem backend.
function readProducts() {
  try {
    return window.readRaizesProducts(PRODUCT_KEY);
  } catch {
    const defaults = window.mergeRaizesProducts(null);
    window.saveRaizesProducts(PRODUCT_KEY, defaults);
    return defaults;
  }
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
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

// Monta a vitrine de produtos na tela. Também filtra por categoria para deixar a navegação mais fácil.
function renderCatalog() {
  if (!catalog) return;

  const selectedCategory = getSelectedCategory();
  const products = readProducts();
  const categories = ["Lanches", "Pratos", "Bebidas", "Sobremesas", "Ofertas"]
    .filter((category) => selectedCategory === "Todos" || category === selectedCategory);

  const availableProducts = products.filter((product) => categories.includes(product.categoria));
  if (!availableProducts.length) {
    catalog.innerHTML = '<div class="col-12"><div class="alert alert-light border">Nenhum produto encontrado nesta categoria.</div></div>';
    return;
  }

  catalog.innerHTML = categories.map((category) => {
    const categoryProducts = products.filter((product) => product.categoria === category);
    if (!categoryProducts.length) return "";

    const categoryId = `catalog-${category.toLowerCase()}`;
    const productCards = categoryProducts.map((product) => {
      const finalPrice = getProductPrice(product);
      return `
        <article class="product-card product-card-small">
          <div class="product-label">-${product.offer || 0}%</div>
          <div class="product-image"><img src="${window.getRaizesProductImage(product)}" data-product-fallback="${window.getRaizesProductFallbackImage(product)}" alt="${window.escapeRaizesHtml(product.nome)}" loading="lazy"></div>
          <div class="product-info">
            <span class="product-category">${window.escapeRaizesHtml(product.categoria)}</span>
            <h3>${window.escapeRaizesHtml(product.nome)}</h3>
            <p class="product-description">${window.escapeRaizesHtml(product.descricao || "")}</p>
            ${product.itensInclusos?.length ? `<p class="product-inclusions"><strong>Inclui:</strong> ${product.itensInclusos.map(window.escapeRaizesHtml).join(" + ")}</p>` : ""}
            <div class="product-price">
              <strong>${money(finalPrice)}</strong>
              <small>${money(product.preco)}</small>
            </div>
            <div class="product-meta">
              <span>Estoque: ${product.estoque}</span>
            </div>
            <button class="btn btn-success w-100 mt-3 add-to-cart" type="button" data-id="${product.id}">Adicionar</button>
          </div>
        </article>
      `;
    }).join("");

    return `
      <section class="catalog-category" id="${categoryId}" aria-labelledby="${categoryId}-title">
        <div class="catalog-category-heading">
          <h3 id="${categoryId}-title">${window.escapeRaizesHtml(category)}</h3>
          <span>${categoryProducts.length} produtos</span>
        </div>
        <div class="catalog-product-grid">${productCards}</div>
      </section>
    `;
  }).join("");

  window.bindRaizesProductImageFallbacks(catalog);
  catalog.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.id)));
  });
}

// Adiciona um item ao carrinho. Se o produto já estiver lá, aumenta a quantidade.
function addToCart(productId) {
  const cart = readCart();
  const product = readProducts().find((item) => Number(item.id) === productId);
  if (!product) return;

  const existing = cart.find((item) => Number(item.id) === productId);
  if (existing) {
    existing.quantity += 1;
    existing.preco = getProductPrice(product);
  } else {
    cart.push({ id: product.id, nome: product.nome, preco: getProductPrice(product), quantity: 1 });
  }

  writeCart(cart);
  renderCart();
}

// Atualiza a tabela do carrinho e recalcula o total em reais.
function renderCart() {
  const cart = readCart();
  if (!cartItems) return;

  if (!cart.length) {
    cartItems.innerHTML = '<p class="text-muted">Seu carrinho está vazio.</p>';
    if (cartTotal) cartTotal.textContent = money(0);
    return;
  }

  cartItems.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <span class="cart-item-icon" aria-hidden="true">🍽️</span>
      <span class="cart-item-name">${window.escapeRaizesHtml(item.nome)}</span>
      <span class="cart-item-qty">x${item.quantity}</span>
      <span class="cart-item-price">${money(getCartItemPrice(item) * item.quantity)}</span>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0);
  if (cartTotal) cartTotal.textContent = money(total);
}

function getCartItemPrice(item) {
  const product = readProducts().find((candidate) => Number(candidate.id) === Number(item.id));
  return product ? getProductPrice(product) : Number(item.preco || 0);
}

function setFeedback(text, type) {
  if (!feedback) return;
  feedback.textContent = text;
  feedback.className = `small ${type}`;
}

function renderOrderHistory() {
  const tableBody = document.querySelector("#order-history-body");
  if (!tableBody) return;

  const currentUser = getCurrentUser();
  const historySection = document.querySelector("#order-history-section");
  if (historySection) historySection.hidden = !currentUser;

  const storedOrders = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  const orders = currentUser
    ? storedOrders.filter((order) => order.email === currentUser.email)
    : [];
  if (!orders.length) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum pedido registrado ainda.</td></tr>';
    return;
  }

  tableBody.innerHTML = orders.slice().reverse().map((order) => {
    const itemsText = (order.items || []).map((item) => `${item.nome} x${item.quantity}`).join(", ") || "Pedido";
    const date = new Date(order.timestamp || Date.now()).toLocaleDateString("pt-BR");
    return `
      <tr>
        <td>${date}</td>
        <td>${order.store || "Loja Centro"}</td>
        <td>${itemsText}</td>
        <td>${money(order.total || 0)}</td>
        <td><span class="badge bg-success-subtle text-success">${order.status || "Em preparo"}</span></td>
      </tr>
    `;
  }).join("");
}

checkoutButton?.addEventListener("click", () => {
  const cart = readCart();
  if (!cart.length) { setFeedback("Seu carrinho está vazio.", "text-warning"); return; }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    setFeedback("Entre ou crie uma conta para concluir o pedido. Seu carrinho foi mantido.", "text-warning");
    return;
  }

  const region = customerRegion ? customerRegion.value : "Sudeste";
  const store = customerStore ? customerStore.value : "Loja Centro";
  const method = getSelectedOrderMode();
  const address = document.querySelector("#delivery-address")?.value?.trim() || "Rua principal";
  const neighborhood = document.querySelector("#delivery-neighborhood")?.value?.trim() || "Centro";
  const paymentMethod = document.querySelector("#payment-method")?.value || "Pix";
  const items = cart.map((item) => ({ ...item, preco: getCartItemPrice(item) }));
  const total = items.reduce((sum, item) => sum + item.preco * item.quantity, 0);

  const orders = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
  orders.push({
    timestamp: new Date().toISOString(),
    customer: currentUser.name,
    email: currentUser.email,
    items,
    total,
    region,
    store,
    method,
    address,
    neighborhood,
    paymentMethod,
    status: "Em preparo"
  });

  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  localStorage.removeItem(CART_KEY);
  renderCart();
  renderOrderHistory();
  setFeedback(`Pedido finalizado com sucesso em ${store} (${method} / ${region}).`, "text-success");
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

renderCatalog();
renderCart();
renderOrderHistory();
if (checkoutLoginNotice) checkoutLoginNotice.hidden = Boolean(getCurrentUser());
