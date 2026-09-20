import { ExternalLink, MessageSquare } from "lucide-react";
import type { Mission } from "@/data/missions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function MissionDetailDialog({
  mission,
  open,
  onOpenChange,
}: {
  mission: Mission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!mission) return null;

  const labels = mission.labels.map((label) =>
    typeof label === "string" ? label : label.name,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-[min(920px,calc(100vw-3rem))]">
        <article className="p-5 sm:p-7 lg:p-8">
          <header className="pr-12">
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

            <DialogTitle className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl">
              {mission.title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-slate-400">
              Dados públicos da Issue canônica do MCF. O Cockpit não infere progresso,
              prioridade ou conclusão parcial.
            </DialogDescription>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Autor" value={mission.author || "não informado"} />
            <Fact label="Criada" value={fullDate(mission.createdAt)} />
            <Fact label="Atualizada" value={fullDate(mission.updatedAt)} />
            <Fact
              label="Encerrada"
              value={mission.closedAt ? fullDate(mission.closedAt) : "—"}
            />
          </section>

          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <span className="eyebrow">DESCRIÇÃO PÚBLICA</span>
            {mission.body ? (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300 sm:text-base">
                {mission.body}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Esta Issue não possui descrição pública.
              </p>
            )}
          </section>

          {labels.length ? (
            <section className="mt-4">
              <span className="eyebrow">LABELS</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="rounded-lg border border-white/10 bg-white/[0.025] px-2.5 py-1.5 text-xs text-slate-400"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <MessageSquare className="size-4" aria-hidden="true" />
              {mission.comments} comentários
            </span>
            <a
              href={mission.url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Abrir Issue no GitHub
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </footer>
        </article>
      </DialogContent>
    </Dialog>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <strong className="mt-2 block break-words text-sm font-semibold text-white">
        {value}
      </strong>
    </div>
  );
}

function fullDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
