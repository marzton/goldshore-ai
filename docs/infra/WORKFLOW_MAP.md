# Workflow Inventory Map

## Status Key
*   **Valid**: Structurally correct and seemingly in use.
*   **Invalid**: Redundant, legacy, or clearly intended for removal.
*   **Corrupted**: Syntax errors or broken content.
*   **Broken**: References missing files or dependencies.
*   **Warning**: Uses deprecated features or has potential issues.

## Workflow Inventory Table

| Workflow File | Trigger | Dependencies | Status | Reusable Refs | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `deploy-admin.yml` | push (main) | - | **Invalid** | - | Redundant (legacy naming). Use `deploy-gs-admin.yml` |
| `deploy-agent.yml` | push (main) | - | **Invalid** | - | Redundant (legacy naming). Use `deploy-gs-agent.yml` |
| `deploy-api-worker.yml` | push (main) | - | **Invalid** | - | Redundant (legacy naming). Use `deploy-gs-api.yml` |
| `deploy-control-worker.yml` | push (main) | - | **Invalid** | - | Redundant (legacy naming). Use `deploy-gs-control.yml` |
| `deploy-gateway.yml` | push (main) | - | **Invalid** | - | Redundant (legacy naming). Use `deploy-gs-gateway.yml` |
| `deploy-gs-admin.yml` | push (main) | - | **Valid** | - | Production deployment for Admin |
| `deploy-gs-agent.yml` | push (main) | - | **Valid** | - | Production deployment for Agent |
| `deploy-gs-api.yml` | push (main) | - | **Valid** | - | Production deployment for API |
| `deploy-gs-control.yml` | push (main) | - | **Valid** | - | Production deployment for Control |
| `deploy-gs-gateway.yml` | push (main) | - | **Valid** | - | Production deployment for Gateway |
| `deploy-gs-mail.yml` | push (main) | - | **Valid** | - | Production deployment for Mail |
| `deploy-gs-web.yml` | push (main) | - | **Valid** | - | Production deployment for Web |
| `deploy-web.yml` | push (main) | - | **Invalid** | - | Redundant (legacy naming). Use `deploy-gs-web.yml` |
| `jules-nightly.yml` | schedule, dispatch | - | **Broken** | `.github/workflows/jules-daily.yml`, etc. | References missing local workflow files. |
| `lockfile-guard.yml` | pull_request | - | **Corrupted** | - | File content is duplicated/concatenated. Syntax error. |
| `manual.yml` | workflow_dispatch | - | **Valid** | - | Manual test workflow. |
| `naming-lint.yml` | pull_request, push | - | **Valid** | - | Enforces naming conventions. |
| `neuralegion.yml` | push, pr, schedule | - | **Warning** | `NeuraLegion/run-scan` | Uses deprecated `ubuntu-18.04`. Duplicate `neuralegion-scan` job key. |
| `palette-manual.yml` | repository_dispatch | - | **Warning** | - | References `.Jules/run-palette.js` (exists). Duplicate `actions/setup-node`. |
| `pii-scan.yml` | schedule, dispatch, pr | - | **Valid** | - | Duplicate `actions/setup-node` & `upload-artifact` steps. |
| `preview-admin.yml` | pull_request | - | **Valid** | - | Preview deployment. Duplicate `actions/setup-node`. |
| `preview-agent.yml` | pull_request | - | **Valid** | - | Preview deployment. Duplicate `actions/setup-node`. Duplicate run command. |
| `preview-api-worker.yml` | pull_request | - | **Valid** | - | Preview deployment. Duplicate `actions/setup-node`. |
| `preview-control-worker.yml` | pull_request | - | **Valid** | - | Preview deployment. Duplicate `actions/setup-node`. Duplicate `working-directory`. |
| `preview-gateway.yml` | pull_request | - | **Valid** | - | Preview deployment. Duplicate `actions/setup-node`. |
| `preview-web.yml` | pull_request | - | **Valid** | - | Preview deployment. Duplicate `actions/setup-node`. Duplicate `working-directory`. |
| `route-collision-check.yml` | pull_request, dispatch | - | **Valid** | - | Checks route collisions. |
| `sonarcloud.yml` | push, pr, dispatch | - | **Valid** | `SonarSource/sonarcloud-github-action` | Duplicate `uses` keys in steps. |
| `summary.yml` | issues | - | **Valid** | `actions/ai-inference` | Summarizes issues using AI. Duplicate `uses` keys. |
| `tfsec.yml` | push, pr, schedule | - | **Valid** | `aquasecurity/tfsec-sarif-action` | Security scan. Duplicate `uses` keys. |

## Cross-Repo References & Redundancies

### Redundancies
The primary issue is the duplication of deployment workflows. The repository contains both `deploy-<service>.yml` and `deploy-gs-<service>.yml` patterns.
*   **Resolution**: Keep `gs-` prefixed workflows (matching the `apps/gs-*` structure). Remove non-prefixed ones.

### Broken References
*   `jules-nightly.yml` attempts to call other workflows (`jules-daily.yml`, `sentinel-nightly.yml`, etc.) located in `.github/workflows/`, but these files **do not exist** in the repository.

### Corruption
*   `lockfile-guard.yml` contains two full YAML documents concatenated together, which renders it invalid.

### Duplicate Steps
Many workflows (especially previews and scans) contain duplicate step definitions (e.g., `uses: actions/setup-node@v4` followed immediately by `uses: actions/setup-node@v6`). This indicates a merge conflict resolution failure or copy-paste error.
