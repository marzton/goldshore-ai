#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/sync-preview-secrets.sh [--worker <path>]

Options:
  --worker <path>   Worker path to sync secrets for (e.g. apps/gs-api)
  -h, --help        Show this help message
USAGE
}

require_tool() {
  local tool="$1"
  local install_hint="$2"

  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: required tool '$tool' is not installed." >&2
    echo "Install hint: $install_hint" >&2
    exit 1
  fi
}

worker_path=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --worker)
      if [[ $# -lt 2 ]] || [[ -z "${2:-}" ]] || [[ "$2" == --* ]]; then
        echo "Error: --worker requires a path value." >&2
        usage >&2
        exit 1
      fi
      worker_path="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --*)
      echo "Error: unknown option '$1'." >&2
      usage >&2
      exit 1
      ;;
    *)
      echo "Error: unexpected argument '$1'." >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_tool node "Install Node.js (>=22): https://nodejs.org/en/download"
require_tool pnpm "Install pnpm: npm install -g pnpm"
require_tool jq "Install jq: https://jqlang.github.io/jq/download/"

# Audit workers and emit JSON list of worker paths.
audit_output=""
if ! audit_output="$(pnpm --silent exec node -e '
const { readdirSync, existsSync, statSync } = require("node:fs");
const { join } = require("node:path");
const appsDir = "apps";
if (!existsSync(appsDir)) {
  console.error("apps directory not found");
  process.exit(1);
}
const workers = readdirSync(appsDir)
  .filter((entry) => statSync(join(appsDir, entry)).isDirectory())
  .filter((entry) => existsSync(join(appsDir, entry, "wrangler.toml")))
  .map((entry) => join(appsDir, entry))
  .sort();
process.stdout.write(JSON.stringify({ workers }));
')"; then
  echo "Error: worker audit failed; cannot continue." >&2
  exit 1
fi

if ! jq -e '.workers and (.workers | type == "array") and all(.workers[]; type == "string")' >/dev/null 2>&1 <<<"$audit_output"; then
  echo "Error: worker audit returned invalid JSON; expected {\"workers\": [\"apps/<worker>\", ...]}" >&2
  exit 1
fi

if [[ -z "$worker_path" ]]; then
  echo "Available workers:"
  jq -r '.workers[]' <<<"$audit_output"
  read -r -p "Enter worker path: " worker_path
fi

if ! jq -e --arg worker "$worker_path" '.workers | index($worker) != null' >/dev/null 2>&1 <<<"$audit_output"; then
  echo "Error: worker path '$worker_path' is not present in audited worker list." >&2
  echo "Valid workers:" >&2
  jq -r '.workers[]' <<<"$audit_output" >&2
  exit 1
fi

secrets=(
  SESSION_SECRET
  JWTHS256KEY
  HMAC_SECRET
  STRIPE_WEBHOOK_SECRET
  GH_WEBHOOK_SECRET
)

echo "Syncing preview secrets for: $worker_path"
for secret_name in "${secrets[@]}"; do
  read -r -s -p "Enter value for ${secret_name}: " secret_value
  echo

  if [[ -z "$secret_value" ]]; then
    echo "Skipping ${secret_name}: no value provided."
    continue
  fi

  printf '%s' "$secret_value" | pnpm --silent wrangler secret put "$secret_name" --env preview --cwd "$worker_path" >/dev/null
  unset secret_value
  echo "Updated ${secret_name}"
done

echo "Preview secret sync complete."
