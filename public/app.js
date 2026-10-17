const featuredProducts = document.querySelector("#featured-products");
const carousel = document.querySelector("#home-carousel");
const carouselTrack = document.querySelector("#home-carousel-track");
const carouselDots = document.querySelector("#home-carousel-dots");
const carouselPrevious = document.querySelector("#carousel-previous");
const carouselNext = document.querySelector("#carousel-next");
const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
};

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function getDiscountedPrice(product) {
  return Number(product.preco || 0) * (1 - Number(product.offer || 0) / 100);
}

function createProductImage(product, loading = "lazy") {
  const image = document.createElement("img");
  image.src = window.getRaizesProductImage(product);
  image.dataset.productFallback = window.getRaizesProductFallbackImage(product);
  image.alt = product.nome;
  image.loading = loading;
  return image;
}

function renderHomeCarousel(products) {
  if (!carousel || !carouselTrack || !carouselDots) return;
  const offers = products.filter((product) => Number(product.offer) > 0).slice(0, 5);
  if (!offers.length) {
    carousel.hidden = true;
    return;
  }

  const slides = offers.map((product, index) => {
    const slide = createElement("article", `home-carousel-slide${index === 0 ? " is-active" : ""}`);
    slide.hidden = index !== 0;
    slide.setAttribute("aria-label", `${index + 1} de ${offers.length}`);
    const imageBox = createElement("div", "home-carousel-image");
    imageBox.append(createProductImage(product, index === 0 ? "eager" : "lazy"));
    imageBox.firstElementChild.fetchPriority = index === 0 ? "high" : "auto";
    imageBox.append(createElement("span", "promo-tag", `-${Number(product.offer || 0)}%`));
    const content = createElement("div", "home-carousel-content");
    content.append(
      createElement("span", "product-category", product.categoria),
      createElement("h2", "", product.nome),
      createElement("p", "", product.descricao || "Um sabor especial da nossa cozinha.")
    );
    const bottom = createElement("div", "home-carousel-bottom");
    const prices = createElement("div", "price-box");
    prices.append(createElement("strong", "", formatMoney(getDiscountedPrice(product))));
    const original = createElement("del", "", formatMoney(product.preco));
    prices.append(original);
    const link = createElement("a", "btn btn-amber btn-sm", "Quero provar →");
    link.href = "./cliente.html";
    bottom.append(prices, link);
    content.append(bottom);
    slide.append(imageBox, content);
    return slide;
  });
  carouselTrack.replaceChildren(...slides);

  const dots = offers.map((product, index) => {
    const dot = createElement("button", `carousel-dot${index === 0 ? " is-active" : ""}`);
    dot.type = "button";
    dot.dataset.slide = String(index);
    dot.setAttribute("aria-label", `Mostrar ${product.nome}`);
    dot.setAttribute("aria-current", String(index === 0));
    return dot;
  });
  carouselDots.replaceChildren(...dots);
  window.bindRaizesProductImageFallbacks(carouselTrack);

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

function renderFeaturedProducts(products) {
  if (!featuredProducts) return;
  const offers = products.filter((product) => Number(product.offer) > 0).slice(0, 4);
  featuredProducts.replaceChildren(...offers.map((product) => {
    const card = createElement("article", "product-card");
    card.append(createElement("div", "product-label", `-${Number(product.offer || 0)}%`));
    const imageBox = createElement("div", "product-image");
    imageBox.append(createProductImage(product));
    const info = createElement("div", "product-info");
    info.append(
      createElement("span", "product-category", product.categoria),
      createElement("h3", "", product.nome),
      createElement("p", "product-description", product.descricao || "")
    );
    const prices = createElement("div", "product-price");
    prices.append(createElement("strong", "", formatMoney(getDiscountedPrice(product))));
    prices.append(createElement("small", "", formatMoney(product.preco)));
    const link = createElement("a", "btn btn-ghost btn-sm featured-product-link", "Ver no cardápio →");
    link.href = "./cliente.html";
    info.append(prices, link);
    card.append(imageBox, info);
    return card;
  }));
  window.bindRaizesProductImageFallbacks(featuredProducts);
}

window.raizesProductsReady.then((products) => {
  renderHomeCarousel(products);
  renderFeaturedProducts(products);
});
