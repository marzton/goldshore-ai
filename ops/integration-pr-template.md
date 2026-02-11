# Integration PR: conflict-resolution baseline

## Issue context (required)
- Related issue/ticket: `<link-or-id>`
- Problem statement: `<what failed or what conflict is being resolved>`
- Why this change now: `<release/deploy/blocker context>`

## Summary
- Base: `<base-commit-sha>`
- Integration branch: `<integration-branch>`
- Merge window: `<start-date>` → `<end-date>`

## Merged branches (ordered)
| Branch | Score | Merge status | Notes |
| --- | --- | --- | --- |
| `<branch>` | `<score>` | clean/conflict | `<notes>` |

## Conflict resolutions
- `<file>`: `<decision and rationale>`

## Regenerated artifacts
- `pnpm-lock.yaml`: regenerated after merging `<branch list>`

## Checks
- `pnpm -w install`
- `pnpm -w -s build`
- `pnpm -w -s lint`
- `pnpm -w -s typecheck`
- `pnpm -w -s test`
- Optional: `pnpm --filter=@goldshore/web build`
- Optional: `pnpm e2e`

## Review tags (required when applicable)
Select one when asking Jules for deeper review:
- @Jules-Bot [review-request]
- @Jules-Bot [error-analysis]
- @Jules-Bot [issue-repro]

## Notes
- `<additional context, links, or logs>`
