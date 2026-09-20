import {
  Brain, Boxes, Cpu, Eye, FlaskConical, Package, ServerCog, Wrench, ExternalLink
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { EcosystemNode } from "@/data/schema";
import { GROUP_PRESENTATION, displayName, trustFor } from "@/domain/ecosystem";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  core: Brain,
  foundation: ServerCog,
  execution: Cpu,
  continuity: Brain,
  applications: Package,
  labs: FlaskConical,
  interfaces: Eye,
  support: Wrench
};

const PLAIN: Record<string, string> = {
  "multiagent-collaboration-framework": "É o núcleo do ecossistema: concentra governança, missões, skills, adapters, evidências e o runtime governado.",
  "cloud-infrastructure": "É a base de infraestrutura que sustenta o MCF e seus mecanismos de controle, serviços e ambientes.",
  "cognitive-ledger": "Preserva ideias, decisões, conversas, aprendizados e continuidade para recuperar contexto entre chats, projetos e tempo.",
  "triview-workspace-linux": "É o workspace visual Linux integrado ao MCF para acompanhar e operar o trabalho em múltiplas superfícies.",
  "mcf-model-intelligence": "Projeto registrado na área de execução e inteligência. O Cockpit público mostra identidade e entrypoints, sem expor conteúdo privado.",
  "leon337-hermes-operator": "Operador registrado no MCF. O Registry aponta documentação de estado e arquitetura como seus principais pontos de entrada.",
  "dsh-client-ui-agent-nav": "Cliente registrado para navegação e interface de agente. Detalhes privados não são publicados pelo Cockpit.",
  "leandro-workstation-mcp": "Projeto candidato no Registry para integrar a workstation ao ecossistema via MCP, com continuidade e handoff documentados.",
  "project-memory": "Metodologia de memória versionada para outra LLM reconstruir o estado de um projeto lendo poucos arquivos de contexto.",
  "controle-ponto-frontend": "Caso real de produto: front-end de controle de ponto e reconhecimento facial acompanhado pelo MCF.",
  "curso-instavar": "Caso de produto e curso com missão e estado documentados no MCF.",
  "arvore-presente-digital-twin": "Produto registrado no MCF com checklist, roadmap e estado próprio de continuidade.",
  "predixai-robo-de-listas": "Aplicação desktop PredixAI para calibração, agendamento e execução controlada de cliques locais.",
  "mcf-evaluation-lab": "Laboratório independente para avaliação, medição e auditoria do MCF.",
  "mcf-product-lab": "Laboratório de pesquisa e produto que transforma aprendizados sobre agentes em hipóteses, decisões e conceitos.",
  "mcf-cockpit-next": "Este cockpit: interface incremental para entender e observar o ecossistema usando dados reais.",
  "mcf-cockpit-live": "Coleção anterior de protótipos visuais do cockpit publicada com dados reais.",
  "mcf-long-mission-public": "Superfície pública relacionada ao acompanhamento de missões longas do MCF; ainda não está no Project Registry.",
  "mcf-control-center": "Painel relacionado ao controle e observação do MCF; descoberto no GitHub e ainda fora do Project Registry.",
  "voicehub-linux": "Camada de comunicação por voz referenciada por um projeto MCF, mas sem entrada própria no Project Registry."
};

const EVIDENCE: Record<string, string> = {
  PROJECT_REGISTRY: "Project Registry",
  MCF_CURRENT_STATE_CF_4_OF_4: "Context Fabric 4/4",
  PROJECT_REGISTRY_REFERENCE: "Referência no Registry",
  GITHUB_DISCOVERY: "Descoberta GitHub"
};

export function ProjectCardDialog({
  node,
  open,
  onOpenChange
}: {
  node: EcosystemNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!node) return null;

  const repository = node.repository;
  const group = GROUP_PRESENTATION[node.classification.group] || GROUP_PRESENTATION.support;
  const trust = trustFor(node);
  const Icon = ICONS[node.classification.group] || Boxes;
  const meaning = PLAIN[node.id] || repository?.description || `Este projeto pertence à área “${group.title}”. ${group.short}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <article className="p-5 sm:p-7 lg:p-8">
          <header className="flex items-start gap-4 pr-12">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-sky-400/20 bg-sky-400/10 sm:size-16">
              <Icon className="size-7 text-sky-200 sm:size-8" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="eyebrow">{group.title}</span>
              <DialogTitle className="mt-1 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {displayName(node)}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                {group.short}
              </DialogDescription>
            </div>
          </header>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Badge tone={trust.tone}>{trust.label}</Badge>
            <span className="text-sm leading-5 text-slate-500">{trust.description}</span>
          </div>

          <section className="mt-5 rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-4 sm:p-5">
            <span className="eyebrow">ENTENDA EM 10 SEGUNDOS</span>
            <p className="mt-2 text-base leading-7 text-slate-100 sm:text-lg">{meaning}</p>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Branch" value={repository?.defaultBranch} />
            <Stat label="Linguagem" value={repository?.language} />
            <Stat label="Issues" value={repository?.openIssues} />
            <Stat label="Stars" value={repository?.stars} />
            <Stat label="Forks" value={repository?.forks} />
          </section>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <Facts title="Papel no MCF" rows={[
              ["Área", group.title],
              ["Relação", node.classification.relationLabel],
              ["Confiança", trust.label],
              ["Evidência", node.evidence.map((item) => EVIDENCE[item] || item).join(" · ")]
            ]} />
            <Facts title="Identidade técnica" rows={[
              ["Lifecycle", node.registry.lifecycle],
              ["Repo canônico", node.canonicalRepository || repository?.fullName],
              ["Registry", node.registry.status],
              ["Estado", node.registry.operationalState]
            ]} />
          </div>

          <section className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <span className="eyebrow">EVIDÊNCIAS E PROVENIÊNCIA</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {node.evidence.map((item) => <Evidence key={item}>{EVIDENCE[item] || item}</Evidence>)}
              {node.registry.path ? <Evidence>{node.registry.path}</Evidence> : null}
              {node.registry.entrypoints.slice(0, 6).map((entry) => <Evidence key={entry}>↳ {entry}</Evidence>)}
            </div>
          </section>

          <footer className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>{repository?.updatedAt ? `GitHub atualizado ${relative(repository.updatedAt)}` : "Sem metadados públicos de atividade"}</span>
            {repository?.url ? (
              <a
                href={repository.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/10 px-4 font-semibold text-sky-100 transition hover:bg-sky-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                Ver código no GitHub <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            ) : null}
          </footer>
        </article>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:p-4">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-2 block truncate text-base font-semibold text-white">{value ?? "—"}</strong>
    </div>
  );
}

function Facts({ title, rows }: { title: string; rows: Array<[string, string | null | undefined]> }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <span className="eyebrow">{title}</span>
      <dl className="mt-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 border-b border-white/5 py-2 last:border-0">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="m-0 break-words text-sm text-slate-200">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Evidence({ children }: { children: ReactNode }) {
  return <span className="rounded-lg border border-white/10 bg-[#0c1724] px-2.5 py-1.5 text-xs text-slate-400">{children}</span>;
}

function relative(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(delta / 60000));
  if (minutes < 60) return `há ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.round(hours / 24)} d`;
}
