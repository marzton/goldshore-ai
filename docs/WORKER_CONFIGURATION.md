# Worker Configuration Guide

This document details the configuration for the Cloudflare Workers in the GoldShore monorepo.

## 1. gs-mail (`apps/gs-mail`)

The email routing and processing worker.

- **Directory:** `apps/gs-mail`
- **Package Name:** `gs-mail`
- **Wrangler:** `apps/gs-mail/wrangler.toml`
- **Deployment:** GitHub Actions production deploy (`.github/workflows/deploy-gs-mail.yml`) or manual Wrangler.
- **Bindings:** None currently required.
- **Purpose:** Handles email routing logic and forwarding.

## 2. gs-agent (`apps/gs-agent`)

The AI agent service.

- **Directory:** `apps/gs-agent`
- **Package Name:** `@goldshore/gs-agent`
- **Wrangler:** `infra/Cloudflare/gs-agent.wrangler.toml` (external config)
- **Deployment state:** **Preview-only by design**
- **GitHub Actions:** `.github/workflows/preview-gs-agent.yml`
- **Production deploy:** Manual Wrangler by ops; GitHub Actions is not the production source of truth.
- **Bindings:**
  - `AI`: Cloudflare Workers AI binding.
  - `Queues`: Consumes `goldshore-jobs`.
- **Main Entry:** `apps/gs-agent/src/index.ts`
- **Purpose:** Handles AI inference tasks and background job processing.

## 3. gs-gateway (`apps/gs-gateway`)

The API gateway and router.

- **Directory:** `apps/gs-gateway`
- **Package Name:** `@goldshore/gs-gateway`
- **Wrangler:** `apps/gs-gateway/wrangler.toml`
- **Deployment state:** **Preview-only by design**
- **GitHub Actions:** `.github/workflows/preview-gs-gateway.yml`
- **Production deploy:** Manual Wrangler by ops; GitHub Actions is not the production source of truth.
- **Bindings:**
  - `KV Namespaces`: `GATEWAY_KV`.
  - `Queues`: Produces to `goldshore-jobs`.
  - `Services`: `API` (points to `gs-api`).
  - `AI`: Cloudflare Workers AI binding.
- **Main Entry:** `apps/gs-gateway/src/index.ts`
- **Purpose:** Primary entry point for API traffic and queue ingress.

## 4. gs-control (`apps/gs-control`)

The operational control plane worker.

- **Directory:** `apps/gs-control`
- **Package Name:** `@goldshore/gs-control`
- **Wrangler:** `apps/gs-control/wrangler.toml`
- **Deployment state:** **Fully manual / no GitHub deploy automation**
- **GitHub Actions:** None
- **Production deploy:** Manual Wrangler by ops.
- **Bindings:**
  - `KV Namespaces`: `CONTROL_LOGS`.
  - `R2 Buckets`: `STATE`.
  - `Services`: `API`, `GATEWAY`.
- **Main Entry:** `apps/gs-control/src/index.ts`
- **Purpose:** Internal tool for managing Cloudflare resources and administrative operations.

## 5. gs-api (`apps/gs-api`)

The backend API service.

- **Directory:** `apps/gs-api`
- **Package Name:** `gs-api`
- **Wrangler:** `apps/gs-api/wrangler.toml`
- **Deployment:** GitHub Actions production deploy (`.github/workflows/deploy-gs-api.yml`) plus preview workflow (`.github/workflows/preview-gs-api.yml`).
- **Purpose:** Core business logic and data access layer.
