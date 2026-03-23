#!/usr/bin/env bash
set -euo pipefail

CLIENT_ID="${CF_ACCESS_CLIENT_ID:-}"
CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET:-}"
BASE_DOMAIN="${GS_BASE_DOMAIN:-goldshore.ai}"
SYNC_PATH="${GS_SYNC_PATH:-/health}"
SERVICES_RAW="${GS_SERVICES:-gs-admin}"
TIMEOUT_SECONDS="${GS_SYNC_TIMEOUT_SECONDS:-20}"
TARGET_ENVIRONMENT="${GS_SYNC_ENVIRONMENT:-production}"
TARGET_BRANCH="${GS_SYNC_TARGET_BRANCH:-main}"

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "Missing CF_ACCESS_CLIENT_ID or CF_ACCESS_CLIENT_SECRET" >&2
  exit 1
fi

normalize_path() {
  local path="$1"
  if [[ -z "$path" ]]; then
    echo "/"
  elif [[ "$path" == /* ]]; then
    echo "$path"
  else
    echo "/$path"
  fi
}

service_url() {
  local service="$1"
  local path="$2"

  case "$service" in
    gs-web) echo "https://${BASE_DOMAIN}${path}" ;;
    gs-admin) echo "https://admin.${BASE_DOMAIN}${path}" ;;
    gs-api) echo "https://api.${BASE_DOMAIN}${path}" ;;
    gs-gateway) echo "https://gw.${BASE_DOMAIN}${path}" ;;
    gs-mail) echo "https://mail.${BASE_DOMAIN}${path}" ;;
    gs-agent) echo "https://agent.${BASE_DOMAIN}${path}" ;;
    gs-control) echo "https://ops.${BASE_DOMAIN}${path}" ;;
    http://*|https://*) echo "$service" ;;
    *)
      echo "Unsupported gs service mapping: $service" >&2
      return 1
      ;;
  esac
}

assert_trusted_host() {
  local url="$1"
  local host
  host=$(python - "$url" <<'PY'
import sys
from urllib.parse import urlparse
print(urlparse(sys.argv[1]).hostname or "")
PY
)

  case "$host" in
    "$BASE_DOMAIN"|"www.$BASE_DOMAIN"|"admin.$BASE_DOMAIN"|"api.$BASE_DOMAIN"|"gw.$BASE_DOMAIN"|"mail.$BASE_DOMAIN"|"agent.$BASE_DOMAIN"|"ops.$BASE_DOMAIN"|*.pages.dev)
      return 0
      ;;
    *)
      echo "Refusing to send service-token headers to untrusted host: ${host:-<none>}" >&2
      return 1
      ;;
  esac
}

SYNC_PATH="$(normalize_path "$SYNC_PATH")"
IFS=',' read -r -a SERVICES <<< "$SERVICES_RAW"

if [[ ${#SERVICES[@]} -eq 0 ]]; then
  echo "No services configured for sync." >&2
  exit 1
fi

echo "Starting GS maintenance sync checks"
echo "Environment: $TARGET_ENVIRONMENT"
echo "Target branch: $TARGET_BRANCH"
echo "Payload path: $SYNC_PATH"
echo "Services: $SERVICES_RAW"
echo

failures=0
for raw_service in "${SERVICES[@]}"; do
  service="$(printf '%s' "$raw_service" | xargs)"
  [[ -n "$service" ]] || continue

  target_url="$(service_url "$service" "$SYNC_PATH")"
  assert_trusted_host "$target_url"

  headers_file="$(mktemp)"
  body_file="$(mktemp)"

  echo "Testing Cloudflare Access service-token auth against [$service]: $target_url"

  if ! curl -sS --max-time "$TIMEOUT_SECONDS" -o "$body_file" -D "$headers_file" \
    -H "CF-Access-Client-Id: $CLIENT_ID" \
    -H "CF-Access-Client-Secret: $CLIENT_SECRET" \
    "$target_url"; then
    echo "Request failed for $service" >&2
    failures=$((failures + 1))
    rm -f "$headers_file" "$body_file"
    continue
  fi

  status=$(awk 'toupper($1) ~ /^HTTP\// {code=$2} END {print code}' "$headers_file")
  echo "HTTP status [$service]: ${status:-unknown}"

  if [[ "${status:-}" =~ ^2[0-9][0-9]$ ]]; then
    echo "Service token auth passed for $service."
  else
    echo "Service token auth failed for $service. Response headers:" >&2
    cat "$headers_file" >&2
    failures=$((failures + 1))
  fi

  rm -f "$headers_file" "$body_file"
  echo
done

if (( failures > 0 )); then
  echo "GS maintenance sync checks failed for ${failures} service(s)." >&2
  exit 1
fi

echo "All GS maintenance sync checks passed."
