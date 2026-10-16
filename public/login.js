const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const registerToggle = document.querySelector("#toggle-register");
const feedback = document.querySelector("#login-feedback");

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback small ${type}`;
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = readUsers().find((item) =>
    item.email.toLowerCase() === email && item.password === password
  );

  if (!user) {
    showFeedback("E-mail ou senha inválidos.", "text-danger");
    return;
  }

  const dashboard = getDashboardPath(user.role);
  if (!dashboard) {
    showFeedback("Este perfil não possui uma área configurada.", "text-danger");
    return;
  }

  setCurrentUser({ name: user.name, email: user.email, role: user.role });
  window.location.assign(dashboard);
});

registerToggle.addEventListener("click", () => {
  registerForm.hidden = !registerForm.hidden;
  registerToggle.textContent = registerForm.hidden ? "Criar conta de cliente" : "Cancelar cadastro";
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const users = readUsers();

  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    showFeedback("Este e-mail já está cadastrado.", "text-warning");
    return;
  }

  users.push({ name, email, password, role: "cliente" });
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  registerForm.reset();
  registerForm.hidden = true;
  registerToggle.textContent = "Criar conta de cliente";
  showFeedback("Conta criada. Entre com seu e-mail e senha.", "text-success");
});
