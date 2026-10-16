// app.js — Lógica da vitrine principal (index.html).
// Responsável por renderizar os produtos em destaque na página inicial.
const PRODUCT_STORAGE_KEY = "raizes-storefront-products";
const featuredProducts = document.querySelector("#featured-products");

function readProducts() {
  try {
    return window.readRaizesProducts(PRODUCT_STORAGE_KEY);
  } catch {
    const defaults = window.mergeRaizesProducts(null);
    window.saveRaizesProducts(PRODUCT_STORAGE_KEY, defaults);
    return defaults;
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

// Renderiza os produtos em destaque na vitrine. A letra inicial da categoria
// serve como ícone de fallback enquanto não há imagens reais carregadas.
function renderFeaturedProducts() {
  if (!featuredProducts) return;

  const products = readProducts().slice(0, 4);
  featuredProducts.innerHTML = products.map((product) => {
    const desconto = Number(product.offer || 0);
    const precoFinal = Number(product.preco || 0) * (1 - desconto / 100);

    return `
      <div class="col-md-6 col-lg-3">
        <div class="product-card">
          <div class="product-label">-${desconto}%</div>
          <div class="product-image"><img src="${window.getRaizesProductImage(product)}" data-product-fallback="${window.getRaizesProductFallbackImage(product)}" alt="${window.escapeRaizesHtml(product.nome)}"></div>
          <div class="product-info">
            <span class="product-category">${window.escapeRaizesHtml(product.categoria)}</span>
            <h3>${window.escapeRaizesHtml(product.nome)}</h3>
            <p class="product-description">${window.escapeRaizesHtml(product.descricao || "")}</p>
            ${product.itensInclusos?.length ? `<p class="product-inclusions"><strong>Inclui:</strong> ${product.itensInclusos.map(window.escapeRaizesHtml).join(" + ")}</p>` : ""}
            <div class="product-price">
              <strong>${formatMoney(precoFinal)}</strong>
              <small>${formatMoney(product.preco)}</small>
            </div>
            <div class="product-meta">
              <span>Estoque: ${product.estoque}</span>
              <span>Entrega em 24h</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
  window.bindRaizesProductImageFallbacks(featuredProducts);
}

renderFeaturedProducts();

async function renderUnitStatistics() {
  const totalElement = document.querySelector("#stat-total");
  const activeElement = document.querySelector("#stat-active");
  const statesElement = document.querySelector("#stat-states");
  if (!totalElement || !activeElement || !statesElement) return;

  if (!window.__APP_CONFIG__.apiBaseUrl) {
    [totalElement, activeElement, statesElement].forEach((element) => {
      element.textContent = "—";
      element.title = "Indicadores de unidades disponíveis somente quando a API está ativa.";
    });
    return;
  }

  try {
    const response = await fetch(`${window.__APP_CONFIG__.apiBaseUrl}/unidades`);
    if (!response.ok) {
      throw new Error(`Falha ao carregar unidades: HTTP ${response.status}`);
    }

    const units = await response.json();
    if (!Array.isArray(units)) {
      throw new Error("A API retornou uma lista de unidades inválida.");
    }

    totalElement.textContent = String(units.length);
    activeElement.textContent = String(units.filter((unit) => Number(unit.ativa) === 1).length);
    statesElement.textContent = String(new Set(units.map((unit) => unit.estado).filter(Boolean)).size);
  } catch (error) {
    console.error("Não foi possível carregar os indicadores de unidades:", error);
    [totalElement, activeElement, statesElement].forEach((element) => {
      element.textContent = "—";
      element.title = "Indicador indisponível: não foi possível consultar a API.";
    });
  }
}

renderUnitStatistics();
