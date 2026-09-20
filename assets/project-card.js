(function(){
  var CACHE = null;

  var GROUPS = {
    core:{icon:"🧠",label:"MCF Core",purpose:"Coordena o ecossistema",color:"core"},
    foundation:{icon:"🏗️",label:"Fundação",purpose:"Mantém o MCF de pé",color:"foundation"},
    execution:{icon:"⚙️",label:"Execução e inteligência",purpose:"Faz o trabalho acontecer",color:"execution"},
    continuity:{icon:"🧠",label:"Memória e continuidade",purpose:"Ajuda o sistema a lembrar",color:"continuity"},
    applications:{icon:"📦",label:"Produtos e casos",purpose:"Onde o MCF vira solução real",color:"applications"},
    labs:{icon:"🧪",label:"Laboratórios",purpose:"Onde testamos e medimos",color:"labs"},
    interfaces:{icon:"👁️",label:"Interfaces e observabilidade",purpose:"Onde você enxerga o sistema",color:"interfaces"},
    support:{icon:"🔧",label:"Ferramentas de suporte",purpose:"Ajudam outras partes a funcionar",color:"support"}
  };

  var PLAIN = {
    "multiagent-collaboration-framework":"É o núcleo do ecossistema: concentra governança, missões, skills, adapters, evidências e o runtime governado.",
    "cloud-infrastructure":"É a base de infraestrutura que sustenta o MCF e seus mecanismos de controle, serviços e ambientes.",
    "cognitive-ledger":"Preserva ideias, decisões, conversas, aprendizados e continuidade para recuperar contexto entre chats, projetos e tempo.",
    "triview-workspace-linux":"É o workspace visual Linux integrado ao MCF para acompanhar e operar o trabalho em múltiplas superfícies.",
    "mcf-model-intelligence":"Projeto registrado na área de execução e inteligência. O Cockpit público mostra sua identidade e entrypoints, sem expor conteúdo privado.",
    "leon337-hermes-operator":"Operador registrado no MCF. O Registry aponta documentação de estado e arquitetura como seus principais pontos de entrada.",
    "dsh-client-ui-agent-nav":"Cliente registrado para navegação e interface de agente. Detalhes privados não são publicados pelo Cockpit.",
    "leandro-workstation-mcp":"Projeto candidato no Registry para integrar a workstation ao ecossistema via MCP, com continuidade e handoff documentados.",
    "project-memory":"Metodologia de memória versionada: permite que outra LLM reconstrua o estado de um projeto lendo poucos arquivos de contexto.",
    "controle-ponto-frontend":"Caso real de produto: front-end de controle de ponto/reconhecimento facial acompanhado pelo MCF.",
    "curso-instavar":"Caso de produto/curso com missão e estado documentados no MCF.",
    "arvore-presente-digital-twin":"Produto registrado no MCF com checklist, roadmap e estado próprio de continuidade.",
    "predixai-robo-de-listas":"Aplicação desktop PredixAI para calibração, agendamento e execução controlada de cliques locais.",
    "mcf-evaluation-lab":"Laboratório independente para avaliação, medição e auditoria do MCF.",
    "mcf-product-lab":"Laboratório de pesquisa e produto que transforma aprendizados sobre agentes em hipóteses, decisões e conceitos.",
    "mcf-cockpit-next":"Este cockpit: uma interface incremental para entender e observar o ecossistema usando dados reais.",
    "mcf-cockpit-live":"Coleção anterior de protótipos visuais do cockpit publicada com dados reais.",
    "mcf-long-mission-public":"Superfície pública relacionada ao acompanhamento de missões longas do MCF; ainda não está no Project Registry.",
    "mcf-control-center":"Painel relacionado ao controle/observação do MCF; descoberto no GitHub e ainda fora do Project Registry.",
    "voicehub-linux":"Camada de comunicação por voz referenciada por um projeto MCF, mas sem entrada própria no Project Registry."
  };

  function esc(v){
    return String(v == null ? "" : v).replace(/[&<>"']/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function ago(v){
    if(!v) return "—";
    var delta=Date.now()-new Date(v).getTime();
    if(!Number.isFinite(delta)) return "—";
    var minutes=Math.max(0,Math.round(delta/60000));
    if(minutes<1) return "agora";
    if(minutes<60) return "há "+minutes+" min";
    var hours=Math.round(minutes/60);
    if(hours<24) return "há "+hours+" h";
    return "há "+Math.round(hours/24)+" d";
  }

  function trust(node){
    if((node.evidence||[]).indexOf("MCF_CURRENT_STATE_CF_4_OF_4")>=0){
      return {label:"INTEGRADO",cls:"integrated",explain:"Possui relação estrutural documentada no estado canônico do MCF."};
    }
    if(node.registry && node.registry.status==="REGISTERED"){
      return {label:"OFICIAL",cls:"canonical",explain:"Possui entrada própria no Project Registry do MCF."};
    }
    if(node.registry && node.registry.status==="REFERENCED_NOT_REGISTERED"){
      return {label:"REFERENCIADO",cls:"referenced",explain:"É citado por um projeto MCF, mas ainda não possui entrada própria no Registry."};
    }
    return {label:"DESCOBERTO",cls:"discovered",explain:"Foi relacionado pelo GitHub, mas ainda não é canônico no Project Registry."};
  }

  function fact(label,value){
    return '<div><dt>'+esc(label)+'</dt><dd>'+esc(value == null || value==="" ? "—" : value)+'</dd></div>';
  }

  function stat(label,value){
    return '<div class="game-stat"><span>'+esc(label)+'</span><strong>'+esc(value == null ? "—" : value)+'</strong></div>';
  }

  function evidenceLabel(code){
    return {
      PROJECT_REGISTRY:"Project Registry",
      MCF_CURRENT_STATE_CF_4_OF_4:"Context Fabric 4/4",
      PROJECT_REGISTRY_REFERENCE:"Referência no Registry",
      GITHUB_DISCOVERY:"Descoberta GitHub"
    }[code] || code;
  }

  async function data(){
    if(CACHE) return CACHE;
    var response=await fetch("/api/ecosystem",{headers:{Accept:"application/json"}});
    var json=await response.json();
    if(!response.ok || !json.ok) throw new Error(json.message||json.error||"Falha na API");
    CACHE=json;
    return json;
  }

  function findNode(ecosystem,id){
    return (ecosystem.inventory||[]).find(function(node){return node.id===id;});
  }

  function open(node){
    var dialog=document.getElementById("projectDialog");
    if(!dialog || !node) return;

    var repo=node.repository||{};
    var group=GROUPS[node.classification && node.classification.group]||GROUPS.support;
    var confidence=trust(node);
    var title=repo.name||node.label||node.id;
    var meaning=PLAIN[node.id] || repo.description ||
      ("Este projeto pertence à área “"+group.label+"”. "+group.purpose+".");

    dialog.dataset.group=group.color;
    document.getElementById("projectCardIcon").textContent=group.icon;
    document.getElementById("projectCardGroup").textContent=group.label.toUpperCase();
    document.getElementById("projectCardTitle").textContent=title;
    document.getElementById("projectCardPurpose").textContent=group.purpose+".";
    document.getElementById("projectCardMeaning").textContent=meaning;

    var trustRoot=document.getElementById("projectCardTrust");
    trustRoot.innerHTML='<span class="card-trust '+confidence.cls+'">'+confidence.label+'</span>'+
      '<span>'+esc(confidence.explain)+'</span>';

    document.getElementById("projectCardStats").innerHTML=
      stat("Branch",repo.defaultBranch||"—")+
      stat("Linguagem",repo.language||"—")+
      stat("Issues",repo.openIssues == null ? "—" : repo.openIssues)+
      stat("Stars",repo.stars == null ? "—" : repo.stars)+
      stat("Forks",repo.forks == null ? "—" : repo.forks);

    document.getElementById("projectCardRole").innerHTML=
      fact("Área",group.label)+
      fact("Relação",node.classification && node.classification.relationLabel)+
      fact("Confiança",confidence.label)+
      fact("Evidência",(node.evidence||[]).map(evidenceLabel).join(" · "));

    document.getElementById("projectCardTech").innerHTML=
      fact("Lifecycle",node.registry && node.registry.lifecycle)+
      fact("Repo canônico",node.canonicalRepository||repo.fullName)+
      fact("Registry",node.registry && node.registry.status)+
      fact("Estado operacional",node.registry && node.registry.operationalState);

    var evidence=[];
    (node.evidence||[]).forEach(function(e){
      evidence.push('<span class="evidence-chip">'+esc(evidenceLabel(e))+'</span>');
    });
    if(node.registry && node.registry.path){
      evidence.push('<span class="evidence-chip path">'+esc(node.registry.path)+'</span>');
    }
    (node.registry && node.registry.entrypoints || []).slice(0,5).forEach(function(entry){
      evidence.push('<span class="evidence-chip entry">↳ '+esc(entry)+'</span>');
    });
    document.getElementById("projectCardEvidence").innerHTML=evidence.length
      ? evidence.join("")
      : '<span class="evidence-chip">Sem evidência adicional publicada</span>';

    document.getElementById("projectCardUpdated").textContent=repo.updatedAt
      ? "GitHub atualizado "+ago(repo.updatedAt)
      : "Sem metadados públicos de atividade";

    var link=document.getElementById("projectCardGithub");
    if(repo.url){
      link.href=repo.url;
      link.hidden=false;
    } else {
      link.hidden=true;
      link.removeAttribute("href");
    }

    if(typeof dialog.showModal==="function"){
      if(!dialog.open) dialog.showModal();
    }else{
      dialog.setAttribute("open","");
    }
  }

  async function openById(id){
    try{
      var ecosystem=await data();
      open(findNode(ecosystem,id));
    }catch(error){
      console.error("project-card",error);
    }
  }

  var dialog=document.getElementById("projectDialog");
  var close=document.getElementById("projectCardClose");
  if(close){
    close.addEventListener("click",function(){
      if(dialog && typeof dialog.close==="function") dialog.close();
      else if(dialog) dialog.removeAttribute("open");
    });
  }
  if(dialog){
    dialog.addEventListener("click",function(event){
      if(event.target===dialog && typeof dialog.close==="function") dialog.close();
    });
  }

  document.addEventListener("click",function(event){
    var trigger=event.target.closest && event.target.closest(".project-trigger");
    if(!trigger) return;
    var id=trigger.getAttribute("data-project-id");
    if(id) openById(id);
  });
  var initialProject=new URLSearchParams(location.search).get("project");
  if(initialProject){
    openById(initialProject);
  }

})();