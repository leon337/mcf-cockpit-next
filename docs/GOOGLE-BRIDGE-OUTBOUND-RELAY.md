# MCF — Canal de saída autenticado Google Bridge ↔ Cockpit Next

**Missão:** MCF-GOOGLE-BRIDGE-SECURE-REMOTE-20261120.
**Autoridade humana:** LEANDRO. **Orquestração:** MESTRE.
**Boundary:** integração MCF Cockpit Next; o MissionRuntime MCF central permanece separado.

## Objetivo

Conectar o painel Vercel à Google Bridge em `mcf-gpu-x99` SEM abrir a porta
`127.0.0.1:8755` nem enviar tokens Google para a nuvem. O agente local
consulta a Bridge, sanitiza **somente** status, projetos e eventos recentes
e envia periodicamente um snapshot assinado por HTTPS. O painel remoto
requer pareamento do usuário LEANDRO antes de exibir informação privada.

```text
Google Cloud
   ^ (OAuth/ADC: permanecem em mcf-gpu-x99)
Google Bridge [localhost:8755]
   ^ consulta local (Bearer privado)
Agente MCF local [systemd timer, saída HTTPS]
   | HMAC-SHA256 + timestamp + UUID anti-replay, POST outbound
   v
Vercel API /api/google-bridge-ingest
   | allowlist + HMAC + schema estrito + replay ledger
   v
Neon project mcf-central-operacoes / schema mcf_bridge
   ^
Vercel API /api/google-bridge [cookie HttpOnly, 12h]
   ^
Cockpit UI público [pareamento privado obrigatório]
```

## Operações e segurança

- **Local:** `google.status` e `google.cloud.projects`. Nenhum payload
  arbitrário fornecido pelo navegador é enviado à Bridge. Nenhum comando
  remoto ou ação de escrita é aceito.
- **Agente:** `tools/google-bridge-outbound-agent.mjs`, token local 0600,
  endereço de ingestão HTTPS allowlisted e key HMAC apenas no host.
  Padrão timer 5 minutos; nenhuma porta de entrada nova.
- **Webhook:** `POST /api/google-bridge-ingest`, `x-mcf-timestamp`,
  `x-mcf-nonce`, `x-mcf-signature`; janela temporal 120 s,
  UUID único, registro anti-replay no banco e recusa por padrão.
- **Dados:** `sourceId`, `publishedAt`, status OAuth/ADC booleanos,
  lista de no máximo 20 projetos (IDs/nomes/estado), dois checks tipados
  com trace UUID e até 30 eventos locais sanitizados. **Nunca** enviar
  access/refresh token, chave OAuth, bearer, segredo de sessão, conteúdo
  de Gmail/Drive, nome de usuário ou variáveis de ambiente.
- **Persistência:** schema isolado `mcf_bridge` do projeto Neon
  `mcf-central-operacoes`; tabelas `snapshots`, `ingest_receipts`,
  `auth_limits`. Role `mcf_bridge_gateway` limitada ao schema
  (sem permissão de leitura em `public.mcf_records`).
- **Acesso:** código aleatório de 256 bits criado no host local, somente
  seu SHA-256 fica na Vercel. O browser não recebe token de banco;
  sessão MAC no cookie `HttpOnly; Secure; SameSite=Strict; Max-Age=43200`.
  O código não deve ir para a URL e não deve ser colado em Issues/PRs.
  Login limitado no Neon (7 tentativas/20 minutos).
- **Frescor:** snapshots acima de 15 min são explicitamente
  `stale=true`. O painel não deve apresentar testes em cache como
  execução ao vivo; mostra `STALE` para testes atrasados.
- **Falha fechada:** se configuração de produção incompleta, banco não
  acessível, sessão ausente, assinatura inválida ou host diferente,
  não divulgar projetos, auditoria ou bearer.

## Ativação (somente após gates e E2E)

Variáveis Vercel *Production* do projeto `predix-ai-br/mcf-cockpit-next`:

```text
MCF_BRIDGE_REMOTE_ENABLED=true
MCF_BRIDGE_DATABASE_URL=<Neon URI role restrita, segredo>
MCF_BRIDGE_INGEST_SECRET=<256 bits hexadecimal, segredo>
MCF_BRIDGE_REMOTE_PASSCODE_SHA256=<SHA256 do código privado>
MCF_BRIDGE_SESSION_SECRET=<256 bits, segredo>
```

**Não versionar valores reais.** No host local, manter
`~/.config/mcf-google-bridge/remote-publisher.env` 0600 com chave
HMAC e URL fixa `https://mcf-cockpit-next.vercel.app/api/google-bridge-ingest`.
Ativar somente depois de promover o código correto:

```bash
systemctl --user link /home/leo/mcf-cockpit-next/ops/systemd/mcf-google-bridge-outbound.service
systemctl --user link /home/leo/mcf-cockpit-next/ops/systemd/mcf-google-bridge-outbound.timer
systemctl --user daemon-reload
systemctl --user enable --now mcf-google-bridge-outbound.timer
systemctl --user start mcf-google-bridge-outbound.service
systemctl --user status mcf-google-bridge-outbound.service --no-pager
```

O shell acima é instrução operacional, não prova de execução. Em caso de
revisão/rollback, usar `systemctl --user disable --now
mcf-google-bridge-outbound.timer` e `MCF_BRIDGE_REMOTE_ENABLED=false`
na Vercel **seguido de redeploy** (ambiente novo).

## Critérios de aceitação

1. Testes Node `npm run check`; typecheck e build Vite em commit exato.
2. Regressão das telas locais, com `MCF_BRIDGE_REMOTE_ENABLED=false`.
3. Integração assinada do worker → endpoint com secret real → Neon
   `ingest_receipts` e `snapshots`, sem dados sensíveis no log.
4. Login HTTPS pareado pelo LEANDRO; sem cookie, listagem 401;
   sessão expirada 401; logout apaga cookie.
5. E2E visual desktop/celular; estado stale e falha de rede.
6. Segurança independente e gate de promoção antes de habilitar
   qualquer ponte privada na produção.

## Limites intencionais

Este serviço faz publicação **somente de snapshots tipados, periódicos**.
Não é uma sessão de agente genérico nem um canal bidirecional de comandos.
A consulta remota não substitui HDF, ledger/recibos assinados ou gates do
MissionRuntime central. Nunca confundir o `ingest_receipts` com a
auditoria de ações do MissionRuntime.
