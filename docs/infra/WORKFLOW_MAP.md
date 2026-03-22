# Workflow Map & Inventory

Last reviewed: 2026-03-21

This document maps the active GitHub Actions workflows in the repository, their triggers, dependencies, and current status.

## Workflow Inventory

| Workflow Name | File Path | Trigger | Dependencies | Reusable Refs | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Deploy GS Admin | `.github/workflows/deploy-gs-admin.yml` | `push` (main) | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `cloudflare/pages-action` | None | VALID | Deploys to Cloudflare Pages. |
| Deploy GS API | `.github/workflows/deploy-gs-api.yml` | `push` (main) | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Deploys using Wrangler. |
| Deploy GS Mail | `.github/workflows/deploy-gs-mail.yml` | `push` (main) | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Deploys using Wrangler. |
| Deploy GS Web | `.github/workflows/deploy-gs-web.yml` | `push` (main) | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `cloudflare/pages-action` | None | VALID | Deploys to Cloudflare Pages. |
| Jules Nightly | `.github/workflows/jules-nightly.yml` | `schedule`, `workflow_dispatch` | None | `jules-daily.yml`, `jules-nightly-clean.yml`, `palette-daily.yml`, `sentinel-nightly.yml`, `conflict-sweeper-nightly.yml` | **INVALID** | References missing reusable workflows. Requires repair or removal. |
| Lockfile Guard | `.github/workflows/lockfile-guard.yml` | `workflow_dispatch` | `actions/checkout` | None | **MANUAL** | Enforces strict lockfile policy. Disabled automation (Cost Containment). |
| Manual | `.github/workflows/manual.yml` | `workflow_dispatch` | None | None | VALID | Simple greeting workflow. |
| Naming Guard | `.github/workflows/naming-guard.yml` | `workflow_dispatch` | `actions/checkout` | None | **MANUAL** | Checks for legacy paths/files. Disabled automation (Cost Containment). |
| Naming Lint | `.github/workflows/naming-lint.yml` | `pull_request`, `push` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Runs `pnpm check:naming`. |
| NeuraLegion Scan | `.github/workflows/neuralegion.yml` | `schedule`, `workflow_dispatch` | `actions/checkout`, `NeuraLegion/run-scan` | None | **DEPRECATED** | Uses deprecated `ubuntu-18.04` runner. |
| Palette Manual | `.github/workflows/palette-manual.yml` | `workflow_dispatch` | `actions/checkout`, `actions/setup-node` | None | VALID | Manual trigger. |
| PII Scan | `.github/workflows/pii-scan.yml` | `workflow_dispatch` | `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` | None | **MANUAL** | Runs `pnpm scan:pii`. Disabled automation (Cost Containment). |
| Preview Agent | `.github/workflows/preview-gs-agent.yml` | `pull_request` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Preview-only by design; GitHub Actions is not authoritative for production. |
| Preview GS Admin | `.github/workflows/preview-gs-admin.yml` | `pull_request` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `cloudflare/pages-action` | None | VALID | Deploys preview to Cloudflare Pages. |
| Preview GS API | `.github/workflows/preview-gs-api.yml` | `pull_request` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Deploys preview using Wrangler. |
| Preview GS Gateway | `.github/workflows/preview-gs-gateway.yml` | `pull_request` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Preview-only by design; GitHub Actions is not authoritative for production. |
| Preview GS Web | `.github/workflows/preview-gs-web.yml` | `pull_request` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `cloudflare/pages-action` | None | VALID | Deploys preview to Cloudflare Pages. |
| Route Collision Check | `.github/workflows/route-collision-check.yml` | `pull_request`, `push` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Runs route collision check. |
| SonarCloud | `.github/workflows/sonarcloud.yml` | `push`, `pull_request` | `SonarSource/sonarcloud-github-action` | None | VALID | Uses SonarCloud action. |
| Stabilization Task | `.github/workflows/stabilization-task.yml` | `schedule`, `workflow_dispatch` | `actions/checkout`, `actions/setup-node`, `stefanzweifel/git-auto-commit-action` | None | VALID | Runs daily stabilization checks. |
| Summary | `.github/workflows/summary.yml` | `issues` | `actions/ai-inference` | None | **SUSPICIOUS** | Uses `actions/ai-inference@v2` which may be invalid or costly. |
| Sync Infra | `.github/workflows/sync-infra.yml` | `workflow_dispatch` | `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` | None | VALID | Manual infrastructure synchronization workflow. |
| TFSec | `.github/workflows/tfsec.yml` | `schedule` | `actions/checkout`, `aquasecurity/tfsec-sarif-action`, `github/codeql-action` | None | VALID | Runs security scan. |

## Governance Observations

1. `gs-agent` is intentionally **preview-only** in GitHub Actions; production deploys are manual.
2. `gs-gateway` is intentionally **preview-only** in GitHub Actions; production deploys are manual.
3. `gs-control` is intentionally **fully manual** and has no active deploy workflow.
4. The `jules-nightly.yml` workflow is non-functional as it relies on missing files.
5. `neuralegion.yml` must be updated to use a supported runner or removed.
6. `summary.yml` uses an AI inference action that warrants investigation.

See [`docs/ci/WORKER_DEPLOYMENT_STATES.md`](../ci/WORKER_DEPLOYMENT_STATES.md) for the canonical worker deployment policy.
