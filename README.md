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

## Google Bridge — relay remoto autenticado (desligado por padrão)

A integração opcional de saída `mcf-gpu-x99 → HTTPS Vercel → Neon → Cockpit`
possui allowlist somente leitura, snapshots assinados, anti-replay,
pareamento privado com cookie HttpOnly e diagnóstico explícito de dados
desatualizados. Não são encaminhados tokens OAuth, nem abertos endpoints
do computador na internet. Consulte o runbook
[`docs/GOOGLE-BRIDGE-OUTBOUND-RELAY.md`](docs/GOOGLE-BRIDGE-OUTBOUND-RELAY.md).

**A integração não é ativada automaticamente pelo merge.** Para conectar
dados reais na Vercel, são obrigatórios provisionamento privado de
credenciais, teste E2E com Neon/HTTPS, revisão de segurança e gate de
produção. A UI mantém estado seguro de indisponibilidade até a conclusão.
