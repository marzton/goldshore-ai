# Cloudflare Apps Runbook

The Infra Agent must follow this procedure when asked to manage
Cloudflare applications (Pages / Workers / KV / R2 / D1 / AI / Queues).

1. Always parse `infra/Cloudflare/desired-state.yaml`.
2. Identify which resource types the user is referring to:
   - "Create a new Pages project" → Pages
   - "Add a KV binding" → Workers + KV
   - "Add a new gateway route" → Worker routes

3. Show a PLAN:
   - List the resources to create/update/delete.
   - Indicate which entries come from desired-state and which are ad-hoc.

4. For creation:
   - Prefer using Cloudflare API endpoints.
   - If user says "show wrangler commands instead", output CLI commands only.

5. For bindings:
   - Create or confirm existence of:
     - KV namespaces
     - R2 buckets
     - D1 databases
   - Then add bindings into corresponding `wrangler.toml`.

6. For Pages projects:
   - Verify that project name matches:
     - `astro-gs-web`
     - `astro-gs-admin`
   - Confirm root directories and branches from desired-state.

7. For Workers:
   - Never overwrite an existing Worker with a different purpose.
   - If a service name conflict exists, STOP and ask for renaming.

8. For AI Gateway:
   - Never print API keys or secrets.
   - Only reference gateway IDs or names.

9. Always output final summary:
   - What changed
   - Any TODOs left for manual steps (e.g. Cloudflare UI-only flows)

10. Worker Builds token policy:

- For `gs-web`, `gs-admin`, and `gs-api`, use the `gs-control` build token in Cloudflare Worker Builds.
- Current repo wrangler files live at:
  - `infra/Cloudflare/gs-web.wrangler.toml`
  - `infra/Cloudflare/gs-admin.wrangler.toml`
  - `infra/Cloudflare/gs-api.wrangler.toml`

## 11. Service Token Sync for AI Agents (gs-global-protect)

When Cloudflare Access protects `gs-admin` and related operator endpoints:

1. In Zero Trust → Access → Service Auth, confirm service token `gs-ai-agent-token` exists.
2. In Access → Applications → `gs-global-protect` → Policies, verify a **Service Auth** policy includes that token.
3. Ensure CI secrets are set:
   - `CF_ACCESS_CLIENT_ID`
   - `CF_ACCESS_CLIENT_SECRET`
4. Validate with:

```bash
scripts/jules-sync.sh https://gs-admin.pages.dev/
```

The command must return an HTTP 2xx status to pass.
The script only sends service-token headers to trusted hosts (`gs-admin.pages.dev`, `admin.goldshore.ai`, `ops.goldshore.ai`).
