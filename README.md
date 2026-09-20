# MCF Cockpit Next

Novo cockpit incremental do ecossistema MCF.

## Etapa 1

A primeira entrega contém somente:

- conta pública do GitHub `leon337`;
- repositórios públicos selecionados como parte do ecossistema MCF;
- metadados reais do GitHub;
- busca local;
- proveniência da fonte.

Nenhum estado do Linux, VoiceHub ou agentes locais é inferido nesta etapa.

## Desenvolvimento

```bash
npm run check
```

A API serverless está em `/api/github`.

## Seleção de repositórios

A classificação fica em `config/mcf-repositories.json`. A seleção não altera os metadados: nomes, branches, stars, forks, issues e timestamps são retornados pelo GitHub.
