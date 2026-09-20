import { ExternalLink, MessageSquare, Search } from "lucide-react";
import { useMemo } from "react";
import type { Mission, MissionsResponse } from "@/data/missions";
import type { MissionFilter } from "@/domain/navigation";
import { MissionDetailDialog } from "@/components/v3/mission-detail-dialog";

export function MissionsView({
  data,
  search = "",
  filter,
  onFilterChange,
  selectedMissionNumber,
  onSelectMission,
  onCloseMission,
}: {
  data: MissionsResponse;
  search?: string;
  filter: MissionFilter;
  onFilterChange: (filter: MissionFilter) => void;
  selectedMissionNumber: number | null;
  onSelectMission: (mission: Mission) => void;
  onCloseMission: () => void;
}) {

  const missions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.missions.filter((mission) => {
      if (filter !== "all" && mission.state !== filter) return false;
      if (!q) return true;
      return [mission.code, mission.title, String(mission.number)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [data.missions, filter, search]);

  return (
    <div className="space-y-5">
      <section>
        <span className="eyebrow">MISSÕES REAIS</span>
        <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Missões do MCF
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-400">
              Fonte direta das issues públicas do repositório canônico. O Cockpit não
              inventa percentual de progresso; mostra estado, labels e atividade observável.
            </p>
          </div>
          <span className="text-sm text-slate-600">
            Atualizado {relative(data.generatedAt)}
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Count value={data.counts.open} label="Abertas" tone="open" />
        <Count value={data.counts.closed} label="Encerradas" tone="closed" />
        <Count value={data.counts.total} label="Na janela consultada" tone="neutral" />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {(["open", "closed", "all"] as MissionFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            className={
              "min-h-11 rounded-xl border px-4 text-sm font-semibold transition " +
              (filter === value
                ? "border-sky-400/25 bg-sky-400/10 text-sky-200"
                : "border-white/10 bg-white/[0.025] text-slate-500 hover:text-slate-300")
            }
          >
            {value === "open" ? "Em andamento" : value === "closed" ? "Encerradas" : "Todas"}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-600">{missions.length} exibidas</span>
      </div>

      {search ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-sm text-slate-500">
          <Search className="size-4" aria-hidden="true" />
          filtro global: <strong className="text-slate-300">{search}</strong>
        </div>
      ) : null}

      <section className="grid gap-3">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onSelect={() => onSelectMission(mission)} />
        ))}
        {!missions.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            Nenhuma missão corresponde aos filtros atuais.
          </div>
        ) : null}
      </section>

      <footer className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-5 text-slate-600">
        <strong className="text-slate-400">Proveniência:</strong> {data.source}. Regra:
        {" "}{data.selection.rule}. Janela: {data.selection.window}.
      </footer>

      <MissionDetailDialog
        mission={
          selectedMissionNumber
            ? data.missions.find((mission) => mission.number === selectedMissionNumber) || null
            : null
        }
        open={Boolean(
          selectedMissionNumber &&
            data.missions.some((mission) => mission.number === selectedMissionNumber),
        )}
        onOpenChange={(open) => {
          if (!open) onCloseMission();
        }}
      />
    </div>
  );
}

function MissionCard({
  mission,
  onSelect,
}: {
  mission: Mission;
  onSelect: () => void;
}) {
  const labels = mission.labels.map((label) =>
    typeof label === "string" ? label : label.name
  );

  return (
    <article className="rounded-2xl border border-white/10 bg-panel/75 p-4 transition hover:border-white/20 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                "rounded-full border px-2.5 py-1 text-xs font-bold " +
                (mission.state === "open"
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                  : "border-slate-400/15 bg-slate-400/[0.06] text-slate-400")
              }
            >
              {mission.state === "open" ? "ABERTA" : "ENCERRADA"}
            </span>
            {mission.code ? (
              <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.06] px-2.5 py-1 text-xs font-bold text-sky-200">
                {mission.code}
              </span>
            ) : null}
            <span className="text-xs text-slate-600">#{mission.number}</span>
          </div>

          <h2 className="mt-3 text-lg font-bold leading-7 text-white sm:text-xl">
            {mission.title}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {labels.slice(0, 6).map((label) => (
              <span
                key={label}
                className="rounded-lg border border-white/10 bg-white/[0.025] px-2 py-1 text-xs text-slate-500"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 text-sm text-slate-500 lg:items-end">
          <span>atualizada {relative(mission.updatedAt)}</span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-4" aria-hidden="true" />
            {mission.comments} comentários
          </span>
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.06] px-3 font-semibold text-sky-200 transition hover:bg-sky-400/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Abrir no Cockpit
          </button>
          <a
            href={mission.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 font-semibold text-slate-300 transition hover:bg-white/[0.06]"
          >
            Ver issue
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

function Count({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "open" | "closed" | "neutral";
}) {
  const style =
    tone === "open"
      ? "border-emerald-400/20 bg-emerald-400/[0.06]"
      : tone === "closed"
        ? "border-slate-400/15 bg-slate-400/[0.04]"
        : "border-sky-400/15 bg-sky-400/[0.04]";

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <strong className="block text-2xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
    </div>
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
