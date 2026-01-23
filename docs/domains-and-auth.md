# Domains and Auth

This document tracks the domains that must be wired into GitHub App settings, Cloudflare Access, and any edge proxy configuration so preview branches can authenticate correctly.

## Preview domains referenced by apps

Preview environments for `apps/web` and `apps/admin` reference the following domains (from app docs and Cloudflare bindings):

| Area | Preview domain | Source |
| --- | --- | --- |
| Web (Pages) | `preview.goldshore.ai` | Cloudflare bindings map |
| Web (Pages per-branch) | `{branch}.goldshore-pages.dev` | Web app README |
| Admin (Pages) | `admin-preview.goldshore.ai` | Admin app README + Cloudflare bindings map |
| API worker | `api-preview.goldshore.ai` | Cloudflare bindings map |
| Gateway worker | `gw-preview.goldshore.ai` | Cloudflare bindings map |

## GitHub App preview callback URLs

Add the preview callback URLs for **each preview domain above that hosts the OAuth callback route** in GitHub App settings. Use the same callback path as production, but swap the host to the preview domain.

Example (replace `<callback-path>` with the production path configured in the GitHub App):

- `https://preview.goldshore.ai/<callback-path>`
- `https://{branch}.goldshore-pages.dev/<callback-path>`
- `https://admin-preview.goldshore.ai/<callback-path>`

If the GitHub App callback is routed through API or gateway previews, include them as well:

- `https://api-preview.goldshore.ai/<callback-path>`
- `https://gw-preview.goldshore.ai/<callback-path>`

## Cloudflare Access / edge proxy alignment

When Cloudflare Access or an edge proxy is enabled for preview domains:

- Ensure Access applications include the **same preview hostnames** as the GitHub App callback URLs.
- Confirm the OAuth callback path is **not blocked** by Access policies or edge rules.
- Keep allowlists (email, identity provider, or IP) in sync between preview and production so GitHub App auth flows match production behavior.
