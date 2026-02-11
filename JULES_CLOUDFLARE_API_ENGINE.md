# 🟣 MODULE 2 — JULES CF AUTOMATION ENGINE (API LAYER)

This module defines exactly how Jules interacts with the Cloudflare APIs:

✔ Workers
✔ Pages
✔ DNS
✔ Access Policies
✔ Bindings
✔ KV / R2 / D1
✔ Worker Versions
✔ Email Routing
✔ Account verification
✔ Project creation
✔ Route validation
✔ Error recovery
✔ Idempotency guarantees

This module must be placed into your repo at:

/JULES_CLOUDFLARE_API_ENGINE.md

and referenced from Jules’ master instructions.

⸻

## 📍 1 — Cloudflare API Endpoints Jules Must Use

### 🔹 Account & Tokens

`GET /user/tokens/verify`
`GET /accounts`

Jules MUST verify:
	•	API token permissions
	•	Account ID
	•	Zone ID

Before taking any action.

⸻

## 📍 2 — Workers (Create / Update / Deploy / Bindings)

### 🔹 Create Worker Script:

`PUT /accounts/{account_id}/workers/scripts/{script_name}`

Jules must upload:
	•	_worker.js or compiled bundle
	•	metadata JSON
	•	wasm modules (if present)
	•	kv, r2, d1 bindings

⸻

### 🔹 Worker Routes:

`PUT /zones/{zone_id}/workers/routes`

Example Jules MUST create:

| Worker | Route |
| :--- | :--- |
| gs-api | api.goldshore.ai/* |
| gs-gateway | gw.goldshore.ai/* |
| gs-control | ops.goldshore.ai/* |


⸻

### 🔹 Worker Versions:

`GET  /accounts/{account_id}/workers/scripts/{script}/versions`
`POST /accounts/{account_id}/workers/scripts/{script}/versions/{version}/activate`

Jules MUST:
	•	Deploy as preview
	•	Test routing
	•	Activate production version ONLY after validation

⸻

## 📍 3 — Pages (Create / Build / Deploy / Bindings)

### 🔹 Create Pages Project:

`POST /accounts/{account_id}/pages/projects`

Jules must create these:

**projectName: gs-web**
production_branch: main
build_command: pnpm --filter @goldshore/web build
build_output: apps/web/dist

**projectName: gs-admin**
production_branch: main
build_command: pnpm --filter @goldshore/admin build
build_output: apps/admin/dist


⸻

### 🔹 Deploy Pages:

`POST /accounts/{account_id}/pages/projects/{project}/deployments`

Jules MUST:
	•	Zip the dist folder
	•	Upload it
	•	Poll status
	•	Validate success

⸻

### 🔹 Custom Domains:

`POST /accounts/{account_id}/pages/projects/{project}/domains`

**gs-web:**

goldshore.ai
www.goldshore.ai

**gs-admin:**

admin.goldshore.ai


⸻

## 📍 4 — DNS Management

### 🔹 Add DNS Record:

`POST /zones/{zone_id}/dns_records`

Jules MUST add:

```json
{
  "type": "CNAME",
  "name": "api",
  "content": "gs-api.goldshore.workers.dev",
  "proxied": true
}
```


⸻

### 🔹 Update DNS

`PUT /zones/{zone_id}/dns_records/{identifier}`


⸻

### 🔹 Delete DNS

`DELETE /zones/{zone_id}/dns_records/{identifier}`

Jules MUST NEVER:
	•	Modify unrelated DNS
	•	Delete anything without confirmation

⸻

## 📍 5 — KV / R2 / D1 Bindings

### 🔹 Create KV namespace:

`POST /accounts/{account_id}/storage/kv/namespaces`

### 🔹 Create R2 bucket:

`PUT /accounts/{account_id}/r2/buckets/{bucket}`

### 🔹 Create D1 database:

`POST /accounts/{account_id}/d1/database`

Jules MUST store:
	•	Namespace IDs
	•	Bucket names
	•	Database IDs

and insert them into wrangler.toml automatically.

⸻

## 📍 6 — Cloudflare Access Policies

### 🔹 Create Access Application:

`POST /accounts/{account_id}/access/apps`

### 🔹 Create Access Policy:

`POST /accounts/{account_id}/access/apps/{app_id}/policies`

Jules MUST create Access protection for:

| Domain | Protection |
| :--- | :--- |
| admin.goldshore.ai | Required |
| ops.goldshore.ai | Required |
| api.goldshore.ai | Optional |
| gw.goldshore.ai | Optional |
| goldshore.ai | Never |


⸻

## 📍 7 — Email Routing & Workers

### Catch-all:

`POST /zones/{zone_id}/email/routing/rules`

Jules MUST configure:

`*@goldshore.ai` → `gs-mail` worker

### Email Worker Trigger:

```javascript
export default {
  async email(message, env, ctx) {
    await message.forward("ops@goldshore.ai");
  }
}
```


⸻

## 📍 8 — Worker Reconciliation Engine

Jules MUST implement a 7-step safety cycle:
	1.	Fetch current worker state
	2.	Fetch wrangler.toml
	3.	Compare differences
	4.	Apply missing bindings
	5.	Validate routes
	6.	Validate DNS
	7.	Apply missing pieces ONLY

This prevents accidental overwrites.

⸻

## 📍 9 — High-Level Jules Commands (Natural Language → API)

**Create Worker**

“Jules, create worker gs-api.”

**Update Routes**

“Jules, wire gs-gateway to gw.goldshore.ai.”

**Deploy**

“Jules, deploy gs-admin Preview.”

**Fix DNS**

“Jules, reconcile DNS for all workers.”

**Protect Admin**

“Jules, enable Access for admin.goldshore.ai.”

⸻

## 📍 10 — Maintenance Responsibilities

Jules MUST automatically:
	•	Rotate API tokens (when instructed)
	•	Validate D1 schema
	•	Validate Pages builds
	•	Ensure Astro builds with correct adapter
	•	Ensure wrangler.toml matches Cloudflare config
	•	Lint workflows
	•	Guard against breaking changes
	•	Monitor diff between repo + Cloudflare state
