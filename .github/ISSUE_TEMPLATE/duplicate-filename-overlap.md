---
name: Audit - Duplicate filename overlap
about: Track cleanup for duplicate filenames with overlapping purpose
title: "[Audit][Duplicate Filenames] "
labels: ["audit", "repo-hygiene", "duplicate-filenames"]
assignees: ["marzton"]
---

## Audit category
Duplicate filenames with overlapping purpose

## Report context
- Report date:
- Report file: `reports/repo-audit.json`
- Duplicate key(s):

## Affected files
List all colliding paths and any owner context.

## Proposed cleanup
- [ ] Remove stale copy
- [ ] Consolidate implementation
- [ ] Add naming convention follow-up (if needed)

## Definition of done
- [ ] Duplicate filename overlap count is reduced in `reports/repo-audit-summary.md`
- [ ] No regression introduced in CI audit check
