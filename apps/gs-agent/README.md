# apps/gs-agent

## Overview
`gs-agent` is the queue-driven/background worker for `goldshore-jobs`. Keep this service separate from `gs-gateway`.

Its responsibilities are:
- consume background work from `goldshore-jobs`
- process queue-driven automation and async tasks after ingress has already responded
- provide a minimal fetch surface for health/status and any explicitly synchronous agent interactions routed through `gs-gateway`

The presence of queue connectivity between `gs-gateway` and `gs-agent` is deliberate, but it does **not** justify a full service merge. The queue is the asynchronous contract between ingress and background execution.

## Sync vs async flow rules

### Use direct service binding for synchronous interactions
Use direct Worker-to-Worker fetches only when the request must complete inline and return a response immediately.

Examples:
- health/status checks
- explicitly synchronous `agent.goldshore.ai` requests proxied through `gs-gateway`
- any small control-plane interaction where waiting on queue processing would be incorrect

`gs-agent` can participate in these flows, but they are secondary to its queue-consumer role.

### Use queue handoff for asynchronous/background work
Use `goldshore-jobs` for work that should be accepted now and processed later.

Examples:
- long-running AI agent tasks
- retryable or batched automation
- background enrichment, orchestration, or follow-up work triggered by ingress requests

This is the primary runtime mode for `gs-agent`.

## Wrangler configuration notes
The local worker config in `apps/gs-agent/wrangler.toml` reflects the intended split:
- `gs-agent` consumes `goldshore-jobs`
- it does not act as the public ingress worker
- its fetch handler exists for status/admin or explicitly synchronous agent calls, not to replace `gs-gateway`

## Routes and endpoints
These routes are implemented in `src/index.ts`:
- `GET /`
- `GET /health`
- `GET /templates`
- queue consumer for `goldshore-jobs`

## Local dev
```bash
pnpm install
pnpm --filter ./apps/gs-agent dev
pnpm --filter ./apps/gs-agent build
```

## Deploy
- Production deploy workflow: `.github/workflows/deploy-gs-agent.yml`
- Preview deploy workflow: `.github/workflows/preview-gs-agent.yml`
- Deploy command: `wrangler deploy --env prod --config wrangler.toml`
- Worker Builds should use the `gs-control` build token when configured in Cloudflare
