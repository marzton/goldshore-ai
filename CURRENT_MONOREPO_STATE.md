# Current GoldShore Monorepo State Snapshot (2025-11-28T13:20:35Z)

## Target Workspaces and Status

Note: The actual contents of these directories may be incomplete or conflicting due to recent failed merges.

| Workspace | Status | Goal |
| :--- | :--- | :--- |
| `apps/web` | Unverified | Public marketing site |
| `apps/admin` | Conflicting | Secure operational console |
| `apps/api-worker` | Conflicting | Cloudflare Worker logic (API/Agent) |
| `infra/scripts` | Unverified | Deployment/Automation Scripts |

## Detailed File Tree Analysis (Recursive Listing)
```tree
 |__web
 | |__astro.config.mjs
 | |__package.json
 | |__src
 | | |__pages
 | | | |__legal
 | | | | |__privacy.astro
 | | | | |__terms.astro
 | | | |__index.astro
 | | | |__developer
 | | | | |__docs
 | | | | | |__index.astro
 | | | | | |__[...slug].astro
 | | | | |__index.astro
 | | | | |__api
 | | | | | |__[...slug].astro
 | | | |__status.astro
 | | |__env.d.ts
 | | |__layouts
 | | | |__DocsLayout.astro
 | | | |__MarketingLayout.astro
 | | |__data
 | | | |__v1.json
 | | |__components
 | | | |__Nav.astro
 | | | |__DocsSearch.astro
 | | | |__FeatureGrid.astro
 | | | |__MDXCodeBlock.astro
 | | | |__ApiSchema.astro
 | | | |__TryItConsole.astro
 | | | |__Hero.astro
 | | | |__CodeBlock.astro
 | | | |__ApiSidebar.astro
 | | | |__DocsSidebar.astro
 | | | |__ApiEndpoint.astro
 | | | |__Footer.astro
 | | |__content
 | | | |__config.ts
 | | | |__docs
 | | | | |__gateway
 | | | | | |__routing.mdx
 | | | | |__auth
 | | | | | |__overview.mdx
 | | | | |__getting-started.mdx
 | | | | |__index.mdx
 | | | | |__api
 | | | | | |__overview.mdx
 | | | | | |__system-info.mdx
 | | | | |__intro.md
 | | | |__openapi
 | | | | |__v1.json
 | |__AI
 | | |__AGENT_IDENTITY.yaml
 | |__tsconfig.json
 | |__openapi
 | | |__v1.json
 | | |__v1.yaml
 | | |__openapi
 | | | |__v1.json
 |__admin
 | |__astro.config.mjs
 | |__package.json
 | |__src
 | | |__pages
 | | | |__settings
 | | | | |__index.astro
 | | | |__index.astro
 | | | |__systems
 | | | | |__index.astro
 | | | |__trading
 | | | | |__index.astro
 | | |__env.d.ts
 | | |__layouts
 | | | |__AdminLayout.astro
 | | |__components
 | | | |__AdminNav.astro
 | | | |__Topbar.astro
 | | | |__Sidebar.astro
 | | | |__Table.astro
 | | | |__StatCard.astro
 | |__tsconfig.json
 |__api-worker
 | |__wrangler.toml
 | |__package.json
 | |__src
 | | |__routes
 | | | |__user.ts
 | | | |__health.ts
 | | | |__system.ts
 | | |__index.ts
 | |__tsconfig.json
infra
 |__github
 | |__workflows
 | | |__.gitkeep
 |__cloudflare
 | |__BINDINGS_MAP.md
 | |__goldshore-agent.wrangler.toml
 | |__runbooks
 | | |__DNS_AND_EMAIL.md
 | | |__CLOUDFLARE_APPS.md
 | |__goldshore-admin.wrangler.toml
 | |__goldshore-api.wrangler.toml
 | |__desired-state.yaml
 | |__goldshore-web.wrangler.toml
 |__AI
 | |__AGENT_CONFIG.yaml
 | |__AGENT_IDENTITY.yaml
docs
 |__CNAME
package.json
```

## Key Configuration Files Status

The following files contain core configuration data:

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

[[kv_namespaces]]
binding = "GS_KV"
id = "gs_api_kv_prod_001"

[[r2_buckets]]
binding = "GS_ASSETS"
bucket_name = "gs-api-assets"

[[d1_databases]]
binding = "GS_DB"
database_name = "gs_database"
database_id = "gs_database_id_001"

[ai]
binding = "AI"

[observability]
enabled = true
```
