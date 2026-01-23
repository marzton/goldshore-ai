# apps/web

## Overview
The public GoldShore website and user portal built with Astro, shared theme, and UI components. It deploys to Cloudflare Pages as the primary marketing and customer-facing experience.

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
Cloudflare Pages deploys via GitHub Actions. Preview branches publish to `{branch}.goldshore-pages.dev`.
