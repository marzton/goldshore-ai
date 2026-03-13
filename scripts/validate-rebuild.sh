#!/usr/bin/env bash
set -euo pipefail

# Validation helper for cherry-pick verification.
# Phase 2 intentionally targets changed packages when possible.

BASE_REF="${BASE_REF:-origin/main}"

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  if git rev-parse --verify main >/dev/null 2>&1; then
    BASE_REF="main"
  else
    BASE_REF="HEAD~1"
  fi
fi

echo "[validate-rebuild] Comparing changes against: $BASE_REF"

mapfile -t CHANGED_PACKAGES < <(
  git diff --name-only "$BASE_REF...HEAD" \
    | awk -F/ '/^packages\/[^/]+\// {print "./packages/"$2}' \
    | sort -u
)

echo "[validate-rebuild] Phase 1: detect changed package scope"
if ((${#CHANGED_PACKAGES[@]} > 0)); then
  printf '  - %s\n' "${CHANGED_PACKAGES[@]}"
else
  echo "  - no package-level changes detected"
fi

echo "[validate-rebuild] Phase 2: build changed packages (if present)"
if ((${#CHANGED_PACKAGES[@]} > 0)); then
  FILTER_ARGS=()
  for pkg in "${CHANGED_PACKAGES[@]}"; do
    FILTER_ARGS+=(--filter "$pkg")
  done
  pnpm -r "${FILTER_ARGS[@]}" --if-present run build
else
  # Fallback: keep command resilient to packages without a build script.
  pnpm -r --filter "./packages/**" --if-present run build
fi
