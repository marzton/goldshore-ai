# GoldShore Web (Astro)

Public marketing site and content hub for GoldShore.

## Goals

- Keep **navbars, menus, and responsive containers** in shared layouts.
- Keep **page content** in `src/pages` to remain lightweight.
- Keep **search** as a reusable component that can be embedded in marketing, docs, and portals.

## Template Page

Use the template page as the default starting point for new marketing or campaign pages:

- `src/pages/templates/index.astro`

The template demonstrates:

- Layout-driven navigation + menus.
- Grid containers for desktop/tablet/mobile.
- Search module integration.
- CTA cards and campaign-ready sections.

## Key Layouts + Components

- `src/layouts/WebLayout.astro`: Global nav, menu toggle, and footer.
- `src/layouts/MarketingLayout.astro`: Thin wrapper for marketing content.
- `src/components/DocsSearch.astro`: Independent search widget.
- `src/components/Hero.astro`, `FeatureGrid.astro`: Reusable marketing sections.

## SEO + Marketing Guidance

- Use descriptive `title` and `description` props on layouts.
- Keep CTA blocks consistent with `@goldshore/ui` buttons.
- Make every page responsive using `gs-grid` and `gs-section` helpers.

## Integrations to Plan

- AI: Google Gemini, ChatGPT, Jules, Cloudflare AI Gateway.
- Marketing + CRM: HubSpot, Mailchimp, Salesforce.
- Commerce: Stripe, Shopify, invoicing portals.
- Market data landing pages: Alpaca, Thinkorswim, Polygon, Tradier.

## Development

# apps/web

## Overview
The public GoldShore website and user portal built with Astro and shared theme/UI packages. It deploys to Cloudflare Pages.

Cloudflare metadata:
- Pages project name: `gs-web` (production), `preview-web` (preview)
- Pages bindings config: `infra/cloudflare/goldshore-web.wrangler.toml`
- Connected services for preview builds: `PUBLIC_API=https://api-preview.goldshore.ai`, `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`

## Routes/Endpoints
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
- Domains, previews, and Access policies: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

## Preview Authentication
- Preview builds reuse the centralized GitHub App callback handler; OAuth completes in the shared callback service, which redirects back to the preview hostname instead of registering per-branch callbacks.
- Cloudflare Access is enforced by the shared Access application and policy set, with preview hostnames allowlisted alongside production domains.
- See the centralized guide: [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

<!-- // [AUTO-UPDATE] Updated by Jules AI on 2026-01-23 01:43 -->
# GoldShore Web (Astro)

Public marketing site and content hub for GoldShore.

## Goals

- Keep **navbars, menus, and responsive containers** in shared layouts.
- Keep **page content** in `src/pages` to remain lightweight.
- Keep **search** as a reusable component that can be embedded in marketing, docs, and portals.

## Template Page

Use the template page as the default starting point for new marketing or campaign pages:

- `src/pages/templates/index.astro`

The template demonstrates:

- Layout-driven navigation + menus.
- Grid containers for desktop/tablet/mobile.
- Search module integration.
- CTA cards and campaign-ready sections.

## Key Layouts + Components

- `src/layouts/WebLayout.astro`: Global nav, menu toggle, and footer.
- `src/layouts/MarketingLayout.astro`: Thin wrapper for marketing content.
- `src/components/DocsSearch.astro`: Independent search widget.
- `src/components/Hero.astro`, `FeatureGrid.astro`: Reusable marketing sections.

## SEO + Marketing Guidance

- Use descriptive `title` and `description` props on layouts.
- Keep CTA blocks consistent with `@goldshore/ui` buttons.
- Make every page responsive using `gs-grid` and `gs-section` helpers.

## Integrations to Plan

- AI: Google Gemini, ChatGPT, Jules, Cloudflare AI Gateway.
- Marketing + CRM: HubSpot, Mailchimp, Salesforce.
- Commerce: Stripe, Shopify, invoicing portals.
- Market data landing pages: Alpaca, Thinkorswim, Polygon, Tradier.

## Development

```bash
pnpm --filter @goldshore/web dev
```
# apps/web

## Overview
The public GoldShore website and user portal built with Astro, shared theme, and UI components. It deploys to Cloudflare Pages as the primary marketing and customer-facing experience.

## Routes/Endpoints
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

## Local Dev
```bash
pnpm install
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
```

## Deploy
Cloudflare Pages deploys via GitHub Actions. Domains, previews, and Access policies: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

## Preview Authentication
- Preview builds reuse the centralized GitHub App callback handler; OAuth completes in the shared callback service, which redirects back to the preview hostname instead of registering per-branch callbacks.
- Cloudflare Access is enforced by the shared Access application and policy set, with preview hostnames allowlisted alongside production domains.
- See the centralized guide: [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).
