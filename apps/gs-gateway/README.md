# apps/gs-gateway

## Overview
The `gs-gateway` worker is the routing and queue ingress layer for GoldShore on Cloudflare Workers. It is managed alongside the control worker as part of the Edge Workers deployment group.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-gateway`
- Route: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md)
- Compatibility date: `2025-01-10`
- Bindings: `GATEWAY_KV` (KV), `JOB_QUEUE` (Queues producer), `API` (service binding), `AI` (AI Gateway)
- Environment variables: `ENV=production`, `API_ORIGIN=https://api.goldshore.ai`, `CLOUDFLARE_ACCESS_AUDIENCE`, `CLOUDFLARE_TEAM_DOMAIN`

## Routes/Endpoints
These are worker API endpoints implemented in `src/index.ts` (not HTML pages). The router file is the source of truth.
- `https://gw.goldshore.ai/*` (proxy + routing entrypoint)
- `GET /` (status page)
- `GET /health`
- `GET /templates`
- `GET /user/login`
- `POST /v1/chat`
- `*` (proxy passthrough to `gs-api` when no matching route)
The `gs-gateway` worker is the routing and queue ingress layer for GoldShore, served from the gateway hostname documented in [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md). It handles proxying to the API, rate limiting, and preflight authorization checks.

Configuration highlights (from `wrangler.toml`):
- `ENV=production`
- `API_ORIGIN=https://api.goldshore.ai`
- `CLOUDFLARE_ACCESS_AUDIENCE` (required for Access verification)
- `CLOUDFLARE_TEAM_DOMAIN` (required for Access verification)
- KV binding: `GATEWAY_KV`
- Queue producer: `JOB_QUEUE`
- Service binding: `API`
- AI binding: `AI`

## Secret Provisioning
`ADMIN_INTERNAL_SECRET` is intentionally **not** committed in `wrangler.toml` under `[vars]`.

Set it through Cloudflare Worker secret management for each environment:

```bash
# From repo root
cd apps/gs-gateway

# Set secret for default environment
wrangler secret put ADMIN_INTERNAL_SECRET

# Or for a named environment (example)
wrangler secret put ADMIN_INTERNAL_SECRET --env production
```

You can also set the same secret in the Cloudflare dashboard: Worker → Settings → Variables → Secrets.

### Expected behavior when secret is missing
- Requests that depend on `ADMIN_INTERNAL_SECRET` should fail closed (unauthorized / forbidden) rather than bypassing protection.
- Deploys may still succeed, but protected admin/internal flows will not authenticate correctly until the secret is set.
- If this occurs, provision the secret and redeploy (or restart local dev) so the Worker picks up the new secret value.

## Routes/Endpoints
These are worker API endpoints implemented in `src/index.ts` (not HTML pages). Route handlers are defined in `src/index.ts`.
- `https://gw.goldshore.ai/*` (proxy + routing entrypoint)

## Operational commands (repo-standard)
```bash
pnpm install
pnpm --filter @goldshore/gs-gateway dev
pnpm --filter @goldshore/gs-gateway exec wrangler tail
pnpm --filter @goldshore/gs-gateway build
```

## Deploy
- Preview deploy workflow: [`.github/workflows/preview-gs-gateway.yml`](../../.github/workflows/preview-gs-gateway.yml)
- Production deploy workflow file exists at [`.github/workflows/deploy-gs-gateway.yml.disabled`](../../.github/workflows/deploy-gs-gateway.yml.disabled) and is intentionally disabled (not executed by GitHub Actions).
- Current production deploy is triggered manually via:
  ```bash
  pnpm --filter ./apps/gs-gateway deploy
  ```
  This runs `wrangler deploy` for the worker using `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` credentials.
- Domains, previews, and Access policies: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
```bash
pnpm --filter @goldshore/gs-gateway deploy
```

## Deploy workflows
- Production deploy: `.github/workflows/deploy-gateway.yml`
- Preview deploy: `.github/workflows/preview-gateway.yml`
