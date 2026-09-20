# MCF Cockpit Next — Prototype V3 Result

Mission: MCF-COCKPIT-V3-001
MCF Issue: #291

## Product scope implemented

- Mission Control shell with desktop sidebar and mobile bottom navigation.
- Ecosystem dashboard using real counts.
- Evidence-backed relationship graph.
- Real missions feed from public MCF GitHub Issues.
- Deterministic insights with visible rule and source.
- Existing Project Card and private-repository boundary preserved.

## Data truth

### Ecosystem
Observed locally during integration:
- 20 nodes;
- 7 groups;
- 12 registered projects;
- 7 discovered outside Registry;
- 1 explicitly referenced without own Registry entry.

### Missions
Observed from GitHub public issues:
- 19 mission issues in the current 100-issue update window;
- 11 open;
- 8 closed;
- MCF-COCKPIT-V3-001 present.

No progress percentage is inferred.

## Insights rules

- registry.status === NOT_IN_PROJECT_REGISTRY
- registry.status === REFERENCED_NOT_REGISTERED
- registry.status === REGISTERED && repository === null
- repository.updatedAt older than 30 days
- repository.archived === true

These are deterministic observations, not health scores.

## Parallel execution

Four isolated worktrees/processes produced child receipts:

- WS-A — Helena + Isabela — PID 355819
- WS-B — Tiago + Helena — PID 356166
- WS-C — Beatriz + Ricardo — PID 356424
- WS-D — Renato + Marina — PID 356627

Gabriel integrated the commits on feat/v3-mission-control.

cognitiveIndependenceProven=false.

## Current state

Code, local browser QA and public Render audit are green.

Public audit: https://mcf-cockpit-next-v3-audit.onrender.com

Audited product commit: da19df5b817214c16a6507c10562420c1fbb1102

Render deploy: dep-danm5bmgekts739duidg
