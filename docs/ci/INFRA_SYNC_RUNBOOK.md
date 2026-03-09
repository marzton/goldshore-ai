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

Optional for token rotation without downtime:

- `CLOUDFLARE_BUILD_API_TOKEN` (if set, workflows prefer this token and fall back to `CLOUDFLARE_API_TOKEN`)

### Secret migration: `CF_ZONE_ID` -> `CLOUDFLARE_ZONE_ID`

Use a shell-valid migration flow when adding the new repository secret name:

```bash
# If needed, source CF_ZONE_ID first from your vault/1Password/secret manager.
export CF_ZONE_ID='<zone-id-from-secret-store>'
gh secret set CLOUDFLARE_ZONE_ID --body "$CF_ZONE_ID"
```

Notes:

- In hosted CI docs/examples, explicitly show exporting or otherwise loading the source value first before calling `gh secret set`.
- `gh secret set` runs in a local shell context, so you cannot directly use GitHub expression syntax like `${{ secrets.CF_ZONE_ID }}` in that command.
- After confirming all workflows and scripts read `CLOUDFLARE_ZONE_ID`, remove the deprecated `CF_ZONE_ID` secret from GitHub.

Do not store Cloudflare credentials or namespace IDs in tracked workflow files or scripts.

## Secret migration: `CF_ZONE_ID` → `CLOUDFLARE_ZONE_ID`

When migrating zone ID secret names, treat GitHub secrets as **write-only**:

- You can check whether a secret exists, but you cannot read a secret value back from GitHub.
- Do **not** try to recover values with patterns like `ZONE_VAL=$(gh secret list | grep CF_ZONE_ID)`.

Use a presence-only check for the legacy key:

```bash
gh secret list | grep -q '^CF_ZONE_ID\b' && echo "CF_ZONE_ID is present"
```

Set `CLOUDFLARE_ZONE_ID` from your source of truth (vault or local secure store), not from GitHub secret output:

```bash
export CLOUDFLARE_ZONE_ID='<zone-id-from-vault-or-secure-store>'
gh secret set CLOUDFLARE_ZONE_ID --body "$CLOUDFLARE_ZONE_ID"
```

After setting the new secret, deploy and verify production behavior. Remove legacy `CF_ZONE_ID` only after successful deployment verification.
