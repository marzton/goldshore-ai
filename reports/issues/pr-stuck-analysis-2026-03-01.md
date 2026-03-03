# PR stuck analysis (2026-03-01)

## Target PR
- **#2298** `Normalize CI/workflows, add stabilization & verification scripts, and refresh frontend assets`
- Base: `codex/fix-high-priority-bugs-from-codex-review-2026-02-20`
- Head: `codex/github-mention-codex/fix-high-priority-bugs-from-codex-revi-2026-03-01`

## Why it is stuck
1. **Merge conflicts are present**
   - GitHub marks #2298 as `mergeable=false`, `mergeable_state=dirty`.
   - This means the PR cannot be merged without conflict resolution.

2. **The base branch itself is not trunk (`main`)**
   - #2298 targets another feature/fix branch, not `main`.
   - Its base-PR chain appears to be:
     - #2298 (base = `codex/fix-high-priority-bugs-from-codex-review-2026-02-20`)
     - #1943 (base = `main`)
   - If #1943 is stale or conflicted, #2298 inherits that instability.

3. **Upstream branch stack is stale and conflicted**
   - #2299 (same head as #2298 but against `main`) is also `mergeable_state=dirty`.
   - Older related PRs in this stack (#1943, #1954) are still open and substantially behind `main` in prior audits.

4. **No successful status contexts are attached**
   - For #2298/#2299 and related heads, commit status is `pending` with `0` contexts reported.
   - With no completed CI signals plus dirty merge state, maintainers cannot safely merge.

## Open PRs checked during triage
- #2298, #2299, #2232, #2215, #1954, #1943, #1904, #1871, #1869, #1868, #1852, #1834.

## Recommended unstick plan
1. Rebase/cherry-pick intended minimal fix commits onto fresh `main`.
2. Open a new single-purpose PR directly to `main` (avoid branch-on-branch dependency).
3. Resolve conflicts in the old stacked PRs only if any unique commits remain.
4. Close superseded stacked PRs once the minimal `main` PR lands.
5. Request focused review with `@Jules-Bot [review-request]` including conflict notes + exact commit list.
