#!/usr/bin/env bash
# scripts/jules-sync.sh - Authenticated sync for gs-* services

set -euo pipefail

# These values should come from GitHub Actions Secrets
CLIENT_ID="${CF_ACCESS_CLIENT_ID:?CF_ACCESS_CLIENT_ID is required}"
CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET:?CF_ACCESS_CLIENT_SECRET is required}"

BASE_DOMAIN="${GS_BASE_DOMAIN:-goldshore.ai}"
ENDPOINT_PATH="${GS_SYNC_PATH:-/api/health}"
CURL_TIMEOUT="${GS_SYNC_TIMEOUT_SECONDS:-20}"

# Comma-separated override is supported via GS_SERVICES.
DEFAULT_SERVICES="gs-web,gs-admin,gs-api,gs-gateway,gs-mail,gs-agent,gs-control"
SERVICES_CSV="${GS_SERVICES:-$DEFAULT_SERVICES}"
IFS=',' read -r -a SERVICES <<< "$SERVICES_CSV"

failures=0

for SERVICE_RAW in "${SERVICES[@]}"; do
  SERVICE="$(echo "$SERVICE_RAW" | xargs)"
  [ -n "$SERVICE" ] || continue

  URL="https://${SERVICE}.${BASE_DOMAIN}${ENDPOINT_PATH}"
  echo "🤖 Jules syncing ${SERVICE}..."

  if curl --silent --show-error --fail \
    --max-time "${CURL_TIMEOUT}" \
    --request GET "${URL}" \
    --header "CF-Access-Client-Id: ${CLIENT_ID}" \
    --header "CF-Access-Client-Secret: ${CLIENT_SECRET}" >/dev/null; then
    echo "✅ ${SERVICE} sync check passed"
  else
    echo "❌ ${SERVICE} sync check failed (${URL})"
    failures=$((failures + 1))
  fi
done

if [ "$failures" -gt 0 ]; then
  echo "Completed with ${failures} failing service check(s)."
  exit 1
fi

echo "✅ All gs-* services synced via Service Token."
