# apps/gs-gateway

## Overview
`gs-gateway` is the Cloudflare Worker at `gw.goldshore.ai` that handles request ingress, Access verification, and proxying to upstream services.

## `/admin` behavior and auth model
- `gs-gateway` does **not** define a first-class `/admin` route handler in `src/index.ts`.
- Requests to `/admin` on the gateway host fall through to the catch-all proxy and are forwarded to the upstream API/service binding.
- Gateway auth enforcement is Cloudflare Access token verification (`verifyAccess`) for all non-public routes.
- If you additionally enable HTTP Basic Auth for admin paths in upstream infrastructure, the effective model is **Access + Basic Auth** (defense in depth).

### Basic Auth env vars (only if Basic Auth is enabled)
If Basic Auth is enabled for admin traffic in your upstream/admin service, configure:
- `ADMIN_USER`
- `ADMIN_PASS`

> Note: these variables are not part of the current `wrangler.toml` defaults for `gs-gateway`; only set and consume them where Basic Auth is actually implemented.

## Canonical runtime bindings (`wrangler.toml`)
### Core worker settings
- `name = "gs-gateway"`
- `main = "src/index.ts"`
- `compatibility_date = "2025-01-10"`
- `compatibility_flags = ["nodejs_compat"]`
- Route: `gw.goldshore.ai/*`

### Vars
- `ENV` (default: `production`)
- `API_ORIGIN` (default: `https://api.goldshore.ai`)
- `CLOUDFLARE_ACCESS_AUDIENCE`
- `CLOUDFLARE_TEAM_DOMAIN`

### Bindings
- KV namespace: `GATEWAY_KV`
- Queue producer: `JOB_QUEUE`
- Service binding: `API -> gs-api (environment: prod)`
- AI binding: `AI`

## Routes/Endpoints implemented in gateway
- `GET /`
- `GET /health`
- `GET /templates`
- `GET /user/login`
- `POST /v1/chat`
- `*` fallback proxy to upstream API

## Operational commands (repo-standard)
```bash
pnpm install
pnpm --filter ./apps/gs-gateway dev
pnpm --filter ./apps/gs-gateway build
pnpm --filter ./apps/gs-gateway deploy
```

Optional live logs:
```bash
pnpm exec wrangler tail --config apps/gs-gateway/wrangler.toml
```

## Deploy workflows
- Production deploy: `.github/workflows/deploy-gateway.yml`
- Preview deploy: `.github/workflows/preview-gateway.yml`
