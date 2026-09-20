# DECISIONS — PHASE-01-V3-1-IMPLEMENTATION

## D-001 — Stack congelada preservada

React/TypeScript/Vite/Tailwind/Radix/TanStack/Zod permanecem.

## D-002 — URL como contrato de continuidade

Estados relevantes de navegação passam a ser serializados na URL em vez de dependerem de estados locais desconectados.

## D-003 — Mission Detail read-only

O corpo público da Issue pode ser exibido internamente. Nenhuma escrita GitHub é introduzida.

## D-004 — Grafo permanece evidencial

Filtros reduzem ruído; não criam novas relações ou dependências.

## D-005 — Gate de auditoria

Decisão: `APROVAR_COM_RESSALVAS`.

Justificativa:
- build, regressões e runtime: PASS;
- browser visual fresh: evidência indisponível por limitação externa de tooling;
- nenhuma falha visual nova foi observada, mas também não é alegado PASS visual.

## D-006 — V4 continua fora do escopo

V4 permanece reservado para capability boundary materialmente novo.
