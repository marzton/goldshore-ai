# Stabilization Kanban

## 1. Purpose
This kanban defines canonical work states and policy for Wave 1–7 stabilization execution.

## 2. Board Columns
1. Backlog
2. Ready
3. In Progress
4. In Review
5. Blocked
6. Done

## 3. Card Template (Required Fields)
- Title
- Wave (1–7)
- Control class (Build/Test/Quality/Security/Compliance/Release Readiness)
- Repository or scope
- Owner
- Due date
- Dependencies
- Risk level
- Links to PRs/issues/dashboards

## 4. Work Intake Policy
- New cards must map to a specific wave outcome.
- Each card must include measurable success criteria.
- Dependencies must be declared before moving to Ready.

### Exit Criteria
- 100% of Ready cards have owner, due date, and measurable acceptance criteria.

### Non-Goals
- No intake of tasks without wave alignment.
- No hidden work outside board visibility.

### Operational Rule
- If a card cannot state measurable acceptance criteria, it remains in Backlog.

## 5. WIP Limits
- In Progress: max 2 cards per owner.
- In Review: max 1 queued review card per owner.
- Blocked: no limit, but blocker reason is mandatory.

### Exit Criteria
- WIP limit violations are resolved within one working day.

### Non-Goals
- No unlimited multitasking for critical-path owners.
- No silent overflow of review queues.

### Operational Rule
- Cards exceeding WIP limits must be deprioritized or reassigned before new work starts.

## 6. Definition of Done
- Implementation merged with required checks passing.
- Documentation updated where policy/process changed.
- Metrics or evidence links attached to card.
- Follow-up tasks created for deferred scope.

### Exit Criteria
- Done cards include evidence links proving control behavior in target repositories.

### Non-Goals
- No “Done” status without merged artifacts.
- No “Done” status based only on verbal confirmation.

### Operational Rule
- A card may move to Done only after evidence links are present and review is complete.

## 7. Blocker Management
- Blocked cards must include blocker type: dependency, environment, ownership, policy, or incident.
- Blocker owner and unblock ETA are required.
- Cards blocked more than five business days require escalation.

### Exit Criteria
- Aged blockers are escalated and tracked with remediation actions.

### Non-Goals
- No indefinite blocked state without escalation.
- No blocker records missing accountable owner.

### Operational Rule
- Every blocker update must include next action and target date.

## 8. Governance Cadence
- Daily: board triage and unblock review.
- Weekly: wave progress review and KPI refresh.
- Monthly: exception aging and dependency risk review.
- Quarterly: roadmap rebaseline and control maturity assessment.

## 9. KPI Tracking
- Throughput by wave.
- Lead time from Ready to Done.
- Blocked-time percentage.
- Reopen rate from In Review to In Progress.
- Exception aging for enforcement-related cards.
