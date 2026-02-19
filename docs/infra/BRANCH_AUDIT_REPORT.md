# Branch Audit Report

**Date**: 2026-02-18
**Total Branch Count**: 58
**Target Count**: < 15

## Executive Summary
The repository is experiencing "Branch Explosion". There are 58 active remote branches, significantly exceeding the target of < 15. While no branches are technically "stale" (inactive > 7 days) due to recent activity/creation, the sheer volume indicates a lack of lifecycle management and potential "working copy" proliferation.

## Stale Branch Analysis
*   **Definition**: Inactive for > 7 days.
*   **Current Status**: 0 stale branches found. All branches have commit dates >= 2026-02-11.
*   **Observation**: Despite the lack of stale branches, the high count suggests that many branches are created but not merged/deleted promptly, or there are many parallel initiatives without clear cleanup.

## Governance Violations
The following branches do not follow the naming convention (`feat/`, `fix/`, `infra/`, `docs/`, `chore/`, `release/`, `stabilize/`):

*   `bolt-optimize-docs-search-17357184510406706208`
*   `conflicts`
*   `fix-conflicts-restore-manifests-16782105097730596540`
*   `fix-gs-web-build-aliases-13314510050307645369`
*   `main-HEAD`
*   `main-HEAD-1`
*   `main-HEAD-2`
*   `main-HEAD-3`
*   `main-HEAD-4`
*   `main-HEAD-5`
*   `perf-optimize-ai-cache-key-14784405813922786148`
*   `repo-rename-and-cleanup-4658917426659822449`
*   `revert-1492-codex/github-mention-chore-migrate-legacy-app-path-references-to-2026-02-13`
*   `revert-1514-codex/add-and-fetch-git-remote-refs-2026-02-14`
*   `security-fix-media-upload-size-check-1691631318753640735`
*   `stabilization-sync-check-949597410874134791`
*   `workingxopy2-15-26`
*   `workingxopy2-15-26-origin`

## Recommendation
1.  **Immediate Cleanup**: Delete `main-HEAD-*` branches and `workingxopy*` branches as they appear to be temporary artifacts or mistake pushes.
2.  **Enforce Naming**: Block push of branches that do not match the allowed prefixes.
3.  **Merge & Delete**: Review the `codex/` and `chore/` branches. Many seem to be automated or single-task branches that should be PR'd and deleted.
