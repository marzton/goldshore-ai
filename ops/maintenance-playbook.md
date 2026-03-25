# GoldShore Repo + Infra Maintenance Playbook
**Goal:** Keep the monorepo, Pages/Workers configs, and PR workflow healthy so conflicts are rare, small, and easy to resolve quickly.

This playbook covers:
- Repo hygiene (branches, PRs, lockfiles, configs)
- Conflict prevention + fast resolution patterns
- CI gates that prevent drift
- Cloudflare Pages/Workers config stability
- Daily automation tasks (Jules + Palette)

---

## 0) Golden Rules (Non-negotiable)

### 0.1 Lockfiles are never manually merged
- If `pnpm-lock.yaml` conflicts: **delete + regenerate**
- Never hand-edit conflict markers in lockfiles.

### 0.2 `main` is the source of truth
- All branches must rebase (or merge) regularly from `origin/main`.
- PRs should be short-lived and merged quickly.

### 0.3 One PR = one intent
- Avoid “mega PRs” that touch workers + pages + theme + root configs all at once.
- Separate infra/config PRs from UI feature PRs.

### 0.4 Reduce duplicate roots / nested monorepos
- Only one root should contain `pnpm-workspace.yaml`, `turbo.json`, `pnpm-lock.yaml`.
- No nested `astro-goldshore/astro-goldshore` structures.

---

## 1) Branch Strategy & Lifecycle

### 1.1 Allowed branch types
- `feature/<topic>`
- `fix/<topic>`
- `palette/<date>-<ux-fix>`
- `jules/<date>-<maintenance>`
- `release/<yyyymmdd>` (optional)

### 1.2 Branch TTL (time-to-live)
- Feature branches: **≤ 7 days**
- Fix branches: **≤ 3 days**
- Automated branches (palette/jules): **≤ 24–48 hours**

### 1.3 Daily sync expectation
Every non-main branch should rebase daily:
```bash
git fetch origin main
git rebase origin/main
git push --force-with-lease
```
If you do not want rebases, use merge—but then expect more conflicts later.

---

## 2) PR Rules to Prevent Conflict Propagation

### 2.1 PR size and scope

Prefer PRs that:
- Change ≤ 20 files
- Touch ≤ 2 apps/packages per PR
- Avoid touching root configs unless necessary

### 2.2 “High-conflict” file policy

