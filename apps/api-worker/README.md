# gs-api (apps/api-worker)

## Overview

Hono-based API Worker deployed on Cloudflare Workers.

```
Route: https://api.goldshore.ai/*
```

## Endpoints

```
GET   /health
GET   /version
POST  /auth/login
GET   /auth/session
GET   /content/:slug
POST  /queue/task
```

## Bindings

```
KV = gs-kv
R2 = gs-assets
D1 = gs-db
AI = AI (AI Gateway)
```

## Local Development

From the repo root:

```bash
pnpm --filter ./apps/api-worker dev
```

Build or deploy:

```bash
pnpm --filter ./apps/api-worker build
pnpm --filter ./apps/api-worker deploy
```

## Related Packages

- `@goldshore/auth`
