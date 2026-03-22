# apps/gs-control

## Overview
The `gs-control` worker is the privileged infrastructure automation and control-plane worker for GoldShore. It handles DNS updates, preview environment creation, secret rotation, Access audits, Cloudflare inventory, and configuration sync operations, and it is served from `https://ops.goldshore.ai/*` on Cloudflare Workers. It is managed alongside the gateway worker as part of the Edge Workers deployment group.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-control`
- Route: `ops.goldshore.ai/*`
- Compatibility date: `2025-01-10`
- Bindings: `CONTROL_LOGS` (KV), `GS_CONFIG` (KV), `STATE` (R2)
- Service bindings: `API` (`gs-api`), `GATEWAY` (`gs-gateway`)
- Environment variable: `ENV=production`

## Routes/Endpoints
These are worker API endpoints implemented in `src/index.ts` and `src/routes/cloudflare.ts` (not HTML pages). The router files are the source of truth.

## Privileged ownership
`gs-control` is not interchangeable with `gs-api`. Keep it as its own worker on `ops.goldshore.ai` and treat the following capabilities as control-plane exclusive:
- Cloudflare DNS operations (`/dns/*`, `/cloudflare/dns/*`)
- Cloudflare Pages deploy and project inventory operations (`/pages/*`, `/cloudflare/pages/*`)
- Access policy and infra audit endpoints (`/access/audit`, `/cloudflare/access/*`, broader `/cloudflare/*` inventory)
- Writes to the shared `GS_CONFIG` KV via `POST /system/sync`

`gs-api` may read derived state, but privileged writes and Cloudflare admin actions remain owned by `gs-control`.

- `GET /` (service health)
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

Configuration highlights (from `wrangler.toml`):
- `ENV=production`
- KV bindings: `CONTROL_LOGS`, `GS_CONFIG`
- R2 binding: `STATE`
- Service bindings: `API` (`gs-api`), `GATEWAY` (`gs-gateway`)
- Secret-managed service-to-service sync secret: `CONTROL_SYNC_TOKEN`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gs-control dev
pnpm --filter ./apps/gs-control run-task
```

## Deploy
- Production deploy workflow in repo: `.github/workflows/deploy-gs-control.yml.disabled`
- No dedicated preview control workflow exists in `.github/workflows` right now; treat `ops-preview.goldshore.ai` validation as a Cloudflare/dashboard verification step until one is added.
- Worker deploy jobs use `wrangler deploy` with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`, and some jobs prefer `CLOUDFLARE_BUILD_API_TOKEN` when that override secret is present.
- Store runtime secrets with `wrangler secret put` rather than committing env values.

### Cloudflare token rotation notes

When rotating Worker Builds credentials for `gs-control`, keep these related services aligned at the same time:

- `gs-api`
- `gs-gateway`
- `gs-control`
- `gs-agent` preview jobs if they are being retried in the same maintenance window

Operational checklist:

1. Rotate the Worker Builds token in Cloudflare Dashboard for the affected service/project and save the new active token.
2. Update the matching GitHub repository secrets used by the deploy jobs: `CLOUDFLARE_API_TOKEN`, optional `CLOUDFLARE_BUILD_API_TOKEN`, and confirm `CLOUDFLARE_ACCOUNT_ID`.
3. Reconcile preview worker/service names in Cloudflare with the repo’s canonical `gs-*` naming before reruns. The repo still contains references that may need dashboard cleanup, including `gs-api-preview`, `gs-agent-preview`, and older service names such as `astro-gs-api`, `astro-gs-gateway`, and `goldshore-control-worker`.
4. Confirm the preview DNS/routes exist for `api-preview.goldshore.ai`, `gw-preview.goldshore.ai`, and `ops-preview.goldshore.ai` before rerunning failed preview jobs.
5. Rerun the affected GitHub Actions workflows, then run `.github/workflows/maintenance.yml` to verify the rotated credentials can still reconcile Cloudflare state.

For the full workflow/secret matrix, see `docs/ci/INFRA_SYNC_RUNBOOK.md`.

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-03-18 00:00 -->
```bash
pnpm --filter ./apps/gs-control deploy
```
