# GoldShore Admin (Astro)

Secure operational console for GoldShore teams.

## Goals

- Keep **navigation, menus, and layout shell** in `AdminLayout`.
- Keep **dashboard modules** (tables, cards, charts) as reusable components.
- Ensure templates make it easy to extend operations, staffing, and workflow views.

## Template Page

Use the admin template to scaffold new operational modules:

- `src/pages/templates/index.astro`

The template demonstrates:

- Layout shell with sidebar + topbar.
- Stats cards for KPI summaries.
- Table patterns for logs, runs, and staffing.

## Key Layouts + Components

- `src/layouts/AdminLayout.astro`: Admin shell (sidebar + topbar).
- `src/components/Sidebar.astro`: Navigation tree.
- `src/components/Topbar.astro`: Global actions + page title.
- `src/components/StatCard.astro`: KPI tiles.
- `src/components/Table.astro`: Structured tabular data.

## Operations + HITL Guidance

- Track PRs, issues, and workflows in admin table views.
- Pair with gateway + agent template endpoints for real-time status.
- Plan future staffing dashboards for human-in-the-loop approvals.

## Development

```bash
pnpm --filter @goldshore/admin dev
```
