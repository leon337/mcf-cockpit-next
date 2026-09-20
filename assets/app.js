const $ = s => document.querySelector(s);
let DATA = null;

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

function dateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
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

function repoTemplate(repo) {
  const language = repo.language || "Sem linguagem";
  const description = repo.description || "Sem descrição pública.";
  return `
    <a class="repo-card" href="${esc(repo.url)}" target="_blank" rel="noreferrer" data-name="${esc(repo.name.toLowerCase())}">
      <div class="repo-card-head">
        <div class="repo-name">${esc(repo.name)}</div>
        <span class="repo-branch">${esc(repo.defaultBranch || "—")}</span>
      </div>
      <div class="repo-description">${esc(description)}</div>
      <div class="repo-meta">
        <span>${esc(language)}</span>
        <span>★ ${repo.stars}</span>
        <span>⑂ ${repo.forks}</span>
        <span>◉ ${repo.openIssues}</span>
      </div>
      <div class="repo-footer">
        <span>${repo.archived ? "arquivado" : "público"}</span>
        <span class="fresh">Atualizado ${ago(repo.updatedAt)}</span>
      </div>
    </a>
  `;
}

function renderRepositories(query = "") {
  if (!DATA) return;
  const needle = query.trim().toLowerCase();
  const repos = DATA.repositories.filter(repo => {
    if (!needle) return true;
    return [
      repo.name,
      repo.description,
      repo.language,
      repo.defaultBranch
    ].some(value => String(value || "").toLowerCase().includes(needle));
  });

  $("#repoCount").textContent = repos.length;
  $("#repoGrid").innerHTML = repos.length
    ? repos.map(repoTemplate).join("")
    : '<div class="empty">Nenhum repositório corresponde à busca.</div>';
}

function render(data) {
  DATA = data;
  $("#accountCard").innerHTML = accountTemplate(data.account);
  renderRepositories($("#repoSearch").value);
  $("#sourcePill").textContent = `GitHub real · ${ago(data.generatedAt)}`;
  $("#provSource").textContent = data.source;
  $("#provGenerated").textContent = dateTime(data.generatedAt);
  const s = data.selection;
  $("#provSelection").textContent =
    `${s.explicitNames.length} nomes explícitos + prefixos/termos dinâmicos`;
}

async function loadData() {
  $("#refreshButton").disabled = true;
  $("#errorBox").hidden = true;
  try {
    const response = await fetch("/api/github", {
      headers: { Accept: "application/json" }
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }
    render(data);
  } catch (error) {
    $("#errorBox").hidden = false;
    $("#errorBox").textContent = `Não foi possível carregar os dados do GitHub: ${error.message}`;
    $("#repoGrid").innerHTML = '<div class="empty">Dados indisponíveis no momento.</div>';
    $("#sourcePill").textContent = "GitHub indisponível";
  } finally {
    $("#refreshButton").disabled = false;
  }
}

$("#repoSearch").addEventListener("input", event => renderRepositories(event.target.value));
$("#refreshButton").addEventListener("click", loadData);
loadData();
