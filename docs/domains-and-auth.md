# Domains & Auth (Single Source of Truth)

This document is the canonical reference for GoldShore domains, preview URLs, Cloudflare Access policy coverage, and GitHub App callback endpoints.

## Production domains

- `goldshore.ai`
- `api.goldshore.ai`
- `gw.goldshore.ai`
- `ops.goldshore.ai`

## Preview domains

- `*-preview.goldshore.ai`
- `{branch}.goldshore-pages.dev`

## Cloudflare Access policies

Cloudflare Access is enforced on internal tooling and protected previews. The table below captures the Access policy names and the domains they protect.

| Access application | Policy name | Domains protected | Notes |
| --- | --- | --- | --- |
| GoldShore Admin | GoldShore-Admin-ZT | `admin.goldshore.ai`, `*-preview.goldshore.ai` | Admin cockpit access (email allowlist + IdP). Preview hostnames share the same policy. |
| GoldShore Web (Preview) | GoldShore-Web-Preview | `{branch}.goldshore-pages.dev` | Production web (`goldshore.ai`) is public; previews are gated by Access. |
| GoldShore API | GoldShore-API-Bypass | `api.goldshore.ai` | Bypass policy for API (Access not enforced on public endpoints). |

## GitHub App callback URLs

- Production: `https://ops.goldshore.ai/auth/github/callback`
- Preview: `https://ops-preview.goldshore.ai/auth/github/callback`
