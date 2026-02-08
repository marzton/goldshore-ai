# 🟦 GoldShore Monorepo (README v2)

Unified platform for the **GoldShore** ecosystem, built with **Astro**, **Cloudflare**, and a shared design system. This monorepo ships the public website, admin cockpit, edge workers, and shared packages that power GoldShore in production.

- **Astro** (Web + Admin SSR)
- **Cloudflare Pages** (Frontend hosting)
- **Cloudflare Workers** (API + Gateway + Control + Agent)
- **KV, R2, D1, Queues, AI Gateway**
- **pnpm + Turborepo** (Monorepo orchestration)

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
│   ├── gs-agent/          # Autonomous AI service (Workers)
│   ├── goldshore-agent/   # Deprecated agent shim (legacy workflows)
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

Authenticated user portal:

```
/app
├── dashboard
├── profile
├── logs
└── settings
```

### 2) `apps/admin` — Admin Dashboard (Astro SSR)

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

### 3) `apps/api-worker` — gs-api (Hono API Worker)

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

### 4) `apps/gateway` — gs-gateway

```
Route: https://gw.goldshore.ai/*
```

Responsibilities:

- Reverse proxy → gs-api
- Queue ingestion
- Rate limiting
- JWT / Access token verification
- Preflight filtering (IP / SNI policies)

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

### `packages/utils`

TypeScript utilities:

- fetch wrapper
- env loader
- request helpers
- error handling

### `packages/auth`

Cloudflare Access helpers:

- JWKS retrieval
- Audience validation
- `getUser(request)`

### `packages/config`

Monorepo-wide:

- eslint
- prettier
- tsconfig base

## Domains & DNS

| Component      | Domain                     | Hosting            |
|----------------|----------------------------|--------------------|
| Web            | https://goldshore.ai       | Pages              |
| Admin          | https://admin.goldshore.ai | Pages + Access     |
| API Worker     | https://api.goldshore.ai   | Workers            |
| Gateway Worker | https://gw.goldshore.ai    | Workers            |
| Control Worker | https://ops.goldshore.ai   | Workers            |

## API + Gateway Routing

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

## CI/CD Workflows

Location:

```
infra/github/workflows/
```

Workflows include:

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

## Local Development

Install dependencies:

```bash
pnpm install
```

Run everything:

```bash
pnpm dev
```

Run individual apps:

```bash
pnpm --filter ./apps/web dev
pnpm --filter ./apps/admin dev
pnpm --filter ./apps/api-worker dev
pnpm --filter ./apps/gateway dev
pnpm --filter ./apps/gs-agent dev
```

Build all:

```bash
pnpm build
```

## Testing

Playwright tests live in:

```
apps/admin/tests
apps/web/tests
```

Run:

```bash
pnpm test
```

## Deployment

Pages deploy automatically via GitHub Actions.

Workers deploy:

```bash
pnpm --filter ./apps/api-worker deploy
pnpm --filter ./apps/gateway deploy
pnpm --filter ./apps/control-worker deploy
pnpm --filter ./apps/gs-agent deploy
```

## Versioning Strategy

- `main` → Production
- `feature/*` → Preview Deployments
- `release/*` → Staging

## License

Proprietary © GoldShore Labs
All rights reserved.
