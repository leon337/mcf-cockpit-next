# Stage 5 — QA / Security Contract

Mission: MCF-COCKPIT-NEXT-FRAMEWORK-001

## Required gates

- TypeScript strict typecheck.
- Vite production build.
- React app loads `/api/github` and `/api/ecosystem`.
- Zod validates both responses.
- TanStack Query owns client cache/refetch.
- Project Card uses an accessible dialog primitive.
- GitHub remains secondary action.
- Private registered projects do not gain private metadata.
- No arbitrary font size below 12px.
- Base body text is 16px or larger.
- Large-screen scaling exists.
- Reduced-motion handling exists.
- 390×844, 768×1024, 1440×900 and 1920×1080 browser checks.
- Secret scan before publication.

These checks validate implementation boundaries; they do not establish independent cognition for local workers.
