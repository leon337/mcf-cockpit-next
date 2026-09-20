import type { EcosystemNode } from "@/data/schema";

export const GROUP_PRESENTATION: Record<string, { icon: string; title: string; short: string; detail: string }> = {
  core: { icon: "🧠", title: "MCF Core", short: "Coordena o ecossistema.", detail: "Governança, missões, skills, adapters, evidências e runtime governado." },
  foundation: { icon: "🏗️", title: "Fundação", short: "Mantém o MCF de pé.", detail: "Infraestrutura, memória estrutural e workspace que dão base ao restante do ecossistema." },
  execution: { icon: "⚙️", title: "Execução e inteligência", short: "Faz o trabalho acontecer.", detail: "Ferramentas e agentes que executam, navegam, operam ou ajudam a escolher modelos." },
  continuity: { icon: "🧠", title: "Memória e continuidade", short: "Ajuda o sistema a lembrar.", detail: "Mantém contexto de projetos e continuidade entre sessões e missões." },
  applications: { icon: "📦", title: "Produtos e casos", short: "Onde o MCF vira solução real.", detail: "Aplicações, cursos e casos concretos que usam capacidades do ecossistema." },
  labs: { icon: "🧪", title: "Laboratórios", short: "Onde testamos e medimos.", detail: "Avaliação, experimentação e descoberta antes de promover algo ao núcleo." },
  interfaces: { icon: "👁️", title: "Interfaces e observabilidade", short: "Onde você enxerga o sistema.", detail: "Cockpits, painéis e superfícies que mostram o que está acontecendo." },
  support: { icon: "🔧", title: "Ferramentas de suporte", short: "Ajudam outras partes a funcionar.", detail: "Ferramentas auxiliares usadas por projetos MCF sem serem o núcleo em si." }
};

export function trustFor(node: EcosystemNode) {
  if (node.evidence.includes("MCF_CURRENT_STATE_CF_4_OF_4")) {
    return { label: "Integrado", tone: "integrated" as const, description: "Relação estrutural documentada." };
  }
  if (node.registry.status === "REGISTERED") {
    return { label: "Oficial", tone: "canonical" as const, description: "Projeto presente no Project Registry." };
  }
  if (node.registry.status === "REFERENCED_NOT_REGISTERED") {
    return { label: "Referenciado", tone: "referenced" as const, description: "Citado pelo MCF, ainda sem registro próprio." };
  }
  return { label: "Descoberto", tone: "discovered" as const, description: "Relacionado no GitHub, ainda não canônico." };
}

export function displayName(node: EcosystemNode) {
  return node.repository?.name || node.label || node.id;
}
