# apps/api-worker

## Overview
The `gs-api` worker is the primary Hono-based API layer for GoldShore, served from `https://api.goldshore.ai/*` on Cloudflare Workers.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-api`
- Route: `api.goldshore.ai/*`
- Compatibility date: `2025-01-10`
- Bindings: `API_KV` (KV), `ASSETS` (R2), `DB` (D1), `AI` (AI Gateway)
- Environment variable: `ENV=production`

## Routes/Endpoints
- `GET /health`
- `GET /version`
- `POST /auth/login`
- `GET /auth/session`
- `GET /content/:slug`
- `POST /queue/task`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/api-worker dev
pnpm --filter ./apps/api-worker build
```

## Deploy
- Production deploy: `.github/workflows/deploy-api-worker.yml`
- Preview deploy: `.github/workflows/preview-api-worker.yml`
- Uses `wrangler deploy` with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
