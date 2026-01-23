# apps/gateway

## Overview
The `gs-gateway` worker is the routing and queue ingress layer for GoldShore on Cloudflare Workers. It is managed alongside the control worker as part of the Edge Workers deployment group.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-gateway`
- Route: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md)
- Compatibility date: `2025-01-10`
- Bindings: `gs-kv`, `GATEWAY_KV` (KV), `JOB_QUEUE` (Queues producer), `AI` (AI Gateway)
- Environment variables: `ENV=production`, `API_ORIGIN=https://api.goldshore.ai`, `CLOUDFLARE_ACCESS_AUDIENCE`, `CLOUDFLARE_TEAM_DOMAIN`

## Routes/Endpoints
- `GET /health`
- `GET /user/login`
- `POST /v1/chat`
The `gs-gateway` worker handles proxying to the API, rate limiting, and preflight authorization checks. For domain routing, see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

Configuration highlights (from `wrangler.toml`):
- `ENV=production`
- `API_ORIGIN=https://api.goldshore.ai`
- `CLOUDFLARE_ACCESS_AUDIENCE` (required for Access verification)
- `CLOUDFLARE_TEAM_DOMAIN` (required for Access verification)
- KV bindings: `gs-kv`, `GATEWAY_KV`
- Queue producer: `JOB_QUEUE`
- AI binding: `AI`

## Routes/Endpoints
See [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md) for gateway domain routing.

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gateway dev
pnpm --filter ./apps/gateway build
```

## Deploy
- Production deploy: `.github/workflows/deploy-gateway.yml`
- Preview deploy: `.github/workflows/preview-gateway.yml`
- Uses `wrangler deploy` with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets
- Domains, previews, and Access policies: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
```bash
pnpm --filter ./apps/gateway deploy
```
