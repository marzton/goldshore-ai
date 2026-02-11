# GoldShore Monorepo

The GoldShore Monorepo powers the entire GoldShore ecosystem, including:
• Public Website (Astro + Cloudflare Pages)
• Admin Cockpit Dashboard (Astro SSR + GoldShore UI Kit)
• API Layer (Hono + Cloudflare Workers)
• Gateway Layer (routing, throttling, AI gateway)
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

🖼 Brand Identity

GoldShore Brand Variants

<table>
<tr>
<td><img src="/mnt/data/C9A20845-9F2A-4364-B1B7-64747F47E94E.jpeg" width="350"></td>
<td><img src="/mnt/data/3204BCE0-00A7-41B8-A4F8-7046FAF6D3A4.jpeg" width="350"></td>
</tr>
<tr>
<td><img src="/mnt/data/887BDDB7-1D8C-4D45-87C8-AD9FB19CA682.png" width="350"></td>
<td><img src="/mnt/data/AA06F6B1-D0F0-40F8-B427-ADF5A9CE9390.png" width="350"></td>
</tr>
<tr>
<td><img src="/mnt/data/EE7C529E-3427-4A4B-81CE-E71CC52F4B10.png" width="350"></td>
<td><img src="/mnt/data/2C7B9641-99BA-461B-82F2-699B82C6150F.png" width="350"></td>
</tr>
</table>

---

🧭 Monorepo Structure

astro-goldshore/
│
├── apps/
│ ├── web/ → Public website (Astro + CF Pages)
│ ├── admin/ → Admin Cockpit (Astro SSR)
│ ├── api-worker/ → Hono API Worker
│ ├── gateway/ → Edge gateway router
│ └── control-worker/ → Infra automation (DNS, bindings)
│
├── packages/
│ ├── ui/ → GoldShore UI component library
│ ├── theme/ → Tokens, CSS vars, theming engine
│ ├── config/ → Shared TS, ESLint, Prettier configs
│ └── utils/ → Shared helpers
│
└── infra/
├── cloudflare/ → wrangler.toml, DNS maps, bindings
└── github/ → Workflows for CI/CD

---

🔥 Apps Overview

🌐 apps/web — GoldShore Public Website
• Astro SSR
• Powered by the GoldShore UI Kit
• Deploys via Cloudflare Pages
• Theming powered by packages/theme
• Pulls dynamic content from API + Gateway

Hero Example

---

🛠 apps/admin — GoldShore Admin Cockpit

This is your hyper-modern operational dashboard.

<table>
<tr>
<td><img src="/mnt/data/2C7B9641-99BA-461B-82F2-699B82C6150F.png" width="350"></td>
<td><img src="/mnt/data/9FED57B5-F91A-419D-B41F-E9E76DCF32A6.png" width="350"></td>
</tr>
</table>

Features
• Realtime visitors
• Task manager
• Ad engine metrics
• Trading analytics
• Widgets API
• Inter-app control center
• API/Gateway integration

---

🧩 packages/ui — GoldShore UI Component Kit
• 100% framework-agnostic components
• Works in Astro, Workers, Hono frontends
• Shared design system
• Includes:

<Button>
<Card>
<StatsBox>
<CockpitGauge>
<WidgetPane>
<MetricCard>
<GlowPanel>
<ThemeToggle>

---

🎨 packages/theme — Tokens & Dynamic Themes

Every app uses the same token set:

tokens.css
└── Colors
└── Radii
└── Typography
└── Effects (glow, blur, depth)
└── Shadows
└── Spacing
└── Grid

Supports:
• Light mode
• Dark mode
• Neon mode
• Penrose mode (GoldShore default)
• System override

---

⚙️ apps/api-worker — Main API (Hono)
• Edge-native API
• Zod schemas
• Hono router
• Cookie/session utilities
• Cloudflare bindings
• Responds to the admin + web apps
• Preconfigured OpenAPI generation

---

🚏 apps/gateway — Routing & AI Gateway

Handles:
• URL-based routing
• Load balancing
• Service binding switching
• AI Gateway proxy
• Authorization pre-checks

---

🛰 apps/control-worker — Infra Automation

Can automatically:
• Create DNS records
• Attach KV / R2 / D1 bindings
• Create preview domains
• Sync environment variables
• Repair worker routes
• Enforce idempotent deployment rules

This replaces Terraform (optional).

---

🚀 Development Workflow

Install dependencies:

pnpm install

Run everything:

pnpm dev

Run only the admin app:

pnpm --filter ./apps/admin dev

Run the web app:

pnpm --filter ./apps/web dev

Run API worker:

pnpm --filter ./apps/api-worker dev

Build all:

pnpm build

---

🧪 Testing

Playwright tests live in:

apps/admin/tests
apps/web/tests

Run:

pnpm test

---

🌩 Deployment (Cloudflare)

Deploy is handled by GitHub Actions:

infra/github/workflows/deploy.yml

CI/CD steps: 1. Install dependencies 2. Build workspaces with Turbo 3. Deploy:
• web → Cloudflare Pages
• admin → Cloudflare Pages
• api-worker → Workers
• gateway → Workers
• control-worker → Workers

Preview branches automatically deploy to:

{branch}.goldshore-pages.dev
api-preview.goldshore.ai
gw-preview.goldshore.ai
admin-preview.goldshore.ai

---

🏁 Closing Preview

---

✅ README is Ready

If you want:

✔ A version with a table of contents
✔ A version with architecture diagrams
✔ A version with installation badges + shields.io
✔ A split README per app
✔ Auto-generated Markdown with relative paths for GitHub

Just tell me:

“Generate README v2”,
or
“Generate per-app READMEs”,
or
“Generate architecture diagram”.

I can produce all variants.
