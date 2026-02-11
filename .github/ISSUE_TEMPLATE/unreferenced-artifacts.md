---
name: Audit - Unreferenced packages/pages/components
about: Track cleanup for unreferenced artifacts detected by repo audit
title: "[Audit][Unreferenced Artifacts] "
labels: ["audit", "repo-hygiene", "unreferenced"]
assignees: ["marzton"]
---

## Audit category
Unreferenced packages/pages/components

## Report context
- Report date:
- Report file: `reports/repo-audit.json`
- Artifact type: (package/page/component)
- Confidence level:

## Candidate artifacts
List candidate files/directories from the report.

## Validation checklist
- [ ] Confirm artifact is truly unused
- [ ] Confirm it is not framework-routed/auto-discovered
- [ ] Confirm there are no external runtime references

## Cleanup plan
- [ ] Remove artifact
- [ ] Wire required references
- [ ] Mark as intentionally retained (document why)

## Definition of done
- [ ] Relevant unreferenced count is reduced in `reports/repo-audit-summary.md`
- [ ] No regression introduced in CI audit check
