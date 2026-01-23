# @goldshore/web

## Overview

Public marketing site and user portal built with Astro and Cloudflare Pages. Shared UI and theming come from `packages/ui` and `packages/theme`.

## Routes

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

## Local Development

From the repo root:

```bash
pnpm --filter ./apps/web dev
```

Common scripts:

```bash
pnpm --filter ./apps/web build
pnpm --filter ./apps/web preview
pnpm --filter ./apps/web astro check
```

## Dependencies

- `@goldshore/ui`
- `@goldshore/theme`
