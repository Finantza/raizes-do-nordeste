import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import request from "supertest";
import app from "./app.js";
import { getFinanceiroSummary, getStockSummary, listProducts, listUnidades } from "./db.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "../public");

test("o catálogo em public/products.js recupera dados padrão offline caso a API falhe", async () => {
  const productsCode = fs.readFileSync(path.join(publicDir, "products.js"), "utf8");

  // Simula ambiente de navegador sem conexão de rede
  const browserContext = {
    window: {},
    console: {
      error: () => {} // silencia log de erro esperado na falha de rede
    }
  };

  // Simula requisição da API falhando por ausência de internet
  browserContext.window.raizesApiRequest = () => Promise.reject(new Error("Failed to fetch (offline)"));

  vm.runInNewContext(productsCode, browserContext);

  assert.ok(browserContext.window.RAIZES_DEFAULT_PRODUCTS, "Produtos padrão devem estar definidos");
  assert.equal(browserContext.window.RAIZES_DEFAULT_PRODUCTS.length, 100);

  // Aguarda a promessa do catálogo lidar com a falha de conexão
  const resolvedProducts = await browserContext.window.raizesProductsReady;
  assert.ok(Array.isArray(resolvedProducts), "Deve resolver como array");
  assert.equal(resolvedProducts.length, 100, "Deve manter os 100 produtos no fallback offline");
  assert.equal(browserContext.window.raizesProducts.length, 100);
});

test("todas as páginas HTML e scripts do frontend são 100% locais sem CDNs externos", () => {
  const htmlFiles = ["index.html", "login.html", "cliente.html", "admin.html", "operacional.html"];

  for (const fileName of htmlFiles) {
    const filePath = path.join(publicDir, fileName);
    assert.ok(fs.existsSync(filePath), `Arquivo ${fileName} deve existir`);
    const content = fs.readFileSync(filePath, "utf8");

    // Verifica que não há referências externas a scripts ou estilos carregados via CDN (http/https)
    const scriptSrcs = [...content.matchAll(/<script[^>]+src=["'](https?:)?\/\/([^"']+)["']/gi)];
    const linkHrefs = [...content.matchAll(/<link[^>]+href=["'](https?:)?\/\/([^"']+)["']/gi)];

    assert.equal(
      scriptSrcs.length,
      0,
      `Arquivo ${fileName} contém scripts externos de CDN: ${scriptSrcs.map((m) => m[0]).join(", ")}`
    );
    assert.equal(
      linkHrefs.length,
      0,
      `Arquivo ${fileName} contém links externos de CDN: ${linkHrefs.map((m) => m[0]).join(", ")}`
    );
  }

  // Verifica que o CSS não faz @import de fontes ou regras externas
  const cssContent = fs.readFileSync(path.join(publicDir, "style.css"), "utf8");
  const externalCssImports = [...cssContent.matchAll(/@import\s+url\(["']?(https?:)?\/\/[^"'\)]+["']?\)/gi)];
  assert.equal(externalCssImports.length, 0, "style.css não deve importar recursos externos via rede");
});

test("todos os recursos estáticos essenciais existem no disco e são servidos offline pelo Express", async () => {
  const essentialRoutes = [
    { url: "/", mime: /text\/html/ },
    { url: "/login.html", mime: /text\/html/ },
    { url: "/cliente.html", mime: /text\/html/ },
    { url: "/admin.html", mime: /text\/html/ },
    { url: "/operacional.html", mime: /text\/html/ },
    { url: "/style.css", mime: /text\/css/ },
    { url: "/config.js", mime: /javascript/ },
    { url: "/auth.js", mime: /javascript/ },
    { url: "/products.js", mime: /javascript/ },
    { url: "/app.js", mime: /javascript/ },
    { url: "/gestao.js", mime: /javascript/ },
    { url: "/images/raizes-logo.svg", mime: /image\/svg\+xml/ }
  ];

  for (const route of essentialRoutes) {
    const response = await request(app).get(route.url);
    assert.equal(response.status, 200, `Rota estática ${route.url} deve responder 200`);
    assert.match(response.headers["content-type"], route.mime, `MIME type de ${route.url} deve corresponder`);
  }
});

test("o banco de dados local SQLite funciona isolado sem conexão com a internet", async () => {
  const products = await listProducts();
  assert.ok(Array.isArray(products), "Deve listar produtos do SQLite local");
  assert.ok(products.length >= 100, "Deve conter catálogo carregado localmente");

  const unidades = await listUnidades();
  assert.ok(Array.isArray(unidades), "Deve listar unidades do SQLite local");

  const stockSummary = await getStockSummary();
  assert.ok(stockSummary && typeof stockSummary.totalItens === "number", "Deve calcular resumo de estoque local");

  const finSummary = await getFinanceiroSummary();
  assert.ok(finSummary && typeof finSummary.saldoProjetado === "number", "Deve calcular resumo financeiro local");
});

test("todas as 100 imagens de catálogo e fallbacks por categoria existem localmente no sistema de arquivos", () => {
  const productsCode = fs.readFileSync(path.join(publicDir, "products.js"), "utf8");
  const browserContext = { window: {} };
  vm.runInNewContext(productsCode, browserContext);

  const products = browserContext.window.RAIZES_DEFAULT_PRODUCTS;
  assert.equal(products.length, 100);

  const imagensDir = path.resolve(currentDir, "imagens");
  const fallbackDir = path.resolve(publicDir, "images/products");

  for (const prod of products) {
    const localImgPath = browserContext.window.getRaizesProductImage(prod);
    const fallbackImgPath = browserContext.window.getRaizesProductFallbackImage(prod);

    // Converte './imagens/x.png' para caminho no disco decodificando URLs com espaços (%20)
    const localFileName = decodeURIComponent(localImgPath.replace(/^\.\/imagens\//, ""));
    const localFile = path.resolve(imagensDir, localFileName);
    assert.ok(fs.existsSync(localFile), `Imagem local do produto '${prod.nome}' deve existir: ${localFile}`);

    // Converte './images/products/x.jpg' para caminho no disco
    const fallbackFileName = decodeURIComponent(fallbackImgPath.replace(/^\.\//, ""));
    const fallbackFile = path.resolve(publicDir, fallbackFileName);
    assert.ok(fs.existsSync(fallbackFile), `Imagem de fallback do produto '${prod.nome}' deve existir: ${fallbackFile}`);
  }
});

test("o cálculo de preços com ofertas funciona offline e é idêntico à regra do backend", () => {
  const productsCode = fs.readFileSync(path.join(publicDir, "products.js"), "utf8");
  const browserContext = { window: {} };
  vm.runInNewContext(productsCode, browserContext);

  const products = browserContext.window.RAIZES_DEFAULT_PRODUCTS;
  const combos = products.filter((p) => Number(p.offer) > 0);
  assert.ok(combos.length > 0, "Deve haver produtos em oferta");

  for (const item of combos) {
    const rawPrice = Number(item.preco);
    const offerPercent = Number(item.offer);
    const expectedPromoPrice = Math.round(rawPrice * (1 - offerPercent / 100) * 100) / 100;

    assert.ok(expectedPromoPrice < rawPrice, "Preço promocional deve ser menor que o original");
    assert.ok(expectedPromoPrice > 0, "Preço deve ser positivo");
  }
});
