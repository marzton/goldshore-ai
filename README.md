# 🟦 GoldShore Monorepo

Unified monorepo for the GoldShore platform. This repository contains the live `gs-*` applications, shared packages, infrastructure configuration, and GitHub Actions workflows used to build and deploy the workspace.

## Where to find things

- **Current workspace snapshot:** [`CURRENT_MONOREPO_STATE.md`](./CURRENT_MONOREPO_STATE.md)
- **Architecture diagram source:** [`docs/architecture/diagram.mmd`](./docs/architecture/diagram.mmd)
- **Cloudflare infrastructure docs:** [`infra/Cloudflare/README.md`](./infra/Cloudflare/README.md)
- **Deprecated package tracking:** [`DEPRECATED_PACKAGES.md`](./DEPRECATED_PACKAGES.md)
- **Developer rollout docs:** [`docs/developer-briefing.md`](./docs/developer-briefing.md)

## Tech stack

- **Workspace orchestration:** pnpm + Turborepo
- **Frontend:** Astro
- **Edge/backend:** Cloudflare Workers + Hono
- **Shared libraries:** internal `@goldshore/*` packages under `packages/`
- **CI/CD:** GitHub Actions under `.github/workflows`

## Applications

The canonical application directories are the `gs-*` folders under `apps/`:

| Path | Package name | Type | Current state | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `apps/gs-web` | `@goldshore/gs-web` | Astro app | Active | Public website workspace |
| `apps/gs-admin` | `@goldshore/gs-admin` | Astro app | Active | Admin workspace |
| `apps/gs-api` | `@goldshore/gs-api` | Cloudflare Worker | Active | API service |
| `apps/gs-gateway` | `@goldshore/gs-gateway` | Cloudflare Worker | Active | Gateway / router service |
| `apps/gs-control` | `@goldshore/gs-control` | Cloudflare Worker | Active | Control-plane worker |
| `apps/gs-agent` | `@goldshore/gs-agent` | Cloudflare Worker | Active | Agent worker |
| `apps/gs-mail` | `@goldshore/gs-mail` | Cloudflare Worker | Active | Mail worker |

### Compatibility and stale paths

The repository still contains two compatibility workspaces that should **not** be treated as the canonical app locations:

- `apps/web` (`@goldshore/web-compat`) → use `apps/gs-web` instead.
- `apps/admin` (`@goldshore/admin-compat`) → use `apps/gs-admin` instead.

The following older references are stale and are **not** live top-level app directories in the current workspace:

- `apps/api-worker`
- `apps/control-worker`
- `apps/goldshore-agent`
- `apps/jules-bot`
- `apps/legacy/goldshore-api`

## Repository structure

```text
.
├── apps/
│   ├── admin/                # compatibility workspace (stale alias)
│   ├── gs-admin/             # @goldshore/gs-admin
│   ├── gs-agent/             # @goldshore/gs-agent
│   ├── gs-api/               # @goldshore/gs-api
│   ├── gs-control/           # @goldshore/gs-control
│   ├── gs-gateway/           # @goldshore/gs-gateway
│   ├── gs-mail/              # @goldshore/gs-mail
│   ├── gs-web/               # @goldshore/gs-web
│   └── web/                  # compatibility workspace (stale alias)
├── packages/
│   ├── ai-providers/         # @goldshore/ai-providers
│   ├── auth/                 # @goldshore/auth
│   ├── brand/                # @goldshore/brand
│   ├── broker-adapters/      # @goldshore/broker-adapters
│   ├── config/               # @goldshore/config
│   ├── core-schema/          # @goldshore/core-schema
│   ├── integrations/         # @goldshore/integrations
│   ├── schema/               # @goldshore/schema
│   ├── theme/                # @goldshore/theme
│   ├── ui/                   # @goldshore/ui
│   └── utils/                # @goldshore/utils
├── infra/
│   ├── AGENT_CANONICAL_STATE.json
│   ├── AI/
│   ├── Cloudflare/
│   ├── cron/
│   ├── github/
│   └── scripts/
└── .github/
    └── workflows/
```

## Shared packages

Current package directories under `packages/`:

- `packages/ai-providers`
- `packages/auth`
- `packages/brand`
- `packages/broker-adapters`
- `packages/config`
- `packages/core-schema`
- `packages/integrations`
- `packages/schema`
- `packages/theme`
- `packages/ui`
- `packages/utils`

## Infrastructure

Current top-level infrastructure layout under `infra/`:

- `infra/AGENT_CANONICAL_STATE.json`
- `infra/AI`
- `infra/Cloudflare`
- `infra/cron`
- `infra/github`
- `infra/scripts`

Notable live Cloudflare files include:

- `infra/Cloudflare/gs-admin.wrangler.toml`
- `infra/Cloudflare/gs-agent.wrangler.toml`
- `infra/Cloudflare/gs-api.wrangler.toml`
- `infra/Cloudflare/gs-web.wrangler.toml`
- `infra/Cloudflare/config.yaml`
- `infra/Cloudflare/desired-state.yaml`

## GitHub Actions workflows

The active root workflow directory is `.github/workflows/`. Current files there are:

### Validation and repository health

- `archive-path-guard.yml`
- `canonical-structure-check.yml`
- `ci.yml`
- `lockfile-guard.yml`
- `naming-guard.yml`
- `naming-lint.yml`
- `pii-scan.yml`
- `repo-health.yml`
- `route-collision-check.yml`
- `signed-commit-guard.yml`
- `sonarcloud.yml`
- `summary.yml`
- `tfsec.yml`

### Deployment and preview workflows

- `deploy-gs-admin.yml`
- `deploy-gs-agent.yml`
- `deploy-gs-api.yml`
- `deploy-gs-control.yml.disabled`
- `deploy-gs-gateway.yml.disabled`
- `deploy-gs-mail.yml`
- `deploy-gs-web.yml`
- `preview-gs-admin.yml`
- `preview-gs-agent.yml`
- `preview-gs-api.yml`
- `preview-gs-gateway.yml`
- `preview-gs-web.yml`

### Maintenance and automation

- `cleanup-cache.yml`
- `cleanup-workflow-runs.yml`
- `close-stale-prs.yml`
- `jules-nightly.yml`
- `maintenance-gs-sync.yml`
- `maintenance.yml`
- `neuralegion.yml`
- `palette-manual.yml`
- `stabilization-task.yml`

## Development

Install dependencies:

```bash
pnpm install
```

Run the workspace in development mode:

```bash
pnpm dev
```

Run top-level validation checks:

```bash
pnpm validate
pnpm check:docs-consistency
```

## Notes

- Canonical app paths use the `gs-*` naming convention.
- Root GitHub Actions definitions live in `.github/workflows`, not `infra/github/workflows`.
- When updating Cloudflare Worker build-token settings, services/workers should use the `gs-control` build token.
