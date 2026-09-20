# MCF Cockpit Next — Hierarquia do Ecossistema

## Objetivo

A Etapa 2 transforma o inventário plano de repositórios em uma visão hierárquica
sem confundir **registro canônico** com **classificação visual**.

## Fontes

1. `multiagent-collaboration-framework/context/projects/*.yaml`
   - identidade do projeto;
   - lifecycle;
   - repositório canônico;
   - aliases;
   - Capsule/entrypoints;
   - freshness.

2. `multiagent-collaboration-framework/docs/MCF-CURRENT-STATE.md`
   - integração estrutural Context Fabric 4/4:
     - multiagent-collaboration-framework;
     - cloud-infrastructure;
     - cognitive-ledger;
     - triview-workspace-linux.

3. GitHub REST API
   - metadados **públicos** dos repositórios;
   - descrição;
   - branch;
   - linguagem;
   - stars/forks/issues;
   - timestamps.

## Níveis de confiança

### Registry MCF

Projeto presente em `context/projects/`.

### Context Fabric 4/4

Além do Registry, possui evidência estrutural explícita no Current State.

### Referenciado pelo MCF

Repositório mencionado por um projeto registrado, mas sem entrada própria no
Project Registry. Exemplo atual: `voicehub-linux`, referenciado pelo projeto
`controle-ponto-frontend`.

### Descoberto no GitHub

Repo público relacionado ao ecossistema, porém não encontrado no Project
Registry atual.

## Modelo visual

Os grupos abaixo são **modelo de navegação do Cockpit**, não uma afirmação de
dependência arquitetural canônica quando o MCF não declarar essa relação:

- Fundação integrada
- Execução e inteligência
- Memória e continuidade
- Produtos e casos
- Laboratórios
- Interfaces e observabilidade
- Ferramentas de suporte

Cada nó mantém sua proveniência visível.

## Privacidade

O site público não publica metadados privados de repositórios privados.
Quando um repositório canônico do Registry não aparece na listagem pública do
GitHub, o Cockpit mantém somente as informações já declaradas no Registry
público e informa que os metadados públicos não estão disponíveis.
