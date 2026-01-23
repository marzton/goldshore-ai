# apps/gateway

## Overview
The `gs-gateway` worker is the routing and queue ingress layer for GoldShore, served from `https://gw.goldshore.ai/*` on Cloudflare Workers. It is managed alongside the control worker as part of the Edge Workers deployment group.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-gateway`
- Route: `gw.goldshore.ai/*`
- Compatibility date: `2025-01-10`
- Bindings: `gs-kv`, `GATEWAY_KV` (KV), `JOB_QUEUE` (Queues producer), `AI` (AI Gateway)
- Environment variables: `ENV=production`, `API_ORIGIN=https://api.goldshore.ai`, `CLOUDFLARE_ACCESS_AUDIENCE`, `CLOUDFLARE_TEAM_DOMAIN`

## Routes/Endpoints
- `https://gw.goldshore.ai/*` (proxy + routing entrypoint)
- `GET /health`
- `GET /user/login`
- `POST /v1/chat`
The `gs-gateway` worker is the routing and queue ingress layer for GoldShore, served from `https://gw.goldshore.ai/*` on Cloudflare Workers. It handles proxying to the API, rate limiting, and preflight authorization checks.

Configuration highlights (from `wrangler.toml`):
- `ENV=production`
- `API_ORIGIN=https://api.goldshore.ai`
- `CLOUDFLARE_ACCESS_AUDIENCE` (required for Access verification)
- `CLOUDFLARE_TEAM_DOMAIN` (required for Access verification)
- KV bindings: `gs-kv`, `GATEWAY_KV`
- Queue producer: `JOB_QUEUE`
- AI binding: `AI`

## Routes/Endpoints
- `https://gw.goldshore.ai/*` (proxy + routing entrypoint)

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

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
```bash
pnpm --filter ./apps/gateway deploy
```
