#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
REDIRECTS="$ROOT/apps/gs-web/public/_redirects"
ASTRO_CFG="$ROOT/apps/gs-web/astro.config.mjs"

echo "Verifying gs-website routing guardrails..."

test -f "$REDIRECTS"
test -f "$ASTRO_CFG"

# Legacy path redirects (301)
rg -n "^/developer-hub[[:space:]]+/developer[[:space:]]+301$" "$REDIRECTS"
rg -n "^/old-home[[:space:]]+/[[:space:]]+301$" "$REDIRECTS"
rg -n "^/about-us[[:space:]]+/about[[:space:]]+301$" "$REDIRECTS"
rg -n "^/company[[:space:]]+/about[[:space:]]+301$" "$REDIRECTS"

# CORS-safe proxy rewrites (200)
rg -n "^/v1/status/\\*[[:space:]]+https://api\\.goldshore\\.ai/status/:splat[[:space:]]+200$" "$REDIRECTS"
rg -n "^/v1/telemetry/\\*[[:space:]]+https://api\\.goldshore\\.ai/telemetry/:splat[[:space:]]+200$" "$REDIRECTS"

# Framework-level alias retained (allow single or double quotes and flexible spacing)
rg -n "['\"]/developer-hub['\"][[:space:]]*:[[:space:]]*['\"]/developer['\"]" "$ASTRO_CFG"

echo "✅ gs-website routing guardrails verified."
