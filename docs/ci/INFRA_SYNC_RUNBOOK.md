# Infra Sync Runbook

Use `.github/workflows/sync-infra.yml` to run Cloudflare infrastructure synchronization separately from app deploy pipelines.

## Trigger model

- **Automatic on `main` push (path-filtered):** runs when infra sources change (`infra/Cloudflare/**`, `infra/cron/**`).
- **Scheduled (weekly):** catches drift even without recent infra commits.
- **Manual (`workflow_dispatch`):** recommended for urgent reconciliation or post-incident verification.

## When to run manually

Run `Sync Infrastructure (Cloudflare)` manually when:

- You rotate Cloudflare credentials or namespace bindings.
- You changed Cloudflare resources via dashboard/API and need repo-defined state re-applied.
- You need immediate drift correction before the next scheduled run.

## When schedule is enough

Rely on the weekly schedule when:

- No urgent Cloudflare drift is observed.
- Infra updates are already merged and path-filtered push runs succeeded.

## Required GitHub Secrets

Set these repository secrets before enabling the workflow:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_KV_NAMESPACE_API_ID`
- `CLOUDFLARE_KV_NAMESPACE_GATEWAY_ID`

Do not store Cloudflare credentials or namespace IDs in tracked workflow files or scripts.
