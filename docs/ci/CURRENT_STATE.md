# Stabilization Sync Check Report

**Date:** Mon, 23 Feb 2026 20:36:10 GMT

## 1. Governance Compliance Check

### ❌ Violations Detected
- Unpinned CI Actions detected (must use SHA): actions/checkout is unpinned (uses @v6) in canonical-structure-check.yml, actions/setup-node is unpinned (uses @v6) in canonical-structure-check.yml, pnpm/action-setup is unpinned (uses @v4) in deploy-gs-admin.yml, actions/setup-node is unpinned (uses @v6) in deploy-gs-admin.yml, cloudflare/pages-action is unpinned (uses @v1) in deploy-gs-admin.yml, pnpm/action-setup is unpinned (uses @v4) in deploy-gs-api.yml, actions/setup-node is unpinned (uses @v6) in deploy-gs-api.yml, actions/checkout is unpinned (uses @v6) in deploy-gs-mail.yml, pnpm/action-setup is unpinned (uses @v4) in deploy-gs-mail.yml, actions/setup-node is unpinned (uses @v6) in deploy-gs-mail.yml, pnpm/action-setup is unpinned (uses @v4) in deploy-gs-web.yml, actions/setup-node is unpinned (uses @v6) in deploy-gs-web.yml, cloudflare/pages-action is unpinned (uses @v1) in deploy-gs-web.yml, actions/checkout is unpinned (uses @v6) in lockfile-guard.yml, actions/checkout is unpinned (uses @v6) in naming-lint.yml, pnpm/action-setup is unpinned (uses @v4) in naming-lint.yml, actions/setup-node is unpinned (uses @v6) in naming-lint.yml, actions/setup-node is unpinned (uses @v6) in palette-manual.yml, actions/checkout is unpinned (uses @v6) in pii-scan.yml, actions/setup-node is unpinned (uses @v6) in pii-scan.yml, actions/upload-artifact is unpinned (uses @v6) in pii-scan.yml, pnpm/action-setup is unpinned (uses @v4) in preview-gs-admin.yml, actions/setup-node is unpinned (uses @v6) in preview-gs-admin.yml, cloudflare/pages-action is unpinned (uses @v1) in preview-gs-admin.yml, pnpm/action-setup is unpinned (uses @v4) in preview-gs-agent.yml, actions/setup-node is unpinned (uses @v6) in preview-gs-agent.yml, pnpm/action-setup is unpinned (uses @v4) in preview-gs-api.yml, actions/setup-node is unpinned (uses @v6) in preview-gs-api.yml, pnpm/action-setup is unpinned (uses @v4) in preview-gs-gateway.yml, actions/setup-node is unpinned (uses @v6) in preview-gs-gateway.yml, pnpm/action-setup is unpinned (uses @v4) in preview-gs-web.yml, actions/setup-node is unpinned (uses @v6) in preview-gs-web.yml, cloudflare/pages-action is unpinned (uses @v1) in preview-gs-web.yml, actions/checkout is unpinned (uses @v6) in route-collision-check.yml, pnpm/action-setup is unpinned (uses @v4) in route-collision-check.yml, actions/setup-node is unpinned (uses @v6) in route-collision-check.yml, actions/ai-inference is unpinned (uses @v2) in summary.yml, github/codeql-action/upload-sarif is unpinned (uses @v4) in tfsec.yml

Documented in docs/ci/CURRENT_STATE.md. Do not self-fix. Escalate via comment only.

## 2. Branch Discipline Check

**Current Branch:** jules-101676864093333730-d036ee33
**Divergence vs origin/main:** Behind: 0, Ahead: 0

✅ Branch divergence acceptable.

## 3. CI State Snapshot

⚠️ gh CLI unavailable; unable to resolve PR CI status in this environment.

### Local Build Verification

| App | Status | Notes |
|---|---|---|
| **gs-web** | ❌ FAIL | Check run logs |
| **gs-admin** | ❌ FAIL | Check run logs |
| **gs-api** | ❌ FAIL | Check run logs |
| **gs-mail** | ❌ FAIL | Check run logs |

## 4. App-Level Repairs Only

Failures detected in: gs-web build failed, gs-admin build failed, gs-api build failed, gs-mail build failed.
**Guidance:** You may fix these inside `apps/*`. Do not modify `.github/`, `infra/`, or root scripts.

## 5. No Expansion Rule

⚠️ Violations or issues detected. Focus on stabilization only. Do not add features or optimize pipelines.

## Stop Condition

If CI is green across all required checks for 48 consecutive hours and no branch divergence >5 commits exists, recommend terminating recurring stabilization sync.
