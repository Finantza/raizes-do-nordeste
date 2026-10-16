import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Este arquivo funciona como a "caixa de armazenamento" do sistema.
// Em vez de usar banco SQL, a aplicação salva os dados em um arquivo JSON dentro da pasta data.
// Isso facilita a execução local, offline e em hospedagens simples.
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const dataDir = path.resolve(currentDir, "../data");
const dbFilePath = process.env.RAIZES_DB_PATH
  ? path.resolve(process.env.RAIZES_DB_PATH)
  : path.join(dataDir, "raizes.json");

const defaultDbState = Object.freeze({
  nextId: 1,
  unidades: []
});

// Cria a pasta de dados caso ela ainda não exista.
fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

// Garante que o arquivo JSON do banco exista antes de qualquer leitura.
function ensureDatabaseFile() {
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(defaultDbState, null, 2));
  }
}

// Lê tudo que está salvo no arquivo JSON. Se algo estiver quebrado,
// a aplicação volta para um estado inicial seguro.
function readDatabase() {
  ensureDatabaseFile();

  try {
    const raw = fs.readFileSync(dbFilePath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.unidades)) {
      return { ...defaultDbState };
    }

    return {
      nextId: Number.isInteger(parsed.nextId) && parsed.nextId > 0 ? parsed.nextId : 1,
      unidades: parsed.unidades
    };
  } catch {
    return { ...defaultDbState };
  }
}

function writeDatabase(nextState) {
  fs.writeFileSync(dbFilePath, JSON.stringify(nextState, null, 2));
}

function listUnidades() {
  return readDatabase().unidades
    .slice()
    .sort((primeira, segunda) => primeira.nome.localeCompare(segunda.nome));
}

// Cria uma nova unidade. Antes de salvar, verifica se o código já existe.
// Isso evita duplicidade e mantém a rede organizada.
function createUnidade(novaUnidade) {
  const state = readDatabase();
  const codigo = String(novaUnidade.codigo || "").trim().toUpperCase();
  const unidadeExistente = state.unidades.some((unidade) => unidade.codigo === codigo);

  if (unidadeExistente) {
    const erro = new Error("Já existe uma unidade com esse código.");
    erro.code = "UNIQUE_CONSTRAINT";
    throw erro;
  }

  const unidade = {
    id: state.nextId,
    codigo,
    nome: String(novaUnidade.nome || "").trim(),
    cidade: String(novaUnidade.cidade || "").trim(),
    estado: String(novaUnidade.estado || "").trim().toUpperCase(),
    ativa: 1,
    criada_em: new Date().toISOString()
  };

  state.unidades.push(unidade);
  state.nextId += 1;
  writeDatabase(state);

  return unidade;
}

function resetDatabase() {
  writeDatabase({ ...defaultDbState });
}

export { createUnidade, listUnidades, resetDatabase };
export default { createUnidade, listUnidades, resetDatabase };
