# apps/gs-gateway

## Overview
The `gs-gateway` worker is the routing and queue ingress layer for GoldShore on Cloudflare Workers.
The `gs-gateway` worker is the GoldShore edge gateway. It applies CORS and Cloudflare Access checks, enforces integration request headers, serves a small set of gateway-native endpoints, and proxies unmatched traffic to `gs-api`.

## Source of truth
This README is maintained manually. No generator for this worker README was found in the repository. Keep it aligned with:

- `apps/gs-gateway/wrangler.toml` for routes, compatibility date, bindings, and vars.
- `apps/gs-gateway/src/index.ts` for auth behavior, explicit handlers, and proxy fallback behavior.
- `apps/gs-gateway/src/middleware/integration.ts` for integration-header requirements.

## Cloudflare configuration
From `apps/gs-gateway/wrangler.toml`:

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
- Entry point: `src/index.ts`
- Compatibility date: `2025-01-10`
- Compatibility flags: `nodejs_compat`
- Production routes:
  - `agent.goldshore.ai/*`
  - `gw.goldshore.ai/*`
  - `gateway.goldshore.ai/*`
- Declared vars:
  - `ENV=production`
  - `API_ORIGIN=https://api.goldshore.ai`
  - `CLOUDFLARE_ACCESS_AUDIENCE`
  - `CLOUDFLARE_TEAM_DOMAIN`
- Declared bindings:
  - `GATEWAY_KV` (`kv_namespaces`)
  - `JOB_QUEUE` (`queues.producers`)
  - `API` (`services`, bound to `gs-api` `prod`)
  - `AI` (`ai`)

## Runtime notes
- `GET /`, `GET /health`, and `OPTIONS` requests skip Cloudflare Access auth; all other requests require it.
- `integrationControls` only applies to paths under `/integrations` and `/market-streams`.
- For those integration paths, the gateway requires:
  - `X-Data-Classification`
  - `X-Secrets-Access-Policy`
  - `X-Audit-Trace-Id`
- Integration audit entries are written to `GATEWAY_KV` when that binding is available.
- Although `JOB_QUEUE` and `AI` are declared in `wrangler.toml`, `src/index.ts` does not currently invoke them directly.

## Authoritative endpoint list
Defined in `src/index.ts`.

### Gateway-native routes
- `GET /` — HTML status page.
- `GET /health` — JSON health check.
- `GET /templates` — JSON module/template description.
- `GET /user/login` — placeholder login route.
- `POST /v1/chat` — placeholder chat route.

### Proxy / passthrough behavior
- `ALL *` — forwards all unmatched requests to the `API` service binding when present.
- If the `API` service binding is unavailable, unmatched requests fall back to `API_ORIGIN`.
- If neither `API` nor `API_ORIGIN` is configured, unmatched requests return `500 Upstream API not configured`.

## Local development
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
- Production workflow: `.github/workflows/deploy-gateway.yml`
- Preview workflow: `.github/workflows/preview-gateway.yml`
- Domains, previews, and Access policies: `docs/domains-and-auth.md`
- Deploy command:

```bash
pnpm --filter ./apps/gs-gateway deploy
```
