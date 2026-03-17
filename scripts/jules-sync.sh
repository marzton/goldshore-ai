#!/usr/bin/env bash
set -euo pipefail

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
  exit 1
fi
