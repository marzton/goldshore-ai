#!/usr/bin/env bash
set -euo pipefail

TARGET_APP="${TARGET_APP:-all}"
REPO_ROOT="${REPO_ROOT:-/workspace/goldshore-ai}"
API_HOST="${API_HOST:-api.goldshore.ai}"
CORE_URL="${CORE_URL:-https://${API_HOST}/v1/status}"
CLOUDFLARE_SYNC_MODE="${CLOUDFLARE_SYNC_MODE:-wrangler}" # wrangler|api
DRY_RUN="${DRY_RUN:-0}"

KV_KEYS=("ALPACA_PAPER" "ENVIRONMENT_TAG")
SECRET_KEYS=("OPENAI_API_KEY" "ANTHROPIC_API_KEY" "AIPROXYSIGNING_KEY")
WORKER_APPS=("apps/gs-api" "apps/gs-gateway")

HEALTH_RESULT="failure"
DNS_RESULT="failure"
TLS_RESULT="failure"

run_cmd() {
  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "🧪 [dry-run] $*"
    return 0
  fi
  "$@"
}

post_github_deployment_status() {
  if [[ -z "${GITHUB_TOKEN:-}" || -z "${GITHUB_REPOSITORY:-}" || -z "${GITHUB_DEPLOYMENT_ID:-}" ]]; then
    echo "ℹ️ Skipping GitHub deployment status update (missing GITHUB_TOKEN, GITHUB_REPOSITORY, or GITHUB_DEPLOYMENT_ID)."
    return 0
  fi

  local state="$1"
  local description="$2"
  local environment_url="https://${API_HOST}/health"

  run_cmd curl -fsS -X POST \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${GITHUB_REPOSITORY}/deployments/${GITHUB_DEPLOYMENT_ID}/statuses" \
    -d "$(jq -n \
      --arg state "$state" \
      --arg description "$description" \
      --arg environment_url "$environment_url" \
      '{state: $state, description: $description, environment_url: $environment_url}')" >/dev/null

  echo "✅ Posted GitHub deployment status: ${state}"
}

