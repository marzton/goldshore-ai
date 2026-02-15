# Stabilization Roadmap (Wave 1–7)

## 1. Purpose
This document defines the canonical Wave 1–7 stabilization sequence used to harden delivery quality, release confidence, and operational safety.

## 2. Operating Model
Each wave is time-boxed and exits only when all required controls are in place and measurable.

---

## 3. Wave 1 — Baseline Visibility and Safety Rails
### Scope
- Establish baseline build/test signal coverage for all active repositories.
- Define critical-path ownership and escalation paths.
- Capture current policy drift across CI and branch protections.

### Deliverables
- Canonical inventory of required checks per repository.
- Single source of truth for branch protection intent.
- Initial dashboard for pass/fail and flaky-check rates.

### Exit Criteria
- 100% of active repositories mapped to owners and required checks.
- Baseline CI pass rate and flaky rate measured for two consecutive weeks.
- Branch protection policy drift report generated and reviewed.

### Non-Goals
- No blocking policy enforcement yet.
- No large-scale test rewrites.
- No migration of existing pipeline platforms.

### Operational Rule
- Changes improving observability may merge with lightweight review if they do not reduce existing protections.

---

## 4. Wave 2 — Required Check Standardization
### Scope
- Normalize naming and semantics for required checks.
- Remove ambiguous or duplicate status checks.
- Introduce required check classes (build, test, quality, security).

### Deliverables
- Canonical required-check matrix applied to default branches.
- Repository-level mapping from old check names to canonical names.
- Documentation for check ownership and expected runtimes.

### Exit Criteria
- All protected branches reference canonical required check names.
- Duplicate/legacy checks removed from required lists.
- Required checks complete within agreed runtime SLO for 95th percentile.

### Non-Goals
- No strict merge queue rollout yet.
- No mandatory deployment gates for non-production environments.
- No cross-repo monolithic pipeline consolidation.

### Operational Rule
- New required checks must be declared in the CI enforcement matrix before being enabled on protected branches.

---

## 5. Wave 3 — Branch Protection Hardening
### Scope
- Enforce pull-request-based merging on protected branches.
- Require up-to-date branches and linear-history-compatible merge strategy.
- Enforce CODEOWNERS and review minimums.

### Deliverables
- Organization-standard branch protection configuration.
- Exception process with time-bound approvals and audit trail.
- Automated drift detection against protection baseline.

### Exit Criteria
- 100% of protected branches require PRs and required checks.
- Review minimums and CODEOWNERS enforced for all critical paths.
- Drift alerts active and routed to repository owners.

### Non-Goals
- No complete freeze on administrator overrides.
- No elimination of emergency hotfix path.
- No requirement that every repo adopt identical workflow tooling.

### Operational Rule
- Any temporary branch protection exception must include an owner, expiration date, and rollback plan.

---

## 6. Wave 4 — Merge Queue and Concurrency Control
### Scope
- Introduce merge queue for high-churn protected branches.
- Enforce deterministic queue entry criteria and batched validation policy.
- Limit concurrent merges to reduce integration risk.

### Deliverables
- Merge queue policy by repository tier.
- Queue observability: wait time, dequeue reasons, revalidation rate.
- Playbook for queue incidents and queue bypass governance.

### Exit Criteria
- Merge queue enabled on all designated high-churn branches.
- Queue success rate and median wait time meet published targets.
- Untracked direct merges to queued branches reduced to zero.

### Non-Goals
- No queue requirement for low-risk archival repositories.
- No global single queue across unrelated repositories.
- No manual queue management as the default steady-state process.

### Operational Rule
- Queue bypass may be used only for incident response and must trigger post-incident review.

---

## 7. Wave 5 — Quality and Security Gate Tightening
### Scope
- Raise minimum test and quality thresholds for protected merges.
- Enforce security scanning gates at PR time and pre-release time.
- Introduce risk-based differential policies for critical services.

### Deliverables
- Threshold policy for unit/integration coverage deltas.
- Security gate taxonomy (blocker, warn, informational).
- Exception registry for temporary suppressions.

### Exit Criteria
- Quality thresholds enforced on all Tier-1 and Tier-2 repositories.
- Blocker-level security findings prevent merge unless exceptioned.
- Exception registry reviewed on a recurring governance cadence.

### Non-Goals
- No attempt to achieve perfect static-analysis signal quality before enforcement.
- No one-size-fits-all thresholds across all repo types.
- No retroactive blocking on historic findings without triage.

### Operational Rule
- Every active suppression must have a ticket, owner, and expiration date.

---

## 8. Wave 6 — Release Reliability and Operational Readiness
### Scope
- Align CI gates with release readiness controls.
- Enforce release artifact provenance and reproducibility checks.
- Standardize rollback validation for production-impacting systems.

### Deliverables
- Release-readiness checklist integrated into CI/CD workflow.
- Signed artifact and provenance verification policy.
- Rollback drill cadence and evidence capture requirements.

### Exit Criteria
- Production release pipelines enforce provenance verification.
- Rollback procedures tested and documented for all critical services.
- Release-blocking incidents show measurable reduction trend.

### Non-Goals
- No mandatory full blue/green adoption across every service.
- No replacement of all existing release tooling.
- No elimination of controlled manual approvals where required.

### Operational Rule
- A release is not considered eligible until rollback evidence is current and linked.

---

## 9. Wave 7 — Continuous Governance and Auditability
### Scope
- Operationalize long-term governance of checks, protections, and exceptions.
- Implement recurring audits for policy drift and control efficacy.
- Tie stabilization outcomes to service-level reliability metrics.

### Deliverables
- Governance calendar with quarterly audit checkpoints.
- KPI set for policy compliance, exception burn-down, and stability outcomes.
- Executive-ready scorecard for ongoing enforcement health.

### Exit Criteria
- Quarterly audits executed with tracked remediation closure.
- Policy compliance sustained above target threshold across protected repos.
- Exception volume and aging trend downward over two consecutive quarters.

### Non-Goals
- No governance process that blocks urgent production safety work.
- No purely manual audit workflow without automation support.
- No static policy set that cannot evolve with platform needs.

### Operational Rule
- Governance changes must be versioned, announced, and accompanied by an effective date.

---

## 10. Dependency Order
1. Wave 1 must complete before enforcing Wave 2 controls.
2. Wave 2 and Wave 3 must complete before broad Wave 4 rollout.
3. Wave 5–7 depend on stable Wave 4 queue behavior and measurable signal quality.

## 11. Success Measures
- Lower change-failure rate on protected branches.
- Reduced mean time to detect and prevent unsafe merges.
- Sustained decrease in policy drift and exception aging.
