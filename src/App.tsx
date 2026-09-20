import { useEffect, useState } from "react";
import type { EcosystemNode } from "@/data/schema";
import { useAccount, useEcosystem } from "@/data/queries";
import { useMissions } from "@/data/missions";
import { InventoryView } from "@/components/ecosystem/views";
import { ProjectCardDialog } from "@/components/project/project-card-dialog";
import { AppShell } from "@/components/v3/app-shell";
import { EcosystemDashboard } from "@/components/v3/ecosystem-dashboard";
import { RelationshipGraph } from "@/components/v3/relationship-graph";
import { MissionsView } from "@/components/v3/missions-view";
import { InsightsView } from "@/components/v3/insights-view";
import {
  normalizeCockpitLocation,
  readCockpitLocation,
  writeCockpitLocation,
  type CockpitLocation,
  type ProjectTab,
  type V3View,
} from "@/domain/navigation";

export function App() {
  const account = useAccount();
  const ecosystem = useEcosystem();
  const missions = useMissions();
  const [nav, setNav] = useState<CockpitLocation>(() => readCockpitLocation());

  useEffect(() => {
    const onPopState = () => setNav(readCockpitLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function commitNavigation(
    patch: Partial<CockpitLocation>,
    mode: "push" | "replace" = "push",
  ) {
    setNav((current) => {
      const next = normalizeCockpitLocation({ ...current, ...patch });
      writeCockpitLocation(next, mode);
      return next;
    });
  }

  function navigate(view: V3View) {
    commitNavigation({ view }, "push");
  }

  function openProject(node: EcosystemNode) {
    commitNavigation({ project: node.id, tab: "overview" }, "push");
  }

  function closeProject() {
    commitNavigation({ project: null, tab: "overview" }, "replace");
  }

  function changeProjectTab(tab: ProjectTab) {
    commitNavigation({ tab }, "replace");
  }

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
  const activeProject = nav.project
    ? ecosystemData.inventory.find((node) => node.id === nav.project) || null
    : null;

  const user = {
    name: accountData.name || accountData.login,
    login: accountData.login,
    avatar: accountData.avatar,
  };

  return (
    <AppShell
      activeView={nav.view}
      onNavigate={navigate}
      user={user}
      search={nav.q}
      onSearchChange={(value) => commitNavigation({ q: value }, "replace")}
    >
      {nav.view === "ecosystem" ? (
        <EcosystemDashboard
          data={ecosystemData}
          onSelect={openProject}
          missionSummary={missions.data?.counts || null}
          search={nav.q}
          focusedGroupId={nav.area}
          onFocusedGroupChange={(area) => commitNavigation({ area }, "push")}
        />
      ) : null}

      {nav.view === "graph" ? (
        <RelationshipGraph
          data={ecosystemData}
          onSelect={openProject}
          search={nav.q}
          groupFilter={nav.graphGroup}
          evidenceFilter={nav.graphEvidence}
          onGroupFilterChange={(graphGroup) =>
            commitNavigation({ graphGroup }, "replace")
          }
          onEvidenceFilterChange={(graphEvidence) =>
            commitNavigation({ graphEvidence }, "replace")
          }
        />
      ) : null}

      {nav.view === "projects" ? (
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
          <InventoryView data={ecosystemData} onSelect={openProject} search={nav.q} />
        </section>
      ) : null}

      {nav.view === "missions" ? (
        missions.isLoading ? (
          <LoadingPanel label="Carregando missões reais…" />
        ) : missions.error || !missions.data ? (
          <ErrorPanel
            title="Missões temporariamente indisponíveis"
            detail={String(missions.error || "A fonte pública não respondeu.")}
          />
        ) : (
          <MissionsView
            data={missions.data}
            search={nav.q}
            filter={nav.missionFilter}
            onFilterChange={(missionFilter) =>
              commitNavigation({ missionFilter }, "replace")
            }
            selectedMissionNumber={nav.mission}
            onSelectMission={(mission) =>
              commitNavigation({ mission: mission.number }, "push")
            }
            onCloseMission={() => commitNavigation({ mission: null }, "replace")}
          />
        )
      ) : null}

      {nav.view === "insights" ? (
        <InsightsView
          data={ecosystemData}
          search={nav.q}
          onSelectProject={(projectId) => {
            const node = ecosystemData.inventory.find((item) => item.id === projectId);
            if (node) openProject(node);
          }}
        />
      ) : null}

      <ProjectCardDialog
        node={activeProject}
        open={Boolean(activeProject)}
        activeTab={nav.tab}
        onTabChange={changeProjectTab}
        onOpenChange={(open) => {
          if (!open) closeProject();
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
