# GoldShore Admin (`apps/gs-admin`)

Secure Astro-based operations console for GoldShore teams.

## Overview

`gs-admin` is the internal dashboard for operations, content, user, and system workflows. It is protected with Cloudflare Access and uses shared workspace packages for auth, config, schema, theme, UI, and utilities.

Documentation:

- [Integrations hub](../../docs/integrations.md)
- [Agent integration policy](../../docs/agent-integration.md)
- [Domains and auth](../../docs/domains-and-auth.md)

## Cloudflare configuration

- Pages project: `gs-admin`
- App-local Wrangler config: `apps/gs-admin/wrangler.toml`
- Canonical Cloudflare manifest: `infra/Cloudflare/gs-admin.wrangler.toml`
- Preview and production deployments are handled by the live workflows under `.github/workflows/`.

## Routes and endpoints

Routing and access policy: [`docs/security-scope.md`](../../docs/security-scope.md).

### Top-level pages

- `/`
- `/ai`
- `/api-logs`
- `/appearance/hero`
- `/dashboard`
- `/deployments`
- `/domain`
- `/logs`
- `/settings`
- `/systems`
- `/templates`
- `/trading`
- `/users`

### Admin pages

- `/admin/overview`
- `/admin/analytics`
- `/admin/api-logs`
- `/admin/content`
- `/admin/forms`
- `/admin/forms/:slug`
- `/admin/logs`
- `/admin/media`
- `/admin/monetization`
- `/admin/page-editor`
- `/admin/pages`
- `/admin/pages/new`
- `/admin/pages/editor`
- `/admin/pages/:id`
- `/admin/pii-scans`
- `/admin/settings`
- `/admin/system`
- `/admin/system/dns`
- `/admin/system/pages`
- `/admin/system/secrets`
- `/admin/system/storage`
- `/admin/systems`
- `/admin/users`
- `/admin/users/list`
- `/admin/users/permissions`
- `/admin/users/sessions`
- `/admin/workers`
- `/admin/workers/bindings`
- `/admin/workers/routes`
- `/admin/workers/status`

### API routes served from `gs-admin`

- `GET /api/admin/hero`
- `POST /api/admin/hero`
- `GET /api/gs-api/health`
- `GET /api/gs-api/status`
- `GET /api/gs-api/version`
- `GET /api/gs-api/config`
- `PUT /api/gs-api/config`
- `GET /api/gs-api/dns-sync-status`
- `GET /api/gs-api/inbox-status`
- `GET /api/gs-api/sync-runs`

## Development

```bash
pnpm install
pnpm --filter @goldshore/gs-admin dev
pnpm --filter @goldshore/gs-admin build
pnpm --filter @goldshore/gs-admin preview
```

Useful checks:

```bash
pnpm --filter @goldshore/gs-admin test
pnpm --filter @goldshore/gs-admin test:unit
```

## Deployment

- Production workflow: `.github/workflows/deploy-gs-admin.yml`
- Preview workflow: `.github/workflows/preview-gs-admin.yml`
- Cloudflare Pages root directory: `apps/gs-admin`
- Build command: `pnpm build`
- Output directory: `dist`

See [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md) for Access and preview-host details.

## Admin UI structure

Key reusable building blocks:

- `src/layouts/AdminLayout.astro`
- `src/components/Sidebar.astro`
- `src/components/Topbar.astro`
- `src/components/StatCard.astro`
- `src/components/Table.astro`
- `src/pages/templates/index.astro` for scaffolding new operational pages

## Operational guidance

- Keep navigation and layout concerns in `AdminLayout`.
- Prefer reusable modules for tables, cards, and workflow dashboards.
- Coordinate admin changes with the API and agent surfaces when dashboards depend on live service data.
