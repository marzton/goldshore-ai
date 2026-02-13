# Current GoldShore Monorepo State Snapshot

## Active Workspaces

| Workspace | Package Name | Type | Status | Goal |
| :--- | :--- | :--- | :--- | :--- |
| `apps/web` | `@goldshore/web` | Astro (SSR) | Active | Public marketing site |
| `apps/admin` | `@goldshore/admin` | Astro (SSR) | Active | Secure operational console |
| `apps/api-worker` | `gs-api` | Worker | Active | Core API logic |
| `apps/gateway` | `@goldshore/gateway` | Worker (Hono) | Active | API Gateway / Router |
| `apps/control-worker` | `@goldshore/control` | Worker (Hono) | Active | Control plane logic |
| `apps/gs-agent` | `@goldshore/agent` | Worker | Evaluation | Agent implementation |
| `apps/jules-bot` | `jules-bot` | Node.js | Experimental | Bot logic |

## Non-workspace App Directories (No `package.json`)
- `apps/gs-control`
- `apps/gs-mail`

## Legacy / Archive
- `apps/legacy`

## Infrastructure
- `infra/scripts`: Automation scripts
- `infra/cloudflare`: Cloudflare configurations (wrangler.toml files for some apps are here or referenced)

## Configuration Summary
- **Package Manager**: pnpm (v9)
- **Monorepo Tool**: Turbo
- **Linting**: ESLint (root `.eslintrc.cjs` + workspace extensions)
- **Styling**: TailwindCSS
- **Frameworks**: Astro, Hono, Cloudflare Workers

## Notes
- Removed missing path references such as `apps/goldshore-agent`.
- Package names are synced to current `apps/*/package.json` values.
