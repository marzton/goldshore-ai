#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NVMRC_FILE="$ROOT_DIR/.nvmrc"
NODE_VERSION_FILE="$ROOT_DIR/.node-version"

source_file=""
required_version=""

if [[ -f "$NVMRC_FILE" ]]; then
  source_file="$NVMRC_FILE"
elif [[ -f "$NODE_VERSION_FILE" ]]; then
  source_file="$NODE_VERSION_FILE"
else
  echo "❌ Error: missing .nvmrc and .node-version at repository root." >&2
  exit 1
fi

required_version="$(tr -d '[:space:]' < "$source_file")"

if [[ -z "$required_version" ]]; then
  echo "❌ Error: pinned Node.js version file is empty: $source_file" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Error: Node.js is not installed or not available in PATH." >&2
  echo "➡️  Install Node.js $required_version, then re-run this script." >&2
  exit 1
fi

current_version="$(node --version | sed 's/^v//')"

if [[ "$current_version" != "$required_version" ]]; then
  echo "❌ Error: Node.js version mismatch." >&2
  echo "   Required: $required_version (from $(basename "$source_file"))" >&2
  echo "   Current:  $current_version" >&2
  echo "➡️  Fix with: nvm install $required_version && nvm use $required_version" >&2
  exit 1
fi

if [[ "${1:-}" == "--check-only" ]]; then
  echo "✅ Node.js version validated: $current_version"
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ Error: pnpm is not installed or not available in PATH." >&2
  exit 1
fi

echo "✅ Node.js version validated: $current_version"
echo "➡️  Installing dependencies with frozen lockfile..."
pnpm install --frozen-lockfile
