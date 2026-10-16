import app from "./app.js";

// Este arquivo inicia o servidor da aplicação.
// Ele pega a porta que o ambiente informou ou usa 3000 por padrão.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor disponível em http://localhost:${PORT}`);
});