Any PR touching these should be merged quickly and reviewed carefully:
- `pnpm-lock.yaml`
- `root package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `root tsconfig.json` / base TS configs
- `apps/*/astro.config.mjs`
- `apps/*/wrangler.toml`

Best practice:
- Make a dedicated “infra PR” for these.
- Merge it first.
- Rebase other PRs onto it.

### 2.3 Avoid parallel edits on the same file

If multiple PRs touch the same “hub file” (e.g. `apps/gs-web/src/pages/index.astro`):
- Merge one PR first.
- Rebase the others.
- Or consolidate into one PR if the work is tightly related.

---

## 3) Conflict Resolution SOP (Fast & Repeatable)

### 3.1 Fast path: “conflict present” checklist
1. Checkout PR branch
2. Rebase onto main
3. Fix conflicts (lockfile rule below)
4. Build
5. Push
6. Comment summary

### 3.2 The Lockfile Rule (mandatory)

If `pnpm-lock.yaml` conflicts:

```bash
rm -f pnpm-lock.yaml
rm -rf node_modules
pnpm install
git add pnpm-lock.yaml
git commit -m "Fix: regenerate pnpm-lock.yaml"
git push --force-with-lease
```

### 3.3 Generated artifacts rule

If conflicts appear in generated files (build outputs, dist, etc.):
- Remove them from the repo unless intentionally versioned.
- Ensure `.gitignore` includes:
    - `dist/`
    - `.astro/`
    - `.turbo/`
    - `node_modules/`

### 3.4 “Truth” selection guidelines for common files
- `astro.config.mjs`: base should match current architecture (Cloudflare adapter, output=server).
- `wrangler.toml`: prefer the config that matches deployed worker naming/bindings.
- `UI/layout` conflicts: prefer stable layout shell from main; then re-apply PR-specific changes.

---

## 4) Preventing Conflicts Before They Start

### 4.1 Stable base configs (protect these)

Mark these as protected patterns:
- Root workspace configs
- Worker wrangler configs
- Theme tokens
- CI workflows

If changes are needed, do them via:
- 1 small PR
- Merge immediately
- Rebase all others

### 4.2 Enforce “clean PR” requirement

Require:
- Passing `pnpm lint`
- Passing `pnpm build`
- No merge markers (`<<<<<<<` etc.)
- No leftover debug logs
- No stray patch artifacts (e.g., `user_patch.diff`)
- No duplicate workspace roots

### 4.3 Use CODEOWNERS

Add `CODEOWNERS` so key areas require review:
- `apps/gs-api/**` → infra reviewer
- `apps/gs-web/**` → web reviewer
- `apps/gs-admin/**` → admin reviewer
- `.github/workflows/**` → ops reviewer
- `packages/theme/**` → design system reviewer

---

## 5) Continuous Repo Health Audits (Daily/Weekly)

### 5.1 Daily: Jules “Repo Health”

Jules runs daily and:
- lists open PRs
- detects lockfile conflicts
- detects duplicated roots/nested monorepos
- checks that Pages apps have Cloudflare adapter + output server
- checks workers have `wrangler.toml` + compat dates
- verifies essential secrets exist in GH org/repo settings (presence only)

Output:
- PR comment or issue summary
- suggested merge order

Branch-management automation for `.github/workflows/maintenance.yml` should stay **inspection-only** unless a separate PR-targeted workflow is explicitly approved. The reporting workflow may fetch and inspect refs, but it should not run branch-wide `git checkout`, `git pull`, rebase, merge, or force-push steps from CI. Prefer report output such as `git branch -r`, `gh pr list`, and `git log` for daily maintenance visibility. If branch mutation is ever required, scope it to a single PR and use logic equivalent to `ops/jules/clean-one-pr.sh` rather than sweeping across every branch. Protected branches such as `main` must never be rewritten directly from CI. Use `.github/workflows/maintenance-agent-sync.yml` for manual repo audit + service-token sync tasks, and keep frontend deploy parity in `.github/workflows/deploy-frontend.yml` rather than adding deploy jobs to the inspection workflow.
Branch-management automation for the maintenance workflow should stay **inspection-only** unless a separate PR-targeted workflow is explicitly approved. The reporting workflow may fetch and inspect refs, but it should not run branch-wide `git checkout`, `git pull`, rebase, merge, or force-push steps from CI. Prefer report output such as `git branch -r`, `gh pr list`, and `git log` for daily maintenance visibility. If branch mutation is ever required, scope it to a single PR and use logic equivalent to `ops/jules/clean-one-pr.sh` rather than sweeping across every branch. Protected branches such as `main` must never be rewritten directly from CI. 

### 5.2 Daily: Palette “Micro UX”

Palette runs daily and:
- finds one micro a11y/UX improvement
- creates PR or exits

### 5.3 Weekly: “Infra sanity check”

Weekly task that verifies:
- Pages build commands still correct
- Worker deploy workflows still valid
- Env bindings match wrangler configs
- Access/JWKS URIs are reachable
- D1/KV/R2 bindings exist and are consistent

---

## 6) CI / Actions Policies (Prevention Gates)

### 6.1 Required checks for every PR
- `pnpm lint`
- `pnpm build`
- merge marker scan: fail if `<<<<<<<` exists in tracked files
- lockfile scan: fail if lockfile has conflict markers

### 6.2 “Autofix workflows” (safe automation)

Allowed auto-fixes:
- regenerate lockfile
- run formatting
- rewrite trivial a11y improvements
- update snapshots (optional)

Disallowed auto-fixes:
- modifying worker logic
- changing production bindings/secrets
- changing deployment targets without review

---

## 7) Cloudflare Pages + Workers Configuration Stability

### 7.1 Pages projects: web/admin

Keep stable:
- Build command: `pnpm install && pnpm --filter @goldshore/web build`
- Output directory: `apps/gs-web/dist`
- Same pattern for admin.

Do not change build output dir without updating CF Pages settings + docs.

### 7.2 Workers deploy: prefer GitHub Actions

Avoid “Connect Git” monorepo path headaches:
- Deploy Workers via GH Actions scoped to `apps/*worker*`

### 7.3 Keep binding names consistent

Use a single canonical naming for bindings across:
- `wrangler.toml`
- code references (`env.<binding>`)
- docs (`ops/bindings.md`)

---

## 8) Emergency Recovery Protocol (When Everything Is On Fire)

If many PRs are blocked or repo drift is severe:
1. Freeze merges temporarily
2. Phase A branch bootstrap (`pnpm branch:bootstrap -- <type> <slug>`) now creates `infra/stabilization-backup` before your working branch and logs the exact source ref used.
   - Source selection order:
     1. local `main` (if present)
     2. `origin/HEAD` default branch target
     3. current checked-out branch
   - This fallback keeps stabilization automation working in repositories that do not have a local `main` branch.
3. Create a “stabilization PR” off main/default baseline:
    - remove duplicated roots
    - regenerate lockfile
    - verify build passes
    - fix config drift
4. Merge stabilization PR
5. Rebase every PR onto stabilized main/default branch
6. Close obsolete PRs

---

## 9) Minimal Daily Checklist (Human)

Daily (5 minutes):
- Check open PR list
- Merge the smallest “infra PR” first
- Rebase long-lived PRs
- Ensure no lockfile conflict is being hand-resolved

Weekly (30 minutes):
- prune stale branches
- review workflows
- verify Cloudflare project settings still match repo structure

---

## 10) Suggested Repo Files to Add (Optional but recommended)
- `ops/pr-playbook.md` (conflict resolution SOP)
- `ops/maintenance-playbook.md` (this doc)
- `ops/bindings.md` (KV/D1/R2/Queues binding map)
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`

---

## 11) Quick Commands Reference

List open PRs:
```bash
gh pr list --state open --limit 50
```

Show files in PR:
```bash
gh pr view <id> --json files --jq '.files[].path'
```

Checkout PR:
```bash
gh pr checkout <id>
```

Rebase to main:
```bash
git fetch origin main
git rebase origin/main
git push --force-with-lease
```

Lockfile regeneration:
```bash
rm -f pnpm-lock.yaml && rm -rf node_modules && pnpm install && git add pnpm-lock.yaml
```
