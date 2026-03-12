# Open PR Inventory Template

Use this template to capture the state of all open PRs when you cannot directly query GitHub (e.g., `gh` CLI unavailable or the repo has no remote configured). Copy the table into an issue, doc, or pull request description and fill it in manually.

## Instructions

1. Establish the source of truth for PR data:
   - Preferred: `gh pr list --state open --limit 50` followed by `gh pr view <id> --json ...`.
   - Fallback: Browse the GitHub UI and enter details manually if `gh` is not installed or the repo is not connected to a remote.
2. Identify vital files touched by each PR (lockfiles, package manifests, app entry points, infra configs).
3. Record mergeability and risk, then propose a merge order starting with infra/config and high-risk overlaps.
4. Share the filled template with the team and update it as PRs merge or change status.

## Table

| PR # | Title | Head → Base | Mergeable | Vital files / directories | Risk (H/M/L) | Status & required actions | Owner |
| ---- | ----- | ----------- | --------- | ------------------------ | ------------ | ------------------------- | ----- |
|      |       |             |           |                          |              |                           |       |
|      |       |             |           |                          |              |                           |       |
|      |       |             |           |                          |              |                           |       |

## Notes

- Regenerate `pnpm-lock.yaml` instead of hand-editing whenever conflicts arise.
- Highlight overlapping files between PRs to deconflict sequencing.
- Tag `@Jules-Bot` with `[review-request]`, `[error-analysis]`, or `[issue-repro]` when you need automated assistance.
