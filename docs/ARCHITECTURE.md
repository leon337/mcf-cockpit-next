# Arquitetura — Etapa 1

```text
GitHub REST API
      ↓
api/github.js
      ↓
normalização
      ↓
JSON estável
      ↓
assets/app.js
      ↓
index.html
```

## Princípios

1. dados reais ou ausência explícita;
2. UI independente do payload bruto do GitHub;
3. componentes adicionados por etapas;
4. sem dependência do cockpit legado;
5. sem estado local inventado.

## Próximas etapas

A próxima etapa só deve ser adicionada depois da auditoria da Etapa 1.
