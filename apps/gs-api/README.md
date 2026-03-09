# apps/gs-api

## Overview
The `gs-api` worker is the primary Hono-based API layer for GoldShore, served from `https://api.goldshore.ai/*` on Cloudflare Workers.

Cloudflare metadata (from `wrangler.toml`):
- Worker name: `gs-api`
- Route: `api.goldshore.ai/*`
- Compatibility date: `2025-01-10`
- Bindings: `API_KV` (KV), `ASSETS` (R2), `DB` (D1), `AI` (AI Gateway)
- Environment variable: `ENV=production`
The `gs-api` worker is the primary Hono-based API layer for GoldShore, served from `https://api.goldshore.ai/*` on Cloudflare Workers. It uses KV, R2, D1, and the AI Gateway bindings configured in `wrangler.toml`.

Configuration highlights (from `wrangler.toml`):
- `ENV=production`
- KV binding: `API_KV`
- R2 binding: `ASSETS`
- D1 binding: `DB`
- AI binding: `AI`

## Routes/Endpoints
These are API endpoints handled by the worker in `src/index.ts` and the route files in `src/routes` (not HTML pages). The router files are the source of truth.
- `GET /` (status page)
- `GET /health`
- `GET /ai`
- `POST /ai/analysis`
- `GET /users`
- `GET /user/:id`
- `GET /system/info`
- `GET /templates`
- `GET /v1/users`
- `GET /v1/agents`
- `GET /v1/models`
- `GET /v1/logs`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/gs-api dev
pnpm --filter ./apps/gs-api build
```

## Deploy
- Production deploy: `.github/workflows/deploy-gs-api.yml`
- Preview deploy: `.github/workflows/preview-gs-api.yml`
- Uses `wrangler deploy` with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets

### Cloudflare Worker Builds troubleshooting

If Cloudflare Worker Builds fails before dependency installation with:

`Failed: The build token selected for this build has been deleted or rolled and cannot be used for this build.`

the issue is in Worker Builds project settings (not this repository code).

Fix in Cloudflare Dashboard:

1. Open **Workers & Pages** → **gs-api** → **Settings** → **Builds**.
2. Set **Deploy command** to:

   ```bash
   pnpm wrangler deploy --config apps/gs-api/wrangler.toml --env prod --outdir=apps/gs-api/dist
   ```

3. Set **Build command** to:

   ```bash
   pnpm wrangler deploy --config apps/gs-api/wrangler.toml --env prod --dry-run --outdir=apps/gs-api/dist
   ```

4. Ensure no stale override is inherited from another template/project (especially any command still referencing `apps/gs-gateway`).
5. Create or select an active Worker Builds token.
6. Save Worker Builds settings and re-run the build.

Notes:
- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` can still be valid while Worker Builds fails.
- Rotating/deleting the Worker Builds token immediately invalidates queued and new builds that reference the old token.

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
```bash
pnpm --filter ./apps/gs-api deploy
```
