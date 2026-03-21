# Omnichannel Platform

Monorepo da plataforma SaaS multi-tenant de atendimento, operacao e automacao omnichannel.

## Estrutura

- `apps/frontend`: frontend em Next.js
- `apps/backend`: backend em NestJS
- `packages/shared`: tipos e utilitarios compartilhados
- `infra/docker`: stack Docker para desenvolvimento e certificacao local

## Stack principal

- Frontend: Next.js + React
- Backend: NestJS
- Banco: PostgreSQL
- Filas e workers: BullMQ + Redis
- Billing: Stripe

## Workspace

Este repositório usa `pnpm` workspaces.

### Comandos úteis

```bash
pnpm install
pnpm --filter @repo/frontend build
pnpm --filter @repo/backend build
```

## Estado atual

- Fase 1 e Fase 2 concluídas
- Fase 3 implementada em código
- Deploy alvo em adaptação para frontend na Vercel e backend/workers em Railway
