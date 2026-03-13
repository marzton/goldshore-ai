# Main Branch Success Plan (PR Conflict Review)

**Date:** 2026-03-12  
**Scope:** Review of currently open pull requests plus recent closed pull requests to build a conflict-reduction plan for `main`.

## Snapshot Findings

### Open PR conflict posture

- Open PRs reviewed: **62**.
- Open PRs with `mergeable_state=dirty`: **61**.
- Open PRs not currently marked dirty: **1** (`#3268`, `mergeable_state=unstable`).
- Most open PRs target `main`; at least one PR targets a non-main integration branch (`#3141`).

### Recent closed PR posture

- Recent closed PRs sampled: **100**.
- Closed PRs not merged: **8**.
- For those unmerged PRs, GitHub currently reports `mergeable_state=unknown` (expected for closed PRs, so conflict status is not directly actionable post-close).

## What this implies

1. **Current open-PR backlog is conflict-saturated.**
   The `main` integration surface is effectively blocked by stale or overlapping branches.
2. **Closed PRs are a weaker source for direct conflict diagnosis.**
   Once closed, mergeability often becomes `unknown`, so planning should prioritize active open PRs.
3. **Batch integration is required.**
   Point-by-point manual merges will likely churn without a staged conflict-burn-down.

## Execution Plan for a successful `main`

### Phase 1: Triage and prune

1. Freeze new non-critical PR merges for one cycle.
2. Partition open PRs into:
   - **Keep now** (business-critical, active in last 72h)
   - **Rebase-required** (valuable but stale)
   - **Close/defer** (duplicate or superseded work)
3. Close duplicate PR chains first to reduce branch fan-out.

### Phase 2: Deterministic rebase wave

1. For each kept PR, force rebase on latest `main` per SOP-001.
2. Apply deterministic conflict policy for high-churn files (`README.md`, `pnpm-lock.yaml`, `CURRENT_MONOREPO_STATE.md`) per SOP-003.
3. Require green CI before re-requesting review.

### Phase 3: Merge queue and risk ordering

1. Merge in this order:
   - docs/config-only PRs
   - isolated app PRs (`apps/*` narrow scope)
   - cross-app and infra-touching PRs
2. Limit queue to 2-3 PRs at a time to reduce rebase drift.
3. Re-run merge audit (`scripts/merge-audit.sh`) between batches.

### Phase 4: Governance stabilization

1. Enforce branch freshness threshold (e.g., rebased within 24h of merge).
2. Auto-label stale PRs and trigger periodic conflict audit output.
3. Track success metric: decreasing `mergeable_state=dirty` count week over week.

## Suggested operational targets

- Reduce dirty open PRs from 61 to **<20** in first triage cycle.
- Reach **0 dirty PRs** in active merge queue before any large cross-cutting merge.
- Maintain `main` green status for 48h after burn-down.

## Data source note

This plan is based on a live GitHub API snapshot from 2026-03-12 and should be refreshed before execution.
