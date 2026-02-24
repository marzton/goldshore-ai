#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
OUT_DIR="$ROOT/reports/audit"
SNAP_DIR="$OUT_DIR/snapshots"

mkdir -p "$SNAP_DIR"
mkdir -p "$OUT_DIR"

# Prioritized scopes from your request
SCOPES=(
  "packages/theme"
  "apps/gs-web"
  "apps/gs-admin"
  ".github/workflows"
  "public"
)

# Root files to always snapshot
ROOT_FILES=(
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
  "astro.config.mjs"
  "tailwind.config.mjs"
  "tsconfig.json"
  "tsconfig.base.json"
  "netlify.toml"
  "CNAME"
  "worker-configuration.d.ts"
)

echo -e "path\tbytes\tmime\text" > "$OUT_DIR/inventory.tsv"

snapshot_file () {
  local rel="$1"
  local abs="$ROOT/$rel"
  mkdir -p "$(dirname "$SNAP_DIR/$rel")"

  local bytes mime ext
  bytes="$(wc -c < "$abs" | tr -d ' ')"
  mime="$(file -b --mime-type "$abs" || echo "unknown")"
  ext="${rel##*.}"

  echo -e "${rel}\t${bytes}\t${mime}\t${ext}" >> "$OUT_DIR/inventory.tsv"

  # First 200 lines (or whole file if shorter)
  sed -n '1,200p' "$abs" > "$SNAP_DIR/$rel"
}

# snapshot root files if present
for f in "${ROOT_FILES[@]}"; do
  if [[ -f "$ROOT/$f" ]]; then
    snapshot_file "$f"
  fi
done

# snapshot scoped files
for s in "${SCOPES[@]}"; do
  if [[ -d "$ROOT/$s" ]]; then
    find "$ROOT/$s" -type f \
      -not -path "*/node_modules/*" \
      -not -path "*/dist/*" \
      -not -path "*/.astro/*" \
      -print0 \
      | while IFS= read -r -d '' abs; do
          rel="${abs#"$ROOT/"}"
          snapshot_file "$rel"
        done
  fi
done

# tree view for human scanning
{
  echo "ROOT: $ROOT"
  echo
  for s in "${SCOPES[@]}"; do
    if [[ -d "$ROOT/$s" ]]; then
      echo "### $s"
      (cd "$ROOT" && find "$s" -maxdepth 4 -print | sed 's|[^/]*/|  |g')
      echo
    else
      echo "### $s (missing)"
      echo
    fi
  done
} > "$OUT_DIR/tree.txt"

echo "Inventory written to: $OUT_DIR"
