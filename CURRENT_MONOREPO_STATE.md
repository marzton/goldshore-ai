# Current GoldShore Monorepo State Snapshot

> [!NOTE]
> **Document metadata**
> - **Single source of truth for:** architecture and repository state
> - **Last updated:** 2026-02-11
> - **Updated by:** manual
> - **Workflow update path:** `N/A` (manual-only updates at this time)

## Active Workspaces

| Workspace | Package Name | Type | Status | Goal |
| :--- | :--- | :--- | :--- | :--- |
| `apps/gs-web` | `@goldshore/web` | Astro (SSR) | Active | Public marketing site |
| `apps/gs-admin` | `@goldshore/admin` | Astro (SSR) | Active | Secure operational console |
| `apps/gs-api` | `gs-api` | Worker | Active | Core API logic |
| `apps/gs-gateway` | `@goldshore/gateway` | Worker (Hono) | Active | API Gateway / Router |
| `apps/gs-control` | `@goldshore/control` | Worker (Hono) | Active | Control plane logic |
| `apps/gs-agent` | `@goldshore/agent` | Worker (Hono) | Active | Canonical AI agent service |
| `apps/goldshore-agent` | `goldshore-agent` | Worker (Hono) | Deprecated | Legacy shim kept in sync with `gs-agent` |
| `apps/jules-bot` | `jules-bot` | Archived | Archived | Bot logic (removed in restructuring) |

## Legacy / Archive

- No legacy workspaces remain in the repository.

## Infrastructure

```json
{
  "name": "astro-goldshore",
  "private": true,
  "packageManager": "pnpm@8.15.5",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build:openapi": "node scripts/build-openapi.mjs",
    "build": "pnpm build:openapi && turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "build:openapi": "node scripts/build-openapi.mjs"
  },
  "devDependencies": {
    "astro": "^5.15.9",
    "eslint": "^8.57.0",
    "eslint-plugin-astro": "^1.5.0",
    "prettier": "^3.2.5",
    "prettier-plugin-astro": "^0.13.0",
    "typescript": "^5.4.2",
    "yaml": "^2.3.4"
  },
  "dependencies": {
    "@astrojs/cloudflare": "^12.6.11",
    "turbo": "^2.6.1"
  },
  "pnpm": {
    "overrides": {
      "@astrojs/cloudflare": "latest",
      "@astrojs/adapter-cloudflare": "latest"
    }
  }
}
```

```toml
name = "gs-api"
main = "src/index.ts"
compatibility_date = "2024-11-01"

## Configuration Summary

- **Package Manager**: pnpm (v9)
- **Monorepo Tool**: Turbo
- **Linting**: ESLint (root `.eslintrc.cjs` + workspace extensions)
- **Styling**: TailwindCSS
- **Frameworks**: Astro, Hono, Cloudflare Workers

## Recent Updates

- **February 2026**: Completed major directory restructuring renaming apps to use `gs-` prefix (gs-web, gs-admin, gs-api, gs-control, gs-gateway) for brand consistency
- Reconciled the agent worker so `apps/gs-agent` is the single active implementation, with `apps/goldshore-agent` retained as a legacy shim
- Consolidated Astro configuration and fixed package issues across monorepo
