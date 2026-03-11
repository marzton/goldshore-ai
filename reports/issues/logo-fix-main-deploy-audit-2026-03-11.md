# Logo-fix deployment audit (2026-03-11)

## Scope
Validation requested:
1. Confirm logo-fix commit SHA is on `main`.
2. Check GitHub Actions run for `Deploy GS Web (goldshore.ai)` after that SHA.
3. Merge/push if no run exists.
4. If run failed, inspect failed step and re-run after fixing.
5. Confirm Cloudflare Pages `gs-web` latest production deployment SHA matches GitHub `main`.

## Findings

### 1) Logo-fix SHA on `main`
- Target logo-fix commit:
  - `11cc2d2618b7d84b6174dc839d30811591701c45`
  - Message: `fix(brand): override Penrose logo with final production SVG asset (#3254)`
- GitHub compare `11cc2d2...main` returned status `ahead` with `ahead_by: 21`, meaning `main` contains the logo-fix commit and has 21 newer commits.
- GitHub `main` branch HEAD at check time:
  - `2d76b0809bed78be749b897964c2a9a3ff47815b`

### 2) Workflow run after that SHA
- Workflow found:
  - Name: `Deploy GS Web (goldshore.ai)`
  - Workflow ID: `233144264`
  - Path: `.github/workflows/deploy-gs-web.yml`
- Run for exact logo-fix SHA exists:
  - Run number `308`
  - Run ID `22894718511`
  - Status `completed`
  - Conclusion `startup_failure`
  - URL: https://github.com/goldshore/goldshore-ai/actions/runs/22894718511
- Additional runs after that SHA also exist and are all `startup_failure`.

### 3) Push/merge requirement
- Not needed. The logo-fix commit is already on `main` and workflow runs exist after that SHA.

### 4) Failure inspection + rerun attempt
- Failure mode is `startup_failure` with zero jobs created (`total_count: 0` from jobs endpoint), so there is no individual failed job step to inspect.
- Public API/log access is limited for this repository without admin auth; run-log download endpoint returned:
  - `403 Must have admin rights to Repository.`
- Re-run could not be executed from this environment because no authenticated GitHub CLI/token is available and unauthenticated REST cannot trigger reruns.

### 5) Cloudflare Pages production SHA parity
- Could not be confirmed from this environment due missing Cloudflare API credentials (`wrangler`/API token not configured) and a Cloudflare challenge response on direct `goldshore.ai` HEAD request.
- Result: SHA parity between Cloudflare Pages `gs-web` latest production deployment and GitHub `main` remains unverified.

## Recommended next operator actions
1. In GitHub UI, open run `22894718511` and inspect the startup error banner (workflow-level startup failure reason).
2. After correction, rerun workflow `Deploy GS Web (goldshore.ai)` on latest `main`.
3. Verify Cloudflare Pages `gs-web` latest production deployment commit SHA equals `2d76b0809bed78be749b897964c2a9a3ff47815b`.
