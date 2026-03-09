#!/usr/bin/env bash
set -euo pipefail

required_tools=(node pnpm jq)
for tool in "${required_tools[@]}"; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: required tool '$tool' is not installed or not in PATH." >&2
    exit 1
  fi
done

workers_json="$(node <<'NODE'
const fs = require('fs');
const path = require('path');

const appsDir = path.resolve('apps');
if (!fs.existsSync(appsDir)) {
  console.log('[]');
  process.exit(0);
}

const workers = fs
  .readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `apps/${entry.name}`)
  .filter((workerPath) => fs.existsSync(path.resolve(workerPath, 'wrangler.toml')))
  .sort();

process.stdout.write(JSON.stringify(workers));
NODE
)"

if [[ "$(echo "$workers_json" | jq 'length')" -eq 0 ]]; then
  echo "No workers with wrangler.toml found under apps/."
  exit 1
fi

selected_worker=""
if [[ "${1:-}" == "--worker" ]]; then
  shift
  if [[ "${1:-}" == "--" ]]; then
    shift
  fi
  if [[ -z "${1:-}" ]]; then
    echo "Usage: $0 [--worker apps/<worker-name>]" >&2
    exit 1
  fi
  selected_worker="$1"
  if ! echo "$workers_json" | jq -e --arg worker "$selected_worker" 'index($worker) != null' >/dev/null; then
    echo "Error: '$selected_worker' is not a valid worker directory with wrangler.toml." >&2
    echo "Available workers:"
    echo "$workers_json" | jq -r '.[]'
    exit 1
  fi
else
  echo "Available workers:"
  echo "$workers_json" | jq -r 'to_entries[] | "[\(.key + 1)] \(.value)"'
  read -r -p "Select worker number: " selection
  if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
    echo "Invalid selection: must be a number." >&2
    exit 1
  fi
  selected_worker="$(echo "$workers_json" | jq -r --argjson idx "$selection" '.[($idx - 1)] // empty')"
  if [[ -z "$selected_worker" ]]; then
    echo "Invalid selection index: $selection" >&2
    exit 1
  fi
fi

secrets=(
  SESSION_SECRET
  JWTHS256KEY
  HMAC_SECRET
  STRIPE_WEBHOOK_SECRET
  GH_WEBHOOK_SECRET
)

echo "Syncing preview secrets for $selected_worker"
for secret_name in "${secrets[@]}"; do
  echo
  read -r -s -p "Enter value for $secret_name (leave blank to skip): " secret_value
  echo

  if [[ -z "${secret_value:-}" ]]; then
    echo "Skipped $secret_name"
    continue
  fi

  printf '%s' "$secret_value" | pnpm --dir "$selected_worker" exec wrangler secret put "$secret_name" --env preview
  echo "Updated $secret_name"

  unset secret_value
done

echo "Preview secret sync complete for $selected_worker"
