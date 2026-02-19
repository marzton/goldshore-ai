# WORKFLOW MAP

Generated: 2026-02-19T00:13:09.596Z

| Workflow | Trigger(s) | Dependencies | Status | Reusable refs | Cross-repo refs | Class |
|---|---|---|---|---|---|---|
| deploy-admin.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>cloudflare/pages-action@v1 | valid | none | none | Core |
| deploy-agent.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-api-worker.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-control-worker.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-gateway.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-gs-admin.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>cloudflare/pages-action@v1 | valid | none | none | Core |
| deploy-gs-agent.yml | push | actions/checkout@v4<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-gs-api.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-gs-control.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-gs-gateway.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| deploy-gs-mail.yml | push | actions/checkout@v4<br>pnpm/action-setup@v4<br>actions/setup-node@v6 | valid | none | none | Core |
| deploy-gs-web.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>cloudflare/pages-action@v1 | valid | none | none | Core |
| deploy-web.yml | push | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>cloudflare/pages-action@v1 | valid | none | none | Core |
| jules-nightly.yml | schedule, workflow_dispatch | none | valid | ./.github/workflows/jules-daily.yml<br>./.github/workflows/jules-nightly-clean.yml<br>./.github/workflows/palette-daily.yml<br>./.github/workflows/sentinel-nightly.yml<br>./.github/workflows/conflict-sweeper-nightly.yml | none | Scheduled |
| lockfile-guard.yml | pull_request | actions/checkout@v4<br>gh-cli | valid | none | none | Core |
| manual.yml | workflow_dispatch | none | valid | none | none | Core |
| naming-lint.yml | pull_request, push | actions/checkout@v4<br>pnpm/action-setup@v4<br>actions/setup-node@v6 | valid | none | none | Core |
| neuralegion.yml | push, pull_request, schedule | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>NeuraLegion/run-scan@29ebd17b4fd6292ce7a238a59401668953b37fbe | valid | none | none | Scheduled |
| palette-manual.yml | repository_dispatch | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>actions/setup-node@v6 | valid | none | none | Recursive risk |
| pii-scan.yml | schedule, workflow_dispatch, pull_request | actions/checkout@v4<br>actions/setup-node@v6<br>actions/upload-artifact@v6 | valid | none | none | Scheduled |
| preview-admin.yml | pull_request | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>cloudflare/pages-action@v1 | valid | none | none | Core |
| preview-agent.yml | pull_request | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| preview-api-worker.yml | pull_request | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| preview-control-worker.yml | pull_request | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| preview-gateway.yml | pull_request | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>wrangler-cli | valid | none | none | Core |
| preview-web.yml | pull_request | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>pnpm/action-setup@v4<br>actions/setup-node@v6<br>cloudflare/pages-action@v1 | valid | none | none | Core |
| route-collision-check.yml | pull_request, workflow_dispatch | actions/checkout@v4<br>pnpm/action-setup@v4<br>actions/setup-node@v6 | valid | none | none | Core |
| sonarcloud.yml | push, pull_request, workflow_dispatch | SonarSource/sonarcloud-github-action@ffc3010689be73b8e5ae0c57ce35968afd7909e8 | valid | none | none | Core |
| summary.yml | issues | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>actions/ai-inference@v2<br>gh-cli | valid | none | none | Core |
| tfsec.yml | push, pull_request, schedule | actions/checkout@3df4d485d8ce6d2b61b8d12e8f44cdfffbea301e<br>aquasecurity/tfsec-sarif-action@21ded20e8ca120cd9d3d6ab04ef746477542a608<br>github/codeql-action/upload-sarif@v4 | valid | none | none | Scheduled |
