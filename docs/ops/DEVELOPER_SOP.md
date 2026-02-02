# DEVELOPER STANDARD OPERATING PROCEDURE (SOP)

This document dictates the process for debugging Git history conflicts and deployment failures within the `goldshore/Astro-goldshore` monorepo.

## 1. Synchronization and Conflict Resolution (SOP-001)

If a Pull Request (PR) shows merge conflicts, the Agent MUST execute a **Forceful Rebase** to synchronize the source branch with the current state of `main`.

| Step | Command/Action | Rationale |
| :--- | :--- | :--- |
| 1. Pull Latest `main` | `git fetch origin main` | Ensures the local Agent environment has the latest, clean security/config fixes. |
| 2. Rebase Source Branch | `git rebase origin/main <source-branch>` | Rewrites the source branch's history on top of the clean `main` branch. |
| 3. Resolve Conflicts | (Automated by Agent or LLM) | Fixes file-level discrepancies introduced by previous merges/squashes. |
| 4. Push Updated Branch | `git push origin <source-branch> --force-with-lease` | Overwrites the remote source branch, making the PR clean and mergeable. |

## 2. Deployment Failure Troubleshooting (SOP-002)

| Error Code | Likely Cause | Fix Action |
| :--- | :--- | :--- |
| **Error 1101** (Worker Crash) | Missing dependency or unhandled runtime exception (e.g., trying to read KV before initialization). | Must verify asynchronous KV config loading in `apps/api-worker/src/index.(ts|js)`. |
| **Error 522** (Connection Timeout) | Incorrect DNS CNAME or Pages Build Output path. | Execute `infra/scripts/enforce-dns.sh` to correct CNAMEs and ensure Pages settings are manually fixed to target `apps/web/dist` or `apps/admin/dist`. |
| **Build Error** (e.g., `wrangler.toml` invalid) | Incorrect placement of `wrangler.toml` in the Pages project. | Ensure `wrangler.toml` only lives at the Worker root (`apps/api-worker/`) and Pages settings are manually configured. |
