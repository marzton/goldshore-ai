# 2026-03-09 Preview Binding Stabilization

## 6. Rollback & Recovery

When preview binding recovery requires deleting and re-deploying a Worker, use the following guarded process.

### Safety Preconditions (required before any delete)

- [ ] Confirm current git branch and target Worker before running a destructive command.
  ```bash
  git branch --show-current
  ```
- [ ] Confirm every destructive or deploy command includes `--env preview`.
- [ ] Confirm the Worker name ends with `-preview` or matches the approved preview naming convention.
- [ ] Capture the currently deployed version identifier in logs before delete.
  ```bash
  npx wrangler deployments list --name <worker-preview-name> --env preview | head -n 20
  ```
- [ ] Run automated guardrail validation before any delete command.
  ```bash
  node scripts/validate-preview-bindings.js --worker <worker-preview-name> --env preview --version-id <deployment-id-or-hash> --health-url https://<preview-hostname>/healthz
  ```

### Explicit preview delete + redeploy examples

> Do not run a generic delete command. Execute only the per-worker command set that matches the rollback target.

- **`gs-api` preview Worker (`apps/gs-api/wrangler.toml`)**
  ```bash
  npx wrangler delete gs-api-preview --env preview
  npx wrangler deploy --config apps/gs-api/wrangler.toml --env preview
  ```

- **`gs-gateway` preview Worker (`apps/gs-gateway/wrangler.toml`)**
  ```bash
  npx wrangler delete gs-gateway-preview --env preview
  npx wrangler deploy --config apps/gs-gateway/wrangler.toml --env preview
  ```

- **Legacy worker path reference (`archive/legacy/api-worker/wrangler.toml`)**
  ```bash
  npx wrangler delete legacy-api-preview --env preview
  npx wrangler deploy --config archive/legacy/api-worker/wrangler.toml --env preview
  ```

### Post-delete redeploy verification (mandatory)

After each redeploy, verification is not complete until both checks pass:

1. **Deployment success:** Wrangler output must show a successful deploy for the exact preview Worker.
2. **Health endpoint success:** Run the matching preview health endpoint and require a successful (`2xx`) response.

Per-worker verification examples:

```bash
# gs-api
curl -fsS https://gs-api-preview.<preview-domain>/healthz

# gs-gateway
curl -fsS https://gs-gateway-preview.<preview-domain>/healthz

# legacy-api
curl -fsS https://legacy-api-preview.<preview-domain>/healthz
```

Record the pre-delete deployed version identifier, redeploy success output, and health-check output in rollback logs.
