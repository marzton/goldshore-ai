# 🟦 GoldShore Monorepo (README v2)

Unified platform for the **GoldShore** ecosystem, built with:

- **Astro** (web + admin SSR)
- **Cloudflare Pages** (frontend hosting)
- **Cloudflare Workers** (API + gateway + control)
- **KV, R2, D1, Queues, AI Gateway**
- **pnpm + Turborepo** (monorepo orchestration)

This repository contains all applications, shared packages, and infrastructure code used in production.

---

## Overview

The GoldShore Monorepo powers the entire GoldShore ecosystem, including:

- Public website (Astro + Cloudflare Pages)
- Admin cockpit dashboard (Astro SSR + GoldShore UI Kit)
- API layer (Hono + Cloudflare Workers)
- Gateway layer (routing, throttling, AI gateway)
- Control worker (DNS automation, binding sync, deployments)
- Shared design system (UI components, tokens, themes)
- Infrastructure (Cloudflare + GitHub Actions)

---

## Architecture

![GoldShore architecture diagram showing Cloudflare Pages for web and admin, Cloudflare Workers for API, gateway, agent, and control, and storage services (KV, R2, D1, Queues, AI Gateway).](docs/architecture/diagram.svg)

Diagram source: [`docs/architecture/diagram.mmd`](docs/architecture/diagram.mmd).

---

## Apps

### apps/web — Public Website (Astro)

- Marketing site + user portal
- OAuth/Access session integration
- Light/dark themes from `packages/theme`

Public routes:

```
/
├── about
├── pricing
├── legal/privacy
├── legal/terms
└── contact
```

Authenticated portal:

```
/app
├── dashboard
├── profile
├── logs
└── settings
```

### apps/admin — Admin Dashboard (Astro)

Protected by **Cloudflare Access**.

```
/admin
├── overview
├── api-logs
├── workers
│   ├── status
│   ├── bindings
│   └── routes
├── users
│   ├── list
│   ├── sessions
│   └── permissions
└── system
    ├── dns
    ├── pages
    ├── storage
    └── secrets
```

### apps/api-worker — gs-api

Hono-based API worker.

```
Route: https://api.goldshore.ai/*
```

Endpoints:

```
GET   /health
GET   /version
POST  /auth/login
GET   /auth/session
GET   /content/:slug
POST  /queue/task
```

Bindings:

```
KV = gs-kv
R2 = gs-assets
D1 = gs-db
AI = AI (AI Gateway)
```

### apps/gateway — gs-gateway

Request router + queue dispatcher.

```
Route: https://gw.goldshore.ai/*
```

Responsibilities:

- Reverse proxy → gs-api
- Queue ingestion
- Rate limiting
- JWT / Access token verification
- Preflight filtering (IP / SNI policies)

### apps/control-worker — gs-control (optional)

System worker for automation:

- DNS updates
- Preview environment creation
- Worker deployment orchestrator
- Secret rotation
- Observability sync

```
Route: https://ops.goldshore.ai/*
```

---

## Packages

### packages/theme

Design tokens:

- tokens.css
- colors / radii / spacing
- Astro CSS variables
- Used by both web + admin

### packages/ui

Component library:

- Typography
- Buttons, inputs
- Cards, tables
- Navbars, sidebars
- Tailwind/Vanilla CSS compatible

### packages/utils

TypeScript utilities:

- fetch wrapper
- env loader
- request helpers
- error handling

### packages/auth

Cloudflare Access helpers:

- JWKS retrieval
- Audience validation
- getUser(request)

### packages/config

Monorepo-wide:

- eslint
- prettier
- tsconfig base

---

## CI/CD

Workflows live in:

```
infra/github/workflows/
```

Key workflows:

```
preview-web.yml
preview-admin.yml
deploy-api.yml
deploy-gateway.yml
deploy-control.yml
```

Features:

- pnpm install
- pinned SHA for all actions
- preview deploys for PRs
- automatic production deploy on main
- Cloudflare Pages + Workers deploy

---

## Dev Workflow

Install dependencies:

```bash
pnpm install
```

Run everything:

```bash
pnpm dev
```

Run individual app:

```bash
pnpm --filter @goldshore/web dev
pnpm --filter @goldshore/admin dev
pnpm --filter @goldshore/api-worker dev
```

Build all:

```bash
pnpm build
```

---

## Deployment

Pages deploy automatically via GitHub Actions.

Workers deploy:

```bash
pnpm --filter @goldshore/api-worker deploy
pnpm --filter @goldshore/gateway deploy
pnpm --filter @goldshore/control-worker deploy
```

Preview branches automatically deploy to:

```
{branch}.goldshore-pages.dev
api-preview.goldshore.ai
gw-preview.goldshore.ai
admin-preview.goldshore.ai
```

---

## Licensing

Proprietary © GoldShore Labs. All rights reserved.
