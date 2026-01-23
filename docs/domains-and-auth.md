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

Cloudflare Access is enforced only where required for internal tooling and private endpoints.

| Area | Domains | Access policy | Notes |
| --- | --- | --- | --- |
| Public web | `goldshore.ai` | No | Public marketing site. |
| Admin cockpit | `admin.goldshore.ai` | Yes | Internal admin dashboard, email allowlist + IdP/OTP. |
| Control worker | `ops.goldshore.ai` | Yes | Internal ops workflows and automation. |
| API worker | `api.goldshore.ai` | Optional | Enable for private endpoints only. |
| Gateway worker | `gw.goldshore.ai` | Optional | Depends on routing/auth design. |
| Mail handler | `mail.goldshore.ai` | No | Cloudflare mail routing cannot authenticate. |

## GitHub App callback URLs

- Production: `https://ops.goldshore.ai/auth/github/callback`
- Preview: `https://ops-preview.goldshore.ai/auth/github/callback`
