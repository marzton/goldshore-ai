# apps/control-worker

## Overview
The `gs-control` worker handles infrastructure automation tasks (DNS updates, preview environment creation, secret rotation, and sync operations) and is served from `https://ops.goldshore.ai/*` on Cloudflare Workers.

Configuration highlights (from `wrangler.toml`):
- `ENV=production`
- KV binding: `CONTROL_LOGS`
- R2 binding: `STATE`
- Service bindings: `API` (`gs-api`), `GATEWAY` (`gs-gateway`)

## Routes/Endpoints
- `POST /system/sync`
- `POST /dns/update`
- `POST /preview/create`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/control-worker dev
pnpm --filter ./apps/control-worker run-task
```

## Deploy
```bash
pnpm --filter ./apps/control-worker deploy
```
