# apps/gs-gateway

## Overview
`gs-gateway` is the GoldShore ingress and proxy worker. Keep this service separate from `gs-agent`.

Its responsibilities are:
- terminate incoming edge traffic for `gw.goldshore.ai`, `gateway.goldshore.ai`, and `agent.goldshore.ai`
- enforce shared middleware such as Access verification, CORS, and request tracing
- proxy synchronous calls to downstream workers via direct service bindings
- enqueue background jobs onto `goldshore-jobs` when work should continue asynchronously

Queue connectivity from `gs-gateway` to `gs-agent` is intentional, but it is **not** a reason to merge the two workers. The queue is the async handoff boundary; `gs-gateway` remains the ingress/proxy surface and `gs-agent` remains the background processor.

## Sync vs async flow rules

### Use a direct service binding for synchronous interactions
Use a Worker service binding when the caller needs an immediate response in the same request lifecycle.

Examples:
- `gs-gateway` → `gs-api` for `/api/*` proxy traffic
- `gs-gateway` → `gs-agent` when the `agent.goldshore.ai` hostname should resolve to an immediate fetch response from the agent worker
- any request path where auth, validation, and the downstream response must complete before returning to the client

Current synchronous bindings in `wrangler.toml`:
- `API` → `gs-api`
- `AGENT` → `gs-agent`

### Use queue handoff for asynchronous/background work
Use `JOB_QUEUE` / `goldshore-jobs` when the work should continue after the HTTP request is accepted.

Examples:
- long-running AI or automation jobs
- retries, fan-out, or batchable background processing
- tasks where the caller only needs acknowledgement that the job was accepted

Current async binding in `wrangler.toml`:
- `JOB_QUEUE` producer → `goldshore-jobs`

## Wrangler configuration notes
The worker configuration in `apps/gs-gateway/wrangler.toml` preserves the sync-vs-async split in both production aliases (`prod` and `production`) and preview:
- service bindings are reserved for synchronous fetch-time interactions
- the queue producer is reserved for background handoff
- `gs-gateway` stays the ingress layer even though it can reach `gs-agent` in both sync and async modes

## Routes and endpoints
These routes are implemented in `src/index.ts`:
- `GET /`
- `GET /health`
- `GET /templates`
- `GET /user/login`
- `POST /v1/chat`
- `/api/*` proxy passthrough to `gs-api`
- `agent.goldshore.ai/*` passthrough to `gs-agent` via service binding

## Local dev
```bash
pnpm install
pnpm --filter ./apps/gs-gateway dev
pnpm --filter ./apps/gs-gateway build
```

## Deploy
- Production deploy workflow: `.github/workflows/deploy-gs-gateway.yml.disabled`
- Preview deploy workflow: `.github/workflows/preview-gs-gateway.yml`
- Deploy command: `wrangler deploy --config wrangler.toml`
- Worker Builds should use the `gs-control` build token when configured in Cloudflare

## Workflow conventions
Gateway workflows run from the repository root for install/validation, then switch to `working-directory: apps/gs-gateway` only for `wrangler deploy`. Keep this convention for new jobs to avoid root/subdirectory drift in CI behavior.
