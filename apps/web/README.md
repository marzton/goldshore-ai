# apps/web

## Overview
The public GoldShore website and user portal built with Astro and shared theme/UI packages. It deploys to Cloudflare Pages.

Cloudflare metadata:
- Pages project name: `gs-web` (production), `preview-web` (preview)
- Pages bindings config: `infra/cloudflare/goldshore-web.wrangler.toml`
- Connected services for preview builds: `PUBLIC_API=https://api-preview.goldshore.ai`, `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`

## Routes/Endpoints
Public routes:
- `/`
- `/about`
- `/pricing`
- `/legal/privacy`
- `/legal/terms`
- `/contact`

Authenticated user portal:
- `/app/dashboard`
- `/app/profile`
- `/app/logs`
- `/app/settings`

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

## Deploy
- Production deploy: `.github/workflows/deploy-web.yml`
- Preview deploy: `.github/workflows/preview-web.yml`

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
