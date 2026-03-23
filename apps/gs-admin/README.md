# GoldShore Admin (`apps/gs-admin`)

Secure operational console for GoldShore teams. The app deploys to Cloudflare Pages, is protected by Cloudflare Access, and uses `GS_CONFIG` as its shared configuration namespace with `apps/gs-control`.

## Goals

- Keep **navigation, menus, and layout shell** in `AdminLayout`.
- Keep **dashboard modules** (tables, cards, charts) as reusable components.
- Ensure templates make it easy to extend operations, staffing, and workflow views.
- Keep shared operational configuration in `GS_CONFIG`; do not split admin-owned config into app-local storage.

## Cloudflare metadata

- Pages project name: `gs-admin` (production), `preview-admin` (preview)
- Pages bindings config: `infra/Cloudflare/gs-admin.wrangler.toml`
- Shared config binding: `GS_CONFIG`
  - Role in `gs-admin`: shared configuration read/write namespace used by admin operational controls and settings
  - Shared with: `apps/gs-control`, which remains the orchestrator for broader system configuration sync
- Connected services for preview builds:
  - `PUBLIC_API=https://api-preview.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`

Documentation:

- [Integrations hub (docs + admin config)](../../docs/integrations.md)
- [Agent integration policy](../../docs/agent-integration.md)

## Template page

Use the admin template to scaffold new operational modules:

- `src/pages/templates/index.astro`

The template demonstrates:

- Layout shell with sidebar + topbar.
- Stats cards for KPI summaries.
- Table patterns for logs, runs, and staffing.

## Key layouts + components

- `src/layouts/AdminLayout.astro`: Admin shell (sidebar + topbar).
- `src/components/Sidebar.astro`: Navigation tree.
- `src/components/Topbar.astro`: Global actions + page title.
- `src/components/StatCard.astro`: KPI tiles.
- `src/components/Table.astro`: Structured tabular data.

## Operations + HITL guidance

- Track PRs, issues, and workflows in admin table views.
- Pair with gateway + agent template endpoints for real-time status.
- Plan future staffing dashboards for human-in-the-loop approvals.
- Reference the [agent integration policy](../../docs/agent-integration.md) for when to use Jules/Agent and required approvals.

## Routes/Endpoints

Routing & access policy: [`docs/security-scope.md`](../../docs/security-scope.md).

Admin sections:

- `/admin/analytics`
- `/admin/monetization`
- `/admin/forms`
- `/admin/media`
- `/admin/page-editor`
- `/admin/pages`
- `/admin/pii-scans`
- `/admin/logs`
- `/admin/settings`
- `/admin/overview`
- `/admin/api-logs`
- `/admin/workers/status`
- `/admin/workers/bindings`
- `/admin/workers/routes`
- `/admin/users/list`
- `/admin/users/sessions`
- `/admin/users/permissions`
- `/admin/system/dns`
- `/admin/system/pages`
- `/admin/system/storage`
- `/admin/system/secrets`

## Shared configuration binding

`GS_CONFIG` is the shared configuration namespace for `apps/gs-admin` and `apps/gs-control`.

- Use `GS_CONFIG` for shared operational settings, toggles, and values that must stay aligned with the control plane.
- Keep `apps/gs-control` as the broader system sync/orchestration owner for canonical config propagation.
- Do not treat `gs-admin` as having an app-local replacement for `GS_CONFIG`; the namespace is intentionally shared.

## Local development

```bash
pnpm install
pnpm --filter ./apps/gs-admin dev
pnpm --filter ./apps/gs-admin build
pnpm --filter ./apps/gs-admin preview
```

## Deploy

- Production deploy: `.github/workflows/deploy-admin.yml`
- Preview deploy: `.github/workflows/preview-admin.yml`
- Domains, previews, and Access policies: see [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).

## Preview authentication

- Preview builds reuse the centralized GitHub App callback handler; OAuth completes in the shared callback service, which redirects back to the preview hostname instead of registering per-branch callbacks.
- Cloudflare Access is enforced by the shared Access application and policy set, with preview hostnames allowlisted alongside production domains.
- See the centralized guide: [`docs/domains-and-auth.md`](../../docs/domains-and-auth.md).
