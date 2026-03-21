# apps/gs-agent

## Overview
The `gs-agent` worker is the canonical GoldShore agent service. It serves a small Hono-based status UI, exposes a health endpoint, and processes queue-driven agent work.

Cloudflare metadata (from `infra/Cloudflare/gs-agent.wrangler.toml`):
- Worker base name: `gs-agent`
- Environment names: `gs-agent-dev`, `gs-agent-preview`, `gs-agent-prod`
- Queue consumer: `goldshore-jobs`
- Compatibility date: `2024-03-20`

## Routes/Endpoints
- `/` → status UI
- `/health` → JSON health response

## Configuration
- The authoritative external Wrangler config lives at `infra/Cloudflare/gs-agent.wrangler.toml`.
- Local package scripts also use `apps/gs-agent/wrangler.toml` for app-local defaults.
- Preview deploys are exercised in GitHub Actions; production promotion is intentionally not automated in Actions.

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gs-agent dev
pnpm --filter ./apps/gs-agent build
```

## Deploy
- Deployment state: **preview-only by design**.
- Active preview workflow: `.github/workflows/preview-gs-agent.yml`.
- There is intentionally no active production deploy workflow under `.github/workflows/`.
- Production deploys, when needed, are run manually by ops via Wrangler.
- Deployment policy reference: [`docs/ci/WORKER_DEPLOYMENT_STATES.md`](../../docs/ci/WORKER_DEPLOYMENT_STATES.md).

```bash
pnpm --filter ./apps/gs-agent deploy
```
