# Etapa 4 — Project Cards

## Objetivo

Transformar cada projeto/repositório do Cockpit em uma entidade clicável que abre
uma ficha interna de leitura rápida.

A ficha deve permitir responder em poucos segundos:

1. o que é;
2. para que serve;
3. onde fica na hierarquia;
4. qual o nível de confiança/canonicidade;
5. qual o lifecycle;
6. quais metadados públicos existem;
7. quais evidências sustentam a relação com o MCF;
8. onde está o código, quando público.

## Regra

O GitHub deixa de ser a ação primária.

Fluxo correto:

```text
projeto no mapa
      ↓ clique
ficha interna do Cockpit
      ↓ opcional
Ver código no GitHub
```

## Estilo "card de jogo"

O estilo visual pode lembrar uma ficha de personagem, mas não cria scores,
rankings, níveis ou atributos fictícios.

Atributos exibidos:

- área/classe;
- selo: Oficial, Integrado, Referenciado ou Descoberto;
- descrição rápida;
- branch;
- linguagem;
- issues;
- stars;
- forks;
- lifecycle;
- repositório canônico;
- estado operacional quando publicado;
- evidências;
- entrypoints;
- última atualização pública.

## Privacidade

Projetos privados registrados continuam sem expor metadados privados.
Quando não há metadados públicos, a ficha usa somente identidade,
lifecycle, entrypoints e evidências já publicadas no Registry do MCF.

## Interação

A mesma ficha abre a partir de:

- visão guiada;
- mapa técnico;
- inventário de repositórios.

A URL também aceita `?project=<project-id>` para auditoria/deep-link.
