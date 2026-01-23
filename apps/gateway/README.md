# apps/gateway

## Overview
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
```bash
pnpm --filter ./apps/gateway deploy
```
