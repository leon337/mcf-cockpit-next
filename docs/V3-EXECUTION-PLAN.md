# MCF Cockpit Next — V3 Execution Plan

Mission: MCF-COCKPIT-V3-001
MCF Issue: #291

## Goal

Transform the V2 prototype into a visual Mission Control while preserving the stabilized frontend stack and real-data boundary.

## Phase 1 — Governance

- register mcf-cockpit-next in the MCF Project Registry;
- create .mcf/project-capsule.yaml;
- persist this execution plan.

## Phase 2 — Parallel product workstreams

### WS-A — Shell + Relationship Graph
Owners: Helena + Isabela

Deliverables:
- V3 navigation shell;
- ecosystem dashboard;
- evidence-backed relation graph;
- responsive desktop/mobile navigation.

### WS-B — Real Missions
Owners: Tiago + Helena

Deliverables:
- api/missions.js;
- Zod schema/query;
- Missions view using real public MCF issues;
- open/closed/labels/updated time/link only.

### WS-C — Deterministic Insights
Owners: Beatriz + Ricardo

Deliverables:
- deterministic insight rules;
- Insights view;
- transparent provenance and thresholds;
- privacy regression checks.

### WS-D — QA / Accessibility
Owners: Renato + Marina

Deliverables:
- V3 verifier;
- keyboard/landmark/overflow checks;
- private-project boundary regression;
- build/typecheck/secret scan contract.

## Phase 3 — Integration
Owner: Gabriel

- cherry-pick workstream commits;
- resolve interfaces only;
- no framework changes;
- produce consolidated receipt.

## Phase 4 — Audit

- strict TypeScript;
- Vite production build;
- real APIs;
- 500/768/1440/1920 viewports;
- public/private project checks;
- mission and insight provenance;
- public audit deployment.

## Phase 5 — Release

- PR;
- audit checkpoint on MCF #291;
- merge after gates;
- update Capsule status.

## V3 navigation

Ecossistema → Grafo → Projetos → Missões → Insights

## Data truth

No UI number may be presented as real unless it comes from:
- MCF Project Registry;
- MCF Current State;
- GitHub public API;
- an explicitly documented deterministic calculation.

## Insight rules

Initial rules:
- discovered outside Registry;
- referenced without own Registry entry;
- registered without public repo metadata;
- public repository inactive for more than 30 days based on updatedAt.

These are observations, not health scores.

## Non-claim

Parallel workers demonstrate process/worktree isolation and receipts only.
cognitiveIndependenceProven=false.
