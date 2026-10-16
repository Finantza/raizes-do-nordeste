window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
window.__APP_CONFIG__.apiBaseUrl = window.__APP_CONFIG__.apiBaseUrl ||
  (window.location.origin === "null"
    ? "http://localhost:3000/api"
    : `${window.location.origin}/api`);
