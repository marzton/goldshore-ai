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
log_info() {
  printf '[setup] %s\n' "$1"
}

fail() {
  printf '[setup] ERROR: %s\n' "$1" >&2
  exit 1
}

resolve_pinned_node_version() {
  if [[ -f .nvmrc ]]; then
    tr -d '[:space:]' < .nvmrc
    return
  fi

  if [[ -f .node-version ]]; then
    tr -d '[:space:]' < .node-version
    return
  fi

  fail "No pinned Node.js version found. Add .nvmrc or .node-version at the repository root."
}

normalize_node_version() {
  local version="$1"
  version="${version#v}"
  printf '%s' "$version"
}

assert_node_version() {
  command -v node >/dev/null 2>&1 || fail "Node.js is not installed. Install nvm, then run: nvm install && nvm use"

  local pinned current
  pinned="$(resolve_pinned_node_version)"
  current="$(node --version)"

  local normalized_pinned normalized_current
  normalized_pinned="$(normalize_node_version "$pinned")"
  normalized_current="$(normalize_node_version "$current")"

  if [[ "$normalized_current" != "$normalized_pinned" && "$normalized_current" != "$normalized_pinned."* ]]; then
    cat >&2 <<MSG
[setup] ERROR: Node.js version mismatch.
[setup]   Required (from .nvmrc/.node-version): $pinned
[setup]   Current: $current
[setup] Remediation:
[setup]   nvm install
[setup]   nvm use
MSG
    exit 1
  fi

  log_info "Node.js version check passed ($current)."
}

assert_pnpm() {
  command -v pnpm >/dev/null 2>&1 || fail "pnpm is not installed. Install it, then rerun this setup script."
  log_info "pnpm detected ($(pnpm --version))."
}

install_dependencies() {
  log_info "Installing dependencies with pnpm install --frozen-lockfile ..."
  pnpm install --frozen-lockfile || fail "pnpm install --frozen-lockfile failed. Resolve the errors above and try again."
  log_info "Dependency installation complete."
}

main() {
  assert_node_version
  assert_pnpm
  install_dependencies
}

main "$@"
