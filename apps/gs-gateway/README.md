# apps/gs-gateway

## Overview
The `gs-gateway` worker is the routing and queue ingress layer for GoldShore on Cloudflare Workers.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-gateway`
- Routes: `agent.goldshore.ai/*`, `gw.goldshore.ai/*`, `gateway.goldshore.ai/*`
- Compatibility date: `2025-01-10`
- Bindings: `GATEWAY_KV` (KV), `JOB_QUEUE` (Queues producer), `API` (service binding), `AI` (AI binding)
- Environment variables: `ENV=production`, `API_ORIGIN=https://api.goldshore.ai`, `CLOUDFLARE_ACCESS_AUDIENCE`, `CLOUDFLARE_TEAM_DOMAIN`

## Routes/Endpoints
These are worker API endpoints implemented in `src/index.ts`.
- `GET /`
- `GET /health`
- `GET /templates`
- `GET /user/login`
- `POST /v1/chat`
- `*` → proxy passthrough to `gs-api` when no matching route is handled directly

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gs-gateway dev
pnpm --filter ./apps/gs-gateway build
```

## Deploy
- Deployment state: **preview-only by design**.
- Active preview workflow: `.github/workflows/preview-gs-gateway.yml`.
- There is intentionally no active production deploy workflow under `.github/workflows/`.
- Production deploys, when needed, are run manually by ops via Wrangler.
- Domains, previews, and Access policies: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).
- Deployment policy reference: [`docs/ci/WORKER_DEPLOYMENT_STATES.md`](../../docs/ci/WORKER_DEPLOYMENT_STATES.md).

```bash
pnpm --filter ./apps/gs-gateway deploy
```
