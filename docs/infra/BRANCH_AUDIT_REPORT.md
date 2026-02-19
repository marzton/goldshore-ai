# Branch Audit Report

- **Generated at (UTC):** 2026-02-19T00:08:00Z
- **Repository path:** `/workspace/goldshore-ai`
- **Audit scope:** Local Git branch metadata available in this environment.

## Data Source Commands

```bash
# Timestamp
date -u '+%Y-%m-%dT%H:%M:%SZ'

# Local branch inventory with metadata
git for-each-ref --format='%(refname:short)|%(objectname:short)|%(committerdate:iso8601)|%(authorname)|%(subject)' refs/heads

# Branch counts + stale (>7 days) computation
python - <<'PY'
import subprocess, datetime
now=datetime.datetime.now(datetime.timezone.utc)
rows=subprocess.check_output([
    "git","for-each-ref","--format=%(refname:short)|%(committerdate:iso8601)","refs/heads"
]).decode().strip().splitlines()
print('total_local_branches',len([r for r in rows if r]))
stale=[]
for r in rows:
    if not r: continue
    name,dt=r.split('|',1)
    d=datetime.datetime.strptime(dt,'%Y-%m-%d %H:%M:%S %z')
    age=(now-d.astimezone(datetime.timezone.utc)).days
    if age>7:
        stale.append((name,age,dt))
print('stale_gt_7_days',len(stale))
for s in stale:
    print(*s,sep='|')
PY

# Open PR lookup (attempted)
gh pr list --state open --json number,headRefName,baseRefName,title,url
```

## Counting Methodology

1. **Branch inventory count** = count of refs under `refs/heads` (local branches only).
2. **Stale threshold** = branch tip `committerdate` older than **7 full days** from report generation timestamp (UTC).
3. **Branches with no open PR** would be computed as:
   - `local_branch_names - open_pr_head_branch_names`
   - This could not be fully computed here because GitHub CLI (`gh`) is unavailable and no remote was configured.
4. **PRs whose head branch is missing** would be computed as:
   - `open_pr_head_branch_names - (local_branch_names ∪ remote_branch_names)`
   - This could not be fully computed here for the same reason.

## Full Branch Inventory

| Branch | Tip Commit | Last Commit Date (tip) | Last Author | Last Subject |
|---|---|---|---|---|
| `work` | `296aaba` | 2026-02-18 15:28:32 -0500 | Bobby Rosenberg | Codex/update root package.json scripts 2026 02 15 (#1812) |

**Inventory count:** 1 local branch.

## Stale Branches Older Than 7 Days

No stale local branches found using the >7 day rule.

**Stale count:** 0.

## Branches With No Open PR

**Status:** Not fully determinable in this environment.

- `gh` CLI is not installed (`bash: command not found: gh`).
- No Git remotes were configured (`git remote -v` returned no remotes).

Given missing PR data, this section is marked **pending manual completion**.

## PRs Whose Head Branch Is Missing

**Status:** Not fully determinable in this environment.

- Open PR metadata could not be queried (no `gh` CLI).
- No remote branch refs were available for comparison.

Given missing PR data, this section is marked **pending manual completion**.

## Proposed Deletions (**DO NOT DELETE UNTIL APPROVED**)

No deletion candidates are proposed from currently available local data.

> **DO NOT DELETE UNTIL APPROVED**

| Candidate Branch | Reason | Evidence | Approval Status |
|---|---|---|---|
| _None_ | No stale local branches found; PR linkage unavailable | Stale count = 0; PR queries unavailable | Pending manual review |

## Approval Required

Manual sign-off checklist:

- [ ] Branch inventory reviewed by repository owner.
- [ ] PR data retrieved in a GitHub-enabled environment and merged into this report.
- [ ] “Branches with no open PR” list verified.
- [ ] “PRs whose head branch is missing” list verified.
- [ ] Proposed deletions explicitly approved by maintainer.
- [ ] Deletions executed only after explicit approval and backout plan documented.
