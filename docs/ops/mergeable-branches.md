# Finding Merge-able Branches (Goldshore)

This is the project-standard workflow for identifying branches that can merge cleanly.

## Fast local check

1. Update refs:

```bash
git fetch --all --prune
```

2. List remote branches already fully merged into `origin/main`:

```bash
git branch --remotes --merged origin/main
```

> These are safe-delete candidates, not merge candidates.

## Conflict-free mergeability scan (recommended)

Use the repo script:

```bash
scripts/merge-audit.sh --target origin/main
```

Output columns:

- `STATUS=clean` → dry-run merge succeeded
- `STATUS=conflict` → conflicts expected
- `MERGED=yes` → branch already contained in target

Useful flags:

```bash
scripts/merge-audit.sh --target origin/develop --max 25
scripts/merge-audit.sh --target origin/main --include-merged
scripts/merge-audit.sh --target origin/main --no-fetch
```

## Additional branch drift checks

List branches not merged into `origin/main`:

```bash
git branch -r --no-merged origin/main
```

Compare divergence for a branch:

```bash
git log --oneline --left-right --cherry origin/main...origin/<branch-name>
```

- `<` commits are missing from the branch
- `>` commits are introduced by the branch

## Branch existence pre-check (required)

Before any scripted or manual `git checkout`, `git rebase`, or `git merge` that targets a remote branch, verify the branch exists on `origin`:

```bash
git ls-remote --exit-code --heads origin <branch-name>
```

Proceed only when the command succeeds. This is mandatory for automation safety and branch-governance compliance.

## Workflow policy

- Keep `main` deployable.
- Rebase feature branches onto `origin/main` before merge.
- Require passing CI before final merge.

Example:

```bash
git ls-remote --exit-code --heads origin feature-x
git checkout feature-x
git rebase origin/main
```
