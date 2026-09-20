import type { EcosystemNode, EcosystemResponse } from "@/data/schema";
import { GuidedView } from "@/components/ecosystem/views";

export function EcosystemDashboard({
  data,
  onSelect,
  missionSummary,
}: {
  data: EcosystemResponse;
  onSelect: (node: EcosystemNode) => void;
  missionSummary?: { open: number; closed: number } | null;
}) {
  const registered = data.counts.registryProjects;
  const integrated = data.structuralRecoveryCore.length;
  const discovered = data.counts.discoveredUnregistered;
  const referenced = data.counts.referencedNotRegistered || 0;

  return (
    <div className="space-y-6">
      <section>
        <span className="eyebrow">VISÃO DO ECOSSISTEMA</span>
        <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              MCF como sistema vivo
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-400">
              Navegue pela estrutura, abra projetos, acompanhe missões e veja observações
              derivadas de regras transparentes.
            </p>
          </div>
          <span className="text-sm text-slate-600">Prototype V3 · dados reais</span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <FactCard value={data.counts.totalNodes} label="Nós no mapa" />
        <FactCard value={data.groups.length} label="Áreas" />
        <FactCard value={registered} label="No Registry" />
        <FactCard value={integrated} label="Integrados 4/4" />
        <FactCard value={discovered + referenced} label="Fora do Registry" />
        <FactCard
          value={missionSummary ? missionSummary.open : "—"}
          label="Missões abertas"
          helper={missionSummary ? `${missionSummary.closed} encerradas na consulta` : "carregando fonte"}
        />
      </section>

      <GuidedView data={data} onSelect={onSelect} />
    </div>
  );
}

function FactCard({
  value,
  label,
  helper,
}: {
  value: number | string;
  label: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel/80 p-4">
      <strong className="block text-2xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {helper ? <span className="mt-2 block text-xs text-slate-600">{helper}</span> : null}
    </div>
  );
}
