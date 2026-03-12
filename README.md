━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🟦 GoldShore Monorepo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Unified platform for the **GoldShore** ecosystem, built with:

- **Astro** (Web + Admin SSR)
- **Cloudflare Pages** (Frontend hosting)
- **Cloudflare Workers** (API + Gateway + Control)
- **KV, R2, D1, Queues, AI Gateway**
- **pnpm + Turborepo** (Monorepo orchestration)

This repository contains *all* applications, shared packages, and infrastructure code used in production.

---

# 🚀 Architecture Overview

```
                        ┌──────────────────────────────┐
                        │     goldshore.ai (Web)       │
                        │      Cloudflare Pages        │
                        └──────────────────────────────┘
                                   │
                                   ▼
                   ┌──────────────────────────────────────┐
                   │ admin.goldshore.ai (Admin Dashboard) │
                   │     Cloudflare Pages + Access        │
                   └──────────────────────────────────────┘
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         Cloudflare Workers Layer                           │
│────────────────────────────────────────────────────────────────────────────│
│  gs-api        → Hono API Worker                                           │
│  gs-gateway    → Router, proxy, auth, queues                               │
│  gs-control    → Automation, DNS, previews, secret rotation                │
└───────────────────────────────────────────────────────────────────────────┘
                 │                 │                   │
                 ▼                 ▼                   ▼
       ┌──────────────┐   ┌──────────────┐   ┌────────────────────┐
       │ KV Storage    │   │ R2 Static     │   │ D1 Database        │
       └──────────────┘   └──────────────┘   └────────────────────┘
```

---

# 📁 Repository Structure

```
/
├── apps/
│   ├── web/               # Public website (Astro)
│   ├── admin/             # Admin dashboard (Astro)
│   ├── api-worker/        # Hono API (Workers)
│   └── gateway/           # Router + jobs (Workers)
│
├── packages/
│   ├── ui/                # Shared component library
│   ├── theme/             # Design tokens + CSS
│   ├── utils/             # Shared helpers
│   ├── auth/              # Cloudflare Access JWT utils
│   └── config/            # TS/ESLint/Prettier configs
│
└── infra/
    ├── cloudflare/        # wrangler.toml templates
    └── github/            # GitHub Actions CI/CD
```

---

# 🧭 Operational Playbooks

- [Merge Conflict Playbook](docs/merge-conflict-playbook.md) — conflict-safe steps for cleaning up PRs and prioritizing merges.
- [Open PR Inventory Template](docs/pr-inventory-template.md) — table and checklist to capture PR metadata when `gh` or remotes are unavailable.

---

# 🧩 Applications

## **1. apps/web – Public Website (Astro)**

- Marketing site
- User portal
- OAuth/Access session integration
- Light/dark theme from `packages/theme`

### Public Routes

```
/
├── about
├── pricing
├── legal/privacy
├── legal/terms
└── contact
```

### Authenticated User Portal

```
/app
├── dashboard
├── profile
├── logs
└── settings
```

---

## **2. apps/admin – Admin Dashboard (Astro)**

Protected by **Cloudflare Access**.

### Admin Sections

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

---

## **3. apps/api-worker – gs-api**

Hono-based API Worker.

```
Route: https://api.goldshore.ai/*
```

### Endpoints

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

---

## **4. apps/gateway – gs-gateway**

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

---

## **5. gs-control (optional)**

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

# 🎨 Shared Packages

## **packages/theme**
Design tokens:

- tokens.css
- Colors / radii / spacing
- Astro CSS variables
- Used by both web + admin

## **packages/ui**
Component library:

- Typography
- Buttons, Inputs
- Cards, Tables
- Navbars, Sidebars
- Tailwind/Vanilla CSS compatible

## **packages/utils**
TypeScript utilities:

- fetch wrapper
- env loader
- request helpers
- error handling

## **packages/auth**
Cloudflare Access helpers:

- JWKS retrieval
- Audience validation
- getUser(request)

## **packages/config**
Monorepo-wide:

- eslint
- prettier
- tsconfig base

---

# 🌐 Domains & DNS

| Component      | Domain                     | Hosting            |
|----------------|-----------------------------|--------------------|
| Web            | https://goldshore.ai        | Pages              |
| Admin          | https://admin.goldshore.ai  | Pages + Access     |
| API Worker     | https://api.goldshore.ai    | Workers            |
| Gateway Worker | https://gw.goldshore.ai     | Workers            |
| Control Worker | https://ops.goldshore.ai    | Workers            |

---

# 🛰 API + Gateway Routing

```
Client → Gateway → API → Storage
```

Example flow:

```
GET https://gw.goldshore.ai/content/slug
   → routes internally to gs-api
   → fetches content
   → returns JSON
```

Control worker routes:

```
POST /system/sync
POST /dns/update
POST /preview/create
```

---

# 🔧 Cloudflare Bindings

All workers use:

```
KV:         gs-kv
R2:         gs-assets
D1:         gs-db
AI:         AI Gateway
Services:   API -> gs-api
            GATEWAY -> gs-gateway
Queues:     jobsQueue (optional)
```

---

# 🔄 CI/CD Workflows (GitHub Actions)

Location:

```
infra/github/workflows/
```

Workflows included:

```
preview-web.yml
preview-admin.yml
deploy-api.yml
deploy-gateway.yml
deploy-control.yml
```

Features:

- pnpm install
- Pinned SHA for all actions
- Preview deploys for PRs
- Automatic production deploy on main
- Cloudflare Pages + Workers deploy

---

# 💻 Local Development

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

# 🚀 Deployment Guide

Pages deploy automatically via GitHub Actions.

Workers deploy:

```bash
pnpm --filter @goldshore/api-worker deploy
pnpm --filter @goldshore/gateway deploy
pnpm --filter @goldshore/control-worker deploy
```

---

# 📌 Versioning Strategy

- `main` → Production
- `feature/*` → Preview Deployments
- `release/*` → Staging

---

# 🔐 License

Proprietary © GoldShore Labs
All rights reserved.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
