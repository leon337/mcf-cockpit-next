import {
  Activity,
  Brain,
  Boxes,
  Cpu,
  ExternalLink,
  Eye,
  FlaskConical,
  Github,
  Info,
  Network,
  Package,
  ServerCog,
  Wrench,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { EcosystemNode } from "@/data/schema";
import {
  GROUP_PRESENTATION,
  displayName,
  relationInsights,
  trustFor,
} from "@/domain/ecosystem";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  core: Brain,
  foundation: ServerCog,
  execution: Cpu,
  continuity: Brain,
  applications: Package,
  labs: FlaskConical,
  interfaces: Eye,
  support: Wrench,
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
  "voicehub-linux": "Camada de comunicação por voz referenciada por um projeto MCF, mas sem entrada própria no Project Registry.",
};

const EVIDENCE: Record<string, string> = {
  PROJECT_REGISTRY: "Project Registry",
  MCF_CURRENT_STATE_CF_4_OF_4: "Context Fabric 4/4",
  PROJECT_REGISTRY_REFERENCE: "Referência no Registry",
  GITHUB_DISCOVERY: "Descoberta GitHub",
};

export function ProjectCardDialog({
  node,
  open,
  onOpenChange,
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
  const meaning =
    PLAIN[node.id] ||
    repository?.description ||
    `Este projeto pertence à área “${group.title}”. ${group.short}`;
  const relations = relationInsights(node);
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  const defaultTab = requestedTab && ["overview", "mcf", "github", "activity"].includes(requestedTab)
    ? requestedTab
    : "overview";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-[min(980px,calc(100vw-3rem))]">
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

          <Tabs defaultValue={defaultTab} className="mt-5">
            <TabsList className="mb-4 w-full sm:w-max">
              <TabsTrigger value="overview">
                <Info className="mr-2 size-4" aria-hidden="true" />
                Visão geral
              </TabsTrigger>
              <TabsTrigger value="mcf">
                <Network className="mr-2 size-4" aria-hidden="true" />
                MCF
              </TabsTrigger>
              <TabsTrigger value="github">
                <Github className="mr-2 size-4" aria-hidden="true" />
                GitHub
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="mr-2 size-4" aria-hidden="true" />
                Atividade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <section className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-4 sm:p-5">
                <span className="eyebrow">ENTENDA EM 10 SEGUNDOS</span>
                <p className="mt-2 text-base leading-7 text-slate-100 sm:text-lg">{meaning}</p>
              </section>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                  <span className="eyebrow">ONDE FICA NO ECOSSISTEMA</span>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-2xl bg-white/5 text-2xl">{group.icon}</span>
                    <div>
                      <strong className="block text-lg text-white">{group.title}</strong>
                      <span className="mt-1 block text-sm leading-6 text-slate-400">{group.detail}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                  <span className="eyebrow">STATUS RÁPIDO</span>
                  <dl className="mt-3 grid gap-2">
                    <QuickFact label="Confiança" value={trust.label} />
                    <QuickFact label="Lifecycle" value={node.registry.lifecycle} />
                    <QuickFact label="Relação" value={node.classification.relationLabel} />
                  </dl>
                </section>
              </div>

              <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <Stat label="Branch" value={repository?.defaultBranch} />
                <Stat label="Linguagem" value={repository?.language} />
                <Stat label="Issues" value={repository?.openIssues} />
                <Stat label="Stars" value={repository?.stars} />
                <Stat label="Forks" value={repository?.forks} />
              </section>
            </TabsContent>

            <TabsContent value="mcf">
              <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                  <span className="eyebrow">RELAÇÕES COMPROVADAS</span>
                  <div className="mt-3 grid gap-3">
                    {relations.length ? (
                      relations.map((relation) => (
                        <div key={relation.kind} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <strong className="block text-base text-white">{relation.title}</strong>
                          <p className="mt-1 text-sm leading-6 text-slate-400">{relation.detail}</p>
                          <span className="mt-2 block text-xs font-medium text-sky-300">Fonte: {relation.source}</span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm leading-6 text-slate-500">
                        Nenhuma relação explícita adicional foi publicada para este projeto.
                      </div>
                    )}
                  </div>
                </section>

                <Facts
                  title="Identidade no MCF"
                  rows={[
                    ["Área", group.title],
                    ["Relação", node.classification.relationLabel],
                    ["Lifecycle", node.registry.lifecycle],
                    ["Repo canônico", node.canonicalRepository || repository?.fullName],
                    ["Registry", node.registry.status],
                    ["Estado", node.registry.operationalState],
                  ]}
                />
              </div>

              <section className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                <span className="eyebrow">EVIDÊNCIAS E ENTRYPOINTS</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {node.evidence.map((item) => <Evidence key={item}>{EVIDENCE[item] || item}</Evidence>)}
                  {node.registry.path ? <Evidence>{node.registry.path}</Evidence> : null}
                  {node.registry.entrypoints.slice(0, 8).map((entry) => <Evidence key={entry}>↳ {entry}</Evidence>)}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="github">
              {repository ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  <Facts
                    title="Repositório público"
                    rows={[
                      ["Nome", repository.fullName || repository.name],
                      ["Branch", repository.defaultBranch],
                      ["Linguagem", repository.language],
                      ["Visibilidade", repository.visibility],
                      ["Arquivado", repository.archived ? "Sim" : "Não"],
                    ]}
                  />

                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                    <span className="eyebrow">MÉTRICAS PÚBLICAS</span>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Stat label="Issues" value={repository.openIssues} />
                      <Stat label="Stars" value={repository.stars} />
                      <Stat label="Forks" value={repository.forks} />
                    </div>

                    {repository.url ? (
                      <a
                        href={repository.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/10 px-4 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                      >
                        Ver código no GitHub
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </section>
                </div>
              ) : (
                <section className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.05] p-5">
                  <span className="eyebrow !text-violet-200">BOUNDARY DE PRIVACIDADE</span>
                  <h3 className="mt-2 text-lg font-bold text-white">Metadados GitHub não publicados</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    O projeto possui identidade no MCF, mas o Cockpit público não recebeu metadados públicos do repositório. Nenhuma informação privada é inferida.
                  </p>
                </section>
              )}
            </TabsContent>

            <TabsContent value="activity">
              <div className="grid gap-3 md:grid-cols-2">
                <ActivityCard
                  title="Última atualização pública"
                  value={repository?.updatedAt ? fullDate(repository.updatedAt) : "Sem dado público"}
                  helper={repository?.updatedAt ? relative(repository.updatedAt) : "O Cockpit não infere atividade privada."}
                />
                <ActivityCard
                  title="Último push público"
                  value={repository?.pushedAt ? fullDate(repository.pushedAt) : "Sem dado público"}
                  helper={repository?.pushedAt ? relative(repository.pushedAt) : "Nenhum timestamp público disponível."}
                />
                <ActivityCard
                  title="Lifecycle MCF"
                  value={node.registry.lifecycle || "Não declarado"}
                  helper="Estado publicado pelo Project Registry."
                />
                <ActivityCard
                  title="Estado operacional"
                  value={node.registry.operationalState || "Não declarado"}
                  helper="Exibido somente quando publicado no Registry."
                />
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-slate-500">
                Esta aba mostra apenas sinais de atividade disponíveis nas fontes atuais. Commits, PRs e eventos detalhados serão adicionados somente quando uma fonte explícita estiver conectada.
              </div>
            </TabsContent>
          </Tabs>
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

function QuickFact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-white/5 py-2 last:border-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="m-0 text-sm font-medium text-slate-200">{value || "—"}</dd>
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
  return (
    <span className="rounded-lg border border-white/10 bg-[#0c1724] px-2.5 py-1.5 text-xs text-slate-400">
      {children}
    </span>
  );
}

function ActivityCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <span className="eyebrow">{title}</span>
      <strong className="mt-2 block text-lg text-white">{value}</strong>
      <span className="mt-2 block text-sm leading-6 text-slate-500">{helper}</span>
    </section>
  );
}

function relative(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(delta / 60000));
  if (minutes < 60) return `há ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.round(hours / 24)} d`;
}

function fullDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
