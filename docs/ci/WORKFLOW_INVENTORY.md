# Workflow Inventory

Last audited: 2026-02-18

## Scope notes

- Active workflow directory: `.github/workflows/`.
- There is currently **no** `.github/AI/` directory in this repository; agent/governance content is stored under `AI/` at the repo root.
- `naming-lint.yml` is the active naming gate in this repo and serves as the practical equivalent of the planned `naming-guard.yml`.

## Blocking policy legend

- **Blocking**: Runs on `pull_request` and is intended to be configured as a required status check.
- **Non-blocking**: Manual, scheduled, push-only, or advisory workflows not expected to block PR merges.

| Workflow file | Primary purpose | Trigger profile | Blocking status |
|---|---|---|---|
| `.github/workflows/lockfile-guard.yml` | Prevent lockfile drift in PRs. | `pull_request` | **Blocking** |
| `.github/workflows/naming-lint.yml` | Enforce naming conventions (`pnpm check:naming`). | `pull_request`, `push` to `main` | **Blocking** |
| `.github/workflows/route-collision-check.yml` | Validate route ownership/collision map. | `pull_request`, `workflow_dispatch` | **Blocking** |
| `.github/workflows/preview-web.yml` | Preview deploy for web app. | `pull_request` (path-filtered) | Non-blocking |
| `.github/workflows/preview-admin.yml` | Preview deploy for admin app. | `pull_request` (path-filtered) | Non-blocking |
| `.github/workflows/preview-api-worker.yml` | Preview deploy for API worker. | `pull_request` (path-filtered) | Non-blocking |
| `.github/workflows/preview-control-worker.yml` | Preview deploy for control worker. | `pull_request` (path-filtered) | Non-blocking |
| `.github/workflows/preview-gateway.yml` | Preview deploy for gateway worker. | `pull_request` (path-filtered) | Non-blocking |
| `.github/workflows/preview-gs-agent.yml` | Preview deploy for agent worker. | `pull_request` (path-filtered) | Non-blocking |
| `.github/workflows/deploy-web.yml` | Legacy production deploy for web app. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-admin.yml` | Legacy production deploy for admin app. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-api-worker.yml` | Legacy production deploy for API worker. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-control-worker.yml` | Legacy production deploy for control worker. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gateway.yml` | Legacy production deploy for gateway worker. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-agent.yml` | Legacy production deploy for agent worker. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gs-web.yml` | Current production deploy for web app with validation gates. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gs-admin.yml` | Current production deploy for admin app with validation gates. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gs-api.yml` | Current production deploy for API worker with validation gates. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gs-control.yml` | Current production deploy for control worker with validation gates. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gs-gateway.yml` | Current production deploy for gateway worker with validation gates. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gs-agent.yml` | Current production deploy for agent worker with validation gates. | `push` to `main` | Non-blocking |
| `.github/workflows/deploy-gs-mail.yml` | Current production deploy for mail worker with validation gates. | `push` to `main` | Non-blocking |
| `.github/workflows/jules-nightly.yml` | Nightly orchestrator for automation jobs. | `schedule`, `workflow_dispatch` | Non-blocking |
| `.github/workflows/palette-manual.yml` | Dispatch-triggered run for the Palette agent. | `repository_dispatch` | Non-blocking |
| `.github/workflows/maintenance.yml` | Manual Cloudflare infra reconciliation workflow. | `workflow_dispatch` | Non-blocking |
| `.github/workflows/pii-scan.yml` | Manual PII scan/reporting workflow. | `workflow_dispatch` | Non-blocking |
| `.github/workflows/summary.yml` | Summarize new issues using AI. | `issues` events | Non-blocking |
| `.github/workflows/sonarcloud.yml` | SonarCloud analysis. | `push`, `pull_request`, `workflow_dispatch`, `schedule` | Non-blocking |
| `.github/workflows/tfsec.yml` | Infrastructure security scan (tfsec). | `push`, `pull_request`, `workflow_dispatch`, `schedule` | Non-blocking |
| `.github/workflows/neuralegion.yml` | DAST/Nexploit security scan. | `push`, `workflow_dispatch`, `schedule` | Non-blocking |

## Stabilization/disable procedure (real filenames)

When a workflow must be temporarily disabled, archive the actual existing file into `.github/workflows-backup/` instead of renaming a planned/non-existent file:

```bash
mkdir -p .github/workflows-backup
mv .github/workflows/<real-workflow>.yml .github/workflows-backup/
```

Example for the active naming gate:

```bash
mv .github/workflows/naming-lint.yml .github/workflows-backup/
```

Re-enable by moving the same file back into `.github/workflows/`.
