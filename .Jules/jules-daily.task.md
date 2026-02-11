# Jules Daily Automation

The daily automation should sweep every branch, run the Turbo-powered pnpm scripts, and report repo health without risky changes.

## Commands
- Use the root scripts so Turbo controls ordering: `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm typecheck`.
- If a script is missing, skip it with a warning instead of failing the run.
- Allow a per-run override: `JULES_FORCE_RECURSIVE=1` forces `pnpm -r <script>`.
- If lint autofix is requested, run `pnpm lint -- --fix` (non-recursive by default). Run `pnpm format` when the script exists and a format/fix flag is set.

## Branch scope
- Default: sweep all remote branches after `git fetch --all --prune`.
- `JULES_BRANCH_SCOPE=current` (or `--branch-scope current`) limits to the checked-out ref.
- `JULES_BRANCHES="main,dev"` (or `--branches main,dev`) restricts to a specific set.
- Support `--dry-run` to avoid branch checkouts while still running the checks on the current tree.

## Checks (read-only unless fixes are explicitly requested)
1. **Workspace integrity**
   - Flag recursion paths like `*/astro-goldshore/astro-goldshore/*`.
   - Flag nested monorepo roots: `.git/`, `pnpm-workspace.yaml`, `turbo.json`, or a package root copied into another app.
   - Output a deterministic (sorted) list of offending paths.
2. **Wrangler sanity**
   - For every `wrangler.toml`, require `name`, `main`, and `compatibility_date` keys.
   - Fail fast if secret-like strings are committed (`CF_API_TOKEN=`, `CLOUDFLARE_API_TOKEN=`, `ACCOUNT_ID=`, `SECRET=`, `PRIVATE_KEY=`).
   - Warn when no `route`/`routes` entry is present for deployed workers.
3. **Astro sanity**
   - For each `apps/**/astro.config.*`, ensure the Cloudflare adapter is referenced when `output: "server"` (or when a Cloudflare target is implied).
   - Warn if the app is missing `src/env.d.ts`.
4. **Generated artifacts**
   - Identify tracked files that match ignored/ephemeral targets: `.astro/`, `dist/`, `.wrangler/`, `.turbo/`, `coverage/`, and generated OpenAPI JSON.
   - Default action is reporting. When fixes are enabled, run `git rm --cached` on tracked ignored artifacts.

## Allowed fixes
- Lint/format autofix when requested.
- Removing tracked ignored artifacts from Git history (`git rm --cached`).
- No automatic moves or refactors; anything non-trivial should be raised as a report/issue instead.
