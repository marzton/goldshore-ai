# @goldshore/admin

## Overview

Admin cockpit dashboard built with Astro SSR and protected by Cloudflare Access. Uses the shared GoldShore UI kit and theme.

## Sections

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

## Local Development

From the repo root:

```bash
pnpm --filter ./apps/admin dev
```

Common scripts:

```bash
pnpm --filter ./apps/admin build
pnpm --filter ./apps/admin preview
```

## Dependencies

- `@goldshore/ui`
- `@goldshore/theme`
