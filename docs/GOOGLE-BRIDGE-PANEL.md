# MCF Cockpit Next — Painel Google Bridge

**Missão:** MCF-COCKPIT-GOOGLE-BRIDGE-20261120
**Responsável:** MESTRE, com autorização de LEANDRO para implementar.
**Base:** integração canônica da Google Bridge do MCF, PR #559 / `main@e4a7108e80407189dabcdaabec288e005b02539e`.
**Estado:** MVP local de visualização governada; sem deploy público ou ativação de produção.

## Objetivo do produto

Evitar a confusão entre o endpoint de saúde (JSON) e uma interface visual. Adicionar ao Cockpit V3.1 um item **Google Bridge** com cinco abas:

1. Conexão: serviço, versão, OAuth, ADC, horário de consulta e trace.
2. Projetos Cloud: lista real retornada pela Google Bridge; campo de nome ausente é mostrado como **Nome não informado**, nunca substituído por nome inventado.
3. Permissões: skill canônica, allowlist de `google.status` e `google.cloud.projects`, bloqueios de escrita, geração e administração.
4. Testes: execução de duas consultas reais, somente leitura, com resultado individual PASS/FAIL.
5. Auditoria: últimas 30 linhas verificáveis de `audit.jsonl` local, **persistidas pela Bridge**. Se o arquivo não estiver acessível, mostrar explicitamente escopo de *consultas deste painel em memória*. Nenhuma opção equivale ao ledger canônico do MissionRuntime.

## Arquitetura

```text
MCF Cockpit V3.1 (React) → GET /api/google-bridge?view=...
                           → gate local fail-closed (Node server)
                           → leitura do arquivo de token 0600 do usuário Linux
                           → POST http://127.0.0.1:8755/v1/execute
                           → Google Bridge → Google Cloud Resource Manager
```

A aplicação do Cockpit **não** chama endpoints Google diretamente. O token nunca é devolvido ao navegador. O servidor responde somente a GET com `no-store`; o payload de envio contém unicamente a operação fixa e `args: {}`. As respostas são validadas, reduzidas a campos permitidos e limitadas a 64 KiB. A consulta tem timeout 40s, porque a autenticação ADC e a busca Cloud podem demorar mais que 12s.

**Segurança:** opção local desligada por padrão; quando `MCF_GOOGLE_BRIDGE_PANEL_ENABLED=true` no Node dedicado, o servidor é forçado a escutar apenas `127.0.0.1`. A API recusa hosts, sockets e ambientes hospedados incompatíveis (Render/Vercel). É proibido colocar tokens em frontend, configurar a flag em Render ou abrir o servidor em proxy/túnel público. Nenhuma execução de IAM, billing, alteração de projetos, escrita em Drive/Gmail ou geração de modelos foi habilitada.

Em hospedagem remota, o painel **continua renderizando**, mas indica que a Bridge local não está conectada. Não simula status, projetos ou PASS.

## Execução local

Requer Google Bridge previamente autorizada, com serviço `mcf-google-bridge.service` ativo, token privado e ADC válido no mesmo host/usuário Linux:

```bash
npm ci
npm run check
npm run build
PORT=3190 MCF_GOOGLE_BRIDGE_PANEL_ENABLED=true npm start
```

Abra `http://127.0.0.1:3190/?view=google-bridge` **somente no computador que hospeda o serviço**. Se o painel estiver exposto como site remoto, não tente fazê-lo acessar a Bridge local via `localhost` da hospedagem.

## Validação

- `npm run check`: typecheck TS, syntaxcheck Node e 12 testes de segurança/fluxo do endpoint.
- `npm run build`: compilação de produção React/Vite.
- Testes de rede pública bloqueada, operações permitidas, status/Cloud, token privado, respostas malformadas ou volumosas, erros sanitizados, auditoria persistente e projetos com `displayName` ausente.
- E2E local real: cabeçalho e rotas HTTP, status OAuth/ADC, projetos Google Cloud, testes e registro de auditoria. Registrar apenas contagens, estados e hashes, não tokens.
- Teste visual no navegador após build, com screenshot de evidência quando disponível.

## Riscos e próximos passos

- Este painel é independente do runtime de produção do MCF. O adaptador oficial tem outra política de recibos e um banco/ledger próprio; NÃO afirmar que estas consultas foram registradas no ledger central.
- Teste E2E do MissionRuntime central, reconciliação de autorizações e implantação da capacidade remota continuam dependências próprias.
- Acesso remoto futuro exige arquitetura com identidade de workload e comunicação autenticada, sem abrir a porta local 8755.
- Para status multi-host, criar feed assinado de telemetria mínima e RBAC explícito, mantendo projeto/conta ocultos para visitantes públicos.
- Preservar branch e PR do painel até revisão e promoção autorizada. O deploy desta UI não é implicado pelo merge da PR #559 do runtime MCF.
