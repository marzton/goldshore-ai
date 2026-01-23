# Domains and Auth (Cloudflare Access)

## Scope

This document captures the Cloudflare Access applications and policies that protect GoldShore Pages deployments, including preview domains for web and admin.

## Access applications and policies

| Access application | Policy name | Domain coverage | Notes |
| --- | --- | --- | --- |
| GoldShore Admin | GoldShore-Admin-ZT | `admin.goldshore.ai`, `admin-preview.goldshore.ai`, `*-preview.goldshore.ai` (admin preview branches) | Admin cockpit is protected by Access with an email allowlist + identity provider requirement. Preview domains should be attached to the same application to match production enforcement. |
| GoldShore Web (Preview) | GoldShore-Web-Preview | `preview.goldshore.ai`, `{branch}.goldshore-pages.dev` | Web production (`goldshore.ai`, `www.goldshore.ai`) is public, but preview domains must be gated behind Access. |

## Identity providers and session policy alignment

Preview applications should mirror production configuration wherever Access is enforced:

- **Identity providers:** Use the same IdPs as production (currently the admin Access policy requires GitHub as the identity provider).
- **Session policy:** Keep session duration, re-authentication, and device posture requirements aligned with production to avoid preview-only auth drift.

## Source-of-truth references

- Cloudflare desired state for Access policy naming and domain ownership lives in `infra/cloudflare/desired-state.yaml`.
- Pages custom domains for admin and web are documented in `infra/cloudflare/BINDINGS_MAP.md`.
