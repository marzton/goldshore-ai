# apps/gs-control

## Overview
The `gs-control` worker handles infrastructure automation and operator workflows for GoldShore. It exposes control-plane endpoints for sync operations and Cloudflare administration, and it also runs scheduled maintenance tasks.

## Source of truth
This README is maintained manually. No README generator was found in the repository. Keep it synchronized with:

- `apps/gs-control/wrangler.toml` for routes, compatibility date, bindings, service bindings, and declared vars.
- `apps/gs-control/src/index.ts` for mounted routes, auth behavior, and scheduled tasks.
- `apps/gs-control/src/routes/cloudflare.ts` for Cloudflare admin endpoints.

## Cloudflare configuration
From `apps/gs-control/wrangler.toml`:

- Worker name: `gs-control`
- Entry point: `src/index.ts`
- Compatibility date: `2024-11-01`
- Compatibility flags: `nodejs_compat`
- Production route: `ops.goldshore.ai/*`
- Declared vars:
  - `ENV=production`
  - `CONTROL_SYNC_TOKEN`
  - `SYNC_TARGET_SUBDOMAIN=api.goldshore.ai`
- Declared bindings:
  - `CONTROL_LOGS` (`kv_namespaces`)
  - `STATE` (`r2_buckets`)
  - `API` (`services`, bound to `gs-api`)
  - `GATEWAY` (`services`, bound to `gs-gateway`)

## Runtime notes
- Only `/` and `OPTIONS` bypass Cloudflare Access auth.
- Cloudflare admin routes additionally require one of the admin roles from `CONTROL_ADMIN_ROLES`, or the default roles `admin`, `ops`, `owner`, `infra`.
- Scheduled runs write to `CONTROL_LOGS` and invoke `syncDNS(env)` and `rotateKeys(env)`.
- The code expects additional runtime values not declared in `wrangler.toml`, including:
  - `GS_CONFIG` KV binding used by `POST /system/sync`
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_ZONE_ID`
  - `CONTROL_ADMIN_ROLES`
  - `ALLOWED_ORIGINS`

## Authoritative endpoint list
Mounted in `src/index.ts` and `src/routes/cloudflare.ts`.

### Core control routes
- `GET /` — JSON service status.
- `POST /system/sync` — validates and writes routing/service/orchestration config to `GS_CONFIG`, with an audit entry in `CONTROL_LOGS`.
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
- `GET /cloudflare/access/policies?appId=...`
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
