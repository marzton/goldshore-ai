# Deployment Source of Truth

## Cloudflare Pages lock (Option A)

Gold Shore web deployments must use the canonical app surface only.

- **Root directory:** `apps/gs-web`
- **Build output directory:** `dist`

## Runtime binding roles

- `GS_CONFIG` is the shared configuration namespace for `apps/gs-admin` and `apps/gs-control`.
  - `apps/gs-control` is the control-plane orchestrator for shared runtime configuration sync.
  - `apps/gs-admin` uses the same namespace for operational reads/writes that must stay aligned with the control plane.
- `apps/gs-web` keeps its existing runtime storage model and does **not** use `GS_CONFIG` today.
  - `KV` remains for edge persistence and cache-style writes.
  - `DB` remains the D1-backed system of record for forms and submission data.
  - If `gs-web` ever needs shared config reads, add a separate intentional read-only config binding rather than repurposing `KV`.

## Runtime config source of truth (`GS_CONFIG` KV)

The authoritative contract for cross-worker config sync lives in `@goldshore/schema` at `packages/schema/src/system-sync.ts`. The current auth exception around `CONTROL_SYNC_TOKEN` should remain limited to the explicit `gs-control` ⇄ `gs-api` sync flow; do not broaden it into a general bypass.

### Canonical keys and ownership

- `ROUTING_TABLE`
  - **Owner:** `gs-control` (`POST /system/sync`)
  - **Primary readers:** `gs-api` (`GET /system/routing`, internal dashboard aggregation)
  - **Update cadence:** on DNS/routing rollout and infra reconciliations
- `SERVICE_STATUS`
  - **Owner:** `gs-control` for global status updates; `gs-api` for nested `api_config` updates via `/system/config`
  - **Primary readers:** `gs-api` status/config routes, `gs-admin` proxy endpoints
  - **Update cadence:** release events, incident toggles, and admin config edits
- `AI_ORCHESTRATION`
  - **Owner:** `gs-control` (`POST /system/sync`)
  - **Primary readers:** `gs-api` AI routes
  - **Update cadence:** model/policy tuning, default model changes
- `EMAIL_INBOX_LOGS`
  - **Owner:** `gs-mail`
  - **Primary readers:** `gs-api` internal inbox/status aggregation
  - **Update cadence:** append-on-ingress for each inbound message

### `gs-api:config` migration decision

`gs-api:config` is now treated as a **legacy key**. The active source of truth is `SERVICE_STATUS.api_config`.

Migration logic in `gs-api`:

1. Read `SERVICE_STATUS` and legacy `gs-api:config`.
2. If `SERVICE_STATUS.api_config` is absent, normalize legacy values into the new contract shape.
3. Backfill `SERVICE_STATUS.api_config` and mark `migratedFromLegacy: true`.
4. Keep `gs-api:config` read-only for compatibility; no new writes should target it.

## Change control

Agents must not alter the Cloudflare root build target unless explicitly authorized with phase label:

- `infra/build-root-change`

Any proposed change without this phase label is structural drift and must be rejected.
