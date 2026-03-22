#!/usr/bin/env bash
set -euo pipefail

readonly DEFAULT_TARGET_URL="https://gs-admin.pages.dev/"
readonly -a ALLOWED_TARGET_HOSTS=(
  "admin.goldshore.ai"
  "admin-preview.goldshore.ai"
  "gs-admin.pages.dev"
  "ops.goldshore.ai"
  "ops-preview.goldshore.ai"
)
readonly -a ALLOWED_TARGET_HOST_PATTERNS=(
  "*.gs-admin.pages.dev"
)

parse_target_url() {
  local url="$1"
  local authority host port

  if [[ ! "$url" =~ ^https://([^/?#]+)(/.*)?$ ]]; then
    return 1
  fi

  authority="${BASH_REMATCH[1]}"
  if [[ "$authority" == *"@"* ]]; then
    return 1
  fi

  host="$authority"
  port="443"
  if [[ "$authority" == *:* ]]; then
    host="${authority%%:*}"
    port="${authority##*:}"
    [[ "$port" =~ ^[0-9]+$ ]] || return 1
  fi

  [[ -n "$host" ]] || return 1

  printf '%s %s\n' "${host,,}" "$port"
}

is_allowed_target_host() {
  local host="$1"

  for allowed_host in "${ALLOWED_TARGET_HOSTS[@]}"; do
    if [[ "$host" == "$allowed_host" ]]; then
      return 0
    fi
  done

  for allowed_pattern in "${ALLOWED_TARGET_HOST_PATTERNS[@]}"; do
    if [[ "$host" == $allowed_pattern ]]; then
      return 0
    fi
  done

  return 1
}

is_allowed_target_url() {
  local url="$1"
  local host port

  read -r host port < <(parse_target_url "$url") || return 1
  [[ "$port" == "443" ]] || return 1
  is_allowed_target_host "$host"
}

main() {
  local target_url="${1:-$DEFAULT_TARGET_URL}"
  local client_id="${CF_ACCESS_CLIENT_ID:-}"
  local client_secret="${CF_ACCESS_CLIENT_SECRET:-}"
  local response_file headers_file status

  if [[ -z "$client_id" || -z "$client_secret" ]]; then
    echo "Missing CF_ACCESS_CLIENT_ID or CF_ACCESS_CLIENT_SECRET" >&2
    exit 1
  fi

  if ! is_allowed_target_url "$target_url"; then
    printf 'Refusing to send Cloudflare Access credentials to unapproved target: %s\n' "$target_url" >&2
    printf 'Allowed hosts: %s; wildcard patterns: %s; required port: 443\n' "${ALLOWED_TARGET_HOSTS[*]}" "${ALLOWED_TARGET_HOST_PATTERNS[*]}" >&2
    exit 1
  fi

  response_file="$(mktemp /tmp/jules-sync-response.XXXXXX.txt)"
  headers_file="$(mktemp /tmp/jules-sync-headers.XXXXXX.txt)"
  trap 'rm -f "${response_file:-}" "${headers_file:-}"' EXIT

  echo "Testing Cloudflare Access service-token auth against: $target_url"

  curl -sS -o "$response_file" -D "$headers_file" \
    -H "CF-Access-Client-Id: $client_id" \
    -H "CF-Access-Client-Secret: $client_secret" \
    "$target_url"

  status=$(awk 'toupper($1) ~ /^HTTP\// {code=$2} END {print code}' "$headers_file")

  echo "HTTP status: ${status:-unknown}"
  if [[ "${status:-}" =~ ^2[0-9][0-9]$ ]]; then
    echo "Service token auth passed."
  else
    echo "Service token auth failed. Response headers:" >&2
    cat "$headers_file" >&2
    exit 1
  fi
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
TARGET_URL="${1:-https://gs-admin.pages.dev/}"
CLIENT_ID="${CF_ACCESS_CLIENT_ID:-}"
CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET:-}"

if [[ -z "$CLIENT_ID" || -z "$CLIENT_SECRET" ]]; then
  echo "Missing CF_ACCESS_CLIENT_ID or CF_ACCESS_CLIENT_SECRET" >&2
  exit 1
fi

headers_file="$(mktemp)"
body_file="$(mktemp)"
trap 'rm -f "$headers_file" "$body_file"' EXIT

echo "Testing Cloudflare Access service-token auth against: $TARGET_URL"

curl -sS -o "$body_file" -D "$headers_file" \
echo "Testing Cloudflare Access service-token auth against: $TARGET_URL"

curl -sS -o /tmp/jules-sync-response.txt -D /tmp/jules-sync-headers.txt \
  -H "CF-Access-Client-Id: $CLIENT_ID" \
  -H "CF-Access-Client-Secret: $CLIENT_SECRET" \
  "$TARGET_URL"

status=$(awk 'toupper($1) ~ /^HTTP\// {code=$2} END {print code}' "$headers_file")

echo "HTTP status: ${status:-unknown}"
if [[ "${status:-}" =~ ^2[0-9][0-9]$ ]]; then
  echo "Service token auth passed."
else
  echo "Service token auth failed. Response headers:" >&2
  cat "$headers_file" >&2
  echo "Response body:" >&2
  cat "$body_file" >&2
  cat /tmp/jules-sync-headers.txt >&2
  exit 1
fi
