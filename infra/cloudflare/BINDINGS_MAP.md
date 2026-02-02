# Gold Shore Labs — Cloudflare Bindings Map

## Zones

- `goldshore.ai` — primary zone

---

## Pages Projects

### 1. Web (Public)

- Project: `astro-gs-web`
- Repo: `astro-goldshore`
- Root: `apps/web`
- Custom Domains:
  - `goldshore.ai`
  - `preview.goldshore.ai`

**Environment Variables:**

- `PUBLIC_API=https://api.goldshore.ai`
- `PUBLIC_GATEWAY=https://gw.goldshore.ai`

---

### 2. Admin (Cockpit)

- Project: `astro-gs-admin`
- Repo: `astro-goldshore`
- Root: `apps/admin`
- Custom Domains:
  - `admin.goldshore.ai`
  - `admin-preview.goldshore.ai`

**Zero Trust:**

- Access policy required on `admin.goldshore.ai` (email allowlist).

**Environment Variables:**

- `PUBLIC_API=https://api.goldshore.ai`
- `PUBLIC_GATEWAY=https://gw.goldshore.ai`

---

## Workers

### 3. API Worker

- Service Name: `gs-api`
- Code: `apps/goldshore-api`
- Routes:
  - `api.goldshore.ai/*`
  - `api-preview.goldshore.ai/*`

**Bindings:**

- KV:
  - Binding: `API_KV`
  - Namespace: `goldshore-api-kv`
- D1:
  - Binding: `DB`
  - Database: `goldshore-api-db`
- R2:
  - Binding: `ASSETS`
  - Bucket: `goldshore-api-assets`
- AI:
  - Binding: `AI`
  - Gateway: `goldshore-ai-gateway`

---

### 4. Gateway Worker

- Service Name: `astro-gs-gateway`
- Code: `apps/gateway`
- Routes:
  - `gw.goldshore.ai/*`
  - `gw-preview.goldshore.ai/*`

  **Bindings:**

  - Service:
    - Binding: `API`
    - Service: `gs-api`
    - Environment: `production`
- KV:
  - Binding: `GATEWAY_KV`
  - Namespace: `goldshore-gw-kv`
- D1 (optional telemetry):
  - Binding: `DB`
  - Database: `goldshore-telemetry-db`

---

### 5. Control Worker

- Service Name: `gs-control`
- Code: `apps/control-worker`
- Routes:
  - `ops.goldshore.ai/*`

**Bindings:**

- KV:
  - Binding: `CONTROL_LOGS`
  - Namespace: `gs-control-logs`
- R2:
  - Binding: `STATE`
  - Bucket: `gs-control-state`
- Services:
  - Binding: `API`
  - Service: `gs-api`
  - Binding: `GATEWAY`
  - Service: `gs-gateway`
- Env Vars:
  - `ENVIRONMENT=production`
