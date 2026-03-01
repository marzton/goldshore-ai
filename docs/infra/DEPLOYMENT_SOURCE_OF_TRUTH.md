# Deployment Source of Truth

## Cloudflare Pages lock (Option A)

Gold Shore web deployments must use the canonical app surface only.

- **Root directory:** `apps/gs-web`
- **Build output directory:** `dist`

## Change control

Agents must not alter the Cloudflare root build target unless explicitly authorized with phase label:

- `infra/build-root-change`

Any proposed change without this phase label is structural drift and must be rejected.
