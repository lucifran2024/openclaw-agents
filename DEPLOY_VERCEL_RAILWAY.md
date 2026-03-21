# Deploy Target: Vercel + Railway

Este repositorio esta preparado para a topologia operacional abaixo:

- Vercel: `apps/frontend`
- Railway API: `apps/backend` com runtime HTTP
- Railway Worker: `apps/backend` com runtime BullMQ
- Railway Postgres: banco gerenciado
- Railway Redis: fila/cache gerenciado

## O que vai para cada plataforma

### Vercel

- App: `apps/frontend`
- Framework: Next.js
- Root Directory: `apps/frontend`
- Variavel obrigatoria: `NEXT_PUBLIC_API_URL`

### Railway

- Servico `backend-api`
  - Root do repositorio: raiz do monorepo
  - Build Command: `pnpm --filter @repo/backend build`
  - Start Command: `pnpm --filter @repo/backend start`
  - Healthcheck: `/api/v1/health`
- Servico `backend-worker`
  - Root do repositorio: raiz do monorepo
  - Build Command: `pnpm --filter @repo/backend build`
  - Start Command: `pnpm --filter @repo/backend start:worker`
- Servico `postgres`
  - Banco gerenciado do Railway
- Servico `redis`
  - Redis gerenciado do Railway

## Ajustes feitos no codigo para essa topologia

- O backend agora entende `DATABASE_URL` e `REDIS_URL`, alem dos campos separados.
- O backend agora respeita `PORT`, que e o padrao injetado pela Railway.
- O runtime BullMQ foi separado:
  - `APP_RUNTIME=api` para a API HTTP
  - `APP_RUNTIME=worker` para o worker
- Os processors BullMQ so sao registrados no runtime `worker`, evitando consumo duplicado de jobs.
- O CORS aceita lista separada por virgula em `CORS_ALLOWED_ORIGINS` e suporta curingas simples, como `https://*.vercel.app`.

## Variaveis de ambiente por servico

### Frontend na Vercel

Obrigatorias:

- `NEXT_PUBLIC_API_URL`

Podem ficar vazias:

- nenhuma

Exemplo: [frontend.vercel.env.example](/Users/dj_Lu/whatsapp-post-tool/infra/deploy/frontend.vercel.env.example)

### Backend API na Railway

Obrigatorias:

- `APP_RUNTIME=api`
- `BACKEND_URL`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`
- `DATABASE_URL` ou o conjunto `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- `REDIS_URL` ou o conjunto `REDIS_HOST`, `REDIS_PORT`

Obrigatorias para publicar billing real:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PROFESSIONAL`
- `STRIPE_PRICE_ENTERPRISE`

Obrigatorias para WhatsApp real:

- `WHATSAPP_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`

Opcionais:

- `CORS_ALLOWED_ORIGINS`
- `DATABASE_SSL`
- `REDIS_TLS_ENABLED`
- `S3_*`
- `OTEL_*`

Exemplo: [backend.railway.env.example](/Users/dj_Lu/whatsapp-post-tool/infra/deploy/backend.railway.env.example)

### Worker na Railway

Obrigatorias:

- `APP_RUNTIME=worker`
- `BACKEND_URL`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `OPENAI_API_KEY`
- `DATABASE_URL` ou conjunto separado
- `REDIS_URL` ou conjunto separado

Obrigatorias se o worker for processar billing/WhatsApp real:

- mesmo conjunto de `STRIPE_*`
- mesmo conjunto de `WHATSAPP_*`

Opcionais:

- `CORS_ALLOWED_ORIGINS`
- `DATABASE_SSL`
- `REDIS_TLS_ENABLED`
- `S3_*`
- `OTEL_*`

Exemplo: [worker.railway.env.example](/Users/dj_Lu/whatsapp-post-tool/infra/deploy/worker.railway.env.example)

### Postgres na Railway

Obrigatorias:

- servico gerenciado criado no projeto Railway

Usar no backend/worker:

- preferir referencia para `DATABASE_PRIVATE_URL`

### Redis na Railway

Obrigatorias:

- servico gerenciado criado no projeto Railway

Usar no backend/worker:

- preferir referencia para `REDIS_URL`

## Fluxo de deploy por GitHub

### Vercel

1. Importar o repositorio oficial no Vercel.
2. Selecionar `Root Directory = apps/frontend`.
3. Confirmar framework `Next.js`.
4. Configurar `NEXT_PUBLIC_API_URL`.
5. Fazer o primeiro deploy.

### Railway

1. Criar um projeto novo.
2. Adicionar `Postgres`.
3. Adicionar `Redis`.
4. Adicionar um servico `backend-api` a partir do GitHub repo.
5. Na raiz do repositorio, configurar:
   - Build Command: `pnpm --filter @repo/backend build`
   - Start Command: `pnpm --filter @repo/backend start`
6. Duplicar o servico para `backend-worker` ou criar outro servico do mesmo repo.
7. No `backend-worker`, trocar so o Start Command para `pnpm --filter @repo/backend start:worker`.
8. Configurar as variaveis usando os exemplos em `infra/deploy`.
9. Rodar `pnpm --filter @repo/backend migration:up` uma vez em banco limpo via Railway shell ou job manual.

## Fluxo de atualizacao futura sem VPS manual

1. Fazer merge na `main` do GitHub oficial.
2. Vercel redeploya o frontend automaticamente.
3. Railway redeploya `backend-api` e `backend-worker` automaticamente.
4. Sempre que houver migration nova:
   - rodar `pnpm --filter @repo/backend migration:up` no Railway antes ou junto do deploy da versao.

## Checklist exato de publicacao

1. Confirmar dominio/API final:
   - Vercel frontend URL
   - Railway backend URL
2. Criar projeto no Railway com `Postgres` e `Redis`.
3. Publicar `backend-api` com:
   - Build Command `pnpm --filter @repo/backend build`
   - Start Command `pnpm --filter @repo/backend start`
   - Healthcheck `/api/v1/health`
4. Publicar `backend-worker` com:
   - Build Command `pnpm --filter @repo/backend build`
   - Start Command `pnpm --filter @repo/backend start:worker`
5. Configurar todas as variaveis obrigatorias dos dois servicos.
6. Rodar `pnpm --filter @repo/backend migration:up`.
7. Publicar o frontend na Vercel com `Root Directory = apps/frontend`.
8. Configurar `NEXT_PUBLIC_API_URL` apontando para `https://.../api/v1`.
9. Validar:
   - `GET /api/v1/health`
   - login
   - settings
   - billing
   - um job BullMQ
   - um webhook Stripe em test mode

## Menor proximo passo para colocar online

Criar o projeto na Railway com `Postgres + Redis` e subir primeiro o servico `backend-api`, porque isso fixa a URL real da API que o frontend da Vercel vai consumir.
