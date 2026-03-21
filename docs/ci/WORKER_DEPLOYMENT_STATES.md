# Worker Deployment States

Last reviewed: 2026-03-21

This document is the canonical source of truth for the deploy posture of the three edge workers that previously had mixed GitHub Actions states.

## Current decisions

| Worker | State | GitHub Actions status | Production source of truth | Notes |
|---|---|---|---|---|
| `gs-agent` | **Preview-only by design** | Keep `.github/workflows/preview-gs-agent.yml`. No production workflow lives under `.github/workflows/`. | Manual Wrangler deploy by ops when production promotion is intentionally required. | The preview workflow exists to validate queue-consumer changes on pull requests without implying automatic production rollout. |
| `gs-gateway` | **Preview-only by design** | Keep `.github/workflows/preview-gs-gateway.yml`. No production workflow lives under `.github/workflows/`. | Manual Wrangler deploy by ops when production promotion is intentionally required. | Preview deploys remain available for PR validation, but GitHub Actions is not authoritative for production. |
| `gs-control` | **Fully manual / no GitHub deploy automation** | No preview or production workflow is active under `.github/workflows/`. | Manual Wrangler deploy by ops. | This worker mutates operational infrastructure, so both preview and production deployment are intentionally kept out of GitHub Actions. |

## Manual deployment commands

Run these from the repository root with the usual Cloudflare credentials exported in your shell (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).

```bash
pnpm --filter ./apps/gs-agent deploy
pnpm --filter ./apps/gs-gateway deploy
pnpm --filter ./apps/gs-control deploy
```

## What changed

- Retired the disabled production workflow files for `gs-agent`, `gs-gateway`, and `gs-control` from `.github/workflows/` so the active workflow directory reflects the intended state.
- Kept preview workflows only for `gs-agent` and `gs-gateway`, because those workers are preview-enabled by design.
- Left `gs-control` without any active deploy workflow and documented manual deployment explicitly to avoid silent drift.
