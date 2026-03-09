# 2026-03-09 Preview Binding Stabilization

## 6. Rollback & Recovery

When preview binding recovery requires deleting and re-deploying a Worker, use the following guarded process.

### Safety Preconditions (required before any delete)

- [ ] Confirm current git branch and identify the exact target Worker for the rollback action.
- [ ] Confirm the command explicitly includes `--env preview`.
- [ ] Confirm the Worker name ends with `-preview` or otherwise matches the approved preview naming convention.
- [ ] Capture and log the currently deployed version identifier before deleting (for example: deployment ID, version hash, or Wrangler deployment timestamp output).

### Explicit preview delete + redeploy examples

> Do not run a generic delete command. Execute the per-worker command that matches the rollback target.

- **`gs-api` preview Worker**
  ```bash
  npx wrangler delete gs-api-preview --env preview
  npx wrangler deploy --config apps/gs-api/wrangler.toml --env preview
  ```

- **`gs-gateway` preview Worker**
  ```bash
  npx wrangler delete gs-gateway-preview --env preview
  npx wrangler deploy --config apps/gs-gateway/wrangler.toml --env preview
  ```

- **Legacy worker path reference (`legacy/api-worker`)**
  ```bash
  npx wrangler delete legacy-api-preview --env preview
  npx wrangler deploy --config archive/legacy/api-worker/wrangler.toml --env preview
  ```

### Post-delete redeploy verification (mandatory)

After redeploying, verify both deployment success and service health:

1. Confirm Wrangler reports successful deployment for the target preview Worker.
2. Run the preview health check endpoint and verify a success response.

Example:

```bash
curl -fsS https://<preview-hostname>/healthz
```

Record both the successful deployment output and health-check result in rollback logs.
