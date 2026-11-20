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


## Google Bridge — painel local (MVP)

O Cockpit V3.1 contém uma seção **Google Bridge**, disponível pela navegação ou em
`/?view=google-bridge`. Há cinco abas: conexão, projetos Google Cloud, permissões,
testes de leitura e auditoria. O frontend nunca recebe tokens Google. A API é
*local-only* e desabilitada por padrão: um site hospedado exibe **não conectado**
em vez de simular dados.

Para operar no computador que já executa a Bridge, consulte
[`docs/GOOGLE-BRIDGE-PANEL.md`](docs/GOOGLE-BRIDGE-PANEL.md). Não habilite a
integração local na Render/Vercel nem exponha a porta via proxy público.
