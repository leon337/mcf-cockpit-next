import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { EcosystemNode } from "@/data/schema";
import { useAccount, useEcosystem } from "@/data/queries";
import { GuidedView, InventoryView, TechnicalView } from "@/components/ecosystem/views";
import { ProjectCardDialog } from "@/components/project/project-card-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function App() {
  const account = useAccount();
  const ecosystem = useEcosystem();
  const [selected, setSelected] = useState<EcosystemNode | null>(null);
  const initialProject = useMemo(() => new URLSearchParams(window.location.search).get("project"), []);

  if (account.isLoading || ecosystem.isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-panel p-8 text-center shadow-panel">
          <div className="mx-auto size-10 animate-pulse rounded-2xl bg-sky-400/20" />
          <p className="mt-4 text-base text-slate-400">Carregando ecossistema MCF…</p>
        </div>
      </main>
    );
  }

  if (account.error || ecosystem.error || !account.data || !ecosystem.data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-white">
        <div className="max-w-xl rounded-3xl border border-rose-400/20 bg-rose-400/5 p-8">
          <h1 className="text-2xl font-bold">Não foi possível carregar o Cockpit</h1>
          <p className="mt-3 text-base text-slate-400">{String(account.error || ecosystem.error || "Dados indisponíveis")}</p>
        </div>
      </main>
    );
  }

  const ecosystemData = ecosystem.data;
  const accountData = account.data.account;
  const deepLinked = initialProject ? ecosystemData.inventory.find((node) => node.id === initialProject) || null : null;
  const activeProject = selected || deepLinked;

  async function refresh() {
    await Promise.all([account.refetch(), ecosystem.refetch()]);
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1680px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-base font-black text-white shadow-lg shadow-blue-500/20">M</div>
            <div>
              <strong className="block text-base text-white">MCF Cockpit Next</strong>
              <span className="block text-sm text-slate-500">React + TypeScript · framework migration</span>
            </div>
          </div>
          <Button variant="secondary" onClick={refresh}>
            <RefreshCw className="size-4" aria-hidden="true" /> Atualizar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1680px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <section className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-panel md:flex-row md:items-center md:justify-between lg:p-7">
          <div className="flex min-w-0 items-center gap-4">
            <img src={accountData.avatar} alt="" className="size-16 rounded-2xl border border-white/10 object-cover sm:size-20" />
            <div className="min-w-0">
              <span className="eyebrow">AUTORIDADE HUMANA FINAL</span>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">{accountData.name || accountData.login}</h1>
              <p className="mt-1 text-base text-slate-400">@{accountData.login} · {accountData.publicRepos} repositórios públicos</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <Metric value={ecosystemData.counts.registryProjects} label="Registry" />
            <Metric value={ecosystemData.structuralRecoveryCore.length} label="Integrados" />
            <Metric value={ecosystemData.counts.discoveredUnregistered} label="Descobertos" />
            <Metric value={ecosystemData.counts.totalNodes} label="Nós" />
          </div>
        </section>

        <Tabs defaultValue="guided" className="mt-6">
          <TabsList>
            <TabsTrigger value="guided">Entender o ecossistema</TabsTrigger>
            <TabsTrigger value="technical">Mapa técnico</TabsTrigger>
            <TabsTrigger value="inventory">Todos os repositórios</TabsTrigger>
          </TabsList>
          <TabsContent value="guided"><GuidedView data={ecosystemData} onSelect={setSelected} /></TabsContent>
          <TabsContent value="technical"><TechnicalView data={ecosystemData} onSelect={setSelected} /></TabsContent>
          <TabsContent value="inventory"><InventoryView data={ecosystemData} onSelect={setSelected} /></TabsContent>
        </Tabs>
      </main>

      <ProjectCardDialog
        node={activeProject}
        open={Boolean(activeProject)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            if (deepLinked) window.history.replaceState({}, "", window.location.pathname);
          }
        }}
      />
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-24 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
      <strong className="block text-xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  );
}
