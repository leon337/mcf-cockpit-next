import {
  Activity,
  Boxes,
  GitBranch,
  Lightbulb,
  Menu,
  Network,
  Search,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { V3View } from "@/domain/navigation";

const ITEMS: Array<{
  id: V3View;
  label: string;
  icon: typeof Network;
}> = [
  { id: "ecosystem", label: "Ecossistema", icon: Network },
  { id: "graph", label: "Grafo", icon: GitBranch },
  { id: "projects", label: "Projetos", icon: Boxes },
  { id: "missions", label: "Missões", icon: Activity },
  { id: "insights", label: "Insights", icon: Lightbulb },
];

export function AppShell({
  activeView,
  onNavigate,
  user,
  children,
  search,
  onSearchChange,
}: {
  activeView: V3View;
  onNavigate: (view: V3View) => void;
  user: { name: string; login: string; avatar: string };
  children: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(view: V3View) {
    onNavigate(view);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-dvh bg-canvas text-ink lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/10 bg-[#07101a] lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Brand />
        <nav className="mt-5 flex-1 space-y-1 px-3" aria-label="Navegação principal">
          {ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => navigate(item.id)}
            />
          ))}
        </nav>

        <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt=""
              className="size-10 rounded-xl border border-white/10 object-cover"
            />
            <div className="min-w-0">
              <strong className="block truncate text-sm text-white">{user.name}</strong>
              <span className="block truncate text-xs text-slate-500">@{user.login}</span>
            </div>
          </div>
          <span className="mt-3 block text-xs font-semibold uppercase tracking-wide text-amber-200">
            Autoridade humana final
          </span>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-canvas/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-20 max-w-[1720px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.035] lg:hidden"
              aria-label="Abrir navegação"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>

            <div className="lg:hidden">
              <Brand compact />
            </div>

            <label className="ml-auto flex h-11 w-full max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-panel px-3 focus-within:border-sky-400/45">
              <Search className="size-4 text-slate-500" aria-hidden="true" />
              <span className="sr-only">Buscar no Cockpit</span>
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                placeholder={`Buscar em ${ITEMS.find((item) => item.id === activeView)?.label.toLowerCase() || "cockpit"}…`}
              />
            </label>

            <div className="hidden items-center gap-3 sm:flex lg:hidden">
              <img src={user.avatar} alt="" className="size-10 rounded-xl object-cover" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1720px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Fechar navegação"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col border-r border-white/10 bg-[#07101a] shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl border border-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-3" aria-label="Navegação móvel">
              {ITEMS.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeView === item.id}
                  onClick={() => navigate(item.id)}
                />
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-white/10 bg-[#08111c]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold transition",
                active ? "bg-sky-400/10 text-sky-200" : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact ? "" : "p-4")}>
      <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-blue-500/20">
        M
      </div>
      <div className={compact ? "hidden sm:block" : ""}>
        <strong className="block text-sm text-white">MCF Cockpit Next</strong>
        <span className="block text-xs text-slate-500">V3.1 · Mission Control</span>
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof ITEMS)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
        active
          ? "border border-sky-400/15 bg-sky-400/10 text-sky-200"
          : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200",
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      {item.label}
    </button>
  );
}
