#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
OUT_DIR="$ROOT/reports/audit"
mkdir -p "$OUT_DIR"

run () {
  local name="$1"; shift
  echo "==> $name: $*" | tee -a "$OUT_DIR/static-checks.log"
  # Capture all output
  ( "$@" ) 2>&1 | tee -a "$OUT_DIR/static-checks.log"
  echo "" | tee -a "$OUT_DIR/static-checks.log"
}

# Make sure pnpm is available
run "versions" bash -lc "node -v && pnpm -v || true"

run "install" bash -lc "cd \"$ROOT\" && pnpm -w install"

# Builds
run "gs-web build" bash -lc "cd \"$ROOT\" && pnpm -C apps/gs-web build"
run "gs-admin build" bash -lc "cd \"$ROOT\" && pnpm -C apps/gs-admin build"

# Lint (only if scripts exist)
if jq -e '.scripts.lint' "$ROOT/package.json" >/dev/null 2>&1; then
  run "lint" bash -lc "cd \"$ROOT\" && pnpm -w lint"
fi

echo "Static checks log: $OUT_DIR/static-checks.log"
