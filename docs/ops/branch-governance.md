# Branch Governance Policy

This policy defines allowed branch classes, ownership, and retention windows for the `goldshore-ai` repository.

## Allowed branch classes

| Branch pattern | Purpose | Owner | Retention window |
| --- | --- | --- | --- |
| `main` | Production-ready default branch. | Repository maintainers. | Permanent (never auto-deleted). |
| `release/*` | Time-bound release hardening and cutover branches. | Release manager + service owners. | Until release completion, then delete within 30 days. |
| `hotfix/*` | Emergency production fixes. | On-call engineer + maintainer reviewer. | Delete within 30 days after merge. |
| `feature/*` | Feature development branches. | Individual contributor or assigned feature owner. | Delete within 30 days after merge/closure. |
| `integration/*` | Integration/sweep branches created by merge/rebase automation and conflict triage. | DevOps maintainers and automation owners. | 14 days maximum age. |
| `jules/*` | Bot-generated temporary branches from Jules automation. | Jules automation owners (GitHub automation maintainers). | 7 days maximum age. |

## Owner and lifecycle rules

1. Every non-`main` branch must map to one of the allowed patterns above.
2. The branch creator is accountable for assigning an owner in PR metadata (reviewers, labels, or issue linkage).
3. Automation-created branches (`jules/*`, `integration/*`) are considered disposable and are subject to nightly retention cleanup.
4. Cleanup jobs must verify branch existence on `origin` before any checkout, rebase, merge, archive, or delete action.
5. Branches that exceed retention windows must be archived (summary artifact + optional tag/metadata) and then deleted from `origin`.
