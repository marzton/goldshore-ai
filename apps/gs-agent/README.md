# apps/gs-agent

## Overview
The `gs-agent` worker is the canonical GoldShore agent service. It serves a small Hono-based status UI, exposes a health endpoint, and enforces Cloudflare Access auth on protected routes. The deprecated `apps/goldshore-agent` directory now mirrors this implementation.

Cloudflare metadata (from `apps/gs-agent/wrangler.toml`):
- Worker base name: `gs-agent` (per-environment names: `gs-agent-dev`, `gs-agent-preview`, `gs-agent`)
- Queue consumer: `goldshore-jobs`
- Compatibility date: `2025-01-10`

Codex bot decision:
- `jules-bot` remains a separate Node.js webhook service.
- A placeholder `codex-bot` module now lives in `apps/gs-agent/src/bots/codex-bot.ts` for future queue-driven automation.

## Routes/Endpoints
- `/` → status UI
- `/health` → JSON health response

## Configuration
- The canonical Wrangler configuration lives in `apps/gs-agent/wrangler.toml` and defines queue consumers for `goldshore-jobs`.
- Preview deploys use the `env.preview` block in that same config; no separate preview-only config is required.
- Local dev exposes the worker via `wrangler dev`.
- No production routes are configured in the Wrangler config.
The `gs-agent` worker is a queue-driven background agent. It currently returns a simple response for fetch requests and includes a stubbed queue consumer. The Wrangler configuration lives in `apps/gs-agent/wrangler.toml` and defines queue consumers for `goldshore-jobs`.

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
- Production deploy: `.github/workflows/deploy-agent.yml`
- Preview deploy: `.github/workflows/preview-agent.yml`
- Uses `wrangler deploy` with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
```bash
pnpm --filter ./apps/gs-agent deploy
```
