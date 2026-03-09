# 2026-03-09 — Preview Binding Stabilization

## Guardrails (CI-Enforced)

To prevent preview deploy regressions caused by incomplete or ambiguous binding configuration, PR CI now enforces static validation of `wrangler.toml` files before any deploy dry-run step.

### 1) Required binding keys per worker type

The validation script checks that each worker declares required sections in `[env.preview]` and that each required binding entry is present with an explicit `id` (or equivalent explicit identifier), not only a `name`.

| Worker type | Required keys in `[env.preview]` |
| --- | --- |
| API / data-plane workers | `kv_namespaces`, `services`, `d1_databases`, `r2_buckets`, `vars` |
| AI-enabled workers | `ai`, `vars` (+ any of `kv_namespaces`, `services`, `d1_databases`, `r2_buckets` if used by that worker) |
| Routing / edge gateway workers | `services`, `vars` |

Notes:
- `vars` is required for all worker types so environment-specific runtime constants are explicit.
- If a worker uses a binding class, the matching section must exist in `[env.preview]` with concrete IDs.

### 2) Repository validation script

PR CI calls a repository script that statically scans every worker config, including archived projects:

- `scripts/validate-preview-bindings.mjs` (or equivalent implementation at `scripts/validate-preview-bindings.*`)
- Scan scope includes all `wrangler.toml` files under:
  - active workspaces (e.g., `apps/**/wrangler.toml`)
  - archived snapshots, including `archive/astro-goldshore/**/wrangler.toml`

Validation is static (no deploy required): parse TOML, detect worker type, verify required keys, and validate binding entries.

### 3) CI order and failure policy

CI stage order is now:

1. **Preview binding validation** (`validate-preview-bindings`)
2. **Deploy dry-run** (only if validation passes)

The PR pipeline fails immediately when validation finds any of the following:

- missing `[env.preview]`
- missing required binding keys for the detected worker type
- binding entries that use name-only configuration where IDs are required
- missing/empty IDs in required binding entries

### 4) Failure message patterns for self-service fixes

The validator emits stable, grep-friendly messages so developers can quickly resolve issues:

- `PREVIEW_BINDINGS_MISSING_ENV: <path>/wrangler.toml is missing [env.preview]`
- `PREVIEW_BINDINGS_MISSING_KEY: <path>/wrangler.toml missing required key '<key>' for worker type '<type>'`
- `PREVIEW_BINDINGS_NAME_ONLY: <path>/wrangler.toml <key>[<binding>] uses 'name' without '<id_field>' in [env.preview]`
- `PREVIEW_BINDINGS_MISSING_ID: <path>/wrangler.toml <key>[<binding>] has empty or missing '<id_field>' in [env.preview]`

Quick-fix guidance:
- Add `[env.preview]` if missing.
- Mirror required binding blocks from production shape, but ensure preview IDs are real preview resource IDs.
- Replace name-only bindings with explicit ID-backed entries.
- Re-run the validator locally before pushing.

