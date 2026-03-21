# Omnichannel Platform

Monorepo da plataforma SaaS multi-tenant de atendimento, operacao e automacao omnichannel.

## Estrutura

- `apps/frontend`: frontend em Next.js
- `apps/backend`: backend em NestJS
- `packages/shared`: tipos e utilitarios compartilhados
- `infra/docker`: stack Docker para desenvolvimento local
- `infra/deploy`: contratos de ambiente para Vercel e Railway

## Stack principal

- Frontend: Next.js + React
- Backend: NestJS
- Banco: PostgreSQL
- Filas e workers: BullMQ + Redis
- Billing: Stripe

## Workspace

Este repositorio usa `pnpm` workspaces.

## Comandos uteis

```bash
pnpm install
pnpm build:frontend
pnpm build:backend
pnpm migration:up
```

## Deploy alvo

- Frontend em Vercel
- Backend API em Railway
- Workers BullMQ em Railway
- PostgreSQL em Railway
- Redis em Railway

Guia operacional: [DEPLOY_VERCEL_RAILWAY.md](/Users/dj_Lu/whatsapp-post-tool/DEPLOY_VERCEL_RAILWAY.md)

## Estado atual

- Fase 1 e Fase 2 concluidas
- Fase 3 implementada em codigo
- Repositorio oficial ja publicado em `main`
- Proxima etapa operacional: publicacao em Vercel + Railway
