JULES WORKER BOOTSTRAP & CLOUDLFARE DEPLOYMENT SPEC (FINAL)

Applies to repo: goldshore/astro-goldshore

This document defines how Jules must create, configure, deploy, and maintain all Cloudflare Workers without ever using the Cloudflare Dashboard’s UI worker creation flow.

⸻

0. Repository Structure Jules Must Follow

Worker apps always live in:

apps/api-worker/
apps/gateway/
apps/control-worker/

Corresponding Cloudflare Worker service names:

Directory	Worker Name	Domain/Route
apps/api-worker	gs-api	api.goldshore.ai/*
apps/gateway	gs-gateway	gw.goldshore.ai/*
apps/control-worker	gs-control	ops.goldshore.ai/*

Jules must never create any other Worker services.

⸻

1. Worker Creation MUST Use Cloudflare API — NOT UI

Jules must create or update each Worker service using:

POST /accounts/:account_id/workers/services
PUT /accounts/:account_id/workers/services/{name}

Never use:
	•	Cloudflare UI “Create Worker”
	•	workers.new
	•	dashboard worker scaffolding

These generate invalid repos & override your monorepo.

⸻

2. Build Process Jules Must Use

Each worker is built by Jules using:

pnpm --filter @goldshore/api-worker build
pnpm --filter @goldshore/gateway build
pnpm --filter @goldshore/control-worker build

This produces each worker at:

apps/<worker>/dist/_worker.js

If dist does not exist, Jules must run:

wrangler deploy --dry-run --outdir=dist

NEVER build from repo root.

⸻

3. Deployment Process (Required)

Jules must deploy workers using:

wrangler deploy apps/api-worker/src/index.ts --config apps/api-worker/wrangler.toml
wrangler deploy apps/gateway/src/index.ts --config apps/gateway/wrangler.toml
wrangler deploy apps/control-worker/src/index.ts --config apps/control-worker/wrangler.toml

Jules must NOT:
	•	call wrangler deploy without a --config
	•	create wrangler.toml in root
	•	modify cloudflare pages builds
	•	override _worker.js for the Pages project

Workers and Pages must remain isolated.

⸻

4. Attach DNS Routes Automatically

Jules must configure:

gs-api:

api.goldshore.ai/*

gs-gateway:

gw.goldshore.ai/*

gs-control:

ops.goldshore.ai/*

Using:

PUT /zones/:zone_id/workers/routes


⸻

5. Bindings Jules Must Add Automatically

gs-api

[[kv_namespaces]]
binding="KV"
id="<<< PROVIDED BY USER >>>"

[[r2_buckets]]
binding="ASSETS"
bucket_name="gs-api-assets"

[[d1_databases]]
binding="DB"
database_id="<<< PROVIDED BY USER >>>"

[ai]
binding="AI"

gs-gateway

[[services]]
binding="API"
service="gs-api"
environment="production"

[ai]
binding="AI"

gs-control

[[kv_namespaces]]
binding="CONTROL_LOGS"
id="<<< PROVIDED >>>"

[[r2_buckets]]
binding="STATE"
bucket_name="gs-control-state"

[[services]]
binding="API"
service="gs-api"

[[services]]
binding="GATEWAY"
service="gs-gateway"


⸻

6. Jules Must NOT Modify These
	•	Cloudflare Pages project settings
	•	Astro-goldshore Pages root build functions
	•	Pages _worker.js
	•	Pages asset routing
	•	Pages project names
	•	D1/KV/R2 IDs unless asked explicitly

⸻

7. Jules MUST Connect Workers Correctly

Gateway → API

app.env.API.fetch()

Admin → Gateway

Using:

PUBLIC_GATEWAY=https://gw.goldshore.ai

Web → Gateway

Same env.

Control → Gateway + API

Must use service bindings, not DNS.

⸻

8. Jules MUST Validate Deployment

For each worker:

GET https://api.goldshore.ai/v1/health
GET https://gw.goldshore.ai/v1/health
GET https://ops.goldshore.ai/v1/health

All must return 200 before Jules reports success.

⸻

This is the complete Cloudflare automation spec.

With this document in your repo, Jules can:
	•	Create all 3 workers correctly
	•	Bind them correctly
	•	Deploy with wrangler
	•	Wire DNS
	•	Wire service bindings
	•	Avoid UI bugs
	•	Avoid creating new repos
	•	Keep the monorepo intact
