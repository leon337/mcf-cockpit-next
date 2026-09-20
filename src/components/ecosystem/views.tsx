import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, Network, Search } from "lucide-react";
import type { EcosystemGroup, EcosystemNode, EcosystemResponse } from "@/data/schema";
import { GROUP_PRESENTATION, displayName, trustFor } from "@/domain/ecosystem";
import { Badge } from "@/components/ui/badge";

type SelectProject = (node: EcosystemNode) => void;

function ProjectRow({ node, onSelect }: { node: EcosystemNode; onSelect: SelectProject }) {
  const trust = trustFor(node);

  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-sky-400/30 hover:bg-sky-400/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <span className="min-w-0">
        <strong className="block truncate text-base font-semibold text-slate-100">{displayName(node)}</strong>
        <span className="mt-1 block line-clamp-2 text-sm leading-5 text-slate-400">
          {node.repository?.description || "Projeto relacionado ao ecossistema MCF."}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <Badge tone={trust.tone}>{trust.label}</Badge>
        <ArrowRight className="size-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-300" aria-hidden="true" />
      </span>
    </button>
  );
}

function GroupCard({ group, onOpen }: { group: EcosystemGroup; onOpen: (groupId: string) => void }) {
  const presentation = GROUP_PRESENTATION[group.id] || {
    icon: "◌",
    title: group.label,
    short: group.description,
    detail: group.description,
  };

  const official = group.nodes.filter((node) => node.registry.status === "REGISTERED").length;
  const integrated = group.nodes.filter((node) => node.evidence.includes("MCF_CURRENT_STATE_CF_4_OF_4")).length;

  return (
    <button
      type="button"
      onClick={() => onOpen(group.id)}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-panel/85 p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-sky-400/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/5 text-3xl">{presentation.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow">{group.relationLabel}</span>
          <strong className="mt-1 block text-xl font-bold text-white">{presentation.title}</strong>
          <span className="mt-1 block text-base font-medium text-slate-300">{presentation.short}</span>
          <span className="mt-2 block text-sm leading-6 text-slate-500">{presentation.detail}</span>
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
          <b className="text-white">{group.nodes.length}</b> projetos
        </span>
        {official > 0 ? (
          <span className="rounded-xl border border-blue-400/20 bg-blue-400/[0.06] px-3 py-2 text-blue-200">{official} oficiais</span>
        ) : null}
        {integrated > 0 ? (
          <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-emerald-200">{integrated} integrados</span>
        ) : null}
      </div>

      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
        Explorar área
        <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </button>
  );
}

