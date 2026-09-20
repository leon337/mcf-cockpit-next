# PLAN — PHASE-01-V3-1-IMPLEMENTATION

Mission: MCF-COCKPIT-V3-1-001
MCF Issue: #296
Risk class: B

## Objetivo

Evoluir a V3 para uma experiência read-only mais operacional, recuperável e compartilhável sem mudar a stack nem o boundary de dados.

## Workstreams

- WS-A — URL state, deep links e browser history;
- WS-B — busca contextual e Mission Detail;
- WS-C — Insights navegáveis e filtros/foco no Grafo;
- WS-D — regressão, build e auditoria.

## Invariantes

- no fabricated data;
- no inferred private metadata;
- no fabricated progress;
- no undocumented dependency claims;
- no framework replacement;
- no Execution Plane;
- no external write actions.

## Aceite

- URL reproduz estados relevantes;
- back/forward restaura navegação;
- busca deixa de parecer inerte;
- missão é entendível dentro do Cockpit;
- Insights abrem projetos afetados;
- Grafo filtra por evidência sem inventar relações;
- V3 regression continua verde;
- privacy boundary permanece.
