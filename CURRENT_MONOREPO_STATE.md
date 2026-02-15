# Current GoldShore Monorepo State Snapshot

## Active Workspaces

| Workspace | Package Name | Type | Status | Goal |
| :--- | :--- | :--- | :--- | :--- |
| `apps/web` | `@goldshore/web` | Astro (SSR) | Active | Public marketing site |
| `apps/admin` | `@goldshore/admin` | Astro (SSR) | Active | Secure operational console |
| `apps/api-worker` | `@goldshore/gs-api` | Worker | Active | Core API logic |
| `apps/gateway` | `@goldshore/gs-gateway` | Worker (Hono) | Active | API Gateway / Router |
| `apps/control-worker` | `@goldshore/gs-control` | Worker (Hono) | Active | Control plane logic |
| `apps/gs-agent` | `@goldshore/gs-agent` | Worker | Evaluation | Agent implementation |
| `apps/jules-bot` | `jules-bot` | Node.js | Experimental | Bot logic |

## Non-workspace App Directories (No `package.json`)
- None currently under `apps/`

## Legacy / Archive
- `apps/legacy`

## Infrastructure
- `infra/scripts`: Automation scripts
- `infra/cloudflare`: Cloudflare configurations (wrangler.toml files for some apps are here or referenced)
- `infra/cloudflare/goldshore-api.wrangler.toml`: Shared deployment config targeting `apps/api-worker` (`@goldshore/gs-api`) across environments

## Configuration Summary
- **Package Manager**: pnpm (v9)
- **Monorepo Tool**: Turbo
- **Linting**: ESLint (root `.eslintrc.cjs` + workspace extensions)
- **Styling**: TailwindCSS
- **Frameworks**: Astro, Hono, Cloudflare Workers

## Notes
- Removed stale path references for non-existent app directories.
- Package names are synced to current `apps/*/package.json` values.
