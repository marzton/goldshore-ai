# Status DNS Recovery Runbook

Use this runbook when `status.goldshore.ai` fails with `ERR_NAME_NOT_RESOLVED`.

## 1) Restore DNS record in Cloudflare Dashboard

1. Open **Cloudflare Dashboard → goldshore.ai → DNS → Records**.
2. Add or repair this record:
   - **Type:** `CNAME`
   - **Name:** `status`
   - **Target:** `goldshore-ai.pages.dev` (or the active status worker/pages origin)
   - **Proxy status:** `Proxied`
3. Save the record.

## 2) Verify route is accepted by gateway worker

The gateway worker includes a production route for the status hostname:
- `status.goldshore.ai/*`

This ensures traffic can be served by Worker routing after DNS resolves.

## 3) Validate externally

```bash
nslookup status.goldshore.ai
curl -I https://status.goldshore.ai
```

Expected:
- `nslookup` returns Cloudflare edge IPs.
- `curl` returns an HTTP response (not name resolution failure).

## 4) Optional queue handshake validation

If queue connectivity also needs validation:

1. Open log streams for both workers (`gs-gateway` and `gs-api`).
2. Hit `https://gw.goldshore.ai/test/handshake`.
3. Confirm logs:
   - Gateway: dispatch log for `JOBS_QUEUE.send(...)`
   - API: `[queue] Received ...` and processed message logs.

