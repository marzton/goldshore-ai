# apps/gs-control

## Overview
The `gs-control` worker handles infrastructure automation tasks such as DNS updates, preview environment creation, secret rotation, and sync operations. It is served from `https://ops.goldshore.ai/*` on Cloudflare Workers.
`gs-control` is the Cloudflare Worker that owns infrastructure automation for Goldshore, including DNS reconciliation, Cloudflare resource administration, scheduled maintenance tasks, and the shared system configuration sync endpoint in `src/index.ts`.

## Cloudflare deployment metadata
Source of truth: `apps/gs-control/wrangler.toml`.

- Worker name: `gs-control`
- Entry point: `src/index.ts`
- Route: `ops.goldshore.ai/*`
- Compatibility date: `2024-11-01`
- Compatibility flags: `nodejs_compat`

### Real binding set
- KV namespaces:
  - `CONTROL_LOGS`
  - `GS_CONFIG`
- R2 buckets:
  - `STATE`
- Service bindings:
  - `API` → `gs-api`
  - `GATEWAY` → `gs-gateway`
- Vars:
  - `ENV=production`
  - `CONTROL_SYNC_TOKEN`
  - `SYNC_TARGET_SUBDOMAIN`

## Shared config ownership
The shared config KV for cross-worker runtime data is `GS_CONFIG`. `gs-control` writes `ROUTING_TABLE`, `SERVICE_STATUS`, and `AI_ORCHESTRATION` through `POST /system/sync`, while `CONTROL_LOGS` remains the audit and task-log KV used by scheduled jobs and Cloudflare admin routes.

## Routes and endpoints
Implemented in `src/index.ts` and `src/routes/cloudflare.ts`.

- `GET /`
- `POST /system/sync`
- `POST /dns/apply`
- `POST /workers/reconcile`
- `POST /pages/deploy`
- `POST /access/audit`

### Cloudflare administration routes
- `GET /cloudflare/dns/records`
- `PUT /cloudflare/dns/records/:recordId`
- `GET /cloudflare/workers/status`
- `GET /cloudflare/pages/projects`
- `GET /cloudflare/kv/namespaces`
- `GET /cloudflare/r2/buckets`
- `GET /cloudflare/d1/databases`
- `GET /cloudflare/access/policies`

## Local development
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
## Testing and build
- Production workflow: `.github/workflows/deploy-control-worker.yml`
- Preview workflow: `.github/workflows/preview-control-worker.yml`
- Store `CLOUDFLARE_API_TOKEN` as a Cloudflare secret instead of committing it.
- Deploy command:

```bash
pnpm --filter ./apps/gs-control test
pnpm --filter ./apps/gs-control build
```

## Deploy
- Production deploy uses `wrangler deploy`.
- Store secrets such as `CLOUDFLARE_API_TOKEN` with `wrangler secret put` instead of committing plaintext values.
