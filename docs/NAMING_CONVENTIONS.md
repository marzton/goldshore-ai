# Naming Conventions

This document outlines the authoritative naming conventions for the GoldShore AI monorepo.

## Repository & Infrastructure

*   **Repository Name:** `goldshore-ai`
*   **Infrastructure (Terraform/Tofu):** `infra/`

## Applications

All applications reside in the `apps/` directory and must be prefixed with `gs-`.

| Application | Directory | Package Name | Description |
| :--- | :--- | :--- | :--- |
| **Web** | `apps/gs-web` | `gs-web` | Public marketing site (Astro) |
| **Admin** | `apps/gs-admin` | `gs-admin` | Secure operational console (Astro) |
| **API** | `apps/gs-api` | `gs-api` | Core API logic (Cloudflare Worker) |
| **Gateway** | `apps/gs-gateway` | `gs-gateway` | API Gateway & Routing (Cloudflare Worker) |
| **Agent** | `apps/gs-agent` | `gs-agent` | AI Agent Worker (Cloudflare Worker) |
| **Control** | `apps/gs-control` | `gs-control` | Internal Ops & Automation (Cloudflare Worker) |

## Packages

Shared packages reside in the `packages/` directory and are scoped under `@goldshore/`.

*   `packages/ui` -> `@goldshore/ui`
*   `packages/theme` -> `@goldshore/theme`
*   `packages/utils` -> `@goldshore/utils`
*   `packages/auth` -> `@goldshore/auth`
*   `packages/config` -> `@goldshore/config`
*   `packages/schema` -> `@goldshore/schema`

## Deployment & Workflows

*   **Deploy Workflows:** `deploy-<app-name>.yml` (e.g., `deploy-gs-web.yml`)
*   **Preview Workflows:** `preview-<app-name>.yml` (e.g., `preview-gs-api.yml`)

## Domain Mapping

| App | Domain |
| :--- | :--- |
| `gs-web` | `goldshore.ai` |
| `gs-admin` | `admin.goldshore.ai` |
| `gs-api` | `api.goldshore.ai` |
| `gs-gateway` | `gw.goldshore.ai` |
| `gs-control` | `ops.goldshore.ai` |