export function GuidedView({ data, onSelect }: { data: EcosystemResponse; onSelect: SelectProject }) {
  const [focusedGroupId, setFocusedGroupId] = useState<string | null>(() => {
    const area = new URLSearchParams(window.location.search).get("area");
    return area && data.groups.some((group) => group.id === area) ? area : null;
  });
  const focusedGroup = focusedGroupId ? data.groups.find((group) => group.id === focusedGroupId) || null : null;

  if (focusedGroup) {
    const presentation = GROUP_PRESENTATION[focusedGroup.id] || {
      icon: "◌",
      title: focusedGroup.label,
      short: focusedGroup.description,
      detail: focusedGroup.description,
    };

    return (
      <div className="space-y-5">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Navegação do ecossistema">
          <button
            type="button"
            onClick={() => {
              setFocusedGroupId(null);
              const url = new URL(window.location.href);
              url.searchParams.delete("area");
              window.history.replaceState({}, "", url);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 text-slate-300 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Ecossistema
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-white">{presentation.title}</span>
        </nav>

        <section className="overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-400/[0.08] via-panel to-panel p-5 shadow-panel sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-3xl">{presentation.icon}</span>
              <div className="min-w-0">
                <span className="eyebrow">ÁREA EM FOCO</span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{presentation.title}</h2>
                <p className="mt-2 text-base font-medium text-slate-300">{presentation.short}</p>
                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-400">{presentation.detail}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <AreaMetric value={focusedGroup.nodes.length} label="Projetos" />
              <AreaMetric value={focusedGroup.nodes.filter((node) => node.registry.status === "REGISTERED").length} label="Oficiais" />
              <AreaMetric value={focusedGroup.nodes.filter((node) => node.evidence.includes("MCF_CURRENT_STATE_CF_4_OF_4")).length} label="Integrados" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-slate-400">
            <strong className="text-slate-200">Como esta área se conecta ao MCF:</strong>{" "}
            {focusedGroup.sourceType === "MCF_CURRENT_STATE"
              ? "a relação estrutural está documentada no estado canônico do MCF."
              : "esta organização é uma visão de navegação do Cockpit; cada projeto mantém sua própria evidência e status canônico."}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">PROJETOS DESTA ÁREA</span>
              <h3 className="mt-2 text-2xl font-bold text-white">Escolha um projeto</h3>
            </div>
            <span className="hidden text-sm text-slate-500 md:block">A ficha abre sem sair do Cockpit.</span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {focusedGroup.nodes.map((node) => <ProjectRow key={node.id} node={node} onSelect={onSelect} />)}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 rounded-3xl border border-white/10 bg-panel/90 p-5 shadow-panel xl:grid-cols-[0.8fr_1.5fr] xl:p-7">
        <div>
          <span className="eyebrow">MAPA NAVEGÁVEL</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Entenda o ecossistema por camadas</h2>
          <p className="mt-2 max-w-xl text-base leading-7 text-slate-400">
            Comece por quem decide, passe pelo núcleo e depois escolha uma área para explorar seus projetos.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FlowCard icon="👤" label="1. QUEM DECIDE" title="LEANDRO" detail="Autoridade humana final." />
          <FlowCard icon="🧠" label="2. QUEM COORDENA" title="MCF Core" detail="Governança, missões e execução." />
          <FlowCard icon="🗺️" label="3. ONDE EXPLORAR" title={`${data.groups.length} áreas`} detail={`${data.inventory.length} nós representados.`} />
        </div>
      </section>

      <section className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-sky-400/[0.04] to-panel/70 p-5 sm:p-7">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4">
            <span className="eyebrow !text-amber-200">AUTORIDADE HUMANA FINAL</span>
            <strong className="mt-1 block text-xl text-white">{data.authority.label}</strong>
            <span className="mt-1 block text-sm text-slate-400">{data.authority.role}</span>
          </div>

          <div className="h-8 w-px bg-gradient-to-b from-amber-300/50 to-sky-300/40" />

          {data.core ? (
            <button
              type="button"
              onClick={() => onSelect(data.core!)}
              className="group w-full max-w-2xl rounded-3xl border border-sky-400/30 bg-sky-400/[0.08] p-5 text-left transition hover:border-sky-300/50 hover:bg-sky-400/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-xl font-black text-white">MCF</span>
                <span className="min-w-0 flex-1">
                  <span className="eyebrow">NÚCLEO DO ECOSSISTEMA</span>
                  <strong className="mt-1 block text-2xl font-bold text-white">{displayName(data.core)}</strong>
                  <span className="mt-2 block text-base leading-6 text-slate-300">Coordena governança, missões, runtime, contexto, skills e adapters.</span>
                </span>
                <ArrowRight className="mt-2 size-5 shrink-0 text-sky-300 transition group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </button>
          ) : null}

          <div className="flex h-10 items-end">
            <div className="h-10 w-px bg-gradient-to-b from-sky-300/40 to-slate-600/30" />
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
            <Network className="size-4" aria-hidden="true" />
            áreas especializadas
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.groups.map((group) => <GroupCard
              key={group.id}
              group={group}
              onOpen={(groupId) => {
                setFocusedGroupId(groupId);
                const url = new URL(window.location.href);
                url.searchParams.set("area", groupId);
                window.history.replaceState({}, "", url);
              }}
            />)}
        </div>
      </section>
    </div>
  );
}

export function TechnicalView({ data, onSelect }: { data: EcosystemResponse; onSelect: SelectProject }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.groups.map((group) => (
        <section key={group.id} className="rounded-3xl border border-white/10 bg-panel/85 p-5">
          <span className="eyebrow">{group.sourceType}</span>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">{group.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{group.description}</p>
            </div>
            <span className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-400">{group.nodes.length}</span>
          </div>
          <div className="mt-4 grid gap-2">
            {group.nodes.map((node) => <ProjectRow key={node.id} node={node} onSelect={onSelect} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function InventoryView({ data, onSelect }: { data: EcosystemResponse; onSelect: SelectProject }) {
  const [query, setQuery] = useState("");
  const nodes = useMemo(() => {
    const seen = new Set<string>();
    return data.inventory.filter((node) => {
      const key = node.repository?.fullName || node.canonicalRepository || node.id;
      if (seen.has(key)) return false;
      seen.add(key);
      const haystack = [node.id, node.label, node.repository?.name, node.repository?.description, node.canonicalRepository]
        .filter(Boolean).join(" ").toLowerCase();
      return !query || haystack.includes(query.toLowerCase());
    });
  }, [data, query]);

  return (
    <div>
      <label className="flex h-12 w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-panel px-4 focus-within:border-sky-400/50">
        <Search className="size-5 text-slate-500" aria-hidden="true" />
        <span className="sr-only">Buscar repositório</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-600"
          placeholder="Buscar repositório…"
        />
        <span className="text-sm text-slate-500">{nodes.length}</span>
      </label>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {nodes.map((node) => <ProjectRow key={node.id} node={node} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

function FlowCard({ icon, label, title, detail }: { icon: string; label: string; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <span className="text-2xl">{icon}</span>
      <span className="mt-3 block text-xs font-extrabold tracking-wide text-sky-300">{label}</span>
      <strong className="mt-1 block text-base text-white">{title}</strong>
      <span className="mt-1 block text-sm leading-5 text-slate-500">{detail}</span>
    </div>
  );
}

function AreaMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-24 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-center">
      <strong className="block text-xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  );
}
