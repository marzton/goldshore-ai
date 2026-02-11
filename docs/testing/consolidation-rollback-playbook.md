# Consolidation Release Rollback Playbook

Use this playbook when a consolidation release passes PR checks but fails after merge/deploy.

## Trigger conditions

Start rollback if any of the following occur:

- Post-merge smoke tests fail for production web/admin/worker targets.
- Error-rate, latency, or availability alerts exceed SLO thresholds.
- Critical workflow regressions are confirmed by support or on-call.

## Immediate actions (first 15 minutes)

1. **Declare incident owner** in the release channel.
2. **Freeze further merges** until rollback or hotfix is complete.
3. **Capture evidence**:
   - failing smoke job URL,
   - impacted endpoint(s),
   - first observed timestamp,
   - relevant logs.

## Rollback paths

### Path A — GitHub Actions redeploy previous commit (preferred)

1. Identify last known good commit on `main`:
   ```bash
   git log --oneline origin/main
   ```
2. Redeploy using workflow dispatch inputs (or rerun deploy workflow pinned to known-good SHA).
3. Verify recovery with:
   ```bash
   pnpm smoke:post-merge
   ```

### Path B — Fast revert commit

Use when workflow-level rollback is unavailable.

1. Revert the consolidation merge commit:
   ```bash
   git revert <merge_commit_sha>
   git push origin HEAD
   ```
2. Monitor deploy workflows to completion.
3. Confirm production recovery via smoke checks and monitoring.

### Path C — Partial rollback (single service)

For isolated failures in one worker/page app:

1. Revert only affected app/config files.
2. Trigger scoped deploy workflow (web/admin/api/gateway/control/agent).
3. Run smoke checks against impacted URL set.

## Verification checklist

- Web and admin pages return expected status codes.
- API/worker health endpoints return 200.
- No active P1/P2 alerts for the rolled-back services.
- `post-merge-smoke` workflow reports success.

## Communication template

- **Status:** rollback in progress / completed
- **Impact:** affected surfaces and user scope
- **Cause (preliminary):** concise hypothesis
- **Next update:** timestamp

## Follow-up (within 24 hours)

1. Open incident review issue.
2. Document root cause and detection gaps.
3. Add or tighten consolidation matrix gate(s) that would have prevented the failure.
4. Re-open consolidation effort as smaller, staged PRs.
