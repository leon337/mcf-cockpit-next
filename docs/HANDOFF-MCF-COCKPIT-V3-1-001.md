# HANDOFF CANÔNICO — MCF Cockpit Next / V3.1

Mission: `MCF-COCKPIT-V3-1-001`
MCF Issue: `#296`
Project: `leon337/mcf-cockpit-next`
Human authority: `LEANDRO`

## 1. Estado atual

A V3.1 está **IMPLEMENTADA, VALIDADA, AUDITADA E MERGEADA**.

Não reiniciar a implementação V3.1.

Implementation merge:

```text
3d0284de11957b476bf212dfbfd63d9c49dfac48
```

PR:

```text
#9 — feat: V3.1 operability and navigation hardening
```

Candidato final auditado antes do merge:

```text
39fd4fced5af30dc2a1f14617b0c8a0025237f11
```

## 2. Auditoria pública

URL:

```text
https://mcf-cockpit-next-v31-audit.onrender.com
```

Render:

```text
service: srv-dannudqjnfac73992m6g
deploy:  dep-dano033tqb8s73an0big
status:  live
```

O deploy do candidato final repetiu build e regressões.

## 3. Entregas V3.1

A V3.1 acrescentou:

- estado canônico de navegação em URL;
- browser back/forward via `popstate`;
- deep links para view, área, projeto, tab e missão;
- busca contextual e recuperável;
- filtros de missão persistidos;
- Mission Detail read-only com corpo público da Issue;
- Insights navegáveis até Project Card;
- filtros do Grafo por área e proveniência;
- ativação dos nós do Grafo por teclado;
- terminologia de “Proveniência” no Project Card;
- verificador `test:v3.1`.

## 4. Parâmetros canônicos de URL

```text
view
area
project
tab
mission
missionState
q
graphGroup
graphEvidence
```

A URL agora participa da continuidade do produto. Back/forward e reload não devem ser tratados como detalhe cosmético.

## 5. Fontes de verdade preservadas

- MCF Project Registry;
- MCF Current State;
- GitHub public API;
- GitHub public Issues;
- regras determinísticas documentadas.

Não adicionar:

- dados privados inferidos;
- progresso inventado;
- health score;
- dependências sem evidência;
- Execution Plane dentro desta linha V3.x.

## 6. Gates executados

No Render auditado:

```text
npm run check       PASS
npm run build       PASS
npm run test:stage5 PASS
npm run test:v3     PASS
npm run test:v3.1   PASS
V3.1 verifier       failures: []
Render build        successful
Render runtime      live
```

## 7. Reserva de auditoria

Resultado:

```text
PASS_WITH_RESERVATIONS
```

A reserva é específica:

```text
fresh browser visual QA: NOT_EXECUTED
```

Motivo observado:

- Firecrawl scrape bloqueado por créditos insuficientes;
- Firecrawl interact bloqueado por créditos insuficientes;
- fallback HTTP externo do ambiente sem resolução DNS.

Não transformar a QA visual histórica da V3 em evidência fresh da V3.1.

Essa reserva **não representa uma falha funcional detectada**; representa ausência de uma classe específica de evidência.

## 8. Status GitHub externo

Durante o PR #9, o status Vercel permaneceu vermelho por:

```text
build-rate-limit / upgradeToPro
```

Esse status é externo ao conteúdo V3.1. O PR estava `mergeable=true` e o gate Render próprio passou.

## 9. PRF

Pacote:

```text
artifacts/phases/PHASE-01-V3-1-IMPLEMENTATION/
```

Receipt:

```text
artifacts/missions/MCF-COCKPIT-V3-1-001/consolidated-receipt.json
```

`cognitiveIndependenceProven=false`.

## 10. O que NÃO fazer na retomada

Não:

- reconstruir V3 ou V3.1;
- trocar framework;
- remover os boundaries de proveniência;
- voltar a estado local desconectado quando o estado é navegável;
- alegar fresh browser QA PASS sem evidência nova;
- transformar o Cockpit em Execution Plane por inferência;
- abrir V4 apenas por numeração.

## 11. Próximo boundary

V3.1 está encerrada.

A próxima sessão deve começar por:

```text
1. abrir este handoff;
2. observar a auditoria pública;
3. avaliar V3.1 como produto;
4. coletar feedback humano de LEANDRO;
5. decidir se existe incremento V3.2 ou capability boundary V4;
6. criar nova missão MCF antes de nova implementação.
```

V4 continua reservado para mudança material como:

- operações autenticadas;
- escrita governada;
- Execution Plane;
- runtime bidirecional;
- dados privados autorizados.

## 12. Regra de continuidade

Este handoff tem precedência sobre memória informal quando houver divergência sobre o estado V3.1.

Sempre verificar GitHub/Render live antes de afirmar valores voláteis.
