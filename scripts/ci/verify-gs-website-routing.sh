#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
REDIRECTS="$ROOT/apps/gs-web/public/_redirects"
ASTRO_CFG="$ROOT/apps/gs-web/astro.config.mjs"

echo "Verifying GS website routing guardrails..."

test -f "$REDIRECTS" || { echo "ERROR: Redirects file not found at '$REDIRECTS'." >&2; exit 1; }
test -f "$ASTRO_CFG" || { echo "ERROR: Astro config file not found at '$ASTRO_CFG'." >&2; exit 1; }

# Legacy path redirects (301)
rg -n "^/developer-hub[[:space:]]+/developer[[:space:]]+301$" "$REDIRECTS" || { echo "ERROR: Missing legacy redirect: /developer-hub -> /developer (301) in '$REDIRECTS'." >&2; exit 1; }
rg -n "^/old-home[[:space:]]+/[[:space:]]+301$" "$REDIRECTS" || { echo "ERROR: Missing legacy redirect: /old-home -> / (301) in '$REDIRECTS'." >&2; exit 1; }
rg -n "^/about-us[[:space:]]+/about[[:space:]]+301$" "$REDIRECTS" || { echo "ERROR: Missing legacy redirect: /about-us -> /about (301) in '$REDIRECTS'." >&2; exit 1; }
rg -n "^/company[[:space:]]+/about[[:space:]]+301$" "$REDIRECTS" || { echo "ERROR: Missing legacy redirect: /company -> /about (301) in '$REDIRECTS'." >&2; exit 1; }

# CORS-safe proxy rewrites (200)
rg -n "^/v1/status/\\*[[:space:]]+https://api\\.goldshore\\.ai/status/:splat[[:space:]]+200$" "$REDIRECTS" || { echo "ERROR: Missing CORS-safe proxy rewrite for /v1/status/* in '$REDIRECTS'." >&2; exit 1; }
rg -n "^/v1/telemetry/\\*[[:space:]]+https://api\\.goldshore\\.ai/telemetry/:splat[[:space:]]+200$" "$REDIRECTS" || { echo "ERROR: Missing CORS-safe proxy rewrite for /v1/telemetry/* in '$REDIRECTS'." >&2; exit 1; }

# Framework-level alias retained (allow single or double quotes and flexible spacing)
rg -n "['\"]/developer-hub['\"][[:space:]]*:[[:space:]]*['\"]/developer['\"]" "$ASTRO_CFG" || { echo "ERROR: Missing framework-level alias mapping '/developer-hub' to '/developer' in '$ASTRO_CFG'." >&2; exit 1; }

echo "✅ gs-website routing guardrails verified."
