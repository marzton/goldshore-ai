# apps/api-worker

## Overview
The `gs-api` worker is the primary Hono-based API layer for GoldShore, served from `https://api.goldshore.ai/*` on Cloudflare Workers. It uses KV, R2, D1, and the AI Gateway bindings configured in `wrangler.toml`.

Configuration highlights (from `wrangler.toml`):
- `ENV=production`
- KV binding: `API_KV`
- R2 binding: `ASSETS`
- D1 binding: `DB`
- AI binding: `AI`

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
```bash
pnpm --filter ./apps/api-worker deploy
```
