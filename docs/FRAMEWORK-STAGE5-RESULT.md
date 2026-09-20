# Stage 5 — React Framework Migration Result

Mission: `MCF-COCKPIT-NEXT-FRAMEWORK-001`
MCF Issue: #284

## Implemented stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui conventions with Radix UI primitives
- Lucide React
- TanStack Query
- Zod

The existing `/api/github` and `/api/ecosystem` endpoints remain the source of truth.

## Parallel execution

Four isolated worktrees/processes produced independent patch receipts:

- Sofia — architecture/scaffold — PID 269008
- Helena — frontend/data — PID 269129
- Isabela + Marina — UI/accessibility — PID 269209
- Renato + Ricardo — QA/security — PID 269316

Gabriel consolidated the four commits on `feat/framework-react-stage5`.

This demonstrates process/worktree isolation and deterministic receipts. It does **not** demonstrate independent LLM cognition.

## Typography and responsiveness

The legacy UI used several 7–10px values. The React version removes microfonts:

- body: 16px baseline;
- eyebrow/badge: 12px minimum;
- supporting text: 14–16px;
- normal explanatory text: 16–18px;
- dialog title: 24–34px depending on viewport;
- large display scaling: 18px root at 1920px;
- no horizontal overflow in tested viewports.

The Project Card uses a Radix Dialog on desktop and a bottom-sheet layout below 640px.

## Data layer

```text
/api/github + /api/ecosystem
             ↓
           Zod
             ↓
      TanStack Query
             ↓
        React views
```

## Security/privacy

A registered private project was rendered with:
- no public GitHub action;
- no private branch/language/issues metadata;
- only public Registry identity/entrypoints;
- explicit private-safe explanation.

Runtime dependency audit: 0 vulnerabilities.

## Build

- TypeScript strict: PASS
- Vite production build: PASS
- Stage 5 automated checks: 10/10 PASS
- Runtime npm audit: PASS
