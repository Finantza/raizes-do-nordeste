const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const registerToggle = document.querySelector("#toggle-register");
const feedback = document.querySelector("#login-feedback");

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback small ${type}`;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  try {
    const { user } = await window.raizesApiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const dashboard = getDashboardPath(user.role);
    if (!dashboard) {
      showFeedback("Este perfil não possui uma área configurada.", "text-danger");
      return;
    }
    window.location.assign(dashboard);
  } catch (error) {
    showFeedback(error.status === 429
      ? "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente."
      : error.message || "E-mail ou senha inválidos.", "text-danger");
  }
});

registerToggle.addEventListener("click", () => {
  registerForm.hidden = !registerForm.hidden;
  registerToggle.textContent = registerForm.hidden ? "Criar conta de cliente" : "Cancelar cadastro";
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    await window.raizesApiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    registerForm.reset();
    registerForm.hidden = true;
    registerToggle.textContent = "Criar conta de cliente";
    showFeedback("Conta criada. Entre com seu e-mail e senha.", "text-success");
  } catch (error) {
    showFeedback(error.message || "Não foi possível criar a conta.", error.status === 409 ? "text-warning" : "text-danger");
  }
});

window.raizesAuthReady.then((user) => {
  if (user) window.location.replace(getDashboardPath(user.role) || "./cliente.html");
});
