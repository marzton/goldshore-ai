# apps/web

## Overview
Public GoldShore website and user portal built with Astro. It uses shared packages (`@goldshore/ui`, `@goldshore/theme`) and deploys to Cloudflare Pages.

## Cloudflare metadata
- Pages project name: `gs-web` (production), `preview-web` (preview)
- Pages bindings config: `infra/cloudflare/goldshore-web.wrangler.toml`
- Preview service URLs:
  - `PUBLIC_API=https://api-preview.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`

## Theme resolution note (Astro + Vite)
To avoid runtime resolution ambiguity in the monorepo, `apps/web/astro.config.mjs` defines explicit Vite aliases for theme CSS:
- `@goldshore/theme` -> `../../packages/theme/index.css`
- `@goldshore/theme/*` -> `../../packages/theme/src/*`

When importing tokens in pages/layouts, prefer the explicit CSS entry:
- `@goldshore/theme/styles/tokens.css`

## Routes
Routing & access policy: [`docs/security-scope.md`](../../docs/security-scope.md).

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

## Local development
```bash
pnpm install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

## Deploy
- Production deploy workflow: `.github/workflows/deploy-web.yml`
- Preview deploy workflow: `.github/workflows/preview-web.yml`
- Domains and Access policies: [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md)

## Preview authentication
- Preview builds reuse the centralized GitHub App callback handler.
- Cloudflare Access is enforced by shared Access app/policies with preview hostnames allowlisted.
- See: [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).
