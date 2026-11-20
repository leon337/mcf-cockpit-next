import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Database,
  FlaskConical,
  LockKeyhole,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/cn";

type ViewName = "connection" | "projects" | "permissions" | "tests" | "audit";
type Policy = {
  skillId: string;
  provider: string;
  resource: string;
  permissionProfile: string;
  operations: Array<{ id: string; bridge: string; scope: string }>;
  blocked: string[];
  provenance: string;
};
type Summary = {
  ok: true;
  mode: "connected" | "unavailable";
  reason?: string;
  checkedAt: string;
  policy: Policy;
  status?: {
    traceId: string;
    service: string;
    version: string;
    oauthConnected: boolean;
    adcConfigured: boolean;
    readOnly: true;
  };
};
type ProjectResponse = {
  ok: true;
  checkedAt: string;
  traceId: string;
  projects: Array<{ projectId: string; displayName: string | null; state: string }>;
};
type TestResponse = {
  ok: boolean;
  checkedAt: string;
  tests: Array<{ operation: string; outcome: "PASS" | "FAIL"; traceId?: string; code?: string }>;
};
type AuditResponse = {
  ok: true;
  checkedAt: string;
  persistent: boolean;
  scope: "LOCAL_PANEL_REQUESTS_ONLY" | "BRIDGE_LOCAL_AUDIT";
  events: Array<{ at: string; operation: string; outcome: string; traceId: string | null }>;
};

const NAV: Array<{ id: ViewName; label: string; icon: typeof Cloud }> = [
  { id: "connection", label: "Conexão", icon: Activity },
  { id: "projects", label: "Projetos Cloud", icon: Database },
  { id: "permissions", label: "Permissões", icon: ShieldCheck },
  { id: "tests", label: "Testes", icon: FlaskConical },
  { id: "audit", label: "Auditoria", icon: ScrollText },
];

