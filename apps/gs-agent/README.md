# apps/gs-agent

## Overview
The `gs-agent` worker is the canonical GoldShore agent service. It serves a small Hono-based status UI, exposes a health endpoint, and enforces Cloudflare Access auth on protected routes. The deprecated `apps/goldshore-agent` directory now mirrors this implementation, but the active CI/CD story is anchored on the canonical `gs-agent` workflows and `infra/Cloudflare/gs-agent.wrangler.toml`.

Cloudflare metadata (from `infra/Cloudflare/gs-agent.wrangler.toml`):
- Worker base name: `gs-agent`
- Preview environment name: `gs-agent-preview`
- Production environment: Wrangler `production`
- Queue consumer: `goldshore-jobs`
- Compatibility date: `2024-11-01`

Codex bot decision:
- `jules-bot` remains a separate Node.js webhook service.
- A placeholder `codex-bot` module now lives in `apps/gs-agent/src/bots/codex-bot.ts` for future queue-driven automation.

## Routes/Endpoints
- `/` → status UI
- `/health` → JSON health response

## Configuration
- The Wrangler configuration lives in `infra/Cloudflare/gs-agent.wrangler.toml` and defines queue consumers for `goldshore-jobs`.
- Local dev uses the shared Wrangler config via `wrangler dev`.
- Preview deploys must use `wrangler deploy --env preview`.
- Production deploys must use `wrangler deploy --env production`.

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gs-agent dev
pnpm --filter ./apps/gs-agent build
```

## Deploy
- Preview deploy workflow: `.github/workflows/preview-gs-agent.yml`
  - Trigger: pull requests affecting `apps/gs-agent`, shared packages, or `infra/Cloudflare/gs-agent.wrangler.toml`
  - Wrangler target: `--env preview`
- Production deploy workflow: `.github/workflows/deploy-gs-agent.yml`
  - Trigger: `push` to `main` for the same path set
  - Wrangler target: `--env production`
- Both workflows use `CLOUDFLARE_BUILD_API_TOKEN` (falling back to `CLOUDFLARE_API_TOKEN`) plus `CLOUDFLARE_ACCOUNT_ID`.

```bash
pnpm --filter ./apps/gs-agent deploy
pnpm --filter ./apps/gs-agent deploy:preview
```
