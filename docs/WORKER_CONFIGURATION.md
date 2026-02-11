# Worker Configuration Guide

This document is the source of truth for Goldshore Worker naming, routes, and deployment flow.

## 1) Inventory from infra config

| Domain | Wrangler config | Default env names | Preview route | Staging route | Production route |
| --- | --- | --- | --- | --- | --- |
| API | `infra/cloudflare/goldshore-api.wrangler.toml` | `goldshore-api-<env>` | `api-preview.goldshore.ai/*` | `api-staging.goldshore.ai/*` | `api.goldshore.ai/*` |
| Gateway | `infra/cloudflare/goldshore-gateway.wrangler.toml` | `goldshore-gateway-<env>` | `gw-preview.goldshore.ai/*` | `gw-staging.goldshore.ai/*` | `gw.goldshore.ai/*` |
| Control | `infra/cloudflare/goldshore-control.wrangler.toml` | `goldshore-control-<env>` | `ops-preview.goldshore.ai/*` | `ops-staging.goldshore.ai/*` | `ops.goldshore.ai/*` |
| Agent | `infra/cloudflare/gs-agent.wrangler.toml` | `goldshore-agent-<env>` | workers.dev only | workers.dev only | workers.dev only |

Related infra state is also reflected in:

- `infra/cf/config.yaml` for CI-level deploy targets and naming constraints.
- `infra/cloudflare/desired-state.yaml` for target DNS and service naming.

## 2) Naming and config standards

### Worker names

All deployed worker names must follow:

```text
goldshore-<domain>-<env>
```

Allowed env values: `dev`, `preview`, `staging`, `prod`.

### Route patterns

Public routes must follow:

```text
<subdomain>.goldshore.ai/*
```

With environment suffixes:

- Preview: `<subdomain>-preview.goldshore.ai/*`
- Staging: `<subdomain>-staging.goldshore.ai/*`
- Production: `<subdomain>.goldshore.ai/*`

### Secrets and runtime env vars

GitHub deployment workflows use only:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Every worker env should define:

- `APP_ENV` (`dev|preview|staging|prod`)
- `SERVICE_DOMAIN` (worker domain key, such as `api`, `gateway`, `control`, `agent`)

## 3) Workflow mapping

Each worker has exactly:

- one deployment workflow (`deploy-*.yml`) for `staging` + `main` pushes (mapped to `staging` and `prod` envs)
- one preview workflow (`preview-*.yml`) for PR preview deploys (`--env preview`)

Deploy/preview workflow pairs:

- API: `deploy-api-worker.yml` + `preview-api-worker.yml`
- Gateway: `deploy-gateway.yml` + `preview-gateway.yml`
- Control: `deploy-control-worker.yml` + `preview-control-worker.yml`
- Agent: `deploy-agent.yml` + `preview-agent.yml`

## 4) Promotion flow (preview → staging → prod)

1. **Preview**
   - Open PR and apply `preview` label (or move PR to ready-for-review).
   - Preview workflow deploys `--env preview`.
   - Validate behavior on preview hostname.

2. **Staging**
   - Merge PR into `staging` branch.
   - Deploy workflow runs on `push` to `staging` and deploys `--env staging`.
   - Run smoke checks against `*-staging.goldshore.ai` domains.

3. **Production**
   - Promote staging changes into `main`.
   - Deploy workflow runs on `push` to `main` and deploys `--env prod`.
   - Confirm production health and rollback readiness.

## 5) Validation

Run this before merging worker config/workflow changes:

```bash
pnpm validate:workers
```

The validator checks:

- workflows reference Wrangler configs under `infra/cloudflare/*.wrangler.toml`
- deploy env values exist in the selected Wrangler file
- env-specific worker names match `goldshore-<domain>-<env>`