async function getJson<T>(view: string, options: { allowFailedTest?: boolean } = {}): Promise<T> {
  const response = await fetch(`/api/google-bridge?view=${encodeURIComponent(view)}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida da API");
  const data = payload as { ok?: boolean; error?: string; tests?: unknown[] };
  if ((!response.ok || data.ok === false) && !(options.allowFailedTest && Array.isArray(data.tests))) {
    throw new Error(data.error === "LOCAL_RUNTIME_NOT_CONNECTED"
      ? "A Bridge não está conectada a este servidor."
      : "A consulta não pôde ser concluída.");
  }
  return payload as T;
}

function timestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
}

function Code({ children }: { children: string }) {
  return <code className="break-all rounded-lg bg-black/25 px-2 py-1 font-mono text-xs text-sky-200">{children}</code>;
}

function Panel({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/80 p-5 shadow-panel sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StateTag({ connected, text }: { connected: boolean; text: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
      connected ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
        : "border-amber-400/20 bg-amber-400/10 text-amber-200",
    )}>
      <span className={cn("size-2 rounded-full", connected ? "bg-emerald-400" : "bg-amber-300")} />
      {text}
    </span>
  );
}

function Stat({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <strong className="mt-2 block break-words text-lg font-bold text-white">{value}</strong>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

export function GoogleBridgeView() {
  const [tab, setTab] = useState<ViewName>("connection");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projects, setProjects] = useState<ProjectResponse | null>(null);
  const [tests, setTests] = useState<TestResponse | null>(null);
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [busy, setBusy] = useState<string | null>("summary");
  const [error, setError] = useState<string | null>(null);

  const connected = summary?.mode === "connected";

  const refreshSummary = useCallback(async () => {
    setBusy("summary");
    setError(null);
    try {
      const result = await getJson<Summary>("summary");
      setSummary(result);
      if (result.mode !== "connected") {
        setProjects(null);
        setTests(null);
        setAudit(null);
      }
    } catch {
      setSummary(null);
      setProjects(null);
      setError("O Painel não conseguiu consultar seu próprio serviço de integração.");
    } finally {
      setBusy(null);
    }
  }, []);

  useEffect(() => { void refreshSummary(); }, [refreshSummary]);

  async function loadProjects() {
    setBusy("projects");
    setError(null);
    try { setProjects(await getJson<ProjectResponse>("projects")); }
    catch { setProjects(null); setError("Projetos indisponíveis neste ambiente. Nenhuma lista foi simulada."); }
    finally { setBusy(null); }
  }
  async function runTests() {
    setBusy("tests");
    setError(null);
    try {
      const result = await getJson<TestResponse>("tests", { allowFailedTest: true });
      setTests(result);
      if (!result.ok) setError("Um ou mais testes de leitura falharam. Consulte os detalhes abaixo.");
    } catch {
      setTests(null);
      setError("Não foi possível executar os testes de leitura.");
    } finally { setBusy(null); }
  }
  async function loadAudit() {
    setBusy("audit");
    setError(null);
    try { setAudit(await getJson<AuditResponse>("audit")); }
    catch { setAudit(null); setError("A auditoria local não está acessível neste ambiente."); }
    finally { setBusy(null); }
  }

  function openTab(value: ViewName) {
    setTab(value);
    setError(null);
    if (!connected) return;
    if (value === "projects" && !projects) void loadProjects();
    if (value === "audit") void loadAudit();
  }

  return (
    <div className="space-y-6" data-testid="google-bridge-panel">
      <section className="relative overflow-hidden rounded-3xl border border-sky-400/15 bg-gradient-to-br from-[#11263a] via-panel to-[#101629] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="eyebrow">MCF · INTEGRAÇÕES</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-sky-400/10 text-sky-200">
                <Cloud className="size-6" aria-hidden="true" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Google Bridge
              </h1>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Acompanhe a conexão local, consulte projetos autorizados e verifique os limites de
              leitura da integração. O painel não publica credenciais nem habilita operações de escrita.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <StateTag
              connected={connected}
              text={busy === "summary" ? "Verificando…" : connected ? "Bridge local conectada" : "Conexão não disponível"}
            />
            <button type="button" onClick={() => void refreshSummary()} disabled={busy !== null}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-300/25 bg-sky-400/10 px-4 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-wait disabled:opacity-40">
              <RefreshCw className={cn("size-4", busy === "summary" && "animate-spin")} aria-hidden="true" />
              Atualizar estado
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Visão geral da integração" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Conexão" value={connected ? "Local ativa" : "Não disponível"}
          description={connected ? "Consulta confirmada neste servidor." : "Sem acesso validado neste servidor."} />
        <Stat label="OAuth Workspace"
          value={!connected ? "Não verificado" : summary?.status?.oauthConnected ? "Conectado" : "Pendente"}
          description="Estado informado pela Bridge local." />
        <Stat label="ADC Google Cloud"
          value={!connected ? "Não verificado" : summary?.status?.adcConfigured ? "Configurado" : "Pendente"}
          description="Credenciais verificadas no servidor, não no navegador." />
        <Stat label="Política" value="Somente leitura"
          description="Duas consultas permitidas; escrita e geração desabilitadas neste painel." />
      </section>

      <section className="rounded-2xl border border-white/10 bg-panel/60 p-2">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-5" role="tablist" aria-label="Seções Google Bridge">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id}
                onClick={() => openTab(item.id)}
                className={cn("inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm",
                  tab === item.id ? "bg-sky-400/10 text-sky-100 ring-1 ring-sky-400/20"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white")}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {error ? (
        <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {tab === "connection" ? (
        <Panel title="Estado da conexão" subtitle="Consulta em tempo real, quando o Cockpit está no mesmo computador da Bridge.">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="flex items-start gap-3">
                {connected ? <CheckCircle2 className="mt-0.5 size-5 text-emerald-300" aria-hidden="true" />
                  : <ShieldOff className="mt-0.5 size-5 text-amber-300" aria-hidden="true" />}
                <div>
                  <h3 className="font-semibold text-white">
                    {connected ? "Serviço local encontrado" : "Conexão local não confirmada"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {connected
                      ? "A API do Cockpit acessou a Bridge em loopback. Nenhuma credencial foi enviada ao navegador."
                      : "Este Cockpit não está autorizado a consultar a Bridge instalada em outro computador. A interface não usa dados fictícios para preencher esta visão."}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="Serviço" value={summary?.status?.service || "Não verificado"}
                  description="Identidade devolvida pelo conector." />
                <Stat label="Versão" value={summary?.status?.version || "—"}
                  description="Versão reportada pela instância local." />
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <h3 className="font-semibold text-white">Proveniência e segurança</h3>
              <div className="space-y-3 text-sm text-slate-400">
                <p><strong className="text-slate-200">Host:</strong> somente o computador que executa a Bridge.</p>
                <p><strong className="text-slate-200">Operações:</strong> status e listagem de projetos.</p>
                <p><strong className="text-slate-200">Última consulta:</strong> {timestamp(summary?.checkedAt)}</p>
                <p><strong className="text-slate-200">Trace:</strong> <Code>{summary?.status?.traceId || "Não disponível"}</Code></p>
              </div>
              <a href={summary?.policy.provenance || "https://github.com/leon337/multiagent-collaboration-framework"}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-100">
                Ver contrato no GitHub <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === "projects" ? (
        <Panel title="Projetos Google Cloud"
          subtitle="Projetos retornados pela conta Google autorizada. Nenhum projeto é inventado ou armazenado no frontend.">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-500">
              {projects ? `${projects.projects.length} projeto(s) · ${timestamp(projects.checkedAt)}` : "Sem consulta nesta sessão"}
            </span>
            <button type="button" disabled={!connected || busy !== null} onClick={() => void loadProjects()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
              <RefreshCw className="size-4" aria-hidden="true" /> Consultar projetos
            </button>
          </div>
          {projects?.projects.length ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.035] text-xs uppercase tracking-wide text-slate-500">
                  <tr><th scope="col" className="px-4 py-3">Projeto</th><th scope="col" className="px-4 py-3">ID</th><th scope="col" className="px-4 py-3">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {projects.projects.map((item) => (
                    <tr key={item.projectId} className="text-slate-300">
                      <td className="px-4 py-4 font-semibold text-white">{item.displayName || <span className="font-normal italic text-slate-500">Nome não informado</span>}</td>
                      <td className="px-4 py-4"><Code>{item.projectId}</Code></td>
                      <td className="px-4 py-4">{item.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-400">
              {!connected ? "Conecte o Cockpit ao runtime local para consultar projetos." :
                projects ? "A consulta não retornou projetos." : "Execute uma consulta para preencher a tabela com dados reais."}
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">
            Os identificadores vêm da Google Cloud Resource Manager por meio da Bridge local, sem acesso direto do navegador às credenciais.
          </p>
        </Panel>
      ) : null}

      {tab === "permissions" ? (
        <Panel title="Permissões e limites"
          subtitle="Política de acesso definida pelo MCF. O painel não oferece ações de administração do Google Cloud.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-5">
              <h3 className="flex items-center gap-2 font-semibold text-emerald-200"><ShieldCheck className="size-5" /> Permitidas</h3>
              <div className="mt-4 space-y-3">
                {(summary?.policy.operations || []).map((op) => (
                  <div key={op.id} className="rounded-xl bg-black/15 p-3 text-sm">
                    <span className="block font-semibold text-white">{op.id}</span>
                    <span className="mt-1 block font-mono text-xs text-emerald-200">{op.bridge}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.035] p-5">
              <h3 className="flex items-center gap-2 font-semibold text-rose-200"><LockKeyhole className="size-5" /> Bloqueadas</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(summary?.policy.blocked || []).map((op) => (
                  <span key={op} className="rounded-xl border border-rose-400/10 bg-black/20 px-3 py-2 text-sm text-rose-100">{op}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-slate-400">
            Skill <Code>{summary?.policy.skillId || "MCF-GOOGLE-CLOUD-READ"}</Code>
            <span className="mx-2">·</span>
            Perfil <Code>{summary?.policy.permissionProfile || "READ_ONLY"}</Code>
            <p className="mt-3 text-xs">Permissões configuradas não significam conexão ativa ou autorização para ações pagas.</p>
          </div>
        </Panel>
      ) : null}

      {tab === "tests" ? (
        <Panel title="Testes de leitura"
          subtitle="Diagnóstico real e não destrutivo; consulta somente o estado da Bridge e a listagem de projetos.">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-slate-500">{tests ? `Executados em ${timestamp(tests.checkedAt)}` : "Nenhum teste nesta sessão"}</span>
            <button type="button" disabled={!connected || busy !== null} onClick={() => void runTests()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40">
              <FlaskConical className="size-4" aria-hidden="true" /> {busy === "tests" ? "Executando…" : "Executar teste"}
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {tests?.tests.map((test) => (
              <div key={test.operation} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                <div><strong className="block text-sm text-white">{test.operation}</strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {test.traceId ? `Trace ${test.traceId}` : test.code || "Sem trace disponível"}
                  </span>
                </div>
                <StateTag connected={test.outcome === "PASS"} text={test.outcome} />
              </div>
            )) || <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              {connected ? "O teste ainda não foi executado." : "Testes indisponíveis neste host. Nenhum PASS fictício será mostrado."}
            </p>}
          </div>
          <p className="mt-4 text-xs text-slate-500">PASS confirma somente consultas da Bridge, não valida uma missão E2E com ledger do MissionRuntime.</p>
        </Panel>
      ) : null}

      {tab === "audit" ? (
        <Panel title="Auditoria das consultas"
          subtitle="Histórico real do arquivo local da Bridge; se indisponível, últimas consultas deste painel durante o processo atual.">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">{audit?.persistent ? "Fonte: arquivo de auditoria da Bridge (persistido)" : "Fonte: consultas deste painel (memória volátil)"}</span>
            <button type="button" disabled={!connected || busy !== null} onClick={() => void loadAudit()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40">
              <RefreshCw className="size-4" /> Atualizar registros
            </button>
          </div>
          {audit?.events.length ? (
            <div className="space-y-2">
              {audit.events.map((entry, index) => (
                <div key={entry.at + entry.operation + index}
                  className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.015] p-4 text-sm sm:grid-cols-[180px_1fr_110px]">
                  <span className="text-slate-400">{timestamp(entry.at)}</span>
                  <span className="min-w-0"><strong className="block text-white">{entry.operation}</strong>
                    <span className="mt-1 block break-all font-mono text-xs text-slate-500">{entry.traceId || "sem trace"}</span></span>
                  <span className={entry.outcome === "SUCCEEDED" ? "text-emerald-200" : "text-rose-200"}>{entry.outcome}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              {connected ? "Ainda não há consultas registradas neste processo." : "Registros locais não disponíveis neste servidor."}
            </p>
          )}
          <p className="mt-4 text-xs leading-6 text-amber-200/80">
            As evidências exibidas são locais. Mesmo quando persistidas pela Bridge, não substituem recibos assinados nem o ledger canônico do MissionRuntime.
          </p>
        </Panel>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-xs text-slate-500">
        <span>MCF · Google Cloud · Escopo somente leitura · Credenciais nunca expostas ao navegador</span>
        <span>Estado observado: {timestamp(summary?.checkedAt)}</span>
      </footer>
    </div>
  );
}
