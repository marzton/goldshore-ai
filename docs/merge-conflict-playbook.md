# Merge Conflict Playbook

The following task stubs outline a conflict-safe process for making PRs mergeable and tracking open PRs. They include the lockfile regeneration rule, assume `gh` CLI where possible, and align with Jules assistance conventions.

:::task-stub{title="Resolve merge conflicts for pending PRs"}
Goal: Make a conflicted PR mergeable without manually editing lockfiles or huge generated files.
1. Identify the PR branch and base
   - Use:
     - `gh pr list --state open --limit 50`
     - `gh pr view <id> --json headRefName,baseRefName,mergeable`
   - Note:
     - Base branch (usually main)
     - PR branch (`headRefName`)
2. Fetch and checkout the PR branch locally
   - With GitHub CLI:
     - `gh pr checkout <id>`
   - Without GitHub CLI:
     - `git fetch origin pull/<id>/head:pr-<id>`
     - `git checkout pr-<id>`
3. Sync with base branch to surface conflicts
   - Ensure main is up to date:
     - `git fetch origin main`
   - Rebase (preferred) or merge:
     - `git rebase origin/main`
     - or `git merge origin/main`
4. Handle lockfile conflicts the correct way
   - If `pnpm-lock.yaml` has conflict markers (`<<<<<<< / ======= / >>>>>>>`):
     - `rm -f pnpm-lock.yaml`
     - `rm -rf node_modules`
     - `pnpm install`
     - `git add pnpm-lock.yaml`
   - Never edit lockfiles by hand. Always regenerate.
5. Resolve remaining conflicts in source/config files
   - For each conflicted file (excluding the lockfile):
     - Open and search for `<<<<<<<`, `=======`, `>>>>>>>`.
     - Decide source of truth: keep PR changes, base changes, or a manual blend.
     - Remove conflict markers and ensure the file compiles logically.
     - Mark conflicts resolved: `git add <file1> <file2> ...`
6. Validate resolutions with project commands
   - At the monorepo root:
     - `pnpm lint || echo "Lint warnings (non-blocking)"`
     - `pnpm build`
   - Optional per-app:
     - `pnpm --filter @goldshore/web test`
     - `pnpm --filter @goldshore/admin test`
7. Finalize and push the cleaned branch
   - If you rebased:
     - `git commit -m "Resolve merge conflicts for PR <id>" || true`
     - `git push --force-with-lease`
   - If you merged:
     - `git commit -m "Merge origin/main into PR <id> and resolve conflicts" || true`
     - `git push`
8. Document what you did on the PR
   - Add a short PR comment:
     - Conflicts resolved by syncing with main, regenerating `pnpm-lock.yaml`, and fixing merges in:
       - `apps/admin/...`
       - `apps/web/...`
     - Lint + build passing locally. CI re-run triggered.
:::

:::task-stub{title="Inventory open PRs and critical files"}
Goal: Get a clear picture of all open PRs, what they touch, and which ones are worth resolving first.
1. List all open PRs for the repo
   - Default repo: `gh pr list --state open --limit 50`
   - Specific repo: `gh pr list --repo <org>/<repo> --state open --limit 50`
   - If `gh` is unavailable or the repo has no remote, browse the GitHub UI and log PR details manually (see `docs/pr-inventory-template.md`).
2. Pull structured details for each PR
   - For a single PR:
     - `gh pr view <id> --json number,title,headRefName,baseRefName,mergeable,files --jq '{number,title,head: .headRefName,base: .baseRefName,mergeable,files: [.files[].path]}'`
   - For multiple PRs, you can loop and dump JSON to a file (optional future automation).
3. Identify “vital files” and risk level
   - Mark PRs that touch:
     - `package.json`, `pnpm-lock.yaml`
     - `apps/admin/*`, `apps/web/*`
     - `apps/api-worker/*`, `apps/gateway/*`, `apps/control-worker/*`
     - root `tsconfig.json`, `pnpm-lock.yaml`, `package.json`
   - These PRs are high-risk for conflicts and should be merged in a deliberate order.
4. Detect overlaps between PRs
   - Look for PRs touching the same files or directories:
     - Multiple PRs editing `apps/web/src/pages/index.astro`
     - Multiple PRs editing `apps/api-worker/src/index.ts`
     - Multiple PRs editing `pnpm-lock.yaml` or `package.json`
   - Sequence merges so that the most foundational PRs (infra, config, base layouts) go first.
5. Produce a prioritization summary
   - For each PR, summarize:
     - `#<id> — <title>`
     - `head → base`
     - `Mergeable`: true/false/unknown
     - Vital files touched
     - Suggested priority: High / Medium / Low
   - Recommend merge order, e.g.:
     1. Infra / config PRs (root `package.json`, `tsconfig`, `wrangler`, `env`)
     2. Workers (`apps/api-worker`, `gateway`, `control-worker`)
     3. Web/admin layouts and routing
     4. Content-only or copy updates
6. Share the summary and assign decisions
   - Post the summarized list:
     - In a GitHub issue
     - In the repo README under “Active PRs”
     - Or in a private doc for your own reference
   - Note where you want “Jules” automation to:
     - auto-clean conflicts
     - auto-regenerate lockfiles
     - auto-close stale PRs
:::
