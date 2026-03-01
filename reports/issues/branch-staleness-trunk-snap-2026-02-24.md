# Branch staleness + trunk snap analysis (2026-02-24)

## Scope
This note audits open PR heads against `main` to determine whether the current conflict-resolution branch should be merged as-is, or replaced by a trunk-snap strategy.

## Findings

### 1) Current branch is **not** crucial to conflict resolution as a broad merge artifact
- Local commit `0455c18` introduces a large mixed-scope payload (`68 files changed, 1700 insertions, 403 deletions`) on top of prior admin fixes.
- That payload includes workflow normalization, asset swaps, docs drops/additions, and legacy tree edits that are not required to fix the original admin syntax/type issues.
- Conclusion: this branch should **not** be treated as the canonical conflict-resolution branch for trunk. Instead, trunk should absorb only minimal, scoped fixes (or a clean rebase/cherry-pick set).

### 2) Open PR heads are significantly stale vs `main`
Snapshot from GitHub API compare (`main...<head>`):

| PR | Head branch | Ahead | Behind | Updated (days) |
|---|---|---:|---:|---:|
| #2232 | `codex/add-parallax-hero-and-reusable-modal-2026-02-24` | 2 | 344 | 0 |
| #2215 | `chore-stabilization-sync-workflow-3861745990896073767` | 2 | 192 | 0 |
| #1954 | `codex/fix-high-priority-issues-from-codex-review-2026-02-20` | 15 | 896 | 0-2 |
| #1943 | `codex/fix-high-priority-bugs-from-codex-review-2026-02-22` | 14 | 896 | 0-2 |
| #1904 | `codex/update-package.json-name-and-audit-labels-2026-02-17` | 1 | 1281 | 0-2 |
| #1871 | `codex/extract-workflow-data-from-yaml-files-2026-02-18` | 3 | 888 | 0-2 |
| #1869 | `codex/fix-high-priority-codex-review-issues-2026-02-19` | 7 | 896 | 0-2 |
| #1868 | `codex/fix-high-priority-bugs-in-workflows-2026-02-19` | 4 | 896 | 0-2 |
| #1852 | `stabilization-sync-check-949597410874134791` | 8 | 902 | 0 |
| #1834 | `docs/stabilization-phase-0-audit-14574631564636513869` | 16 | 896 | 0-2 |

Interpretation:
- All open PR heads are behind `main` by **192 to 1281** commits.
- Several branches are “small ahead, massively behind”, which is a high-risk shape for broad conflict merges.

## Recommended trunk snap order
1. **Snap smallest/highest-signal PRs first** (`ahead <= 3`): #2232, #2215, #1904, #1871.
2. For heavily stale branches (`behind ~900+`), do a **fresh trunk branch** and cherry-pick only validated fix commits.
3. Avoid one-shot conflict megamerges for #1954/#1943/#1869/#1868/#1834; instead split into topical PRs:
   - admin syntax/type fixes,
   - workflow naming/guard rails,
   - docs-only updates.
4. Close superseded PRs once equivalent minimal commits land on trunk.

## Operational checklist for each stale PR
- Rebase or cherry-pick onto latest `main`.
- Run package/app-local builds/tests only for touched scopes.
- Ensure diff scope matches PR intent (no cross-domain spillover).
- Request review with: `@Jules-Bot [review-request]` including stale-base delta and conflict notes.
