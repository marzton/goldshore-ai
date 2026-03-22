# apps/gs-api

## Overview
The `gs-api` worker is the primary Hono API for GoldShore. In production it is deployed as the `gs-api` Cloudflare Worker and serves `api.goldshore.ai/*` from the `prod` environment.

## Source of truth
This README is maintained manually. There is no generator in this repository for worker endpoint docs. If this file drifts, treat these files as authoritative and update the README to match them:

- `apps/gs-api/wrangler.toml` for routes, compatibility date, and declared bindings.
- `apps/gs-api/src/index.ts` for mounted route prefixes and auth behavior.
- `apps/gs-api/src/routes/*.ts` for concrete endpoint handlers.

## Cloudflare configuration
From `apps/gs-api/wrangler.toml`:

- Worker name: `gs-api`
- Entry point: `src/index.ts`
- Compatibility date: `2024-11-01`
- Compatibility flags: `nodejs_compat`
- Production route: `api.goldshore.ai/*`
- Declared vars:
  - `ENV=production`
  - `CLOUDFLARE_ACCESS_AUDIENCE`
  - `CLOUDFLARE_TEAM_DOMAIN`
  - `CONTROL_SYNC_TOKEN`
- Declared bindings:
  - `KV` (`kv_namespaces`)
  - `CONTROL_LOGS` (`kv_namespaces`)
  - `ASSETS` (`r2_buckets`)
  - `DB` (`d1_databases`)
  - `AI` (`ai`)

## Runtime notes
- All routes except `/`, `/health`, `/health/*`, and `OPTIONS` require Cloudflare Access JWT validation.
- `POST /internal/sync-runs` can bypass Access when `x-control-sync-token` matches `CONTROL_SYNC_TOKEN`.
- The code also references optional secrets/vars that are not declared in `wrangler.toml`: `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `GIT_SHA`.

## Authoritative endpoint list
Mounted in `src/index.ts` and implemented in `src/routes/*.ts`.

### Public / infra
- `GET /` — HTML status page.
- `GET /health` — shallow health check.
- `GET /health?type=deep` — deep health check covering `KV` and `DB`.

### AI
- `GET /ai` — AI service status.
- `POST /ai/analysis` — orchestration-backed analysis endpoint using `KV` cache/config and provider secrets.

### User data
- `GET /users` — list users.
- `GET /users/:id` — fetch a user.
- `GET /user/:id` — legacy redirect to `/users/:id`.
- `GET /v1/users`
- `GET /v1/users/:id`

### System / templates / internal
- `GET /system/status`
- `GET /system/routing`
- `GET /system/config`
- `PUT /system/config`
- `GET /system/version`
- `GET /templates`
- `GET /internal/inbox-status`
- `GET /internal/dns-sync-status`

### Admin
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/audit`

### Media
- `GET /media`
- `GET /media/:id`
- `POST /media/upload`

### Pages
- `GET /pages`
- `GET /pages/slug/:slug`
- `GET /pages/:id`
- `POST /pages`
- `PUT /pages/:id`
- `PATCH /pages/:id/status`
- `DELETE /pages/:id`

### Versioned placeholder routes
- `GET /v1/agents`
- `GET /v1/models`
- `GET /v1/logs`

## Local development
```bash
pnpm install
pnpm --filter ./apps/gs-api dev
pnpm --filter ./apps/gs-api build
```

## Deploy
- Production workflow: `.github/workflows/deploy-api-worker.yml`
- Preview workflow: `.github/workflows/preview-api-worker.yml`
- Deploy command:

```bash
pnpm --filter ./apps/gs-api deploy
```

## Cloudflare Worker Builds troubleshooting
If Cloudflare Worker Builds fails before dependency installation with the deleted-or-rolled build token error, the problem is in the Worker Builds project settings rather than this repository.

1. Open **Workers & Pages** → **gs-api** → **Settings** → **Builds**.
2. Create or select an active Worker Builds token.
3. Save the updated token in Worker Builds settings.
4. Re-run the build.

Notes:
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` can still be valid while Worker Builds fails.
- Rotating or deleting the Worker Builds token invalidates queued and new builds that still reference the old token.
