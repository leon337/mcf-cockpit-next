import { useMemo, useState } from "react";
import type { EcosystemNode } from "@/data/schema";
import { useAccount, useEcosystem } from "@/data/queries";
import { useMissions } from "@/data/missions";
import { InventoryView } from "@/components/ecosystem/views";
import { ProjectCardDialog } from "@/components/project/project-card-dialog";
import { AppShell, type V3View } from "@/components/v3/app-shell";
import { EcosystemDashboard } from "@/components/v3/ecosystem-dashboard";
import { RelationshipGraph } from "@/components/v3/relationship-graph";
import { MissionsView } from "@/components/v3/missions-view";
import { InsightsView } from "@/components/v3/insights-view";

const VALID_VIEWS: V3View[] = [
  "ecosystem",
  "graph",
  "projects",
  "missions",
  "insights",
];

export function App() {
  const account = useAccount();
  const ecosystem = useEcosystem();
  const missions = useMissions();

  const [selected, setSelected] = useState<EcosystemNode | null>(null);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<V3View>(() => {
    const value = new URLSearchParams(window.location.search).get("view") as V3View | null;
    return value && VALID_VIEWS.includes(value) ? value : "ecosystem";
  });

  const initialProject = useMemo(
    () => new URLSearchParams(window.location.search).get("project"),
    [],
  );

  if (account.isLoading || ecosystem.isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-panel p-8 text-center shadow-panel">
          <div className="mx-auto size-10 animate-pulse rounded-2xl bg-sky-400/20" />
          <p className="mt-4 text-base text-slate-400">Carregando Mission Control…</p>
        </div>
      </main>
    );
  }

  if (account.error || ecosystem.error || !account.data || !ecosystem.data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-white">
        <div className="max-w-xl rounded-3xl border border-rose-400/20 bg-rose-400/5 p-8">
          <h1 className="text-2xl font-bold">Não foi possível carregar o Cockpit</h1>
          <p className="mt-3 text-base text-slate-400">
            {String(account.error || ecosystem.error || "Dados indisponíveis")}
          </p>
        </div>
      </main>
    );
  }

  const ecosystemData = ecosystem.data;
  const accountData = account.data.account;
  const deepLinked = initialProject
    ? ecosystemData.inventory.find((node) => node.id === initialProject) || null
    : null;
  const activeProject = selected || deepLinked;

  function navigate(view: V3View) {
    setActiveView(view);
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    if (view !== "ecosystem") url.searchParams.delete("area");
    window.history.replaceState({}, "", url);
  }

  const user = {
    name: accountData.name || accountData.login,
    login: accountData.login,
    avatar: accountData.avatar,
  };

  return (
    <AppShell
      activeView={activeView}
      onNavigate={navigate}
      user={user}
      search={search}
      onSearchChange={setSearch}
    >
      {activeView === "ecosystem" ? (
        <EcosystemDashboard
          data={ecosystemData}
          onSelect={setSelected}
          missionSummary={missions.data?.counts || null}
        />
      ) : null}

      {activeView === "graph" ? (
        <RelationshipGraph data={ecosystemData} onSelect={setSelected} />
      ) : null}

      {activeView === "projects" ? (
        <section className="space-y-5">
          <div>
            <span className="eyebrow">PROJETOS</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Inventário do ecossistema
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-400">
              Abra qualquer projeto para entender seu papel, evidências e identidade técnica
              sem sair do Cockpit.
            </p>
          </div>
          <InventoryView data={ecosystemData} onSelect={setSelected} search={search} />
        </section>
      ) : null}

      {activeView === "missions" ? (
        missions.isLoading ? (
          <LoadingPanel label="Carregando missões reais…" />
        ) : missions.error || !missions.data ? (
          <ErrorPanel
            title="Missões temporariamente indisponíveis"
            detail={String(missions.error || "A fonte pública não respondeu.")}
          />
        ) : (
          <MissionsView data={missions.data} search={search} />
        )
      ) : null}

      {activeView === "insights" ? (
        <InsightsView data={ecosystemData} search={search} />
      ) : null}

      <ProjectCardDialog
        node={activeProject}
        open={Boolean(activeProject)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            const url = new URL(window.location.href);
            url.searchParams.delete("project");
            url.searchParams.delete("tab");
            window.history.replaceState({}, "", url);
          }
        }}
      />
    </AppShell>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center rounded-3xl border border-white/10 bg-panel/70 p-8">
      <div className="text-center">
        <div className="mx-auto size-10 animate-pulse rounded-2xl bg-sky-400/20" />
        <p className="mt-4 text-base text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function ErrorPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.05] p-6">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}
