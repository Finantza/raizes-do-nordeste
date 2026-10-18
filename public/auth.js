const AUTH_USERS_KEY = "raizes-storefront-users";
const dashboardPaths = {
  cliente: "./cliente.html",
  admin: "./admin.html",
  loja: "./operacional.html"
};
let currentUser = null;

window.raizesApiRequest = async (endpoint, options = {}) => {
  const baseUrl = window.__APP_CONFIG__?.apiBaseUrl || `${window.location.origin}/api`;
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.erro || `A solicitação falhou (HTTP ${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
};

function getCurrentUser() {
  return currentUser;
}

function getDashboardPath(role) {
  return dashboardPaths[role] || null;
}

async function migrateLocalUsers() {
  const raw = localStorage.getItem(AUTH_USERS_KEY);
  if (!raw) return;

  let users;
  try {
    const parsed = JSON.parse(raw);
    users = Array.isArray(parsed)
      ? parsed.filter((user) => user && typeof user.name === "string" && typeof user.email === "string" && typeof user.password === "string")
      : [];
  } catch (error) {
    console.error("Não foi possível ler as contas locais para migração.", error);
    return;
  }

  try {
    await window.raizesApiRequest("/auth/migrate-local-users", {
      method: "POST",
      body: JSON.stringify({ users })
    });
    localStorage.removeItem(AUTH_USERS_KEY);
  } catch (error) {
    console.error("A migração das contas locais não foi concluída; os dados locais foram mantidos.", error);
    const feedback = document.querySelector("#login-feedback");
    if (feedback) {
      feedback.textContent = "Não foi possível migrar as contas antigas. Os dados foram mantidos; verifique a conexão com o servidor e recarregue a página.";
      feedback.className = "feedback small text-warning";
    }
  }
}

function setupSharedSession() {
  const requiredRole = document.body.dataset.requiredRole;
  const controls = document.querySelector("#shared-session-controls");

  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !currentUser || currentUser.role !== "admin";
  });
  document.querySelectorAll("[data-loja-only]").forEach((element) => {
    element.hidden = !currentUser || currentUser.role !== "loja";
  });
  document.querySelectorAll("[data-staff-only]").forEach((element) => {
    element.hidden = !currentUser || !["admin", "loja"].includes(currentUser.role);
  });
  document.querySelectorAll("[data-cliente-only]").forEach((element) => {
    element.hidden = !currentUser || currentUser.role !== "cliente";
  });

  if (requiredRole) {
    const allowedRoles = requiredRole.split(",").map((r) => r.trim()).filter(Boolean);
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      document.body.hidden = false;
      window.location.replace(currentUser ? (getDashboardPath(currentUser.role) || "./login.html") : "./login.html");
      return;
    }
  }
  document.body.hidden = false;
  if (!controls) return;

  controls.replaceChildren();
  if (!currentUser) {
    const loginLink = document.createElement("a");
    loginLink.className = "btn btn-outline-light btn-sm";
    loginLink.href = "./login.html";
    loginLink.textContent = "Entrar";
    controls.append(loginLink);
    return;
  }

  const profileLink = document.createElement("a");
  profileLink.className = "btn btn-outline-light btn-sm";
  profileLink.href = getDashboardPath(currentUser.role) || "./login.html";
  profileLink.textContent = `${currentUser.name} (${currentUser.role})`;

  const logoutButton = document.createElement("button");
  logoutButton.className = "btn btn-outline-light btn-sm";
  logoutButton.type = "button";
  logoutButton.textContent = "Sair";
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    try {
      await window.raizesApiRequest("/auth/logout", { method: "POST" });
      window.location.assign("./login.html");
    } catch (error) {
      logoutButton.disabled = false;
      logoutButton.textContent = error.message || "Falha ao sair";
    }
  });
  controls.append(profileLink, logoutButton);
}

window.raizesAuthReady = (async () => {
  const requiredRole = document.body.dataset.requiredRole;
  if (requiredRole) document.body.hidden = true;
  await migrateLocalUsers();

  try {
    const response = await window.raizesApiRequest("/auth/me");
    currentUser = response.user;
  } catch (error) {
    if (error.status !== 401) console.error("Não foi possível consultar a sessão no servidor.", error);
  }

  localStorage.removeItem("raizes-storefront-current-user");
  setupSharedSession();
  return currentUser;
})();
