# apps/gs-control

## Overview
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

## Testing and build
```bash
pnpm --filter ./apps/gs-control test
pnpm --filter ./apps/gs-control build
```

## Deploy
- Production deploy uses `wrangler deploy`.
- Store secrets such as `CLOUDFLARE_API_TOKEN` with `wrangler secret put` instead of committing plaintext values.
