# Consolidation PR Matrix

This matrix defines the required quality gates for consolidation pull requests before merge.

## Required gates

| Gate | Required | Root command | Purpose |
| --- | --- | --- | --- |
| Typecheck | Yes | `pnpm gate:typecheck` | Validates TypeScript/Astro type safety across deployable apps and shared packages. |
| Lint | Yes | `pnpm gate:lint` | Enforces formatting and static lint quality standards. |
| Unit tests | Yes | `pnpm gate:test:unit` | Verifies package-level and worker route test coverage. |
| Integration/API tests | Yes | `pnpm gate:test:integration` | Validates API and service integration behavior for core worker surfaces. |
| Worker config validation | Yes | `pnpm gate:validate:workers` | Ensures all tracked `wrangler.toml` files are parseable and contain required keys. |
| UI visual regression | Conditional (UI-affecting changes) | `pnpm gate:test:visual` | Runs browser regression checks when UI files are touched. |

## Merge policy

Consolidation PRs (title, branch name, body, or labels containing `consolidation`) must pass all required gates.

The visual regression gate is mandatory when the PR touches web/admin UI files (`.astro`, `.tsx`, `.ts`, `.css`, image assets) under `apps/gs-web` or `apps/gs-admin`.

## Local one-shot execution

Run all gates in sequence:

```bash
pnpm gate:matrix
```

## Related automation

- PR enforcement: `.github/workflows/consolidation-matrix.yml`
- Post-merge smoke validation: `.github/workflows/post-merge-smoke.yml`
- Rollback procedure: `docs/testing/consolidation-rollback-playbook.md`
