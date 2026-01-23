# apps/gs-agent

## Overview
The `gs-agent` worker is a queue-driven background agent. It currently returns a simple response for fetch requests and includes a stubbed queue consumer. The Wrangler configuration lives in `infra/cloudflare/gs-agent.wrangler.toml` and defines queue consumers for `goldshore-jobs`.

## Routes/Endpoints
- No production routes are configured in `wrangler.toml`.
- Local dev exposes the worker via `wrangler dev`, returning `Hello from the GoldShore Agent!` from the fetch handler.

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gs-agent dev
pnpm --filter ./apps/gs-agent build
```

## Deploy
```bash
pnpm --filter ./apps/gs-agent deploy
```
