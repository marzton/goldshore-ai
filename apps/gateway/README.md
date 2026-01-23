# @goldshore/gateway

## Overview

Edge gateway for routing, auth, throttling, and queue dispatch on Cloudflare Workers.

```
Route: https://gw.goldshore.ai/*
```

## Responsibilities

- Reverse proxy → gs-api
- Queue ingestion
- Rate limiting
- JWT / Access token verification
- Preflight filtering (IP / SNI policies)

## Local Development

From the repo root:

```bash
pnpm --filter ./apps/gateway dev
```

Build or deploy:

```bash
pnpm --filter ./apps/gateway build
pnpm --filter ./apps/gateway deploy
```

## Related Packages

- `@goldshore/auth`
