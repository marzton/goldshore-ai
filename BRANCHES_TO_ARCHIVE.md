# Branches for Archival

## Rationale
These branches are outdated or related to reverted PRs. They should be archived (deleted from remote) to clean up the repository.

## Categories

### Revert Branches (Cleanup)
These are from reverted PRs and are no longer needed:
```
origin/revert-1310-main
origin/revert-1327-codex/update-tsconfig-paths-for-schema-2026-02-11
origin/revert-1351-revert-1310-main
origin/revert-1352-revert-1333-test/verify-access-coverage-5375367365808659514
origin/revert-1357-codex/update-astro-version-in-package.json-files-2026-02-11
origin/revert-1359-revert-1333-test/verify-access-coverage-5375367365808659514
origin/revert-1366-revert-1327-codex/update-tsconfig-paths-for-schema-2026-02-11
```
**Total:** 7 branches  
**Action:** Delete - these are cleanup branches from reverts

### Obsolete Codex/Jules Branches
Branches based on old directory structure (before restructuring):
```
origin/jules-9183743878781934224-efe07b9b
origin/feature/jules-ci-hygiene-3479691766296662358
origin/codex/improve-goldshore.ai-ui-and-ux-clarity-2026-02-06
origin/codex/resolve-branch-conflicts-in-codebase-2026-02-11
origin/codex/review-branch-for-duplicates-and-errors-2026-02-11
origin/codex/update-astro-version-in-package.json-files-2026-02-11
origin/codex/update-tsconfig-paths-for-schema-2026-02-11
```
**Total:** 7 branches  
**Reason:** 1,700+ commits behind main, based on old apps/ names not gs-*, would create massive merge conflicts  
**Action:** Archive with note explaining why

### Fix Branches (Merged)
Fix branches that appear to be merged into main:
```
origin/fix/sync-module-specs
origin/fix/build-config
```
**Total:** 2 branches  
**Action:** Delete - likely incorporated into main already

### Infrastructure Branches (Inactive)
Old infrastructure/foundational work:
```
origin/infra-monorepo-foundation
origin/cleanup-repo-structure-10233915059836489687
origin/feat/monorepo-restructure
origin/feat/repo-audit-and-restructure
origin/feat/unified-monorepo-v3-1
origin/feature/clean-app-layout-1
```
**Total:** 6 branches  
**Status:** These may have been superseded by newer work  
**Action:** Review if any have uncommitted value, then delete

### Feature Branches (Pre-2026)
Older feature branches from 2025:
```
origin/feat/admin-app-scaffold
origin/feat/module-f-final-1
origin/feat/modules-c-d-e-f-1
origin/feat/modules-c-f
origin/palette-docs-search-shortcut-5649599805928182732
origin/perf/async-audit-logging-491548781906504313
origin/sentinel-add-csp-web-14468920507682904290
origin/jules-code-health-auth-domain-9812628343823827012
```
**Total:** 8 branches  
**Age:** Mostly from 2025  
**Action:** Evaluate if any have active PRs; if not, delete

---

## Total Branches to Delete: 30+

## Archive Process

```bash
# Dry run - list branches that will be deleted
git branch -r | wc -l  # Count before

# Delete via GitHub UI or via command:
# After reviewing each category

git push origin --delete revert-1310-main
git push origin --delete revert-1327-codex/...
# ... etc
```

## Why Archive?

1. **Repository Cleanliness** - Easier to navigate and understand active work
2. **CI/CD Performance** - Fewer branches = faster GitHub API operations  
3. **Focus** - Clear view of what's actually being worked on
4. **Discoverability** - New contributors won't be confused by old branches

## Notes

- Keep `origin/main` (active)
- Keep `origin/HEAD` (pointer)
- Keep any branches with active/open PRs
- Review `origin/sentinel-add-csp-web-14468920507682904290` - might have CSP improvements worth cherry-picking

---

**Recommendation:** Create a cleanup PR that documents these deletions  
**Effort:** 30 minutes to review + 5 minutes to execute deletions  
**Risk:** Low - branches can be recovered from commit history if needed

Generated: 2026-02-11
