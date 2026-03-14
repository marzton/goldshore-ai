# 🟦 GoldShore Monorepo

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
