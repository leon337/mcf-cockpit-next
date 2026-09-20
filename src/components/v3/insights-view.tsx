import type { ReactNode } from "react";
import { AlertTriangle, Info, Lightbulb, ShieldCheck } from "lucide-react";
import type { EcosystemResponse } from "@/data/schema";
import {
  deriveInsights,
  INACTIVITY_DAYS,
  insightSummary,
  type EcosystemInsight,
} from "@/domain/insights";

export function InsightsView({
  data,
  search = "",
}: {
  data: EcosystemResponse;
  search?: string;
}) {
  const allInsights = deriveInsights(data);
  const summary = insightSummary(data);
  const q = search.trim().toLowerCase();
  const insights = q
    ? allInsights.filter((insight) =>
        [
          insight.title,
          insight.description,
          insight.rule,
          ...insight.projects.map((project) => project.label),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : allInsights;

  return (
    <div className="space-y-5">
      <section>
        <span className="eyebrow">INSIGHTS DETERMINÍSTICOS</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Observações do ecossistema
        </h1>
        <p className="mt-2 max-w-3xl text-base leading-7 text-slate-400">
          Nada aqui é um “score de saúde” inventado. Cada observação mostra a regra,
          a fonte e os projetos que fizeram a regra disparar.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          value={summary.observations}
          label="Observações ativas"
          icon={<Lightbulb className="size-5" />}
          tone="sky"
        />
        <SummaryCard
          value={summary.attention}
          label="Pedem atenção"
          icon={<AlertTriangle className="size-5" />}
          tone="amber"
        />
        <SummaryCard
          value={summary.opportunities}
          label="Oportunidades"
          icon={<Lightbulb className="size-5" />}
          tone="violet"
        />
        <SummaryCard
          value={summary.informational}
          label="Informativas"
          icon={<Info className="size-5" />}
          tone="slate"
        />
      </section>

      <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-300" aria-hidden="true" />
          <div>
            <strong className="text-sm text-emerald-100">Regras explícitas da V3</strong>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Registry, referência explícita, visibilidade pública e janela de inatividade
              de {INACTIVITY_DAYS} dias. Nenhuma relação privada ou causal é inferida.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
        {!insights.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
            Nenhuma observação corresponde ao filtro atual.
          </div>
        ) : null}
      </section>

      <footer className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-5 text-slate-600">
        <strong className="text-slate-400">Interpretação:</strong> os insights são
        observações operacionais derivadas de regras, não avaliações de qualidade,
        risco absoluto ou importância dos projetos.
      </footer>
    </div>
  );
}

function InsightCard({ insight }: { insight: EcosystemInsight }) {
  const style =
    insight.severity === "attention"
      ? "border-amber-400/20 bg-amber-400/[0.045]"
      : insight.severity === "opportunity"
        ? "border-violet-400/20 bg-violet-400/[0.045]"
        : "border-sky-400/15 bg-sky-400/[0.035]";

  return (
    <article className={`rounded-2xl border p-4 sm:p-5 ${style}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              {insight.severity === "attention"
                ? "Atenção"
                : insight.severity === "opportunity"
                  ? "Oportunidade"
                  : "Informativo"}
            </span>
            <strong className="text-2xl font-bold text-white">{insight.count}</strong>
          </div>

          <h2 className="mt-3 text-lg font-bold text-white sm:text-xl">
            {insight.title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            {insight.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {insight.projects.slice(0, 12).map((project) => (
          <span
            key={project.id}
            className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5 text-xs text-slate-400"
          >
            {project.label}
          </span>
        ))}
        {insight.projects.length > 12 ? (
          <span className="px-2.5 py-1.5 text-xs text-slate-600">
            +{insight.projects.length - 12}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/10 p-3 text-xs leading-5 text-slate-500 md:grid-cols-2">
        <span>
          <strong className="text-slate-300">Regra:</strong> {insight.rule}
        </span>
        <span>
          <strong className="text-slate-300">Fonte:</strong> {insight.source}
        </span>
      </div>
    </article>
  );
}

function SummaryCard({
  value,
  label,
  icon,
  tone,
}: {
  value: number;
  label: string;
  icon: ReactNode;
  tone: "sky" | "amber" | "violet" | "slate";
}) {
  const style = {
    sky: "border-sky-400/15 bg-sky-400/[0.04] text-sky-300",
    amber: "border-amber-400/15 bg-amber-400/[0.04] text-amber-300",
    violet: "border-violet-400/15 bg-violet-400/[0.04] text-violet-300",
    slate: "border-white/10 bg-white/[0.025] text-slate-400",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <span className="flex items-center gap-2">
        {icon}
        <strong className="text-2xl font-bold text-white">{value}</strong>
      </span>
      <span className="mt-2 block text-xs font-bold uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
