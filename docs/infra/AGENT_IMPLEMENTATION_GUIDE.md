# Gold Shore Labs — Agent Implementation Guide

This runbook captures the required operator workflow to restore, secure, and align Gold Shore infrastructure.

> Security note: token revocation and cloud account changes require authenticated operator access. Execute these steps in your secure admin environment; do not commit secrets to git.

## 1) Critical Security Cleanup (Immediate)

### Key rotation
- Revoke exposed GitHub PAT(s) and issue a new fine-grained token with only required scopes.
- Revoke exposed Cloudflare API token(s) and issue a replacement with least-privilege permissions for:
  - Workers (edit)
  - DNS (edit)
  - Zero Trust (edit)

### DNS and mail cleanup
- In Cloudflare DNS, inspect duplicate `_dmarc` TXT records.
- Keep the record containing `rua=mailto:security@goldshore.ai` and remove incorrect duplicates.

### Secret conversion for Workers (`gs-api`, `gs-gateway`, `gs-control`)
Run for each worker/environment:

```bash
wrangler secret put SESSION_SECRET
wrangler secret put JWTHS256KEY
wrangler secret put HMAC_SECRET
Use one of these command patterns for every write:

- Run from the service directory: `cd apps/<service> && wrangler ...`
- Or run from repo root and pass config explicitly: `wrangler ... --config apps/<service>/wrangler.toml`

For each secret write, immediately run a dry-run deploy against the same environment to verify the worker config resolves correctly and the secret landed in the intended target.

#### `gs-api`
```bash
# preview (from service directory)
cd apps/gs-api
wrangler secret put SESSION_SECRET --env preview
wrangler deploy --dry-run --env preview
wrangler secret put JWTHS256KEY --env preview
wrangler deploy --dry-run --env preview
wrangler secret put HMAC_SECRET --env preview
wrangler deploy --dry-run --env preview

# prod (from repo root, explicit config)
cd /path/to/goldshore-ai
wrangler secret put SESSION_SECRET --config apps/gs-api/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-api/wrangler.toml --env prod
wrangler secret put JWTHS256KEY --config apps/gs-api/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-api/wrangler.toml --env prod
wrangler secret put HMAC_SECRET --config apps/gs-api/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-api/wrangler.toml --env prod
```

#### `gs-gateway`
```bash
# preview (from service directory)
cd apps/gs-gateway
wrangler secret put SESSION_SECRET --env preview
wrangler deploy --dry-run --env preview
wrangler secret put JWTHS256KEY --env preview
wrangler deploy --dry-run --env preview
wrangler secret put HMAC_SECRET --env preview
wrangler deploy --dry-run --env preview

# prod (from repo root, explicit config)
cd /path/to/goldshore-ai
wrangler secret put SESSION_SECRET --config apps/gs-gateway/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-gateway/wrangler.toml --env prod
wrangler secret put JWTHS256KEY --config apps/gs-gateway/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-gateway/wrangler.toml --env prod
wrangler secret put HMAC_SECRET --config apps/gs-gateway/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-gateway/wrangler.toml --env prod
```

#### `gs-control`
```bash
# preview (from service directory)
cd apps/gs-control
wrangler secret put SESSION_SECRET --env preview
wrangler deploy --dry-run --env preview
wrangler secret put JWTHS256KEY --env preview
wrangler deploy --dry-run --env preview
wrangler secret put HMAC_SECRET --env preview
wrangler deploy --dry-run --env preview

# prod (from repo root, explicit config)
cd /path/to/goldshore-ai
wrangler secret put SESSION_SECRET --config apps/gs-control/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-control/wrangler.toml --env prod
wrangler secret put JWTHS256KEY --config apps/gs-control/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-control/wrangler.toml --env prod
wrangler secret put HMAC_SECRET --config apps/gs-control/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-control/wrangler.toml --env prod
```

## 2) DNS and Architecture Alignment

### Role enforcement
- `gs-control` (brain): keep `ops.goldshore.ai` as the canonical control-plane hostname for `gs-control` and enforce Cloudflare Access policy on that endpoint.
  - Rationale: the deployed Worker routes and service references are standardized on `ops.goldshore.ai` (`ops-preview.goldshore.ai` for preview), so introducing `control.goldshore.ai` as a first-class endpoint adds duplicate DNS and policy surface area without an operational requirement.
- `gs-gateway` (guard): update `gateway-preview.goldshore.ai` to target `gs-gateway` (not `gs-control`).

### R2 custom domain provisioning
```bash
wrangler r2 bucket create goldshore-public
```

Then set DNS:
- Type: `CNAME`
- Name: `assets`
- Target: `public.goldshore.ai`
- Proxy: enabled

## 3) Missing Production Logic

### Webhook verification secrets
- Stripe: retrieve `whsec_...` value and set:

```bash
wrangler secret put STRIPE_WEBHOOK_SECRET
# Example for gs-api preview from service directory
cd apps/gs-api
wrangler secret put STRIPE_WEBHOOK_SECRET --env preview
wrangler deploy --dry-run --env preview

# Example for gs-api prod from repo root
cd /path/to/goldshore-ai
wrangler secret put STRIPE_WEBHOOK_SECRET --config apps/gs-api/wrangler.toml --env prod
wrangler deploy --dry-run --config apps/gs-api/wrangler.toml --env prod
```

- GitHub webhook verification: set and use `GH_WEBHOOK_SECRET` to validate `X-Hub-Signature-256` before processing webhook events.

### Production deploy variables
```bash
wrangler deploy --var NODE_ENV:production --var OTEL_SERVICE_NAME:goldshore-core-prod
# from service directory
cd apps/gs-api
wrangler deploy --env prod --var NODE_ENV:production --var OTEL_SERVICE_NAME:goldshore-core-prod

# or from repo root with explicit config
cd /path/to/goldshore-ai
wrangler deploy --config apps/gs-api/wrangler.toml --env prod --var NODE_ENV:production --var OTEL_SERVICE_NAME:goldshore-core-prod
```

## 4) GitHub App and Codex Automation

- GitHub OAuth client ID: `Iv23li3Pe13j28MzEjN0`
- OAuth callback URL: `https://api.goldshore.ai/oauth/github/callback`
- GitHub App webhook endpoint: `https://api.goldshore.ai/webhook/github`

After edits to `env.secrets.bundle.json`:

```bash
pnpm sync:cf
```

All incoming webhook requests must pass Web Crypto HMAC SHA-256 validation before triggering post-deploy hooks.

## Final Checklist

| Task | Action | Expected Result |
|---|---|---|
| JWT Key | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` | Secure HS256 signing key material |
| DMARC | Remove duplicate/invalid TXT | DMARC alignment restored |
| R2 DNS | `assets` CNAME to `public.goldshore.ai` | Custom asset URL in place |
| Gateway Fix | Repoint `gateway-preview` to `gs-gateway` | Correct traffic routing |
| Gateway Fix | Repoint `gw-preview` to `gs-gateway` | Correct traffic routing |

Canonical hostnames for preview/prod surfaces are maintained in `docs/infra/HOSTNAME_REFERENCE.md`.
