# CI Enforcement Matrix

## 1. Purpose
This matrix defines the canonical enforcement levels, required controls, and promotion criteria used across stabilization waves.

## 2. Enforcement Levels

| Level | Name | Merge Impact | Typical Stage |
|---|---|---|---|
| L0 | Observe | Non-blocking | Wave 1 |
| L1 | Warn | Non-blocking with visible warnings | Wave 1–2 |
| L2 | Soft Block | Blocking for protected branches with exception path | Wave 2–4 |
| L3 | Hard Block | Blocking with tightly governed exception path | Wave 4–7 |

## 3. Control Classes

| Control Class | Description | Canonical Examples |
|---|---|---|
| Build | Compiles/packages artifacts | compile, bundle, container build |
| Test | Functional validation | unit, integration, contract, e2e smoke |
| Quality | Code quality and maintainability | lint, formatting, coverage delta |
| Security | Vulnerability and policy checks | SAST, dependency scan, secret scan |
| Compliance | Governance conformance | license checks, provenance verification |
| Release Readiness | Deploy/rollback readiness | artifact signing, rollback validation |

## 4. Matrix by Wave

| Wave | Minimum Enforcement | Required Control Classes | Notes |
|---|---|---|---|
| Wave 1 | L0/L1 | Build, Test (visibility) | Baseline only; no mandatory blocking |
| Wave 2 | L2 | Build, Test, Quality | Canonical check naming and required list |
| Wave 3 | L2 | Build, Test, Quality, Security | Branch protection hardening |
| Wave 4 | L2/L3 | Build, Test, Quality, Security | Merge queue controls begin |
| Wave 5 | L3 | Build, Test, Quality, Security, Compliance | Gate tightening and exception registry |
| Wave 6 | L3 | All classes + Release Readiness | Provenance and rollback checks enforced |
| Wave 7 | L3 | All classes | Audit-driven continuous governance |

## 5. Required Metadata for Every Enforced Check
- Check owner (team or individual).
- Service-level objective (target runtime and freshness).
- Failure severity mapping (blocker, high, medium, low).
- Run condition (always, path-based, risk-based).
- Exception process link.

## 6. Promotion Criteria (L0 -> L3)

### Exit Criteria
- Promotion to the next enforcement level requires at least two weeks of stable signal quality and documented owner approval.
- Flake rate must remain below the published threshold for the control class.
- Mean runtime must remain within agreed SLO for protected branches.

### Non-Goals
- No promotion based solely on anecdotal confidence.
- No promotion without explicit rollback plan.
- No promotion that introduces unowned required checks.

### Operational Rule
- Any enforcement promotion must be recorded in change history with effective date, approver, and rollback trigger.

## 7. Exception Handling
- Exceptions must be time-bound, ticketed, and owner-assigned.
- Exceptions must include compensating controls when merge blocking is reduced.
- Expired exceptions automatically revert to prior enforced behavior.

### Exit Criteria
- 100% of active exceptions include owner, expiration, and linked remediation ticket.

### Non-Goals
- No indefinite exceptions.
- No undocumented ad hoc bypasses.

### Operational Rule
- Emergency bypass is allowed only for active incident mitigation and requires post-incident review.

## 8. Reporting Cadence
- Weekly: enforcement changes, flake trends, exception aging.
- Monthly: control efficacy review by repository tier.
- Quarterly: policy audit and matrix revision proposals.
