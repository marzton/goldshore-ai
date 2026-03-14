#!/usr/bin/env bash
# scripts/jules-sync.sh - Authenticated sync for gs-* services via Cloudflare Access Service Token

set -euo pipefail

: "${CF_ACCESS_CLIENT_ID:?CF_ACCESS_CLIENT_ID is required}"
: "${CF_ACCESS_CLIENT_SECRET:?CF_ACCESS_CLIENT_SECRET is required}"

BASE_DOMAIN="${GS_BASE_DOMAIN:-goldshore.ai}"
ENDPOINT_PATH="${GS_SYNC_PATH:-/api/health}"
CURL_TIMEOUT="${GS_SYNC_TIMEOUT_SECONDS:-20}"

# Keep service list aligned with active gs-* apps
SERVICES=(
  "gs-web"
  "gs-admin"
  "gs-api"
  "gs-gateway"
  "gs-mail"
  "gs-agent"
  "gs-control"
)

failures=0

for SERVICE in "${SERVICES[@]}"; do
  URL="https://${SERVICE}.${BASE_DOMAIN}${ENDPOINT_PATH}"
  echo "🤖 Jules syncing ${SERVICE} (${URL})..."

  if curl --silent --show-error --fail \
    --max-time "${CURL_TIMEOUT}" \
    --request GET "${URL}" \
    --header "CF-Access-Client-Id: ${CF_ACCESS_CLIENT_ID}" \
    --header "CF-Access-Client-Secret: ${CF_ACCESS_CLIENT_SECRET}" >/dev/null; then
    echo "✅ ${SERVICE} sync check passed"
  else
    echo "❌ ${SERVICE} sync check failed"
    failures=$((failures + 1))
  fi

done

if [ "$failures" -gt 0 ]; then
  echo "Completed with ${failures} failing service check(s)."
  exit 1
fi

echo "✅ All gs-* services synced via Service Token."
