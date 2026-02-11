# gs-control worker

## Overview
`gs-control` is the operations worker for Goldshore infrastructure automation (DNS updates, worker/page reconciliation, access audits, and system sync workflows). It is served from `https://ops.goldshore.ai/*`.

## Cloudflare configuration
From `wrangler.toml`:
- Worker name: `gs-control`
- Entry point: `src/index.ts`
- Route: `ops.goldshore.ai/*`
- KV binding: `CONTROL_LOGS`
- R2 binding: `STATE`
- Service bindings: `API` (`gs-api`), `GATEWAY` (`gs-gateway`)
- Environment variable: `ENV=production`

## API endpoints
Implemented in `src/index.ts` and `src/routes/cloudflare.ts`:
- `GET /`
- `POST /dns/apply`
- `POST /workers/reconcile`
- `POST /pages/deploy`
- `POST /access/audit`
- `GET /cloudflare/dns/records`
- `PUT /cloudflare/dns/records/:recordId`
- `GET /cloudflare/workers/status`
- `GET /cloudflare/pages/projects`
- `GET /cloudflare/kv/namespaces`
- `GET /cloudflare/r2/buckets`
- `GET /cloudflare/d1/databases`
- `GET /cloudflare/access/policies`

## Development
```bash
pnpm install
pnpm --filter ./apps/gs-control dev
pnpm --filter ./apps/gs-control typecheck
pnpm --filter ./apps/gs-control build
```

## Deploy
```bash
pnpm --filter ./apps/gs-control deploy
```

## Source/build artifact policy
- TypeScript (`.ts`) files in `src/` are the source of truth.
- Do not commit generated JavaScript files under `src/` (especially `src/libs`, `src/routes`, and `src/tasks`).
- TypeScript compilation output must go only to `dist/` via `pnpm --filter ./apps/gs-control build` (`tsconfig.json` sets `outDir: "dist"`).
- Legacy snapshots created during migrations should be moved under `archive/legacy-snapshots/<YYYY-MM-DD>/` rather than left in app directories.
