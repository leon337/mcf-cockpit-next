# HANDOFF CANÔNICO — MCF Cockpit Next / V3

Mission: `MCF-COCKPIT-V3-001`
MCF Issue: `#291`
Project: `leon337/mcf-cockpit-next`
Human authority: `LEANDRO`

## 1. Estado atual

A Prototype V3 está **CONCLUÍDA, AUDITADA E MERGEADA**.

Não reiniciar a implementação V3.

Main atual observado no handoff:

```text
fd70a4c feat: evolve Cockpit Next to Mission Control V3 (#6)
```

V3 product integration commit auditado:

```text
da19df5b817214c16a6507c10562420c1fbb1102
```

Public audit:

```text
https://mcf-cockpit-next-v3-audit.onrender.com
```

Render deploy auditado:

```text
dep-danm5bmgekts739duidg
```

## 2. Registro no MCF

O projeto já está registrado no Project Registry do MCF.

Registry merge:

```text
9f5fc4e9 feat(registry): register mcf-cockpit-next (#292)
```

Entry:

```text
context/projects/mcf-cockpit-next.yaml
```

Capsule local:

```text
.mcf/project-capsule.yaml
```

A Capsule está com:

```text
current_phase.status: COMPLETE
audit.result: PASS
```

## 3. Escopo V3 entregue

A V3 contém:

- Mission Control shell;
- sidebar desktop;
- navegação mobile;
- visão Ecossistema;
- Grafo de relações;
- Projetos;
- Missões reais;
- Insights determinísticos;
- Project Card V2 preservado;
- boundary de privacidade preservado.

Navegação canônica:

```text
Ecossistema → Grafo → Projetos → Missões → Insights
```

## 4. Fontes de verdade

O Cockpit não deve inventar dados.

Fontes válidas:

- MCF Project Registry;
- MCF Current State;
- GitHub public API;
- GitHub public Issues;
- regras determinísticas documentadas.

APIs principais:

```text
/api/github
/api/ecosystem
/api/missions
```

## 5. Missões reais

Fonte:

```text
GitHub Issues — leon337/multiagent-collaboration-framework
```

Regra:

- issue pública;
- título iniciado por `MCF-<code>`;
- PRs excluídos;
- estado somente `open/closed`;
- sem percentual de progresso inventado.

No audit da V3:

```text
19 missões na janela atual
11 abertas
8 encerradas
MCF-COCKPIT-V3-001 presente
```

Essas contagens são observações daquele audit e podem mudar.

## 6. Insights determinísticos

Regras atuais:

```text
registry.status === NOT_IN_PROJECT_REGISTRY
registry.status === REFERENCED_NOT_REGISTERED
registry.status === REGISTERED && repository === null
repository.updatedAt < now - 30 days
repository.archived === true
```

Interpretar como observações, não como health score, ranking ou avaliação de qualidade.

## 7. Paralelismo executado

Modelo:

```text
MCF-EXECUTE-LOCAL-TEAM-compatible worktree/process isolation
```

Não alegar cognição independente.

```text
cognitiveIndependenceProven=false
```

Receipts:

### WS-A — Shell + Grafo
- Helena + Isabela
- PID 355819
- commit `6e2de412144699f35d057adb42d662f2285cb042`

### WS-B — Missões
- Tiago + Helena
- PID 356166
- commit `e251ebcb2b67b9c924ce4ac2136f0beb8ee0c5fc`

### WS-C — Insights
- Beatriz + Ricardo
- PID 356424
- commit `3afbbed555737acc3a926ecc062a4d0900062a3d`

### WS-D — QA
- Renato + Marina
- PID 356627
- commit `2fcb0b1ffa7a3a478ddfce68176e358d49df0b5e`

Consolidated receipt:

```text
artifacts/missions/MCF-COCKPIT-V3-001/consolidated-receipt.json
```

## 8. Gates já concluídos

Não repetir sem motivo.

```text
TypeScript strict        PASS
Vite build               PASS
V3 verifier              28/28 PASS
Stage 5 regression       10/10 PASS
API syntax               PASS
git diff --check         PASS
private-project boundary PASS
public Render audit      PASS
```

Browser QA observado:

- mobile breakpoint: sem overflow horizontal;
- 768px: sem overflow;
- 1440px: sem overflow;
- 1920px: sem overflow;
- Project Dialog dentro da viewport;
- grafo usa scroll horizontal controlado no mobile;
- sidebar desktop / bottom nav mobile funcionando.

## 9. Arquivos que devem ser lidos primeiro na retomada

Ordem obrigatória:

1. `docs/HANDOFF-MCF-COCKPIT-V3-001.md`
2. `.mcf/project-capsule.yaml`
3. `docs/PROTOTYPE-V3-RESULT.md`
4. `artifacts/missions/MCF-COCKPIT-V3-001/consolidated-receipt.json`
5. `docs/V3-QA-CONTRACT.md`
6. `docs/V3-EXECUTION-PLAN.md`

Para estado canônico do ecossistema:

7. MCF `context/projects/mcf-cockpit-next.yaml`
8. MCF `docs/MCF-CURRENT-STATE.md`

## 10. O que NÃO fazer na retomada

Não:

- recriar a V3;
- reabrir worktrees antigos;
- trocar framework;
- refatorar a stack sem necessidade;
- inventar relações de dependência;
- inferir dados privados;
- transformar insights em score;
- assumir que contagens históricas ainda são atuais;
- alegar que os workers eram agentes cognitivos independentes.

## 11. Próximo ponto de retomada

A V3 está encerrada.

A próxima sessão deve começar por:

```text
1. abrir a auditoria pública da V3;
2. avaliar a experiência como produto;
3. coletar feedback humano de LEANDRO;
4. só então definir o próximo incremento (V3.x ou V4);
5. criar nova missão MCF para qualquer nova evolução.
```

Se LEANDRO pedir apenas continuidade da missão atual, responder que a V3 já está concluída e partir do audit/product review, sem reconstruir nada.

## 12. Regra de continuidade

Este handoff tem precedência sobre memória informal desta conversa quando houver divergência sobre o estado V3.

Sempre verificar o estado live de `main`, MCF Registry e audit URL antes de fazer novas afirmações operacionais.
