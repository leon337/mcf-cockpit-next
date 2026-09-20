import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { EcosystemNode, EcosystemResponse } from "@/data/schema";
import { GROUP_PRESENTATION, displayName, trustFor } from "@/domain/ecosystem";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

type SelectProject = (node: EcosystemNode) => void;

function ProjectRow({ node, onSelect }: { node: EcosystemNode; onSelect: SelectProject }) {
  const trust = trustFor(node);
  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-sky-400/30 hover:bg-sky-400/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <span className="min-w-0">
        <strong className="block truncate text-base font-semibold text-slate-100">{displayName(node)}</strong>
        <span className="mt-1 block line-clamp-2 text-sm leading-5 text-slate-400">
          {node.repository?.description || "Projeto relacionado ao ecossistema MCF."}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <Badge tone={trust.tone}>{trust.label}</Badge>
        <span aria-hidden="true" className="text-lg text-slate-500 transition group-hover:translate-x-1 group-hover:text-sky-300">→</span>
      </span>
    </button>
  );
}

export function GuidedView({ data, onSelect }: { data: EcosystemResponse; onSelect: SelectProject }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-3xl border border-white/10 bg-panel/90 p-5 shadow-panel xl:grid-cols-[0.75fr_1.6fr] xl:p-7">
        <div>
          <span className="eyebrow">LEITURA EM 4 PASSOS</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">Como o MCF funciona</h2>
          <p className="mt-2 max-w-xl text-base leading-7 text-slate-400">Entenda primeiro quem decide, quem coordena e para que serve cada área.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["1", "Você decide", "LEANDRO mantém a autoridade final."],
            ["2", "MCF coordena", "Organiza regras, missões e execução."],
            ["3", "Áreas especializam", "Cada grupo resolve um tipo de problema."],
            ["4", "Projetos executam", "Repos concretos fazem o trabalho."]
          ].map(([step, title, detail]) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <span className="grid size-8 place-items-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sm font-bold text-sky-300">{step}</span>
              <strong className="mt-3 block text-sm text-slate-100">{title}</strong>
              <span className="mt-1 block text-sm leading-5 text-slate-500">{detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">ÁREAS DO ECOSSISTEMA</span>
            <h2 className="mt-2 text-2xl font-bold text-white">Para que serve cada parte?</h2>
          </div>
          <span className="hidden text-sm text-slate-500 md:block">Expanda uma área e abra a ficha de um projeto.</span>
        </div>

        <Accordion type="multiple" className="grid gap-3 lg:grid-cols-2">
          {data.groups.map((group) => {
            const p = GROUP_PRESENTATION[group.id] || { icon: "◌", title: group.label, short: group.description, detail: group.description };
            return (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger>
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/5 text-2xl">{p.icon}</span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="eyebrow">{group.relationLabel}</span>
                    <strong className="mt-1 block text-lg text-white">{p.title}</strong>
                    <span className="mt-1 block text-sm font-medium text-slate-300">{p.short}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-500">{p.detail}</span>
                  </span>
                  <span className="rounded-xl border border-white/10 px-3 py-2 text-center text-sm text-slate-400">
                    <b className="block text-lg text-white">{group.nodes.length}</b> projetos
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2 pt-2">
                    {group.nodes.map((node) => <ProjectRow key={node.id} node={node} onSelect={onSelect} />)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
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
