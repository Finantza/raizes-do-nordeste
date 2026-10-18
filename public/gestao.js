// gestao.js — Módulos de Controle de Estoque, Contas a Pagar e Receber, e Cadastro de Produtos.
// Disponível exclusivamente para perfis autenticados de Loja e Administração.

(function () {
  const formatMoney = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(val || 0));

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const parts = isoStr.split("T")[0].split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return isNaN(d) ? isoStr : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };

  const escapeHtml = (str) => {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // ─────────────────────────────────────────────────────────────
  // SISTEMA DE ABAS (TABS)
  // ─────────────────────────────────────────────────────────────
  function setupTabs() {
    const tabButtons = document.querySelectorAll(".module-nav-btn[data-target-tab]");
    const tabSections = document.querySelectorAll(".management-section");

    if (!tabButtons.length) return;

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.targetTab;
        tabButtons.forEach((b) => b.classList.remove("is-active"));
        tabSections.forEach((s) => s.classList.remove("is-active"));

        btn.classList.add("is-active");
        const targetSec = document.getElementById(targetId);
        if (targetSec) targetSec.classList.add("is-active");

        // Dispara recarregamento do módulo correspondente
        if (targetId === "tab-estoque") window.carregarModuloEstoque?.();
        if (targetId === "tab-financeiro") window.carregarModuloFinanceiro?.();
        if (targetId === "tab-produtos") window.carregarModuloProdutos?.();
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // MÓDULO 1: CONTROLE DE ESTOQUE
  // ─────────────────────────────────────────────────────────────
  let stockData = null;
  let stockMovements = [];
  let stockFilter = "todos";
  let stockSearch = "";

  async function carregarModuloEstoque() {
    const container = document.getElementById("estoque-module-content");
    if (!container) return;

    try {
      const [resumo, movimentacoes] = await Promise.all([
        window.raizesApiRequest("/estoque/resumo"),
        window.raizesApiRequest("/estoque/movimentacoes?limit=50")
      ]);
      stockData = resumo;
      stockMovements = movimentacoes;
      renderEstoqueUI();
    } catch (error) {
      container.innerHTML = `<div class="card p-4 text-center text-danger">
        <p><strong>Não foi possível carregar os dados de estoque.</strong></p>
        <p class="small text-muted">${escapeHtml(error.message)}</p>
      </div>`;
    }
  }

  function renderEstoqueUI() {
    const container = document.getElementById("estoque-module-content");
    if (!container || !stockData) return;

    let filteredProducts = (stockData.products || []).filter((p) => {
      const matchSearch = !stockSearch ||
        p.nome.toLowerCase().includes(stockSearch.toLowerCase()) ||
        p.categoria.toLowerCase().includes(stockSearch.toLowerCase());
      if (!matchSearch) return false;

      const estoque = Number(p.estoque || 0);
      if (stockFilter === "critico") return estoque <= 5;
      if (stockFilter === "atencao") return estoque > 5 && estoque <= 10;
      if (stockFilter === "normal") return estoque > 10;
      return true;
    });

    container.innerHTML = `
      <!-- Métricas do Estoque -->
      <div class="stats-grid-4">
        <div class="stat-box stat-info">
          <span class="stat-label">Total de Itens</span>
          <span class="stat-value">${stockData.totalItens}</span>
          <span class="stat-sub">${stockData.totalProdutos} produtos cadastrados</span>
        </div>
        <div class="stat-box stat-amber">
          <span class="stat-label">Valor do Inventário</span>
          <span class="stat-value">${formatMoney(stockData.valorTotal)}</span>
          <span class="stat-sub">Avaliação a preço de venda</span>
        </div>
        <div class="stat-box stat-danger">
          <span class="stat-label">Estoque Crítico (≤ 5)</span>
          <span class="stat-value">${stockData.totalCriticos}</span>
          <span class="stat-sub">Itens necessitando reposição urgente</span>
        </div>
        <div class="stat-box stat-amber">
          <span class="stat-label">Atenção (6 a 10)</span>
          <span class="stat-value">${stockData.totalAtencao}</span>
          <span class="stat-sub">Itens em monitoramento</span>
        </div>
      </div>

      <div class="row g-4">
        <!-- Tabela de Produtos e Níveis de Estoque -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 class="h5 mb-0">Níveis de Estoque por Produto</h2>
                <button type="button" class="btn btn-sm btn-outline-success" id="btn-refresh-stock">Atualizar</button>
              </div>

              <!-- Filtros e Busca -->
              <div class="filter-bar">
                <input type="text" id="input-search-stock" class="form-control catalog-search-input" placeholder="Buscar produto..." title="Buscar produto no estoque" value="${escapeHtml(stockSearch)}">
                <button type="button" class="filter-pill-btn ${stockFilter === "todos" ? "is-active" : ""}" data-filter-stock="todos">Todos (${stockData.totalProdutos})</button>
                <button type="button" class="filter-pill-btn ${stockFilter === "critico" ? "is-active" : ""}" data-filter-stock="critico">Críticos (${stockData.totalCriticos})</button>
                <button type="button" class="filter-pill-btn ${stockFilter === "atencao" ? "is-active" : ""}" data-filter-stock="atencao">Atenção (${stockData.totalAtencao})</button>
                <button type="button" class="filter-pill-btn ${stockFilter === "normal" ? "is-active" : ""}" data-filter-stock="normal">Normais (${stockData.totalNormais})</button>
              </div>

              <div class="table-responsive stock-table-wrap">
                <table class="table align-middle mb-0">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Estoque</th>
                      <th>Status</th>
                      <th>Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      filteredProducts.length === 0
                        ? `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum produto encontrado no filtro.</td></tr>`
                        : filteredProducts.map((p) => {
                            const estoque = Number(p.estoque || 0);
                            const status = estoque <= 5 ? "Crítico" : estoque <= 10 ? "Atenção" : "OK";
                            const statusClass = estoque <= 5 ? "critico" : estoque <= 10 ? "atencao" : "ok";
                            return `
                              <tr>
                                <td><strong>${escapeHtml(p.nome)}</strong></td>
                                <td><span class="text-muted small">${escapeHtml(p.categoria)}</span></td>
                                <td><strong>${estoque}</strong> un.</td>
                                <td><span class="stock-status-tag stock-status-${statusClass}">${status}</span></td>
                                <td>
                                  <div class="d-flex gap-1">
                                    <button type="button" class="table-action-btn btn-stock-quick" data-product-id="${p.id}" data-action-type="entrada" title="Registrar Entrada">+ Entrada</button>
                                    <button type="button" class="table-action-btn btn-stock-quick" data-product-id="${p.id}" data-action-type="saida" title="Registrar Saída">- Saída</button>
                                  </div>
                                </td>
                              </tr>
                            `;
                          }).join("")
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulário de Movimentação de Estoque -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body p-4">
              <h2 class="h5 mb-3">Registrar Movimentação</h2>
              <form id="form-stock-movement" class="row g-3">
                <div class="col-12">
                  <label class="form-label" for="stock-select-product">Produto</label>
                  <select class="form-control" name="productId" id="stock-select-product" title="Selecione o produto para movimentação" required>
                    <option value="">Selecione o produto</option>
                    ${(stockData.products || []).map((p) => `<option value="${p.id}">${escapeHtml(p.nome)} (Atual: ${p.estoque} un.)</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="stock-select-tipo">Tipo de Movimentação</label>
                  <select class="form-control" name="tipo" id="stock-select-tipo" title="Tipo de Movimentação" required>
                    <option value="entrada">Entrada (+)</option>
                    <option value="saida">Saída (-)</option>
                    <option value="ajuste">Ajuste de Balanço (=)</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="stock-input-quantidade">Quantidade</label>
                  <input type="number" class="form-control" name="quantidade" id="stock-input-quantidade" min="1" step="1" required placeholder="Ex: 10" title="Quantidade">
                </div>
                <div class="col-12">
                  <label class="form-label" for="stock-input-motivo">Motivo / Justificativa</label>
                  <select class="form-control mb-2" id="stock-quick-reason" title="Motivos comuns de movimentação">
                    <option value="">Selecione um motivo comum ou digite abaixo</option>
                    <option value="Reabastecimento semanal de fornecedor">Reabastecimento de fornecedor</option>
                    <option value="Ajuste de conferência / inventário">Ajuste de inventário</option>
                    <option value="Descarte por validade / avaria">Descarte por validade / avaria</option>
                    <option value="Transferência entre lojas">Transferência entre lojas</option>
                    <option value="Consumo interno na cozinha">Consumo interno</option>
                  </select>
                  <input type="text" class="form-control" name="motivo" id="stock-input-motivo" required placeholder="Informe o motivo da movimentação" title="Informe o motivo da movimentação">
                </div>
                <div class="col-12">
                  <button type="submit" class="btn btn-primary w-100" id="btn-submit-stock">Confirmar Movimentação</button>
                </div>
              </form>
              <div id="stock-feedback" class="small mt-2" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Histórico Recente de Movimentações -->
      <div class="card border-0 shadow-sm mt-4">
        <div class="card-body p-4">
          <h2 class="h5 mb-3">Histórico de Movimentações Recentes</h2>
          <div class="table-responsive movements-table-wrap">
            <table class="table align-middle mb-0">
              <thead class="table-light sticky-top">
                <tr>
                  <th>Data/Hora</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Qtd</th>
                  <th>Estoque Anterior → Novo</th>
                  <th>Motivo</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                ${
                  stockMovements.length === 0
                    ? `<tr><td colspan="7" class="text-center text-muted py-4">Nenhuma movimentação registrada.</td></tr>`
                    : stockMovements.map((m) => {
                        const isEntrada = m.tipo === "entrada";
                        const isSaida = m.tipo === "saida";
                        const tipoText = isEntrada ? "+ Entrada" : isSaida ? "- Saída" : "= Ajuste";
                        const tipoClass = isEntrada ? "movement-in" : isSaida ? "movement-out" : "movement-adj";
                        return `
                          <tr>
                            <td><small class="text-muted">${formatDateTime(m.criado_em)}</small></td>
                            <td><strong>${escapeHtml(m.produto_nome || "Produto")}</strong></td>
                            <td><span class="${tipoClass}">${tipoText}</span></td>
                            <td><strong>${m.quantidade}</strong> un.</td>
                            <td>${m.estoque_anterior} → <strong>${m.estoque_novo}</strong></td>
                            <td><span class="small">${escapeHtml(m.motivo)}</span></td>
                            <td><span class="badge bg-light text-dark">${escapeHtml(m.usuario_nome)}</span></td>
                          </tr>
                        `;
                      }).join("")
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Eventos do módulo de estoque
    document.getElementById("btn-refresh-stock")?.addEventListener("click", carregarModuloEstoque);

    document.getElementById("input-search-stock")?.addEventListener("input", (e) => {
      stockSearch = e.target.value;
      renderEstoqueUI();
    });

    document.querySelectorAll("[data-filter-stock]").forEach((btn) => {
      btn.addEventListener("click", () => {
        stockFilter = btn.dataset.filterStock;
        renderEstoqueUI();
      });
    });

    // Ações rápidas na tabela
    document.querySelectorAll(".btn-stock-quick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pId = btn.dataset.productId;
        const aType = btn.dataset.actionType;
        const selectProd = document.getElementById("stock-select-product");
        const selectTipo = document.getElementById("stock-select-tipo");
        if (selectProd) selectProd.value = pId;
        if (selectTipo) selectTipo.value = aType;
        document.getElementById("form-stock-movement")?.scrollIntoView({ behavior: "smooth" });
      });
    });

    const quickReason = document.getElementById("stock-quick-reason");
    const inputMotivo = document.getElementById("stock-input-motivo");
    quickReason?.addEventListener("change", () => {
      if (quickReason.value) inputMotivo.value = quickReason.value;
    });

    // Submissão da movimentação
    const formMovement = document.getElementById("form-stock-movement");
    formMovement?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedback = document.getElementById("stock-feedback");
      const submitBtn = document.getElementById("btn-submit-stock");
      const formData = new FormData(formMovement);

      const payload = {
        productId: Number(formData.get("productId")),
        tipo: String(formData.get("tipo") || ""),
        quantidade: Number(formData.get("quantidade")),
        motivo: String(formData.get("motivo") || "").trim()
      };

      if (!payload.productId || !payload.tipo || !payload.quantidade || payload.quantidade <= 0) {
        if (feedback) {
          feedback.textContent = "Preencha todos os campos com valores válidos.";
          feedback.className = "small mt-2 text-danger";
        }
        return;
      }

      submitBtn.disabled = true;
      try {
        await window.raizesApiRequest("/estoque/movimentacao", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (window.reloadRaizesProducts) await window.reloadRaizesProducts();
        if (feedback) {
          feedback.textContent = "Movimentação registrada com sucesso!";
          feedback.className = "small mt-2 text-success";
        }
        await carregarModuloEstoque();
      } catch (error) {
        if (feedback) {
          feedback.textContent = error.message || "Erro ao registrar movimentação.";
          feedback.className = "small mt-2 text-danger";
        }
        submitBtn.disabled = false;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // MÓDULO 2: CONTAS A PAGAR E RECEBER (FINANCEIRO)
  // ─────────────────────────────────────────────────────────────
  let financeiroResumo = null;
  let financeiroLancamentos = [];
  let finFilterTipo = "todos"; // todos, pagar, receber
  let finFilterStatus = "todos"; // todos, pendente, pago
  let finSearch = "";

  async function carregarModuloFinanceiro() {
    const container = document.getElementById("financeiro-module-content");
    if (!container) return;

    try {
      const [resumo, lancamentos] = await Promise.all([
        window.raizesApiRequest("/financeiro/resumo"),
        window.raizesApiRequest("/financeiro?limit=150")
      ]);
      financeiroResumo = resumo;
      financeiroLancamentos = lancamentos;
      renderFinanceiroUI();
    } catch (error) {
      container.innerHTML = `<div class="card p-4 text-center text-danger">
        <p><strong>Não foi possível carregar os dados financeiros.</strong></p>
        <p class="small text-muted">${escapeHtml(error.message)}</p>
      </div>`;
    }
  }

  function renderFinanceiroUI() {
    const container = document.getElementById("financeiro-module-content");
    if (!container || !financeiroResumo) return;

    const filtered = (financeiroLancamentos || []).filter((item) => {
      if (finFilterTipo !== "todos" && item.tipo !== finFilterTipo) return false;
      if (finFilterStatus !== "todos" && item.status !== finFilterStatus) return false;
      if (finSearch) {
        const s = finSearch.toLowerCase();
        const match = item.titulo.toLowerCase().includes(s) ||
          item.categoria.toLowerCase().includes(s) ||
          (item.observacoes || "").toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });

    const hoje = new Date().toISOString().slice(0, 10);

    container.innerHTML = `
      <!-- Métricas Financeiras -->
      <div class="stats-grid-4">
        <div class="stat-box stat-danger">
          <span class="stat-label">Contas a Pagar</span>
          <span class="stat-value">${formatMoney(financeiroResumo.totalPagarPendente)}</span>
          <span class="stat-sub">Pago: ${formatMoney(financeiroResumo.totalPagarPago)}</span>
        </div>
        <div class="stat-box stat-success">
          <span class="stat-label">Contas a Receber</span>
          <span class="stat-value">${formatMoney(financeiroResumo.totalReceberPendente)}</span>
          <span class="stat-sub">Recebido: ${formatMoney(financeiroResumo.totalReceberPago)}</span>
        </div>
        <div class="stat-box ${financeiroResumo.saldoProjetado >= 0 ? "stat-success" : "stat-danger"}">
          <span class="stat-label">Saldo Projetado</span>
          <span class="stat-value">${formatMoney(financeiroResumo.saldoProjetado)}</span>
          <span class="stat-sub">Realizado atual: ${formatMoney(financeiroResumo.saldoRealizado)}</span>
        </div>
        <div class="stat-box ${financeiroResumo.vencidosCount > 0 ? "stat-amber" : "stat-info"}">
          <span class="stat-label">Títulos Vencidos</span>
          <span class="stat-value">${financeiroResumo.vencidosCount}</span>
          <span class="stat-sub">${financeiroResumo.totalLancamentos} lançamentos no total</span>
        </div>
      </div>

      <div class="row g-4">
        <!-- Tabela de Lançamentos -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 class="h5 mb-0">Contas a Pagar e Receber</h2>
                <button type="button" class="btn btn-sm btn-outline-success" id="btn-refresh-fin">Atualizar</button>
              </div>

              <!-- Filtros -->
              <div class="filter-bar">
                <input type="text" id="input-search-fin" class="form-control catalog-search-input" placeholder="Filtrar por título..." title="Filtrar lançamentos por título" value="${escapeHtml(finSearch)}">
                
                <div class="d-inline-flex gap-1">
                  <button type="button" class="filter-pill-btn ${finFilterTipo === "todos" ? "is-active" : ""}" data-filter-tipo="todos">Todos os Tipos</button>
                  <button type="button" class="filter-pill-btn ${finFilterTipo === "pagar" ? "is-active" : ""}" data-filter-tipo="pagar">A Pagar</button>
                  <button type="button" class="filter-pill-btn ${finFilterTipo === "receber" ? "is-active" : ""}" data-filter-tipo="receber">A Receber</button>
                </div>

                <div class="d-inline-flex gap-1">
                  <button type="button" class="filter-pill-btn ${finFilterStatus === "todos" ? "is-active" : ""}" data-filter-status="todos">Todos os Status</button>
                  <button type="button" class="filter-pill-btn ${finFilterStatus === "pendente" ? "is-active" : ""}" data-filter-status="pendente">Pendentes</button>
                  <button type="button" class="filter-pill-btn ${finFilterStatus === "pago" ? "is-active" : ""}" data-filter-status="pago">Quitados</button>
                </div>
              </div>

              <div class="table-responsive finance-table-wrap">
                <table class="table align-middle mb-0">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição / Categoria</th>
                      <th>Valor</th>
                      <th>Vencimento</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      filtered.length === 0
                        ? `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum lançamento corresponde aos filtros.</td></tr>`
                        : filtered.map((item) => {
                            const isPagar = item.tipo === "pagar";
                            const isPago = item.status === "pago";
                            const isVencido = !isPago && item.data_vencimento < hoje;
                            const typeBadge = isPagar
                              ? `<span class="finance-type-badge finance-type-pagar">A Pagar</span>`
                              : `<span class="finance-type-badge finance-type-receber">A Receber</span>`;
                            const statusBadge = isPago
                              ? `<span class="pill pill-success">Pago</span>`
                              : isVencido
                              ? `<span class="pill pill-danger">Vencido</span>`
                              : `<span class="pill pill-warning">Pendente</span>`;

                            return `
                              <tr>
                                <td>${typeBadge}</td>
                                <td>
                                  <strong>${escapeHtml(item.titulo)}</strong>
                                  <div class="small text-muted">${escapeHtml(item.categoria)} • ${escapeHtml(item.forma_pagamento || "Pix")}</div>
                                </td>
                                <td><strong class="${isPagar ? "text-danger" : "text-success"}">${formatMoney(item.valor)}</strong></td>
                                <td>
                                  <div>${formatDate(item.data_vencimento)}</div>
                                  ${isPago && item.data_pagamento ? `<small class="text-muted">Pago em ${formatDate(item.data_pagamento)}</small>` : ""}
                                </td>
                                <td>${statusBadge}</td>
                                <td>
                                  <div class="d-flex gap-1">
                                    <button type="button" class="table-action-btn ${isPago ? "" : "btn-pay"} btn-toggle-fin" data-id="${item.id}" data-current-status="${item.status}">
                                      ${isPago ? "Desfazer" : (isPagar ? "Dar Baixa" : "Receber")}
                                    </button>
                                    <button type="button" class="table-action-btn btn-del btn-del-fin" data-id="${item.id}" title="Excluir lançamento">✕</button>
                                  </div>
                                </td>
                              </tr>
                            `;
                          }).join("")
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulário de Novo Lançamento -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body p-4">
              <h2 class="h5 mb-3">Novo Lançamento Financeiro</h2>
              <form id="form-financeiro-create" class="row g-3">
                <div class="col-12">
                  <label class="form-label" for="fin-select-tipo">Tipo de Conta</label>
                  <select class="form-control" name="tipo" id="fin-select-tipo" title="Tipo de Conta" required>
                    <option value="pagar">Conta a Pagar (Despesa)</option>
                    <option value="receber">Conta a Receber (Receita)</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label" for="fin-input-titulo">Descrição / Título</label>
                  <input type="text" class="form-control" name="titulo" id="fin-input-titulo" maxlength="150" required placeholder="Ex: Fornecedor de Carnes do Sertão" title="Descrição ou título do lançamento">
                </div>
                <div class="col-12">
                  <label class="form-label" for="fin-select-categoria">Categoria</label>
                  <select class="form-control" name="categoria" id="fin-select-categoria" title="Categoria do lançamento" required>
                    <option value="Ingredientes">Ingredientes & Alimentos</option>
                    <option value="Fornecedores">Fornecedores</option>
                    <option value="Despesas Fixas">Despesas Fixas (Energia, Água, Aluguel)</option>
                    <option value="Insumos">Insumos & Embalagens</option>
                    <option value="Vendas">Vendas & Faturamento</option>
                    <option value="Delivery">Repasses Delivery</option>
                    <option value="Eventos">Eventos & Encomendas</option>
                    <option value="Salários">Equipe & Salários</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="fin-input-valor">Valor (R$)</label>
                  <input type="number" class="form-control" name="valor" id="fin-input-valor" min="0.01" step="0.01" required placeholder="0,00" title="Valor do lançamento">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="fin-input-vencimento">Vencimento</label>
                  <input type="date" class="form-control" name="dataVencimento" id="fin-input-vencimento" required value="${hoje}" title="Data de Vencimento">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="fin-select-forma">Forma de Pagamento</label>
                  <select class="form-control" name="formaPagamento" id="fin-select-forma" title="Forma de Pagamento">
                    <option value="Pix">Pix</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência Bancária</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="fin-select-status">Status Inicial</label>
                  <select class="form-control" name="status" id="fin-select-status" title="Status Inicial">
                    <option value="pendente">Pendente</option>
                    <option value="pago">Quitado / Pago</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label" for="fin-input-observacoes">Observações (opcional)</label>
                  <input type="text" class="form-control" name="observacoes" id="fin-input-observacoes" maxlength="255" placeholder="Detalhes, número de nota fiscal..." title="Observações">
                </div>
                <div class="col-12">
                  <button type="submit" class="btn btn-primary w-100" id="btn-submit-fin">Salvar Lançamento</button>
                </div>
              </form>
              <div id="fin-feedback" class="small mt-2" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos do módulo financeiro
    document.getElementById("btn-refresh-fin")?.addEventListener("click", carregarModuloFinanceiro);

    document.getElementById("input-search-fin")?.addEventListener("input", (e) => {
      finSearch = e.target.value;
      renderFinanceiroUI();
    });

    document.querySelectorAll("[data-filter-tipo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        finFilterTipo = btn.dataset.filterTipo;
        renderFinanceiroUI();
      });
    });

    document.querySelectorAll("[data-filter-status]").forEach((btn) => {
      btn.addEventListener("click", () => {
        finFilterStatus = btn.dataset.filterStatus;
        renderFinanceiroUI();
      });
    });

    // Alternar status (Baixa / Desfazer)
    document.querySelectorAll(".btn-toggle-fin").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const current = btn.dataset.currentStatus;
        const newStatus = current === "pago" ? "pendente" : "pago";
        btn.disabled = true;
        try {
          await window.raizesApiRequest(`/financeiro/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
          });
          await carregarModuloFinanceiro();
        } catch (error) {
          alert(error.message || "Não foi possível atualizar o status.");
          btn.disabled = false;
        }
      });
    });

    // Excluir lançamento
    document.querySelectorAll(".btn-del-fin").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Deseja realmente remover este lançamento financeiro?")) return;
        const id = btn.dataset.id;
        btn.disabled = true;
        try {
          await window.raizesApiRequest(`/financeiro/${id}`, { method: "DELETE" });
          await carregarModuloFinanceiro();
        } catch (error) {
          alert(error.message || "Não foi possível excluir o lançamento.");
          btn.disabled = false;
        }
      });
    });

    // Submissão do lançamento
    const formFin = document.getElementById("form-financeiro-create");
    formFin?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const feedback = document.getElementById("fin-feedback");
      const submitBtn = document.getElementById("btn-submit-fin");
      const formData = new FormData(formFin);

      const payload = {
        tipo: String(formData.get("tipo") || ""),
        titulo: String(formData.get("titulo") || "").trim(),
        categoria: String(formData.get("categoria") || "").trim(),
        valor: Number(formData.get("valor")),
        dataVencimento: String(formData.get("dataVencimento") || ""),
        formaPagamento: String(formData.get("formaPagamento") || "Pix"),
        status: String(formData.get("status") || "pendente"),
        observacoes: String(formData.get("observacoes") || "").trim()
      };

      if (!payload.titulo || !payload.valor || payload.valor <= 0 || !payload.dataVencimento) {
        if (feedback) {
          feedback.textContent = "Preencha todos os campos obrigatórios corretamente.";
          feedback.className = "small mt-2 text-danger";
        }
        return;
      }

      submitBtn.disabled = true;
      try {
        await window.raizesApiRequest("/financeiro", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (feedback) {
          feedback.textContent = "Lançamento adicionado com sucesso!";
          feedback.className = "small mt-2 text-success";
        }
        formFin.reset();
        await carregarModuloFinanceiro();
      } catch (error) {
        if (feedback) {
          feedback.textContent = error.message || "Erro ao salvar lançamento financeiro.";
          feedback.className = "small mt-2 text-danger";
        }
        submitBtn.disabled = false;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // MÓDULO 3: CADASTRO E GERENCIAMENTO DE PRODUTOS
  // ─────────────────────────────────────────────────────────────
  let productCatalogSearch = "";
  let productCatalogCategory = "todas";

  function renderProdutosCatalogUI() {
    const listBody = document.getElementById("catalog-products-body");
    if (!listBody || !window.raizesProducts) return;

    const filtered = window.raizesProducts.filter((p) => {
      if (productCatalogCategory !== "todas" && p.categoria !== productCatalogCategory) return false;
      if (productCatalogSearch) {
        const s = productCatalogSearch.toLowerCase();
        if (!p.nome.toLowerCase().includes(s) && !(p.descricao || "").toLowerCase().includes(s)) return false;
      }
      return true;
    });

    listBody.innerHTML = filtered.length === 0
      ? `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum produto encontrado.</td></tr>`
      : filtered.map((p) => {
          const imgSrc = window.getRaizesProductImage ? window.getRaizesProductImage(p) : (p.imagem || "");
          const fallback = window.getRaizesProductFallbackImage ? window.getRaizesProductFallbackImage(p) : "";
          return `
            <tr>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <img src="${imgSrc}" data-product-fallback="${fallback}" alt="" class="product-thumb-small">
                  <strong>${escapeHtml(p.nome)}</strong>
                </div>
              </td>
              <td><span class="badge bg-light text-dark">${escapeHtml(p.categoria)}</span></td>
              <td>${formatMoney(p.preco)}</td>
              <td><strong>${p.estoque}</strong> un.</td>
              <td>
                <label class="table-action-btn table-action-file-label">
                  Alterar foto
                  <input type="file" class="product-change-photo-input" data-id="${p.id}" accept="image/jpeg,image/png,image/webp" hidden>
                </label>
              </td>
              <td>
                <button type="button" class="table-action-btn btn-del btn-del-product" data-id="${p.id}" title="Excluir produto">✕</button>
              </td>
            </tr>
          `;
        }).join("");

    if (window.bindRaizesProductImageFallbacks) {
      window.bindRaizesProductImageFallbacks(listBody);
    }

    // Exclusão de produto
    document.querySelectorAll(".btn-del-product").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Deseja realmente remover este produto do catálogo?")) return;
        const id = btn.dataset.id;
        btn.disabled = true;
        try {
          await window.raizesApiRequest(`/products/${id}`, { method: "DELETE" });
          if (window.reloadRaizesProducts) await window.reloadRaizesProducts();
          renderProdutosCatalogUI();
          if (window.carregarModuloEstoque) await window.carregarModuloEstoque();
        } catch (error) {
          alert(error.message || "Não foi possível remover o produto.");
          btn.disabled = false;
        }
      });
    });

    // Alteração de foto
    document.querySelectorAll(".product-change-photo-input").forEach((input) => {
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;
        const id = input.dataset.id;
        const prod = window.raizesProducts.find((item) => String(item.id) === id);
        if (!prod) return;

        try {
          const imagem = await window.prepareRaizesProductImage(file);
          await window.raizesApiRequest(`/products/${id}`, {
            method: "PUT",
            body: JSON.stringify({ ...prod, imagem })
          });
          if (window.reloadRaizesProducts) await window.reloadRaizesProducts();
          renderProdutosCatalogUI();
        } catch (error) {
          alert(error.message || "Não foi possível atualizar a foto.");
        }
      });
    });
  }

  function carregarModuloProdutos() {
    renderProdutosCatalogUI();
  }

  // Inicialização no carregamento
  window.carregarModuloEstoque = carregarModuloEstoque;
  window.carregarModuloFinanceiro = carregarModuloFinanceiro;
  window.carregarModuloProdutos = carregarModuloProdutos;

  window.raizesAuthReady.then((user) => {
    if (!user || !["admin", "loja"].includes(user.role)) return;
    setupTabs();

    // Eventos do catálogo de produtos
    const searchInput = document.getElementById("catalog-search-input");
    searchInput?.addEventListener("input", (e) => {
      productCatalogSearch = e.target.value;
      renderProdutosCatalogUI();
    });

    const categorySelect = document.getElementById("catalog-category-select");
    categorySelect?.addEventListener("change", (e) => {
      productCatalogCategory = e.target.value;
      renderProdutosCatalogUI();
    });
  });
})();
