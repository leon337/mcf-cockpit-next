(function(){
  var GROUP_INFO = {
    foundation: {
      icon: "🏗️",
      title: "Fundação",
      simple: "Mantém o MCF de pé.",
      detail: "Infraestrutura, memória estrutural e workspace que dão base ao restante do ecossistema.",
      color: "blue"
    },
    execution: {
      icon: "⚙️",
      title: "Execução e inteligência",
      simple: "Faz o trabalho acontecer.",
      detail: "Ferramentas e agentes que executam, navegam, operam ou ajudam a escolher modelos.",
      color: "violet"
    },
    continuity: {
      icon: "🧠",
      title: "Memória e continuidade",
      simple: "Ajuda o sistema a lembrar.",
      detail: "Mantém contexto de projetos e continuidade entre sessões e missões.",
      color: "cyan"
    },
    applications: {
      icon: "📦",
      title: "Produtos e casos",
      simple: "Onde o MCF vira solução real.",
      detail: "Aplicações, cursos e casos concretos que usam capacidades do ecossistema.",
      color: "green"
    },
    labs: {
      icon: "🧪",
      title: "Laboratórios",
      simple: "Onde testamos e medimos.",
      detail: "Espaço para avaliação, experimentação e descoberta antes de promover algo ao núcleo.",
      color: "orange"
    },
    interfaces: {
      icon: "👁️",
      title: "Interfaces e observabilidade",
      simple: "Onde você enxerga o sistema.",
      detail: "Cockpits, painéis e superfícies que mostram o que está acontecendo.",
      color: "pink"
    },
    support: {
      icon: "🔧",
      title: "Ferramentas de suporte",
      simple: "Ajudam outras partes a funcionar.",
      detail: "Ferramentas auxiliares usadas por projetos MCF sem serem o núcleo em si.",
      color: "gray"
    }
  };

  function escapeHtml(value){
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function trust(node){
    if ((node.evidence || []).indexOf("MCF_CURRENT_STATE_CF_4_OF_4") >= 0) {
      return {label:"Integrado", cls:"integrated", help:"Relação estrutural documentada no MCF."};
    }
    if (node.registry && node.registry.status === "REGISTERED") {
      return {label:"Oficial", cls:"canonical", help:"Projeto presente no Project Registry do MCF."};
    }
    if (node.registry && node.registry.status === "REFERENCED_NOT_REGISTERED") {
      return {label:"Referenciado", cls:"referenced", help:"É citado pelo MCF, mas ainda não possui registro próprio."};
    }
    return {label:"Descoberto", cls:"discovered", help:"Relacionado no GitHub, mas ainda não canônico no Registry."};
  }

  function projectRow(node){
    var t = trust(node);
    var name = (node.repository && node.repository.name) || node.label || node.id;
    var detail = (node.repository && node.repository.description) ||
      (node.registry && node.registry.status === "REGISTERED"
        ? "Projeto reconhecido pelo Registry do MCF."
        : "Projeto relacionado ao ecossistema.");
    return '<button type="button" class="guided-project project-trigger" data-project-id="' + escapeHtml(node.id) + '">' +
      '<div class="guided-project-main">' +
        '<strong>' + escapeHtml(name) + '</strong>' +
        '<small>' + escapeHtml(detail) + '</small>' +
      '</div>' +
      '<span class="trust-pill ' + t.cls + '" title="' + escapeHtml(t.help) + '">' + t.label + '</span>' +
      '<span class="project-open-cue" aria-hidden="true">→</span>' +
    '</button>';
  }

  function render(data){
    var root = document.getElementById("guidedGroupGrid");
    if (!root) return;
    root.innerHTML = data.groups.map(function(group){
      var info = GROUP_INFO[group.id] || {
        icon:"◌",
        title:group.label,
        simple:group.description,
        detail:group.description,
        color:"gray"
      };
      return '<details class="guided-group-card ' + info.color + '">' +
        '<summary>' +
          '<div class="guided-group-icon">' + info.icon + '</div>' +
          '<div class="guided-group-copy">' +
            '<span class="node-kicker">' + escapeHtml(group.relationLabel) + '</span>' +
            '<h3>' + escapeHtml(info.title) + '</h3>' +
            '<strong>' + escapeHtml(info.simple) + '</strong>' +
            '<p>' + escapeHtml(info.detail) + '</p>' +
          '</div>' +
          '<div class="guided-group-count"><b>' + group.nodes.length + '</b><span>projetos</span></div>' +
          '<span class="guided-chevron">⌄</span>' +
        '</summary>' +
        '<div class="guided-projects">' +
          (group.nodes.length ? group.nodes.map(projectRow).join("") : '<div class="empty-group">Nenhum projeto encontrado.</div>') +
        '</div>' +
      '</details>';
    }).join("");
  }

  async function boot(){
    try{
      var response = await fetch("/api/ecosystem", {headers:{Accept:"application/json"}});
      var data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || "Falha na API");
      render(data);
    }catch(error){
      var root = document.getElementById("guidedGroupGrid");
      if (root) root.innerHTML = '<div class="error-box">Não foi possível carregar a visão guiada: ' + escapeHtml(error.message) + '</div>';
    }
  }

  boot();
})();