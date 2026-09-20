# MCF Cockpit V3 — QA Contract

Mission: MCF-COCKPIT-V3-001

## Structural gates

- project registered in MCF;
- local project Capsule exists;
- V3 navigation has Ecosystem, Graph, Projects, Missions and Insights;
- relation graph exposes provenance and does not claim dependency without evidence;
- Missions source is real public GitHub Issues;
- pull requests are excluded from Missions;
- no fabricated progress percentage;
- Insights rules and sources are visible;
- no health score is fabricated;
- private repository boundary from V2 remains intact.

## Build gates

- TypeScript strict;
- Vite production build;
- node syntax for every API route;
- git diff --check;
- runtime dependency audit;
- literal secret scan.

## Browser gates

Viewports:
- mobile breakpoint (Chrome QA minimum width exercising <640 styles);
- 768px;
- 1440px;
- 1920px.

Check:
- no horizontal overflow;
- sidebar hidden/mobile nav shown below desktop breakpoint;
- relationship graph horizontally scrollable on mobile rather than clipped;
- Project Dialog remains inside viewport;
- Missions cards readable;
- Insights rules readable.

## Data gates

Missions:
- source repository is leon337/multiagent-collaboration-framework;
- state is GitHub open/closed;
- labels and timestamps are public GitHub fields;
- no invented completion percentage.

Insights:
- outside Registry;
- explicit reference without own Registry entry;
- registered without public repo metadata;
- public updatedAt older than 30 days;
- archived public repository.

These are deterministic observations, not evaluations.

## Non-claim

Worker/process isolation and receipts do not establish independent LLM cognition.
cognitiveIndependenceProven=false.
