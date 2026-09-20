const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let ACCOUNT_DATA = null;
let ECOSYSTEM_DATA = null;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function ago(value) {
  if (!value) return "—";
  const delta = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(delta)) return "—";
  const minutes = Math.max(0, Math.round(delta / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.round(hours / 24)} d`;
}

function accountTemplate(account) {
  return `
    <div class="account-content">
      <img class="avatar" src="${esc(account.avatar)}" alt="">
      <div class="account-main">
        <div class="account-title">
          <h2>${esc(account.name || account.login)}</h2>
          <a class="account-login" href="${esc(account.url)}" target="_blank" rel="noreferrer">@${esc(account.login)} ↗</a>
        </div>
        <p class="account-bio">${esc(account.bio || "Conta pública do GitHub.")}</p>
        <div class="account-stats">
          <span class="stat"><b>${account.publicRepos}</b> repos públicos</span>
          <span class="stat"><b>${account.followers}</b> seguidores</span>
          <span class="stat"><b>${account.following}</b> seguindo</span>
        </div>
      </div>
    </div>
  `;
}

function lifecycleBadge(node) {
  const lifecycle = node.registry?.lifecycle;
  if (!lifecycle) return "";
  const cls = lifecycle === "ACTIVE" ? "active" :
    lifecycle === "CANDIDATE" ? "candidate" : "registered";
  return `<span class="node-badge ${cls}">${esc(lifecycle)}</span>`;
}

function evidenceBadges(node) {
  const out = [];
  if (node.registry?.status === "REGISTERED") {
    out.push('<span class="node-badge canonical">Registry MCF</span>');
  } else if (node.registry?.status === "REFERENCED_NOT_REGISTERED") {
    out.push('<span class="node-badge referenced">Referenciado pelo MCF</span>');
  } else {
    out.push('<span class="node-badge discovered">GitHub descoberto</span>');
  }
  if ((node.evidence || []).includes("MCF_CURRENT_STATE_CF_4_OF_4")) {
    out.push('<span class="node-badge integrated">Context Fabric 4/4</span>');
  }
  return out.join("");
}

function nodeTemplate(node, compact = false) {
  const repo = node.repository;
  const description = repo?.description || "Sem descrição pública.";
  const repoMeta = repo ? `
    <div class="node-meta">
      <span>${esc(repo.defaultBranch || "—")}</span>
      <span>${esc(repo.language || "sem linguagem")}</span>
      <span>Atualizado ${ago(repo.updatedAt)}</span>
    </div>
  ` : '<div class="node-meta"><span>repositório não visível na listagem pública</span></div>';

  return `
    <button type="button" class="ecosystem-node project-trigger ${compact ? "compact" : ""}" data-project-id="${esc(node.id)}">
      <div class="node-top">
        <div>
          <span class="node-kicker">${esc(node.classification?.relationLabel || "projeto")}</span>
          <h4>${esc(node.label)}</h4>
        </div>
        <div class="node-badges">
          ${evidenceBadges(node)}
          ${lifecycleBadge(node)}
        </div>
      </div>
      <p>${esc(description)}</p>
      ${repoMeta}
      <div class="node-foot">
        <span>${esc(node.registry?.path || "fora do Project Registry")}</span>
        <span>${repo?.url ? "abrir ficha →" : "detalhes →"}</span>
      </div>
    </button>
  `;
}

function renderAuthority(data) {
  $("#authorityNode").innerHTML = `
    <span class="node-kicker">AUTORIDADE HUMANA FINAL</span>
    <strong>${esc(data.authority.label)}</strong>
    <small>${esc(data.authority.role)}</small>
  `;
}

function renderCore(data) {
  const node = data.core;
  $("#coreNode").innerHTML = `
    <div class="core-icon">MCF</div>
    <div class="core-body">
      <span class="node-kicker">NÚCLEO</span>
      <div class="core-title-row">
        <h2>${esc(node.label)}</h2>
        <div class="node-badges">${evidenceBadges(node)}${lifecycleBadge(node)}</div>
      </div>
      <p>${esc(node.repository?.description || "Framework multiagente governado e runtime canônico.")}</p>
      <div class="node-meta">
        <span>${esc(node.canonicalRepository)}</span>
        <span>${esc(node.registry.operationalState || "—")}</span>
        <span>Atualizado ${ago(node.repository?.updatedAt)}</span>
      </div>
      <div class="core-actions">
        <span class="relation-pill">governança</span>
        <span class="relation-pill">runtime</span>
        <span class="relation-pill">context fabric</span>
        <span class="relation-pill">skills/adapters</span>
      </div>
    </div>
  `;
}

function renderGroups(data) {
  $("#groupGrid").innerHTML = data.groups.map(group => `
    <section class="ecosystem-group" data-group="${esc(group.id)}">
      <header class="group-head">
        <div>
          <span class="node-kicker">${esc(group.sourceType)}</span>
          <h3>${esc(group.label)}</h3>
        </div>
        <span class="group-count">${group.nodes.length}</span>
      </header>
      <p class="group-description">${esc(group.description)}</p>
      <div class="group-relation"><span>MCF Core</span><i></i><b>${esc(group.relationLabel)}</b></div>
      <div class="group-nodes">
        ${group.nodes.length
          ? group.nodes.map(node => nodeTemplate(node, true)).join("")
          : '<div class="empty-group">Nenhum nó público encontrado.</div>'}
      </div>
    </section>
  `).join("");
}

function renderSummary(data) {
  const c = data.counts;
  $("#ecosystemSummary").innerHTML = `
    <div class="summary-card"><strong>${c.registryProjects}</strong><span>projetos no Registry</span></div>
    <div class="summary-card"><strong>${data.structuralRecoveryCore.length}</strong><span>núcleo estrutural 4/4</span></div>
    <div class="summary-card"><strong>${c.discoveredUnregistered}</strong><span>descobertos fora do Registry</span></div>
    <div class="summary-card"><strong>${c.referencedNotRegistered || 0}</strong><span>referenciados, não registrados</span></div>
    <div class="summary-card"><strong>${c.totalNodes}</strong><span>nós no mapa</span></div>
  `;
}

function dedupInventory(data) {
  const seen = new Set();
  return data.inventory.filter(node => {
    const key = node.repository?.fullName || node.canonicalRepository || node.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function repoTemplate(node) {
  const repo = node.repository;
  const name = repo?.name || node.canonicalRepository || node.id;
  const description = repo?.description || "Repositório registrado, mas sem metadados públicos carregados.";
  const status = node.registry?.status === "REGISTERED"
    ? "Registry MCF"
    : node.registry?.status === "REFERENCED_NOT_REGISTERED"
      ? "Referenciado pelo MCF"
      : "Descoberto";
  return `
    <button type="button" class="repo-card inventory-card project-trigger" data-project-id="${esc(node.id)}" data-name="${esc(name.toLowerCase())}">
      <div class="repo-card-head">
        <div class="repo-name">${esc(name)}</div>
        <span class="repo-branch">${esc(repo?.defaultBranch || node.registry?.lifecycle || "—")}</span>
      </div>
      <div class="repo-description">${esc(description)}</div>
      <div class="repo-meta">
        <span>${esc(status)}</span>
        <span>${esc(node.classification?.relationLabel || "—")}</span>
        ${repo ? `<span>★ ${repo.stars}</span><span>◉ ${repo.openIssues}</span>` : ""}
      </div>
      <div class="repo-footer">
        <span>${esc(node.registry?.lifecycle || "não registrado")}</span>
        ${repo?.url
          ? '<span class="fresh">abrir ficha →</span>'
          : '<span>abrir ficha →</span>'}
      </div>
    </button>
  `;
}

function renderInventory(query = "") {
  if (!ECOSYSTEM_DATA) return;
  const needle = query.trim().toLowerCase();
  const nodes = dedupInventory(ECOSYSTEM_DATA).filter(node => {
    const haystack = [
      node.id,
      node.label,
      node.repository?.name,
      node.repository?.description,
      node.canonicalRepository,
      node.classification?.relationLabel,
      node.registry?.lifecycle
    ].join(" ").toLowerCase();
    return !needle || haystack.includes(needle);
  });

  $("#repoCount").textContent = nodes.length;
  $("#repoGrid").innerHTML = nodes.length
    ? nodes.map(repoTemplate).join("")
    : '<div class="empty">Nenhum repositório corresponde à busca.</div>';
}

function renderProvenance(data) {
  $("#provRegistry").textContent = data.sources.registry;
  $("#provCurrentState").textContent = data.sources.currentState;
  $("#provGithub").textContent = data.sources.github;
}

function renderAll(accountData, ecosystemData) {
  ACCOUNT_DATA = accountData;
  ECOSYSTEM_DATA = ecosystemData;

  $("#accountCard").innerHTML = accountTemplate(accountData.account);
  $("#sourcePill").textContent = `Registry + GitHub live · ${ago(ecosystemData.generatedAt)}`;

  renderAuthority(ecosystemData);
  renderCore(ecosystemData);
  renderGroups(ecosystemData);
  renderSummary(ecosystemData);
  renderInventory($("#repoSearch").value);
  renderProvenance(ecosystemData);
}

function switchView(view) {
  $$(".view-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  const guided = $("#guidedView");
  const technical = $("#ecosystemView");
  const repositories = $("#repositoriesView");

  guided.hidden = view !== "guided";
  technical.hidden = view !== "technical";
  repositories.hidden = view !== "repositories";

  guided.classList.toggle("active", view === "guided");
  technical.classList.toggle("active", view === "technical");
  repositories.classList.toggle("active", view === "repositories");
}

async function loadData() {
  $("#refreshButton").disabled = true;
  $("#errorBox").hidden = true;

  try {
    const [accountResponse, ecosystemResponse] = await Promise.all([
      fetch("/api/github", { headers: { Accept: "application/json" } }),
      fetch("/api/ecosystem", { headers: { Accept: "application/json" } })
    ]);

    const [accountData, ecosystemData] = await Promise.all([
      accountResponse.json(),
      ecosystemResponse.json()
    ]);

    if (!accountResponse.ok || !accountData.ok) {
      throw new Error(accountData.message || accountData.error || `GitHub HTTP ${accountResponse.status}`);
    }
    if (!ecosystemResponse.ok || !ecosystemData.ok) {
      throw new Error(ecosystemData.message || ecosystemData.error || `Ecosystem HTTP ${ecosystemResponse.status}`);
    }

    renderAll(accountData, ecosystemData);
  } catch (error) {
    $("#errorBox").hidden = false;
    $("#errorBox").textContent = `Não foi possível carregar a hierarquia: ${error.message}`;
    $("#sourcePill").textContent = "dados indisponíveis";
  } finally {
    $("#refreshButton").disabled = false;
  }
}

$$(".view-tab").forEach(button => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});
$("#repoSearch").addEventListener("input", event => renderInventory(event.target.value));
$("#refreshButton").addEventListener("click", loadData);

loadData();
