---
name: Audit - Missing required template files
about: Track missing required files per app/package template
title: "[Audit][Missing Template Files] "
labels: ["audit", "repo-hygiene", "missing-files"]
assignees: ["marzton"]
---

## Audit category
Missing required files per app/package template

## Report context
- Report date:
- Report file: `reports/repo-audit.json`
- Target app/package:

## Missing required files
List missing files exactly as reported.

## Remediation checklist
- [ ] Add missing file(s)
- [ ] Validate file content aligns with template conventions
- [ ] Re-run `node scripts/repo-audit.mjs`

## Definition of done
- [ ] Missing required file count is reduced in `reports/repo-audit-summary.md`
- [ ] No regression introduced in CI audit check