cf_api() {
  local method="$1"
  local path="$2"
  local content_type="${3:-application/json}"
  local data="${4:-}"

  local args=(-fsS -X "$method" "https://api.cloudflare.com/client/v4${path}" -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: ${content_type}")
  if [[ -n "$data" ]]; then
    args+=(-d "$data")
  fi

  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "🧪 [dry-run] curl ${args[*]}"
    return 0
  fi

  curl "${args[@]}"
}

verify_cloudflare_access() {
  cf_api GET "/user/tokens/verify" >/dev/null
  echo "✅ Cloudflare token verification passed"

  if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    cf_api GET "/accounts" | jq -e --arg aid "$CLOUDFLARE_ACCOUNT_ID" '.result[] | select(.id==$aid)' >/dev/null
    echo "✅ Cloudflare account access verified (${CLOUDFLARE_ACCOUNT_ID})"
  else
    echo "ℹ️ CLOUDFLARE_ACCOUNT_ID not set; account-level API checks skipped."
  fi
}

sync_via_api() {
  if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    echo "❌ CLOUDFLARE_ACCOUNT_ID is required for CLOUDFLARE_SYNC_MODE=api"
    return 1
  fi

  local kv_id
  kv_id="$(cf_api GET "/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces" | jq -r '.result[] | select(.title | contains("GOLDSHORE_KV")) | .id' | head -n1)"

  if [[ -z "$kv_id" ]]; then
    echo "⚠️ Warning: GOLDSHORE_KV namespace not found (API mode)."
  else
    for key in "${KV_KEYS[@]}"; do
      if [[ -n "${!key:-}" ]]; then
        echo "📤 API sync KV ${key} -> ${kv_id}"
        cf_api PUT "/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${kv_id}/values/${key}" "text/plain" "${!key}" >/dev/null
      fi
    done
  fi

  for app in "${WORKER_APPS[@]}"; do
    local service_name
    service_name="${app##*/}"
    for secret_key in "${SECRET_KEYS[@]}"; do
      if [[ -n "${!secret_key:-}" ]]; then
        echo "🔐 API updating secret ${secret_key} for ${service_name}"
        cf_api PUT "/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/services/${service_name}/environments/production/secrets" "application/json" "$(jq -n --arg n "$secret_key" --arg t "${!secret_key}" '{name:$n,text:$t,type:"secret_text"}')" >/dev/null
      fi
    done
  done
}

sync_via_wrangler() {
  local kv_id
  kv_id="$(npx wrangler kv:namespace list | jq -r '.[] | select(.title | contains("GOLDSHORE_KV")) | .id' | head -n1)"

  if [[ -n "${kv_id}" ]]; then
    for key in "${KV_KEYS[@]}"; do
      if [[ -z "$(npx wrangler kv:key get --namespace-id "${kv_id}" "${key}" 2>/dev/null || true)" && -n "${!key:-}" ]]; then
        echo "📤 Wrangler sync ${key} -> ${kv_id}"
        if [[ "${DRY_RUN}" != "1" ]]; then
          npx wrangler kv:key put --namespace-id "${kv_id}" "${key}" "${!key}"
        else
          echo "🧪 [dry-run] npx wrangler kv:key put --namespace-id ${kv_id} ${key} <redacted>"
        fi
      fi
    done
  else
    echo "⚠️ Warning: GOLDSHORE_KV namespace not found (wrangler mode)."
  fi

  for app in "${WORKER_APPS[@]}"; do
    if [[ -d "${app}" ]]; then
      pushd "${app}" >/dev/null
      for secret_key in "${SECRET_KEYS[@]}"; do
        if [[ -n "${!secret_key:-}" ]]; then
          echo "🔐 Wrangler updating secret ${secret_key} for ${app}"
          if [[ "${DRY_RUN}" != "1" ]]; then
            echo "${!secret_key}" | npx wrangler secret put "${secret_key}"
          else
            echo "🧪 [dry-run] echo <redacted> | npx wrangler secret put ${secret_key}"
          fi
        fi
      done
      popd >/dev/null
    fi
  done
}

echo "🚀 Initializing GoldShore Audit & Deployment: ${TARGET_APP}"
cd "${REPO_ROOT}" || { echo "❌ Failed to enter ${REPO_ROOT}"; exit 1; }

node -e "const fs=require('fs'); try { const p=JSON.parse(fs.readFileSync('package.json', 'utf8')); fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n'); } catch(e) { const raw=fs.readFileSync('package.json', 'utf8').replace(/,(\s*[\]}])/g, '$1'); fs.writeFileSync('package.json', raw); }"

if [[ -z "${AIPROXYSIGNING_KEY:-}" ]]; then
  export AIPROXYSIGNING_KEY
  AIPROXYSIGNING_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
  echo "✅ AIPROXYSIGNING_KEY generated"
fi

if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "🔍 Auditing Cloudflare Production State..."
  verify_cloudflare_access

  case "${CLOUDFLARE_SYNC_MODE}" in
    api) sync_via_api ;;
    wrangler) sync_via_wrangler ;;
    *) echo "❌ Invalid CLOUDFLARE_SYNC_MODE=${CLOUDFLARE_SYNC_MODE}; use wrangler|api"; exit 1 ;;
  esac

  if [[ -n "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    cf_api GET "/zones/${CLOUDFLARE_ZONE_ID}/healthchecks" >/dev/null || true
  fi
  if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    cf_api GET "/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/data-usage" >/dev/null || true
  fi
else
  echo "⚠️ Warning: CLOUDFLARE_API_TOKEN not detected."
fi

if ! command -v pnpm >/dev/null 2>&1; then
  run_cmd npm install -g pnpm
fi
run_cmd pnpm install --no-frozen-lockfile
run_cmd pnpm run build --filter "./apps/**"

echo "📡 Running Production Health Audit..."

if getent hosts "${API_HOST}" >/dev/null; then DNS_RESULT="success"; echo "✅ DNS resolve ok"; else echo "❌ DNS failed"; fi
if echo | openssl s_client -connect "${API_HOST}:443" -servername "${API_HOST}" -verify_return_error 2>/dev/null | grep -q "Verification: OK"; then TLS_RESULT="success"; echo "✅ TLS validation ok"; else echo "❌ TLS validation failed"; fi
if curl -fsS -m 10 -H "Accept: application/json" "https://${API_HOST}/health" >/dev/null; then HEALTH_RESULT="success"; echo "✅ /health check passed"; else echo "❌ /health check failed"; fi
if curl -fsS -m 10 -H "Accept: application/json" "${CORE_URL}" >/dev/null; then echo "✅ core route check passed (${CORE_URL})"; else echo "⚠️ core route check failed/skipped (${CORE_URL})"; fi

if [[ "${DNS_RESULT}" == "success" && "${TLS_RESULT}" == "success" && "${HEALTH_RESULT}" == "success" ]]; then
  post_github_deployment_status "success" "GoldShore health checks passed"
else
  post_github_deployment_status "failure" "GoldShore health checks failed"
  exit 1
fi
