import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const productsFile = path.resolve(currentDir, "../public/products.js");
const browserContext = { window: {} };
vm.runInNewContext(fs.readFileSync(productsFile, "utf8"), browserContext);

const products = browserContext.window.RAIZES_DEFAULT_PRODUCTS;

test("o cardápio contém 100 produtos válidos e sem nomes repetidos", () => {
  assert.equal(products.length, 100);
  assert.equal(new Set(products.map((product) => product.id)).size, 100);
  assert.equal(new Set(products.map((product) => product.nome)).size, 100);

  for (const product of products) {
    assert.ok(product.nome.trim());
    assert.ok(typeof product.descricao === "string" && product.descricao.trim());
    assert.ok(["Lanches", "Pratos", "Bebidas", "Sobremesas", "Ofertas"].includes(product.categoria));
    assert.ok(Number.isFinite(product.preco) && product.preco >= 0);
    assert.ok(Number.isInteger(product.estoque) && product.estoque >= 0);
    assert.ok(Number.isFinite(product.offer) && product.offer >= 0 && product.offer <= 100);
  }
});

test("todos os combos informam seus itens inclusos", () => {
  const combos = products.filter((product) => product.nome.startsWith("Combo"));
  assert.equal(combos.length, 21);
  for (const combo of combos) {
    assert.ok(Array.isArray(combo.itensInclusos) && combo.itensInclusos.length >= 1, combo.nome);
    assert.ok(combo.itensInclusos.every((item) => typeof item === "string" && item.trim()), combo.nome);
    assert.ok(combo.descricao.trim(), combo.nome);
  }
});

test("a migração inclui o catálogo novo sem perder alterações ou produtos personalizados", () => {
  const previousProducts = [
    { id: 1, nome: "Combo editado", categoria: "Ofertas", preco: 80, estoque: 4 },
    { id: 101, nome: "Produto da loja", categoria: "Lanches", preco: 10, estoque: 2 }
  ];
  const merged = browserContext.window.mergeRaizesProducts(previousProducts);

  assert.equal(merged.length, 101);
  assert.equal(merged.find((product) => product.id === 1).nome, "Combo editado");
  assert.equal(merged.find((product) => product.id === 1).offer, 35);
  assert.equal(merged.find((product) => product.id === 101).nome, "Produto da loja");
});

test("cada produto resolve para uma imagem gerada ou foto local de fallback", () => {
  const images = products.map((product) => browserContext.window.getRaizesProductImage(product));
  assert.equal(images.length, 100);
  const generatedDir = path.resolve(currentDir, "imagens");
  const publicDir = path.resolve(currentDir, "../public");
  const generatedFileNames = fs.readdirSync(generatedDir)
    .filter((fileName) => /\.(png|jpe?g|webp|avif)$/i.test(fileName));
  const generatedImages = images.map((image) => {
    assert.ok(image.startsWith("./imagens/"), image);
    const fileName = decodeURIComponent(image.slice("./imagens/".length));
    assert.ok(generatedFileNames.includes(fileName), `${fileName} não existe no catálogo de imagens`);
    assert.ok(fs.existsSync(path.join(generatedDir, fileName)), `${fileName} não foi encontrado`);
    return fileName;
  });
  assert.equal(new Set(generatedImages).size, products.length);

  const fallbackImages = products.map((product) => browserContext.window.getRaizesProductFallbackImage(product));
  assert.ok(fallbackImages.every((image) =>
    /^\.\//.test(image) &&
    /^\.\/images\/products\/[a-z0-9-]+\.jpg$/.test(image) &&
    fs.existsSync(path.join(publicDir, image.slice(2)))
  ));
  assert.ok(new Set(fallbackImages).size > 10);
  assert.equal(
    browserContext.window.escapeRaizesHtml(`<img src='x'>&`),
    "&lt;img src=&#39;x&#39;&gt;&amp;"
  );
});
