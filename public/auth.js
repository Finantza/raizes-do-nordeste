// auth.js — Utilitários de autenticação compartilhados entre todas as páginas.
// Centralizar aqui elimina a duplicação que existia em admin.js, cliente.js e operacional.js.
const AUTH_CURRENT_USER_KEY = "raizes-storefront-current-user";
const AUTH_USERS_KEY = "raizes-storefront-users";

const defaultUsers = [
  { name: "Cliente Demo", email: "cliente@raizes.com", password: "123456", role: "cliente" },
  { name: "Administrador", email: "admin@raizes.com", password: "admin123", role: "admin" },
  { name: "Loja Norte", email: "loja@raizes.com", password: "loja123", role: "loja" }
];

const dashboardPaths = {
  cliente: "./cliente.html",
  admin: "./admin.html",
  loja: "./operacional.html"
};

// Retorna a lista de usuários da memória do navegador.
// Se não houver dados, inicializa com os usuários de demonstração.
function readUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    const users = Array.isArray(data) && data.length ? data : [...defaultUsers];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
    return users;
  } catch {
    return [...defaultUsers];
  }
}

// Retorna o usuário atualmente autenticado, ou null se nenhum estiver logado.
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_CURRENT_USER_KEY);
    const parsed = JSON.parse(raw || "null");
    return parsed && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

// Persiste o usuário autenticado na memória do navegador.
function setCurrentUser(user) {
  localStorage.setItem(AUTH_CURRENT_USER_KEY, JSON.stringify(user));
}

// Encerra a sessão do usuário atual.
function clearCurrentUser() {
  localStorage.removeItem(AUTH_CURRENT_USER_KEY);
}

function getDashboardPath(role) {
  return dashboardPaths[role] || null;
}

function setupSharedSession() {
  const requiredRole = document.body.dataset.requiredRole;
  const user = getCurrentUser();
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !user || user.role !== "admin";
  });

  if (requiredRole && (!user || user.role !== requiredRole)) {
    document.body.hidden = true;
    window.location.replace(user ? (getDashboardPath(user.role) || "./login.html") : "./login.html");
    return;
  }

  const controls = document.querySelector("#shared-session-controls");
  if (!controls) return;

  if (!user) {
    const loginLink = document.createElement("a");
    loginLink.className = "btn btn-outline-light btn-sm";
    loginLink.href = "./login.html";
    loginLink.textContent = "Entrar";
    controls.append(loginLink);
    return;
  }

  const profileLink = document.createElement("a");
  profileLink.className = "btn btn-outline-light btn-sm";
  profileLink.href = getDashboardPath(user.role) || "./login.html";
  profileLink.textContent = `${user.name} (${user.role})`;

  const logoutButton = document.createElement("button");
  logoutButton.className = "btn btn-outline-light btn-sm";
  logoutButton.type = "button";
  logoutButton.textContent = "Sair";
  logoutButton.addEventListener("click", () => {
    clearCurrentUser();
    window.location.assign("./login.html");
  });

  controls.append(profileLink, logoutButton);
}

setupSharedSession();
