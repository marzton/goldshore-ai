# Platform Consolidation & Rollout Tracking Epic

## Epic Summary

- **Epic title:** `Platform Consolidation: Policy, Automation Hardening, Structural Cleanup, and Rollout Validation`
- **Objective:** Deliver a controlled repository and platform consolidation across process, CI/CD automation, architecture, and release governance.
- **Owner:** Platform Engineering
- **Program duration:** 4 phases (sequenced, with overlap only where dependencies are complete)
- **Status cadence:** Weekly updates every Friday

## Scope and Success Criteria

### In Scope

1. Inventory and policy documentation updates across branches, naming conventions, ownership, Cloudflare, and testing.
2. Automation hardening for workflow reference validation, branch cleanup automation, and recurring audit scripts.
3. Structural consolidation of packages, routes, workers, theme systems, and CSS deduplication.
4. Validation and rollout through a full test matrix, staged deployment strategy, and post-release audit.

### Success Criteria

- Current-state and target-state policy docs are merged and discoverable.
- CI fails on invalid workflow references and policy drift.
- Stale branches and obsolete refs are cleaned on a scheduled cadence.
- Duplicate theme/CSS and route/package overlap are reduced with documented ownership boundaries.
- Full matrix tests pass before production promotion.
- Post-release audit completes with no untriaged P0/P1 regressions.

---

## Sub-Issue Breakdown by Phase

> Create one issue per phase and link each to this epic.

### Issue 1 — Phase 1: Inventory and Policy Docs

- **Suggested title:** `Phase 1: Repository Inventory + Policy Baseline (Branches, Naming, Ownership, Cloudflare, Testing)`
- **Suggested labels:** `epic-subtask`, `documentation`, `governance`, `phase-1`
- **Description:**
  - Produce/update docs for:
    - branch lifecycle policy (creation, merge, archival, deletion)
    - naming conventions (apps/packages/routes/workers)
    - ownership map (teams + CODEOWNERS alignment)
    - Cloudflare environment and deployment policy
    - testing policy (unit/integration/e2e/security gates)
  - Add a policy index page pointing to all authoritative docs.
- **Definition of done:**
  - Docs are merged.
  - Ownership and naming ambiguity is resolved or tracked as explicit follow-up actions.
  - Phase handoff checklist for automation hardening is complete.

### Issue 2 — Phase 2: Automation Hardening

- **Suggested title:** `Phase 2: CI/CD Automation Hardening (Workflow Validation, Branch Cleanup, Audits)`
- **Suggested labels:** `epic-subtask`, `ci-cd`, `automation`, `phase-2`
- **Description:**
  - Implement workflow reference validation in CI (broken `uses`, invalid local action paths, orphan workflow calls).
  - Add guarded branch cleanup automation (safe-delete merged/stale branches with allowlist/denylist controls).
  - Add or upgrade audit scripts (branch drift, workflow hygiene, policy compliance).
  - Schedule recurring automation checks (nightly/weekly as appropriate).
- **Definition of done:**
  - CI blocks invalid workflow references.
  - Branch cleanup automation runs in dry-run + enforce modes.
  - Audit scripts emit actionable reports stored as build artifacts.

### Issue 3 — Phase 3: Structural Consolidation

- **Suggested title:** `Phase 3: Monorepo Structural Consolidation (Packages, Routes, Workers, Theme, CSS Dedupe)`
- **Suggested labels:** `epic-subtask`, `architecture`, `refactor`, `phase-3`
- **Description:**
  - Consolidate duplicate/overlapping packages and route definitions.
  - Rationalize worker boundaries and naming.
  - Centralize theme tokens and reduce CSS duplication.
  - Remove dead/legacy paths and add migration notes where needed.
- **Definition of done:**
  - New structure documented and adopted.
  - Critical routes/workers mapped to owners.
  - CSS/theme duplication reduced with measurable before/after metrics.

### Issue 4 — Phase 4: Validation and Rollout

- **Suggested title:** `Phase 4: End-to-End Validation, Staged Deploys, and Post-Release Audit`
- **Suggested labels:** `epic-subtask`, `release`, `quality`, `phase-4`
- **Description:**
  - Run complete test matrix (unit, integration, e2e, security/compliance checks).
  - Execute staged rollout (dev → preview/staging → production) with explicit promotion gates.
  - Perform post-release audit covering reliability, observability, and policy compliance.
- **Definition of done:**
  - Full matrix is green for release candidates.
  - Staged deploy checklist and rollback plan validated.
  - Post-release report published with owners and due dates for residual follow-ups.

---

## Weekly Status Update Template

Use this in the epic comment thread every Friday.

```md
## Weekly Status — YYYY-MM-DD

### Overall
- RAG status: 🟢 / 🟡 / 🔴
- Current phase: Phase X
- Confidence for next milestone: High / Medium / Low

### Delivered This Week
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

### In Progress
- [ ] Item 1 (owner, ETA)
- [ ] Item 2 (owner, ETA)

### Risks / Blockers
- [ ] Risk 1 (impact, mitigation, owner)
- [ ] Risk 2 (impact, mitigation, owner)

### Metrics Snapshot
- Workflow validation failures: N
- Stale branches pending cleanup: N
- Duplicate CSS selectors/components remaining: N
- Test matrix pass rate: N%

### Next Week Plan
- [ ] Priority 1
- [ ] Priority 2
- [ ] Priority 3
```

## Suggested Epic Description for Issue Tracker

```md
This tracking epic coordinates a four-phase platform consolidation and rollout program:

1. Phase 1 — Inventory and policy docs (branches, naming, ownership, Cloudflare, testing)
2. Phase 2 — Automation hardening (workflow reference validation, branch cleanup, audit scripts)
3. Phase 3 — Structural consolidation (packages/routes/workers/theme/CSS dedupe)
4. Phase 4 — Validation and rollout (full test matrix, staged deploys, post-release audit)

Sub-issues are linked for each phase. Weekly updates are posted every Friday using the status template in this epic.

@Jules-Bot [review-request]
```
