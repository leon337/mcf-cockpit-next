import type { EcosystemNode, EcosystemResponse } from "@/data/schema";
import { displayName, trustFor } from "@/domain/ecosystem";

const TONES = {
  canonical: { stroke: "#60a5fa", fill: "#0f2d4d", label: "Registry MCF" },
  integrated: { stroke: "#34d399", fill: "#0f3a2e", label: "Context Fabric 4/4" },
  referenced: { stroke: "#a78bfa", fill: "#2d2150", label: "Referenciado" },
  discovered: { stroke: "#f59e0b", fill: "#4a3210", label: "Descoberto GitHub" },
} as const;

export function RelationshipGraph({
  data,
  onSelect,
  search,
  groupFilter,
  evidenceFilter,
  onGroupFilterChange,
  onEvidenceFilterChange,
}: {
  data: EcosystemResponse;
  onSelect: (node: EcosystemNode) => void;
  search: string;
  groupFilter: string | null;
  evidenceFilter: string | null;
  onGroupFilterChange: (value: string | null) => void;
  onEvidenceFilterChange: (value: string | null) => void;
}) {
  const core = data.core;
  const query = search.trim().toLowerCase();
  const nodes = data.inventory
    .filter((node) => node.id !== core?.id)
    .filter((node) => !groupFilter || node.classification.group === groupFilter)
    .filter((node) => !evidenceFilter || trustFor(node).tone === evidenceFilter)
    .filter((node) => {
      if (!query) return true;
      return [
        node.id,
        node.label,
        node.repository?.name,
        node.repository?.description,
        node.canonicalRepository,
        node.classification.relationLabel,
        trustFor(node).label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  const width = 1040;
  const height = 680;
  const cx = width / 2;
  const cy = height / 2;

  const positions = nodes.map((node, index) => {
    const outer = index % 2 === 0;
    const radiusX = outer ? 420 : 300;
    const radiusY = outer ? 250 : 175;
    const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1) - Math.PI / 2;
    return {
      node,
      x: cx + Math.cos(angle) * radiusX,
      y: cy + Math.sin(angle) * radiusY,
    };
  });

  return (
    <section className="rounded-3xl border border-white/10 bg-panel/85 p-4 shadow-panel sm:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="eyebrow">GRAFO DE RELAÇÕES</span>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Como os projetos se conectam ao MCF
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            As arestas representam somente relações observáveis: integração estrutural,
            registro canônico, referência explícita ou descoberta no GitHub. Elas não
            significam dependência técnica quando a fonte não declara isso.
          </p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2 text-sm text-slate-400">
          {nodes.length} nós exibidos
        </span>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Área
          <select
            value={groupFilter || ""}
            onChange={(event) => onGroupFilterChange(event.target.value || null)}
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08111c] px-3 text-sm font-medium normal-case text-slate-200 outline-none focus:border-sky-400/50"
          >
            <option value="">Todas as áreas</option>
            {data.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Proveniência
          <select
            value={evidenceFilter || ""}
            onChange={(event) => onEvidenceFilterChange(event.target.value || null)}
            className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08111c] px-3 text-sm font-medium normal-case text-slate-200 outline-none focus:border-sky-400/50"
          >
            <option value="">Todas as evidências</option>
            {Object.entries(TONES).map(([key, tone]) => (
              <option key={key} value={key}>
                {tone.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {nodes.length ? (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#060b12]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto min-w-[920px] w-full"
            role="img"
            aria-label="Grafo de relações do ecossistema MCF"
          >
            <defs>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {positions.map(({ node, x, y }) => {
              const trust = trustFor(node);
              const tone = TONES[trust.tone];
              const dashed = trust.tone === "referenced" || trust.tone === "discovered";
              return (
                <line
                  key={`edge-${node.id}`}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke={tone.stroke}
                  strokeOpacity={0.4}
                  strokeWidth={trust.tone === "integrated" ? 2.6 : 1.6}
                  strokeDasharray={dashed ? "6 7" : undefined}
                />
              );
            })}

            <g
              className="cursor-pointer"
              onClick={() => core && onSelect(core)}
              role="button"
              tabIndex={0}
              aria-label={core ? displayName(core) : "MCF Core"}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && core) onSelect(core);
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r="72"
                fill="#10233e"
                stroke="#60a5fa"
                strokeWidth="3"
                filter="url(#softGlow)"
              />
              <text x={cx} y={cy - 5} textAnchor="middle" fill="#ffffff" fontSize="23" fontWeight="800">
                MCF
              </text>
              <text x={cx} y={cy + 23} textAnchor="middle" fill="#93c5fd" fontSize="12">
                núcleo
              </text>
            </g>

            {positions.map(({ node, x, y }) => {
              const trust = trustFor(node);
              const tone = TONES[trust.tone];
              const label = displayName(node);
              const short = label.length > 22 ? `${label.slice(0, 20)}…` : label;
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(node)}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onSelect(node);
                  }}
                >
                  <rect
                    x={x - 78}
                    y={y - 28}
                    width="156"
                    height="56"
                    rx="14"
                    fill={tone.fill}
                    stroke={tone.stroke}
                    strokeWidth="1.5"
                  />
                  <text x={x} y={y - 2} textAnchor="middle" fill="#f8fafc" fontSize="11.5" fontWeight="700">
                    {short}
                  </text>
                  <text x={x} y={y + 15} textAnchor="middle" fill={tone.stroke} fontSize="9.5">
                    {trust.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
          Nenhum nó corresponde à busca e aos filtros atuais.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(TONES).map(([key, tone]) => (
          <button
            type="button"
            key={key}
            onClick={() =>
              onEvidenceFilterChange(evidenceFilter === key ? null : key)
            }
            className={
              "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs transition " +
              (evidenceFilter === key
                ? "border-sky-400/30 bg-sky-400/[0.08] text-sky-200"
                : "border-white/10 bg-white/[0.025] text-slate-400 hover:text-slate-200")
            }
          >
            <span className="size-2.5 rounded-full" style={{ background: tone.stroke }} />
            {tone.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-600">
        Proveniência: Project Registry do MCF, Current State, referências explícitas e modelo de descoberta GitHub do Cockpit.
      </p>
    </section>
  );
}
