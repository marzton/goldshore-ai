# Integration Contract

This contract captures runtime integration boundaries between frontend apps, edge workers, and mail status APIs.

## 1) Frontend runtime contract (`PUBLIC_*`)

All browser-facing apps (`gs-web`, `gs-admin`) must consume backend origins from `PUBLIC_*` variables instead of hardcoding hostnames.

### Required

- `PUBLIC_API`: base URL for API calls (e.g. `/system/info`, `/internal/inbox-status` via proxied routes).
- `PUBLIC_GATEWAY`: base URL for gateway-routed API traffic.
- `PUBLIC_ENV`: environment marker (`development`, `preview`, `production`).

### Optional/extended

- `PUBLIC_CONTROL`: ops/control surface origin for control UI links or ops tooling.
- `PUBLIC_MAIL`: mail-worker origin (diagnostics/health only; not direct SMTP routing).
- `PUBLIC_WEB`, `PUBLIC_ADMIN`: canonical app origin references for cross-app links.

## 2) Worker service binding contract by environment

Worker-to-worker service bindings must follow this topology in every non-dev deployed environment.

| Worker | Required service bindings | Preview target | Prod target |
| --- | --- | --- | --- |
| `gs-gateway` | `API` | `gs-api` (`environment = "preview"`) | `gs-api` (`environment = "prod"`) |
| `gs-control` | `API`, `GATEWAY` | `gs-api` + `gs-gateway` (`environment = "preview"`) | `gs-api` + `gs-gateway` (`environment = "prod"`) |
| `gs-api` | none (inbound service target) | n/a | n/a |
| `gs-mail` | none (event-driven email handler) | n/a | n/a |

## 3) Mail endpoint contract

### Canonical read endpoint (mail status via API)

- **Path:** `GET /internal/inbox-status` (served by `gs-api`, consumed by admin).
- **Payload shape (response):**
  - `success: boolean`
  - `timestamp: string (ISO-8601)`
  - `services: object` (service status snapshot)
  - `inbox.count: number`
  - `inbox.recent: EmailLog[]` (latest entries)

### CORS expectations

- Browser clients should call this endpoint through same-origin frontend/API proxy routes where possible.
- Direct cross-origin calls are permitted only from approved `goldshore.ai` app origins and must remain aligned with API CORS policy.
- No wildcard `*` CORS policy should be used for authenticated or internal mail status routes.

## 4) Required Cloudflare bindings per worker

The following bindings are required at deploy time for canonical operation.

| Worker | KV | D1 | R2 | Queues | AI | Service bindings |
| --- | --- | --- | --- | --- | --- | --- |
| `gs-api` | `KV`, `CONTROL_LOGS` | `DB` | `ASSETS` | — | `AI` | — |
| `gs-gateway` | `GATEWAY_KV` | — | — | `JOB_QUEUE` (producer) | `AI` | `API -> gs-api` |
| `gs-control` | `CONTROL_LOGS` | — | `STATE` | — | — | `API -> gs-api`, `GATEWAY -> gs-gateway` |
| `gs-mail` | `GS_CONFIG` | — | — | — | — | — |
| `gs-web` (Pages) | (project vars) | (optional app-specific) | (optional app-specific) | — | — | — |
| `gs-admin` (Pages) | (project vars) | — | — | — | — | — |

If a worker adds/removes a binding, this contract must be updated in the same PR.
