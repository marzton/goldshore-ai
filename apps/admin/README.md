# apps/admin

## Overview
The GoldShore admin cockpit is an Astro SSR dashboard protected by Cloudflare Access, built on the shared UI kit and theme.

Cloudflare metadata:
- Pages project name: `gs-admin` (production), `preview-admin` (preview)
- Pages bindings config: `infra/cloudflare/goldshore-admin.wrangler.toml`
- Connected services for preview builds: `PUBLIC_API=https://api-preview.goldshore.ai`, `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`

## Routes/Endpoints
Admin sections:
- `/admin/overview`
- `/admin/api-logs`
- `/admin/workers/status`
- `/admin/workers/bindings`
- `/admin/workers/routes`
- `/admin/users/list`
- `/admin/users/sessions`
- `/admin/users/permissions`
- `/admin/system/dns`
- `/admin/system/pages`
- `/admin/system/storage`
- `/admin/system/secrets`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/admin dev
pnpm --filter ./apps/admin build
pnpm --filter ./apps/admin preview
```

## Deploy
- Production deploy: `.github/workflows/deploy-admin.yml`
- Preview deploy: `.github/workflows/preview-admin.yml`

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
