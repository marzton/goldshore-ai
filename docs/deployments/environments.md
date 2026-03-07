# Deployment Environments

This document defines canonical environment names, hostname ownership, public origin mapping, and workflow trigger policy for Goldshore services.

## Canonical environment names

- `dev`: local development and/or ephemeral worker environments used before PR preview deployment.
- `preview`: pull-request deploy targets under `*-preview.goldshore.ai`.
- `prod`: production deploy targets under `*.goldshore.ai`.

## Hostname ownership matrix

| Service | Dev | Preview | Prod |
| --- | --- | --- | --- |
| `gs-api` | `*.workers.dev` / local (`wrangler dev`) | `api-preview.goldshore.ai` | `api.goldshore.ai` |
| `gs-gateway` | `*.workers.dev` / local (`wrangler dev`) | `gw-preview.goldshore.ai` (`gateway-preview.goldshore.ai` alias) | `gw.goldshore.ai` (`gateway.goldshore.ai`, `agent.goldshore.ai` aliases) |
| `gs-control` | `*.workers.dev` / local (`wrangler dev`) | `ops-preview.goldshore.ai` | `ops.goldshore.ai` (`control.goldshore.ai` alias) |
| `gs-mail` | `*.workers.dev` / local (`wrangler dev`) | `mail-preview.goldshore.ai` (reserved; optional) | `mail.goldshore.ai` |
| `gs-web` | local Astro dev server | `preview.goldshore.ai` (+ branch preview hosts) | `goldshore.ai` (`www.goldshore.ai`) |
| `gs-admin` | local Astro dev server | `admin-preview.goldshore.ai` (+ branch preview hosts) | `admin.goldshore.ai` |

## Preview vs prod frontend origin mapping (`PUBLIC_*`)

The browser/runtime contract should switch as a pair: preview frontends target preview worker origins, production frontends target production worker origins.

| Variable | Preview value | Prod value |
| --- | --- | --- |
| `PUBLIC_API` | `https://api-preview.goldshore.ai` | `https://api.goldshore.ai` |
| `PUBLIC_GATEWAY` | `https://gw-preview.goldshore.ai` | `https://gw.goldshore.ai` |
| `PUBLIC_CONTROL` | `https://ops-preview.goldshore.ai` | `https://ops.goldshore.ai` |
| `PUBLIC_MAIL` | `https://mail-preview.goldshore.ai` (if enabled) | `https://mail.goldshore.ai` |
| `PUBLIC_WEB` | `https://preview.goldshore.ai` | `https://goldshore.ai` |
| `PUBLIC_ADMIN` | `https://admin-preview.goldshore.ai` | `https://admin.goldshore.ai` |

## Workflow trigger policy

- **Production deploys (`prod`)**: trigger from push events on `main` for deploy workflows.
- **Preview deploys (`preview`)**: trigger on PR events when:
  - the PR has label `preview`, or
  - the PR transitions to `ready_for_review` targeting `main`.

This keeps previews opt-in via label while still allowing ready-for-review PRs against `main` to auto-deploy preview surfaces.
