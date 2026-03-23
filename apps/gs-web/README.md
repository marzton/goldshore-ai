# GoldShore Web (`apps/gs-web`)

Public marketing site, documentation hub, and customer-facing Astro app for GoldShore. This app deploys to Cloudflare Pages and shares UI/theme packages with the rest of the monorepo.

## App overview

`gs-web` is the public web surface for:

- marketing pages and contact flows,
- developer documentation and API reference,
- lightweight customer-facing routes,
- preview environments protected with Cloudflare Access.

Cloudflare metadata:

- Pages project name: `gs-web` (production), `preview-web` (preview)
- Pages bindings config: `infra/Cloudflare/gs-web.wrangler.toml`
- Preview runtime bindings commonly set by CI:
  - `PUBLIC_API=https://api-preview.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`
- Build diagnostics exposed on `/status`:
  - `PUBLIC_BUILD_TIMESTAMP`
  - `PUBLIC_COMMIT_HASH`

## Routes

Routing and access policy: [`docs/security-scope.md`](../../docs/security-scope.md).

Public routes:

- `/`
- `/about`
- `/pricing`
- `/legal/privacy`
- `/legal/terms`
- `/contact`
- `/developer/docs`
- `/developer/api/*`

Authenticated or protected surfaces:

- `/app/dashboard`
- `/app/profile`
- `/app/logs`
- `/app/settings`
- preview hostnames documented in [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md)

## CSP inventory

Browser-side `connect-src` dependencies currently required by `gs-web`:

- `'self'` for same-origin endpoints such as `/api/contact` and `/api/docs-search`
- `https://api.goldshore.ai` for production browser calls made by `src/components/TryItConsole.astro`
- `https://api-preview.goldshore.ai` for preview browser calls when `PUBLIC_API` points at the preview API

Current browser/runtime call inventory under `src/`:

- `src/components/ContactForm.astro` → same-origin `POST /api/contact`
- `src/components/DocsSearch.astro` → same-origin `GET /api/docs-search`
- `src/components/ServiceStatus.astro` → browser `fetch(serviceUrl)`; keep this prop same-origin unless CSP is explicitly expanded
- `src/components/TryItConsole.astro` → browser `fetch(${PUBLIC_API} + path)`; this is the reason external API origins remain in `connect-src`
- `src/pages/[...path].astro` → server-side Astro fetches to `${PUBLIC_API}/pages/slug/...`; this is **not** a browser CSP dependency
- `src/pages/developer/docs/index.astro` and content docs may display `PUBLIC_API` / `PUBLIC_GATEWAY` values in examples, but they do **not** create browser runtime network calls by themselves

The shared CSP constants live in `src/utils/csp.ts`. Keep `connect-src` limited to the hosts above unless a new browser-side integration is added and reviewed.

## Deployment

Local development:

```bash
pnpm install
pnpm --filter ./apps/gs-web dev
pnpm --filter ./apps/gs-web build
pnpm --filter ./apps/gs-web preview
```

Production build from repo root:

```bash
pnpm --filter @goldshore/gs-web build
```

Cloudflare Pages settings for the monorepo:

- **Root directory:** `apps/gs-web`
- **Build command:** `pnpm build`
- **Output directory:** `dist`

Deployment workflows:

- Production deploy: `.github/workflows/deploy-web.yml`
- Preview deploy: `.github/workflows/preview-web.yml`
- Domains, previews, and Access policy details: [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md)

## Preview auth

Preview environments are not public.

- Preview builds reuse the centralized GitHub App callback handler instead of registering per-branch callbacks.
- Cloudflare Access protects preview hostnames using the shared Access application and policy set.
- Non-interactive checks against Access-protected preview hosts should use Cloudflare Access service-token headers (`CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET`) rather than assuming anonymous access.
- Canonical domain and Access policy details live in [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

## Runtime storage bindings

`gs-web` keeps its existing runtime storage model. Do **not** reuse these bindings as shared configuration storage.

- `KV`: edge persistence and cache-style writes for Pages Functions, including contact submission replicas and other edge-friendly writes.
- `DB`: D1-backed system of record for forms, form configuration, and lead/submission data.
- `GS_CONFIG`: **not bound in `gs-web` today**. If the web app later needs shared configuration reads, add a separate intentional **read-only** config binding instead of repurposing `KV`.

## Contact form and mail delivery

`/api/contact` stores submissions in both `KV` and `DB` when available, and can send email through MailChannels from Cloudflare Pages Functions.

Set these environment variables in the `gs-web` Pages project:

- `MAILCHANNELS_SENDER_EMAIL` (required for email send)
- `MAILCHANNELS_SENDER_NAME` (optional, defaults to `GoldShore`)
- `CONTACT_NOTIFICATION_EMAILS` (comma-separated recipient list for new submissions)
- `MAILCHANNELS_API_URL` (optional override, defaults to `https://api.mailchannels.net/tx/v1/send`)

Keep the existing `KV` and `DB` bindings so submissions continue to persist even if email delivery is temporarily unavailable. If shared config reads are ever needed here, introduce a new read-only config binding rather than changing the purpose of `KV`.

## Source of truth

For API behavior, treat the OpenAPI description and generated API reference as canonical. `README.md` and the prose docs in `src/content/docs/` should summarize and explain that behavior; if they diverge from the OpenAPI surface, update the docs to match the API contract.
