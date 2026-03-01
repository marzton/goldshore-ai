# Branch Mergeability Guide

Use this workflow to discover branches that are already merged, branch candidates that are still open, and branches that can merge cleanly into your target branch.

## Fast Local Check

1. Update remote branch state:

```bash
git fetch --all --prune
```

2. List branches already fully merged into `origin/main` (safe-delete candidates):

```bash
git branch --remotes --merged origin/main
```

3. List branches not yet merged into `origin/main` (review candidates):

```bash
git branch -r --no-merged origin/main
```

## Conflict-Free Mergeability Scan (Recommended)

Run the repository audit script:

```bash
pnpm run audit:mergeable
```

Optional arguments:

```bash
bash scripts/audit-mergeable-branches.sh <target-branch> <remote>
# Example:
bash scripts/audit-mergeable-branches.sh main origin
```

The output classifies each remote branch as:

- `already-merged`: branch commits are already contained in the target branch.
- `mergeable`: branch cleanly merges into the target branch (no conflicts in dry-run merge).
- `conflicts`: merge conflicts are expected.

## Manual Single-Branch Verification

```bash
git checkout main
git pull --ff-only

git merge --no-commit --no-ff origin/<branch-name>
# Resolve result and then clean up test merge
git merge --abort
```

## Recommended GoldShore Workflow

1. Keep `main` deployable.
2. Rebase feature branches onto `origin/main` before merge.
3. Require passing CI before merge.

```bash
git checkout feature-x
git rebase origin/main
```
