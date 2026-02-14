# Reports Directory

This directory stores **canonical, shareable report outputs** only.

## Versioned output

- `branch-audit.md`: the current branch audit summary intended for reviewers.

## Generation workflow

1. Run the branch/integration audit tooling (for example, repository automation under `scripts/` or `.Jules/`).
2. Regenerate `reports/branch-audit.md` from the latest run.
3. Commit only the refreshed `branch-audit.md` when report updates are needed.

## Not versioned

- Local execution logs (for example, `reports/*.txt`).
- One-off debugging artifacts and temporary run outputs.
