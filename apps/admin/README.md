# apps/admin

## Overview
The GoldShore admin cockpit is an Astro SSR dashboard protected by Cloudflare Access. It uses the shared GoldShore UI kit and theme tokens.

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
Cloudflare Pages deploys via GitHub Actions. Admin previews publish to `admin-preview.goldshore.ai`.
