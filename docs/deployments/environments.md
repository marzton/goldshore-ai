# Cloudflare Environments and Domain Matrix

This document is the canonical source of truth for Goldshore Cloudflare environment naming, domain ownership, frontend public origins, and deploy triggers.

## Environment model

All services use these environment names:

- `dev`
- `preview`
- `prod`

Workers must deploy with explicit environment selection:

- `wrangler deploy --env preview`
- `wrangler deploy --env prod`

## Domain ownership matrix

| Surface | Type | Production hostname | Preview hostname | Owner | Notes |
|---|---|---|---|---|---|
| Public site | Pages | `goldshore.ai` | Cloudflare Pages branch URL | `gs-web` | Uses `PUBLIC_API` and `PUBLIC_GATEWAY`. |
| Admin cockpit | Pages | `admin.goldshore.ai` | Cloudflare Pages branch URL | `gs-admin` | Uses `PUBLIC_API` and `PUBLIC_GATEWAY`. |
| API | Worker | `api.goldshore.ai` | `api-preview.goldshore.ai` | `gs-api` | Routed worker hostname. |
| Gateway | Worker | `gw.goldshore.ai` | `gw-preview.goldshore.ai` | `gs-gateway` | Service-binds to `gs-api` in same env. |
| Ops/control | Worker | `ops.goldshore.ai` | `ops-preview.goldshore.ai` | `gs-control` | Service-binds to `gs-api` and `gs-gateway` in same env. |
| Mail intake | Worker | `mail.goldshore.ai` (optional) | `mail-preview.goldshore.ai` | `gs-mail` | Stable HTTP intake endpoint. |

## Frontend runtime contract

### gs-web

- Prod
  - `PUBLIC_API=https://api.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw.goldshore.ai`
- Preview
  - `PUBLIC_API=https://api-preview.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`

### gs-admin

- Prod
  - `PUBLIC_API=https://api.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw.goldshore.ai`
- Preview
  - `PUBLIC_API=https://api-preview.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`

## Worker binding contract summary

- `gs-gateway` (`preview`, `prod`)
  - `API -> gs-api` in same environment
- `gs-control` (`preview`, `prod`)
  - `API -> gs-api` in same environment
  - `GATEWAY -> gs-gateway` in same environment
- `gs-mail` (`preview`, `prod`)
  - No service binding required for intake
  - Must expose CORS-safe endpoint and authenticated provider path

## Deploy trigger matrix

| Service | Preview trigger | Production trigger |
|---|---|---|
| `gs-api` | PR with `preview` label | `main` push |
| `gs-gateway` | PR with `preview` label | `main` push |
| `gs-control` | PR with `preview` label | `main` push |
| `gs-mail` | PR with `preview` label | `main` push |
| `gs-web` | PR with `preview` label | `main` push |
| `gs-admin` | PR with `preview` label | `main` push |

## Contributor quickstart

1. Set Worker and Pages secrets/vars for `preview` and `prod`.
2. Deploy workers with explicit `--env`.
3. Ensure frontends use `PUBLIC_API` and `PUBLIC_GATEWAY` values matching their env.
4. Validate no worker routes or service bindings point from preview to production.
