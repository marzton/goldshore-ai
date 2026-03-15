# 🟦 GoldShore Monorepo

> Looking for the updated documentation? See [README-v2.md](./README-v2.md).
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Unified platform for the **GoldShore** ecosystem, built with:
# 🟦 GoldShore Monorepo (README v2)

[![CodeQL](https://github.com/goldshore/goldshore-ai/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/goldshore/goldshore-ai/actions/workflows/github-code-scanning/codeql)

Unified platform for the **GoldShore** ecosystem, built with **Astro**, **Cloudflare**, and a shared design system. This monorepo ships the public website, admin cockpit, edge workers, and shared packages that power GoldShore in production.

- **Astro** (Web + Admin SSR)
- **Cloudflare Pages** (Frontend hosting)
- **Cloudflare Workers** (API + Gateway + Control + Agent)
- **KV, R2, D1, Queues, AI Gateway**
- **pnpm + Turborepo** (Monorepo orchestration)

This repository contains _all_ applications, shared packages, and infrastructure code used in production.
The GoldShore Monorepo powers the entire GoldShore ecosystem, including:
• Public Website (Astro + Cloudflare Pages)
• Admin Cockpit Dashboard (Astro SSR + GoldShore UI Kit)
• API Layer (Hono + Cloudflare Workers)
• Gateway Layer (routing, throttling, AI gateway)
• Agent Layer (Autonomous AI service)
• Control Worker (DNS automation, binding sync, deployments)
• Shared Design System (UI components, tokens, themes)
• Infrastructure (Cloudflare + GitHub Actions)

The monorepo uses:
• pnpm for workspace management
• Turborepo for task orchestration
• TypeScript everywhere
• Astro for frontend
• Cloudflare Workers for backend
• A unified theme + UI kit across apps

---

## 📚 Where to find X

- **Architecture & current monorepo state:** [`CURRENT_MONOREPO_STATE.md`](./CURRENT_MONOREPO_STATE.md)
- **Branch operations (mergeability, drift checks, workflows):** [`docs/ops/mergeable-branches.md`](./docs/ops/mergeable-branches.md)
- **Deprecated packages / dependency debt tracking:** [`DEPRECATED_PACKAGES.md`](./DEPRECATED_PACKAGES.md)
- **Developer website rollout guide:** [`docs/developer-briefing.md`](./docs/developer-briefing.md)
- **Copy and tone guide:** [`docs/copy-style-guide.md`](./docs/copy-style-guide.md)

---

## Website rollout docs

- Developer briefing: `docs/developer-briefing.md`
- Copy style guide: `docs/copy-style-guide.md`
- Site config and feature flags: `src/data/site-config.json`

# 🚀 Vibe Coding & Ecosystem

We adhere to the **Vibe Coding** philosophy: Human-in-the-Loop (HITL) engineering where AI agents (Jules, Sentinel, GoldShore Agent) handle routine operations, security scanning, and hygiene, allowing humans to focus on high-value architecture.

### Integrated Tech Stack

- **AI Models:** Google Gemini, OpenAI GPT-4, Anthropic Claude (via Cloudflare AI Gateway).
- **Financial Data:** Alpaca, Thinkorswim (Planned Integrations).
- **Automation:** Jules-Bot (GitHub Hygiene), Sentinel (Security), GoldShore Agent (Background Tasks).

See [ECOSYSTEM.md](./ECOSYSTEM.md) for full details on our extensions and AI integrations.

---

# 🚀 Architecture Overview

![GoldShore architecture diagram showing Cloudflare Pages for web and admin, Cloudflare Workers for API, gateway, agent, and control, and storage services (KV, R2, D1, Queues, AI Gateway).](docs/architecture/diagram.svg)

Diagram source: [`docs/architecture/diagram.mmd`](docs/architecture/diagram.mmd).

---

# 📁 Repository Structure

> Looking for the earlier README? See `README.md`.

## Table of Contents

- [Vibe Coding & Human-in-the-Loop](#vibe-coding--human-in-the-loop)
- [Tech Stack & Integrations](#tech-stack--integrations)
- [Repository Structure](#repository-structure)
- [Architecture Overview](#architecture-overview)
- [Applications](#applications)
- [Shared Packages](#shared-packages)
- [Domains & DNS](#domains--dns)
- [API + Gateway Routing](#api--gateway-routing)
- [CI/CD Workflows](#cicd-workflows)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Versioning Strategy](#versioning-strategy)
- [Contributor Note: Merge Strategy for Top-Level Docs](#contributor-note-merge-strategy-for-top-level-docs)
- [License](#license)

## Vibe Coding & Human-in-the-Loop

This repository embodies the **Vibe Coding** philosophy: rapid iteration, intuitive interfaces, and AI-assisted development. We follow a **Human-in-the-Loop (HITL)** approach where automated agents handle routine tasks, hygiene, and security, so humans can focus on architecture and creative problem-solving.

### Core Principles

1. **AI Augmentation:** Integrate best-in-class AI models (Gemini, Claude, GPT-4) via the Gateway and Agent layers.
2. **Resilience:** Infrastructure is built on Cloudflare Workers and Pages for edge-native performance.
3. **Security:** Automated scanning (Frogbot, Sentinel) and zero-trust access policies keep systems secure.

## Tech Stack & Integrations

### Primary Infrastructure

- **Cloudflare:** Workers (API, Gateway, Agent), Pages (Web, Admin), D1 (Database), R2 (Storage), KV (Cache).
- **GitHub Actions:** CI/CD pipelines, automated PR reviews, and security scanning.
- **Turborepo:** High-performance build system for the monorepo.

### AI & Agents

- **Jules (Bot):** Internal automated engineer assistant for repo hygiene and refactors.
- **GoldShore Agent:** Autonomous service for background tasks and reasoning workflows.
- **Models:** Google Gemini, OpenAI GPT-4, Anthropic Claude (via Cloudflare AI Gateway).

### External Integrations (Planned/Supported)

- **Alpaca:** Stock market data and trading APIs.
- **Thinkorswim:** Advanced charting and trading analysis.
- **Google Gemini:** Multimodal processing for content analysis and generation.
- **ChatGPT:** Conversational interfaces and support bots.

### Utility Extensions

- **GitHub Copilot** for inline suggestions.
- **Cloudflare Wrangler** for local Workers development.
- **Biome/Prettier** for formatting.
- **Jules Extension** (internal) via `apps/jules-bot`.

See [ECOSYSTEM.md](./ECOSYSTEM.md) for full details on extensions and integrations.

## Repository Structure

![GoldShore architecture diagram showing Cloudflare Pages for web and admin, Cloudflare Workers for API, gateway, agent, and control, and storage services (KV, R2, D1, Queues, AI Gateway).](docs/architecture/diagram.svg)

Diagram source: [`docs/architecture/diagram.mmd`](docs/architecture/diagram.mmd).
```
/
├── apps/
│   ├── web/               # Public website (Astro)
│   ├── admin/             # Admin dashboard (Astro)
│   ├── api-worker/        # Hono API (Workers)
│   ├── gateway/           # Router + jobs (Workers)
│   ├── gs-agent/          # AI Agent Service (Workers)
│   ├── goldshore-agent/   # Deprecated agent shim (legacy workflows)
│   ├── control-worker/    # Infra automation
│   └── jules-bot/         # GitHub Automation Bot
│   ├── gs-agent/          # Autonomous AI service (Workers)
│   ├── control-worker/    # Infra automation
│   ├── jules-bot/         # GitHub automation bot
│   └── legacy/            # Legacy services
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

# 🧩 Applications

## **1. apps/gs-web – Public Website (Astro)**
## Architecture Overview

The following diagram is defined in [`docs/architecture/diagram.mmd`](./docs/architecture/diagram.mmd):

```mermaid
flowchart TB
  web[goldshore.ai (Web)\nCloudflare Pages]
  admin[admin.goldshore.ai (Admin)\nCloudflare Pages + Access]

  subgraph workers[Cloudflare Workers Layer]
    api[gs-api\nHono API Worker]
    gateway[gs-gateway\nRouter, proxy, auth, queues]
    agent[gs-agent\nAutonomous AI Agent Service]
    control[gs-control\nAutomation, DNS, previews]
  end

  web --> admin
  admin --> gateway
  gateway --> api
  gateway --> agent
  gateway --> control

  subgraph storage[Storage + Data]
    kv[KV Storage]
    r2[R2 Static]
    d1[D1 Database]
    queues[Queues]
    ai[AI Gateway]
  end

  api --> kv
  api --> r2
  api --> d1
  gateway --> queues
  agent --> ai
```

## Applications

### 1) `apps/web` — Public Website (Astro)

- Marketing site
- User portal
- OAuth/Access session integration
- Light/dark theme from `packages/theme`

### Public Routes
- Theming from `packages/theme`

Public routes:

```
/
├── about
├── pricing
├── legal/privacy
├── legal/terms
└── contact
```

### Authenticated User Portal
Authenticated user portal:

```
/app
├── dashboard
├── profile
├── logs
└── settings
```

---

## **2. apps/gs-admin – Admin Dashboard (Astro)**

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

## **3. apps/gs-api – gs-api**

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

## **4. apps/gs-gateway – gs-gateway**

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

## **5. apps/goldshore-agent – gs-agent**

Autonomous AI Agent Service.

Responsibilities:

- Background reasoning tasks
- Integration with external AI models
- Complex workflow orchestration

---

## **6. gs-control (optional)**

System worker for automation:
### 5) `apps/gs-agent` — Autonomous AI Agent Service

- Background reasoning tasks
- External AI model integration
- Workflow orchestration

### 6) `apps/control-worker` — Automation Worker

```
Route: https://ops.goldshore.ai/*
```

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
### 7) `apps/jules-bot` — GitHub Automation Bot

- PR hygiene
- Repository maintenance
- Automated checks

## Shared Packages

### `packages/theme`

Design tokens:

- `tokens.css`
- Colors / radii / spacing
- Astro CSS variables
- Shared across web + admin

### `packages/ui`

Component library:

- Typography
- Buttons, Inputs
- Cards, Tables
- Navbars, Sidebars
- Tailwind/Vanilla CSS compatible

---

# 🧩 Template Pages & Modules

Template pages are kept alongside each app so navigation, menus, containers, and search remain pluggable.

| App        | Template Location                            | Notes                           |
| ---------- | -------------------------------------------- | ------------------------------- |
| Web        | `apps/gs-web/src/pages/templates/index.astro`   | Marketing + search composition  |
| Admin      | `apps/gs-admin/src/pages/templates/index.astro` | Dashboard shell + table samples |
| API Worker | `apps/gs-api/src/routes/templates.ts`    | Module checklist for API growth |
| Gateway    | `apps/gs-gateway/src/index.ts` (`/templates`)   | Routing + AI dispatch template  |
| Agent      | `apps/gs-agent/src/index.ts` (`/templates`)  | HITL orchestration template     |

---

# 🔗 Integration Matrix (Current + Planned)

GoldShore templates are designed to integrate with:

- **AI Providers**: Google Gemini, OpenAI ChatGPT, Anthropic Claude (via AI Gateway).
- **Operational Assistants**: Jules, GitHub Copilot, and custom HITL review workflows.
- **Cloudflare**: Workers, Pages, Queues, D1, R2, and AI Gateway.
- **DevOps**: GitHub Actions, GitHub Issues/Projects, and deploy previews.
- **Market Data + Trading**: Alpaca, Thinkorswim, Polygon, Tradier, and FIX gateways.
- **Ecommerce + CRM**: Stripe, Shopify, HubSpot, Salesforce, and outbound messaging.

Use these integrations to expand website management, SEO automation, admin analytics,
AI agent tooling, and market data services without rebuilding existing modules.

---

# 🧭 Continuity Tracking

To keep issues, workflows, PRs, branches, and components aligned:

- Track work in **GitHub Issues/Projects** and the templates in `.github/ISSUE_TEMPLATE/`.
- Review deployment flow in `infra/github/workflows/`.
- Use `ops/pr-playbook.md` and `ops/maintenance-playbook.md` for release continuity.
- Document component ownership in the admin dashboard templates and UI kit README.

### Contributing Naming Rules

- Read `docs/conventions/naming.md` before opening a PR.
- Prefer `feat/add-new-worker-healthcheck` over mixed-case or space-separated branch names.
- Prefer package names like `@goldshore/api-worker` and workflow file names like `deploy-api-worker.yml`.
- Anti-patterns to avoid: `Feature/AddThing`, `gs_api`, `Deploy API Worker.yml`, and job keys like `deploy_api`.
- Use helper scripts:
  - `pnpm branch:bootstrap -- <type> <slug>`
  - `pnpm scaffold:worker -- <worker-name>`

## **packages/utils**
### `packages/utils`

TypeScript utilities:

- fetch wrapper
- env loader
- request helpers
- error handling

### `packages/auth`
[![CodeQL](https://github.com/goldshore/goldshore-ai/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/goldshore/goldshore-ai/actions/workflows/github-code-scanning/codeql)

Unified platform for the **GoldShore** ecosystem, built with **Astro**, **Cloudflare**, and shared UI/theme packages.

> Looking for the full operational handbook? See [README-v2.md](./README-v2.md).

## Quick links

- Architecture + repo state: [`CURRENT_MONOREPO_STATE.md`](./CURRENT_MONOREPO_STATE.md)
- Domains + auth policies: [`docs/domains-and-auth.md`](./docs/domains-and-auth.md)
- Branch and release operations: [`docs/ops/mergeable-branches.md`](./docs/ops/mergeable-branches.md)
- Contributor standards: [`docs/contributing.md`](./docs/contributing.md)

## Core apps

- `apps/gs-web` — Public website (Astro + Cloudflare Pages)
- `apps/gs-admin` — Admin cockpit (Astro + Cloudflare Pages)
- `apps/gs-api` — API worker (Hono + Cloudflare Workers)
- `apps/gs-gateway` — Gateway/edge routing worker
- `apps/gs-agent` — Background agent worker
- `apps/gs-control` — Infra automation worker
- `apps/gs-mail` — Mail worker

## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

## License

Proprietary © GoldShore Labs. All rights reserved.
