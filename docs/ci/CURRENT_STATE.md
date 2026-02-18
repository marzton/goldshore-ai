# Stabilization Sync Check Report

**Date:** Wed Feb 18 20:46:34 UTC 2026
**Status:** COMPLETE (With Repairs)

## 1. Governance Compliance Check

### Violations Detected:
- **Directory Structure:**
  - Found unexpected directory: `apps/jules-bot`
  - Found unexpected directory: `apps/legacy`
  - *Requirement:* Apps directory must only contain: gs-web, gs-admin, gs-api, gs-mail, gs-gateway, gs-agent, gs-control.

- **Root package.json:**
  - **REPAIRED:** Fixed duplicate keys in `scripts` and `devDependencies`.
  - **REPAIRED:** Merged `scripts` into single block.

- **Workflow Naming:**
  - Found legacy workflows alongside standard ones: `deploy-web.yml`, `deploy-admin.yml`, etc. vs `deploy-gs-web.yml`.
  - *Action Required:* Delete legacy workflows (Out of scope for this task).

## 2. Branch Discipline Check
- *Note:* Unable to verify git branch graph in this environment.

## 3. CI State Snapshot

All core applications are now building successfully after app-level repairs.

| App | Status | Notes |
|---|---|---|
| **gs-web** | ✅ PASS | Repaired `astro.config.mjs` (syntax error), `src/pages/index.astro` (concatenation error), and fixed CSS imports. |
| **gs-admin** | ✅ PASS | Repaired `src/pages/index.astro` (frontmatter error), `src/lib/cloudflare.ts` (syntax error), and fixed layout imports. |
| **gs-api** | ✅ PASS | No issues found. |
| **gs-mail** | ✅ PASS | No issues found. |

### Repairs Performed:
- **Root:** Fixed `package.json` duplicates to enable `pnpm install`.
- **Apps:** Fixed imports for `@goldshore/theme` to align with package exports (removed `.css` extension, used package root).
- **Config:** Removed manual aliases in `gs-admin/astro.config.mjs` to rely on workspace resolution.

## 4. Recommendations
- Delete `apps/jules-bot` and `apps/legacy`.
- Delete legacy workflows in `.github/workflows`.
- Enforce strict JSON validation for `package.json` in CI.
