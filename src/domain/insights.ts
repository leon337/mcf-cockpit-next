import type { EcosystemNode, EcosystemResponse } from "@/data/schema";

export const INACTIVITY_DAYS = 30;

export type InsightSeverity = "attention" | "opportunity" | "info";

export type EcosystemInsight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  count: number;
  rule: string;
  source: string;
  projects: Array<{
    id: string;
    label: string;
  }>;
};

function projectRef(node: EcosystemNode) {
  return {
    id: node.id,
    label: node.repository?.name || node.label || node.id,
  };
}

export function deriveInsights(
  data: EcosystemResponse,
  now = new Date(),
): EcosystemInsight[] {
  const discovered = data.inventory.filter(
    (node) => node.registry.status === "NOT_IN_PROJECT_REGISTRY",
  );

  const referenced = data.inventory.filter(
    (node) => node.registry.status === "REFERENCED_NOT_REGISTERED",
  );

  const registeredWithoutPublicMetadata = data.inventory.filter(
    (node) => node.registry.status === "REGISTERED" && !node.repository,
  );

  const inactiveCutoff = now.getTime() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
  const inactivePublic = data.inventory.filter((node) => {
    if (!node.repository?.updatedAt) return false;
    const updated = new Date(node.repository.updatedAt).getTime();
    return Number.isFinite(updated) && updated < inactiveCutoff;
  });

  const archived = data.inventory.filter((node) => node.repository?.archived === true);

  const insights: EcosystemInsight[] = [];

  if (discovered.length) {
    insights.push({
      id: "discovered-outside-registry",
      severity: "opportunity",
      title: "Repositórios relacionados fora do Registry",
      description:
        "Estes repositórios aparecem no modelo de descoberta do Cockpit, mas ainda não possuem identidade própria no Project Registry.",
      count: discovered.length,
      rule: "registry.status === NOT_IN_PROJECT_REGISTRY",
      source: "Cockpit discovery + MCF Project Registry",
      projects: discovered.map(projectRef),
    });
  }

  if (referenced.length) {
    insights.push({
      id: "referenced-without-entry",
      severity: "attention",
      title: "Repositórios referenciados sem registro próprio",
      description:
        "Existe referência explícita dentro de um projeto MCF, porém o repositório ainda não possui entrada própria no Project Registry.",
      count: referenced.length,
      rule: "registry.status === REFERENCED_NOT_REGISTERED",
      source: "MCF Project Registry references",
      projects: referenced.map(projectRef),
    });
  }

  if (registeredWithoutPublicMetadata.length) {
    insights.push({
      id: "registered-no-public-metadata",
      severity: "info",
      title: "Projetos registrados sem metadados públicos do GitHub",
      description:
        "O Registry reconhece estes projetos, mas a fonte pública atual não oferece metadados do repositório. O Cockpit preserva o boundary de privacidade.",
      count: registeredWithoutPublicMetadata.length,
      rule: "registry.status === REGISTERED && repository === null",
      source: "MCF Project Registry + public GitHub visibility",
      projects: registeredWithoutPublicMetadata.map(projectRef),
    });
  }

  if (inactivePublic.length) {
    insights.push({
      id: "public-inactive-30-days",
      severity: "attention",
      title: `Repositórios públicos sem atualização há mais de ${INACTIVITY_DAYS} dias`,
      description:
        "Observação temporal baseada somente em repository.updatedAt. Não significa abandono ou problema; apenas ausência de atualização pública dentro da janela.",
      count: inactivePublic.length,
      rule: `repository.updatedAt < now - ${INACTIVITY_DAYS} days`,
      source: "GitHub public repository updatedAt",
      projects: inactivePublic.map(projectRef),
    });
  }

  if (archived.length) {
    insights.push({
      id: "archived-public-repos",
      severity: "info",
      title: "Repositórios públicos arquivados",
      description:
        "O GitHub marca estes repositórios como archived. O Cockpit apenas reproduz esse estado público.",
      count: archived.length,
      rule: "repository.archived === true",
      source: "GitHub public repository metadata",
      projects: archived.map(projectRef),
    });
  }

  return insights;
}

export function insightSummary(data: EcosystemResponse) {
  const insights = deriveInsights(data);
  return {
    observations: insights.length,
    attention: insights.filter((item) => item.severity === "attention").length,
    opportunities: insights.filter((item) => item.severity === "opportunity").length,
    informational: insights.filter((item) => item.severity === "info").length,
  };
}
