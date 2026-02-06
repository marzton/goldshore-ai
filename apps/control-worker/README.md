# apps/control-worker

## Overview
The `gs-control` worker handles infrastructure automation tasks (DNS updates, preview environment creation, secret rotation, and sync operations) and is served from `https://ops.goldshore.ai/*` on Cloudflare Workers. It is managed alongside the gateway worker as part of the Edge Workers deployment group.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-control`
- Route: `ops.goldshore.ai/*`
- Compatibility date: `2025-01-10`
- Bindings: `CONTROL_LOGS` (KV), `STATE` (R2)
- Service bindings: `API` (`gs-api`), `GATEWAY` (`gs-gateway`)
- Environment variable: `ENV=production`

## Routes/Endpoints
These are worker API endpoints implemented in `src/index.ts` and `src/routes/cloudflare.ts` (not HTML pages). The router files are the source of truth.
- `GET /` (service health)
- `POST /dns/apply`
- `POST /workers/reconcile`
- `POST /pages/deploy`
- `POST /access/audit`
- `GET /cloudflare/dns/records`
- `PUT /cloudflare/dns/records/:recordId`
- `GET /cloudflare/workers/status`
- `GET /cloudflare/access/policies`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/control-worker dev
pnpm --filter ./apps/control-worker run-task
```

## Deploy
- Production deploy: `.github/workflows/deploy-control-worker.yml`
- Preview deploy: `.github/workflows/preview-control-worker.yml`
- Uses `wrangler deploy` with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
```bash
pnpm --filter ./apps/control-worker deploy
```
