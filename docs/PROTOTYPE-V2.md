# MCF Cockpit Next — Prototype V2

Mission: MCF-COCKPIT-PROTOTYPE-V2-001

## Objetivo

Evoluir a experiência do protótipo sem alterar a fundação técnica.

## Mapa navegável

Fluxo principal:

LEANDRO → MCF Core → Áreas → Área em foco → Projetos → Ficha

Cada área pode ser focalizada sem troca de página. O usuário mantém contexto e pode retornar ao mapa geral.

## Ficha V2

Abas:

- Visão geral
- MCF
- GitHub
- Atividade

### Visão geral
Explica o projeto em poucos segundos e mostra onde ele fica no ecossistema.

### MCF
Exibe somente relações sustentadas por evidência disponível:
- integração estrutural 4/4;
- presença no Project Registry;
- referência explícita no MCF;
- descoberta GitHub.

Nenhuma dependência ou relação de uso é inventada.

### GitHub
Mostra somente metadados públicos. Projetos privados preservam o boundary de privacidade.

### Atividade
Mostra timestamps públicos e lifecycle/estado operacional publicados. Commits, PRs ou eventos detalhados só serão incluídos quando houver fonte explícita.

## Invariantes

- stack congelada;
- APIs preservadas;
- sem dados fictícios;
- GitHub como ação secundária;
- privacidade preservada.
