# MCF Cockpit Next — Product Review pós-V3

Mission: `MCF-COCKPIT-REVIEW-001`
MCF Issue: `#295`
Baseline reviewed: `main@c75a58bc2ef06acb23ee5aec9ebfb02ea2cc07df`
Product lineage: `MCF-COCKPIT-V3-001`
Review class: `B`

## 1. Resultado executivo

A V3 deve ser preservada como baseline estável. O próximo incremento recomendado é **V3.1 — Operability & Navigation Hardening**, não V4.

A razão é estrutural: o Cockpit já possui shell, dados reais, projetos, missões, grafo, insights e Project Card. Os gaps observados são principalmente de coerência de navegação, continuidade de estado e ação contextual. Eles podem ser resolvidos sem trocar stack, sem criar Execution Plane e sem ampliar a finalidade do produto.

V4 deve ficar reservada para uma mudança material de capacidade, como operações autenticadas, comandos governados, dados privados autorizados ou integração direta com o runtime de execução.

## 2. Evidências verificadas

- V3 concluída e auditada no handoff canônico.
- Capsule registra `current_phase.status: COMPLETE` e `audit.result: PASS`.
- MCF Registry contém `mcf-cockpit-next`.
- Issue V3 `#291` está encerrada.
- Render `mcf-cockpit-next-v3-audit` está live.
- Código atual usa React + TypeScript + Vite + Tailwind + Radix/TanStack/Zod conforme stack congelada.
- Nenhuma alteração funcional foi feita nesta revisão.

## 3. Achados de produto

### A. O Cockpit ainda é predominantemente observacional

A navegação principal é sólida, mas Projetos, Missões e Insights terminam majoritariamente em leitura ou link externo. Isso atende a V3, porém ainda não oferece continuidade operacional forte dentro do próprio Cockpit.

**Recomendação V3.1:** adicionar detalhes contextuais e trajetórias internas sem introduzir escrita externa.

### B. Estado de navegação não é plenamente recuperável

O app usa `history.replaceState` para `view` e `area`, porém não há tratamento de `popstate`. A seleção de projeto feita por clique não atualiza o parâmetro `project`; as tabs do Project Card leem `tab`, mas não persistem mudanças de tab na URL.

Efeito: copiar URL, voltar/avançar no navegador ou compartilhar uma posição exata do Cockpit pode não reconstruir integralmente o estado visual atual.

**Recomendação V3.1:** definir um modelo canônico de URL para `view`, `area`, `project`, `tab`, filtros e missão selecionada, com restauração por back/forward.

### C. Busca global tem semântica inconsistente

O header promete “Buscar projetos, missões…”. O valor de busca é consumido por Projetos, Missões e Insights, mas não por Ecossistema nem Grafo.

Efeito: dependendo da tela ativa, digitar na busca pode não produzir feedback visível.

**Recomendação V3.1:** tornar a busca contextual e explícita, ou aplicar o filtro também às superfícies de Ecossistema/Grafo.

### D. Missões precisam de detalhe interno

A V3 lista issues reais, estado, labels, comentários e link externo. Ainda não existe uma ficha de missão dentro do Cockpit.

**Recomendação V3.1:** Mission Detail read-only com dados públicos verificáveis, mantendo GitHub como fonte e sem inventar progresso.

### E. Insights são transparentes, porém pouco navegáveis

As regras são explícitas e corretas para o boundary atual. Entretanto os projetos afetados aparecem como chips não interativos.

**Recomendação V3.1:** tornar cada projeto afetado navegável para o Project Card e permitir foco do conjunto correspondente.

### F. Grafo é correto para V3, mas tem limite de escala

O grafo radial conecta o núcleo aos demais nós e comunica provenance/trust. Com crescimento do inventário, o layout estático tende a aumentar densidade visual.

**Recomendação V3.1:** filtros por área/proveniência, foco de nó e redução progressiva de ruído antes de considerar uma engine de grafo mais complexa.

### G. Linguagem de “Confiança” pode ser interpretada como avaliação do projeto

No Project Card, `trustFor(node)` aparece como “Confiança”. O modelo representa proveniência/evidência da relação, não qualidade do projeto.

**Recomendação V3.1:** preferir “Proveniência”, “Evidência” ou “Confiança da fonte”, preservando a regra de não produzir score de qualidade.

## 4. O que não deve entrar em V3.1

- escrita em Issues/PRs;
- execução de comandos;
- autenticação para dados privados;
- controle de agentes;
- mutações em runtime;
- novo framework;
- health score;
- inferência de dependências não documentadas.

Esses itens caracterizam um boundary maior e podem justificar V4.

## 5. Missão sucessora proposta

### `MCF-COCKPIT-V3-1-001 — Operability & Navigation Hardening`

Objetivo: transformar a V3 em uma experiência read-only mais operacional e recuperável, preservando a arquitetura e a verdade dos dados.

Escopo inicial:
1. URL state canônico + back/forward;
2. deep links completos para view/area/project/tab/mission;
3. busca contextual previsível;
4. Mission Detail read-only;
5. Insights → Project Card;
6. filtros/foco no grafo;
7. nomenclatura de proveniência;
8. regressão responsiva, teclado e privacidade.

Critérios de aceite:
- qualquer estado navegável relevante pode ser recarregado por URL;
- back/forward restaura a tela esperada;
- busca sempre produz efeito visível ou explica seu escopo;
- missão pode ser entendida sem sair do Cockpit;
- nenhum percentual de progresso é inferido;
- nenhum dado privado é inferido;
- V3 QA continua verde;
- stack permanece congelada.

## 6. Gate para V4

Só promover o produto a V4 quando houver decisão material de adicionar pelo menos uma destas capacidades:

- operações autenticadas;
- ações de escrita governadas;
- Execution Plane;
- integração runtime bidirecional;
- dados privados com autorização explícita;
- modelo de comando/approval/receipt dentro do Cockpit.

Até lá, evolução incremental deve permanecer na linha V3.x.
