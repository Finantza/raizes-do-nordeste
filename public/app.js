// app.js — Lógica da vitrine principal (index.html).
// Responsável por renderizar os produtos em destaque na página inicial.
const PRODUCT_STORAGE_KEY = "raizes-storefront-products";
const featuredProducts = document.querySelector("#featured-products");
const carousel = document.querySelector("#home-carousel");
const carouselTrack = document.querySelector("#home-carousel-track");
const carouselDots = document.querySelector("#home-carousel-dots");
const carouselPrevious = document.querySelector("#carousel-previous");
const carouselNext = document.querySelector("#carousel-next");

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

function getDiscountedPrice(product) {
  return Number(product.preco || 0) * (1 - Number(product.offer || 0) / 100);
}

function renderHomeCarousel() {
  if (!carousel || !carouselTrack || !carouselDots) return;

  const products = readProducts()
    .filter((product) => Number(product.offer) > 0)
    .slice(0, 5);

  if (!products.length) {
    carousel.hidden = true;
    return;
  }

  carouselTrack.innerHTML = products.map((product, index) => {
    const discount = Number(product.offer || 0);
    const price = getDiscountedPrice(product);
    return `
      <article class="home-carousel-slide${index === 0 ? " is-active" : ""}"${index === 0 ? "" : " hidden"} aria-label="${index + 1} de ${products.length}">
        <div class="home-carousel-image">
          <img src="${window.getRaizesProductImage(product)}" data-product-fallback="${window.getRaizesProductFallbackImage(product)}" alt="${window.escapeRaizesHtml(product.nome)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>
          <span class="promo-tag">-${discount}%</span>
        </div>
        <div class="home-carousel-content">
          <span class="product-category">${window.escapeRaizesHtml(product.categoria)}</span>
          <h2>${window.escapeRaizesHtml(product.nome)}</h2>
          <p>${window.escapeRaizesHtml(product.descricao || "Um sabor especial da nossa cozinha.")}</p>
          <div class="home-carousel-bottom">
            <div class="price-box">
              <strong>${formatMoney(price)}</strong>
              <del>${formatMoney(product.preco)}</del>
            </div>
            <a class="btn btn-amber btn-sm" href="./cliente.html">Quero provar <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  carouselDots.innerHTML = products.map((product, index) => `
    <button class="carousel-dot${index === 0 ? " is-active" : ""}" type="button" data-slide="${index}" aria-label="Mostrar ${window.escapeRaizesHtml(product.nome)}" aria-current="${index === 0 ? "true" : "false"}"></button>
  `).join("");

  window.bindRaizesProductImageFallbacks(carouselTrack);

  const slides = [...carouselTrack.querySelectorAll(".home-carousel-slide")];
  const dots = [...carouselDots.querySelectorAll(".carousel-dot")];
  let activeIndex = 0;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.hidden = !isActive;
      slide.classList.toggle("is-active", isActive);
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", String(isActive));
    });
  };

  carouselPrevious?.addEventListener("click", () => showSlide(activeIndex - 1));
  carouselNext?.addEventListener("click", () => showSlide(activeIndex + 1));
  carouselDots.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-slide]");
    if (dot) showSlide(Number(dot.dataset.slide));
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (slides.length > 1 && !reduceMotion.matches) {
    let timer;
    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      if (!document.hidden) timer = window.setInterval(() => showSlide(activeIndex + 1), 6500);
    };
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) start();
    });
    document.addEventListener("visibilitychange", start);
    start();
  }
}

function renderFeaturedProducts() {
  if (!featuredProducts) return;

  const products = readProducts().filter((product) => Number(product.offer) > 0).slice(0, 4);
  featuredProducts.innerHTML = products.map((product) => {
    const desconto = Number(product.offer || 0);
    const precoFinal = getDiscountedPrice(product);

    return `
      <article class="product-card">
        <div class="product-label">-${desconto}%</div>
        <div class="product-image"><img src="${window.getRaizesProductImage(product)}" data-product-fallback="${window.getRaizesProductFallbackImage(product)}" alt="${window.escapeRaizesHtml(product.nome)}" loading="lazy"></div>
        <div class="product-info">
          <span class="product-category">${window.escapeRaizesHtml(product.categoria)}</span>
          <h3>${window.escapeRaizesHtml(product.nome)}</h3>
          <p class="product-description">${window.escapeRaizesHtml(product.descricao || "")}</p>
          <div class="product-price">
            <strong>${formatMoney(precoFinal)}</strong>
            <small>${formatMoney(product.preco)}</small>
          </div>
          <a class="btn btn-ghost btn-sm featured-product-link" href="./cliente.html">Ver no cardápio <span aria-hidden="true">→</span></a>
        </div>
      </article>
    `;
  }).join("");
  window.bindRaizesProductImageFallbacks(featuredProducts);
}

renderHomeCarousel();
renderFeaturedProducts();
