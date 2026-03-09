# AI Gateway Operations Checklist

Use this checklist when validating Cloudflare AI Gateway dashboard settings against this repo's runtime configuration.

## Dashboard toggles → repo config mapping

| Dashboard toggle | Required state | Repo env/secret mapping | Where used in repo |
| --- | --- | --- | --- |
| Authenticated Gateway | **ON** (signed requests only) | `AIPROXYSIGNING_KEY` (Worker secret + KV key), optional endpoint host in `AIPROXY_ENDPOINT` | `scripts/goldshore-audit-deploy.sh` seeds `AIPROXYSIGNING_KEY`; `scripts/rotate-aiproxy-signing-key.mjs` rotates secret + KV value. |
| Caching | **ON** (gateway-level response caching) | `AIPROXY_ENDPOINT` should target the AI Gateway URL with caching enabled in dashboard | Endpoint and cache behavior are operational settings; app workers route AI traffic through gateway binding/endpoint. |
| Rate limiting | **ON** (per-route/per-model limits) | `AIPROXY_ENDPOINT` points to the gateway where limits are enforced | `apps/gs-gateway` is ingress layer for AI dispatch/routing; dashboard rate limits protect upstream provider spend. |
| Provider keys | **Configured for all enabled providers** | Worker secrets: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (and any additional provider keys, e.g. `GEMINI_API_KEY`) | `scripts/goldshore-audit-deploy.sh` audits/pushes provider secrets to workers; `apps/gs-api/src/types.ts` defines provider key envs. |

## Pre-deploy checklist

1. Run deployment audit and secret sync:

   ```bash
   scripts/goldshore-audit-deploy.sh
   ```

   Confirms Cloudflare token access, checks/pushes required Worker secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AIPROXYSIGNING_KEY`), then runs health checks.

2. Rotate AI proxy signing key (recommended before high-risk deploys or on credential events):

   ```bash
   node scripts/rotate-aiproxy-signing-key.mjs
   ```

   Rotates `AIPROXYSIGNING_KEY` across Worker secrets and KV.

3. Verify dashboard state manually before deploy:
   - Authenticated Gateway: ON
   - Caching: ON
   - Rate limiting: ON
   - Provider keys present and valid for enabled models

## Smoke-check (gateway endpoint)

Use the public gateway health endpoint:

```bash
curl -fsS https://gw.goldshore.ai/health
```

Expected JSON shape:

```json
{
  "status": "ok",
  "service": "gs-gateway"
}
```

If this fails, stop deploy and investigate DNS/route/service-binding/secret drift before proceeding.
