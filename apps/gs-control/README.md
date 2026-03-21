# apps/gs-control

## Overview
The `gs-control` worker handles infrastructure automation tasks such as DNS updates, preview environment creation, secret rotation, and sync operations. It is served from `https://ops.goldshore.ai/*` on Cloudflare Workers.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-control`
- Route: `ops.goldshore.ai/*`
- Compatibility date: `2024-11-01`
- Bindings: `CONTROL_LOGS` (KV), `STATE` (R2)
- Service bindings: `API` (`gs-api`), `GATEWAY` (`gs-gateway`)
- Environment variable: `ENV=production`

## Routes/Endpoints
These worker API endpoints are implemented in `src/index.ts` and `src/routes/cloudflare.ts`.
- `GET /`
- `POST /dns/apply`
- `POST /workers/reconcile`
- `POST /pages/deploy`
- `POST /access/audit`
- `GET /cloudflare/dns/records`
- `PUT /cloudflare/dns/records/:recordId`
- `GET /cloudflare/workers/status`
- `GET /cloudflare/pages/projects`
- `GET /cloudflare/kv/namespaces`
- `GET /cloudflare/r2/buckets`
- `GET /cloudflare/d1/databases`
- `GET /cloudflare/access/policies`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gs-control dev
pnpm --filter ./apps/gs-control run-task
```

## Deploy
- Deployment state: **fully manual / no GitHub deploy automation**.
- There is intentionally no active preview or production deploy workflow under `.github/workflows/`.
- This worker is deployed manually by ops via Wrangler because it can mutate shared infrastructure state.
- Deployment policy reference: [`docs/ci/WORKER_DEPLOYMENT_STATES.md`](../../docs/ci/WORKER_DEPLOYMENT_STATES.md).

```bash
pnpm --filter ./apps/gs-control deploy
```
