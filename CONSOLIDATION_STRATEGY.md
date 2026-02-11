# GoldShore Monorepo Consolidation Strategy

This document outlines the strategy to consolidate the various branches within the repository, merge redundant or overlapping branches, and streamline the codebase to meet the project's goals and standards.

## 1. Branch Analysis & Inventory

The repository currently has several active branches with significant divergence. The key branches identified are:

*   **`main`**: The current production baseline.
*   **`feat/repo-audit-and-restructure`**: A comprehensive restructuring of the monorepo, implementing the desired "v3" structure. This branch appears to be the most advanced and correct representation of the target state.
*   **`feat/unified-monorepo-v3-1`**: Likely a predecessor or parallel effort to `repo-audit-and-restructure`.
*   **`feat/admin-app-scaffold`**: Contains specific admin app features.
*   **`feat/module-*`**: Various module-specific feature branches.
*   **`codex/*`**: Automated fix branches.

### Decision
**`feat/repo-audit-and-restructure` will be treated as the "Target State" source of truth.** We will aim to bring `main` to this state, while ensuring we don't lose unique value from `feat/unified-monorepo-v3-1` or `feat/admin-app-scaffold`.

## 2. Consolidation Workflow

We will adopt a "Rebase and Merge" strategy to maintain a clean history where possible, but given the scale of restructuring, a "Squash and Merge" into `main` (or a `release/v3`) might be cleaner.

**Phase 1: Stabilization of Target Branch**
1.  Checkout `feat/repo-audit-and-restructure`.
2.  Merge `main` into it to resolve any immediate conflicts with recent production hotfixes.
3.  Audit `feat/unified-monorepo-v3-1` and cherry-pick any non-duplicate commits that provide unique value (e.g., specific UI components or config tweaks).
4.  Delete `feat/unified-monorepo-v3-1` once its value is preserved.

**Phase 2: Feature Integration**
1.  Rebase `feat/admin-app-scaffold` onto the updated `feat/repo-audit-and-restructure`.
2.  Resolve conflicts in `apps/admin` (likely in `astro.config.mjs` and layout files).
3.  Merge `feat/admin-app-scaffold` into `feat/repo-audit-and-restructure`.

**Phase 3: Standardization & Cleanup**
1.  **Dependency Alignment**: Ensure all workspaces (`apps/*`, `packages/*`) use the same version of shared dependencies:
    *   `astro`: `^5.17.1` (Unified)
    *   `wrangler`: `^3.x` (or `4.x` if ready, but consistently)
    *   `typescript`: `^5.x`
2.  **Configuration**:
    *   Verify `tsconfig.json` path aliases (`@schema/*`, `@goldshore/*`).
    *   Ensure `astro.config.mjs` uses the shared `@goldshore/config` package.
3.  **File Cleanup**:
    *   Remove all `*.legacy-*` files.
    *   Remove unused `apps/legacy` folder if present.
    *   Ensure `packages/ui` is a valid Astro component library (no empty `.tsx` files).

**Phase 4: Final Merge to Main**
1.  Create a Pull Request from `feat/repo-audit-and-restructure` to `main`.
2.  Run full CI/CD suite (Build, Lint, Test).
3.  Merge and Delete the feature branch.

## 3. Component & Standards Alignment

### Naming Conventions
*   **Packages**: `@goldshore/<name>` (e.g., `@goldshore/ui`, `@goldshore/auth`).
*   **Apps**: `@goldshore/<app-name>` (e.g., `@goldshore/web`, `@goldshore/admin`) or `astro-gs-<app-name>`. *Decision: Use `@goldshore/<app-name>` for consistency.*

### Project Structure
```
/
├── apps/
│   ├── web/ (Astro - Public Site)
│   ├── admin/ (Astro - Admin Dashboard)
│   ├── api-worker/ (Cloudflare Worker - API)
│   ├── gateway/ (Cloudflare Worker - Gateway)
│   └── control-worker/ (Cloudflare Worker - Ops)
├── packages/
│   ├── ui/ (Astro UI Components)
│   ├── config/ (Shared Configs)
│   ├── auth/ (Auth Logic)
│   ├── theme/ (CSS & Design Tokens)
│   └── schema/ (Shared Types/Zod)
└── infra/ (Terraform/OpenTofu/Scripts)
```

### Documentation
*   Update `README.md` to reflect the new structure.
*   Update `AGENTS.md` with new specific instructions for the v3 monorepo.
*   Ensure `.jules` and `.codex` configuration files (if used for agent context) are updated.

## 4. Execution Plan (Immediate Next Steps)

1.  **Checkout & Update**: Switch to `feat/repo-audit-and-restructure` and pull latest.
2.  **Cherry-Pick**: bringing in the fixes from `jules-9183743878781934224-efe07b9b` (the branch I just fixed conflicts on) into this restructuring branch.
3.  **Refactor**: Apply the `packages/config` refactor to `apps/web` and `apps/admin` in this branch.
4.  **Verify**: Run `pnpm install` and `pnpm build` for all apps.

## 5. Deployment & Testing
*   **CI/CD**: Update `.github/workflows` to target the new paths and package names.
*   **Cloudflare**: Ensure `wrangler.toml` files are using the correct account IDs and binding names (consolidating `env.preview` redundancy).

---
*Created by Jules*
