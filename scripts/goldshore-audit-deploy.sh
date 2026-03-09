#!/usr/bin/env bash
set -euo pipefail

TARGET_APP="${TARGET_APP:-all}"
REPO_ROOT="${REPO_ROOT:-/workspace/goldshore-ai}"
API_HOST="${API_HOST:-api.goldshore.ai}"
CORE_URL="${CORE_URL:-https://${API_HOST}/v1/status}"
CLOUDFLARE_SYNC_MODE="${CLOUDFLARE_SYNC_MODE:-wrangler}" # wrangler|api
CLOUDFLARE_WORKER_ENV="${CLOUDFLARE_WORKER_ENV:-production}"
DRY_RUN="${DRY_RUN:-0}"

# Alias fallback support
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-}}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-${CF_ACCOUNT_ID:-}}"
CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-${CF_ZONE_ID:-}}"

# JSON-configurable secret/KV definitions and values.
SECRET_KEYS_JSON="${SECRET_KEYS_JSON:-[\"OPENAI_API_KEY\",\"ANTHROPIC_API_KEY\",\"AIPROXYSIGNING_KEY\"]}"
KV_KEYS_JSON="${KV_KEYS_JSON:-[\"ALPACA_PAPER\",\"ENVIRONMENT_TAG\"]}"
WORKER_APPS_JSON="${WORKER_APPS_JSON:-[\"apps/gs-api\",\"apps/gs-gateway\"]}"
SECRET_VALUES_JSON="${SECRET_VALUES_JSON:-{}}"
KV_VALUES_JSON="${KV_VALUES_JSON:-{}}"

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

require_json_env() {
  local name="$1"
  local value="$2"
  jq -e . >/dev/null <<<"${value}" || {
    echo "❌ ${name} must contain valid JSON"
    exit 1
  }
}

urlencode() {
  jq -rn --arg v "$1" '$v|@uri'
}

resolve_config_value() {
  local json_blob="$1"
  local key="$2"
  local resolved
  resolved="$(jq -r --arg k "$key" 'if has($k) and .[$k] != null then .[$k] else "" end' <<<"${json_blob}")"
  if [[ -n "${resolved}" ]]; then
    printf '%s' "${resolved}"
  else
    printf '%s' "${!key:-}"
  fi
}

init_lists_from_json() {
  require_json_env "SECRET_KEYS_JSON" "${SECRET_KEYS_JSON}"
  require_json_env "KV_KEYS_JSON" "${KV_KEYS_JSON}"
  require_json_env "WORKER_APPS_JSON" "${WORKER_APPS_JSON}"
  require_json_env "SECRET_VALUES_JSON" "${SECRET_VALUES_JSON}"
  require_json_env "KV_VALUES_JSON" "${KV_VALUES_JSON}"

  mapfile -t SECRET_KEYS < <(jq -r '.[]' <<<"${SECRET_KEYS_JSON}")
  mapfile -t KV_KEYS < <(jq -r '.[]' <<<"${KV_KEYS_JSON}")
  mapfile -t WORKER_APPS < <(jq -r '.[]' <<<"${WORKER_APPS_JSON}")
}

preflight_env_checks() {
  if [[ -n "${CF_ZONE_ID:-}" && -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    echo "⚠️ Using CF_ZONE_ID fallback; prefer CLOUDFLARE_ZONE_ID"
  fi

  if [[ -z "${ANTHROPIC_API_KEY:-}" && "$(resolve_config_value "${SECRET_VALUES_JSON}" "ANTHROPIC_API_KEY")" == "" ]]; then
    echo "⚠️ ANTHROPIC_API_KEY is missing; Claude-related routing may fail"
  fi

  if [[ "${CLOUDFLARE_SYNC_MODE}" == "api" && -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    echo "❌ CLOUDFLARE_ACCOUNT_ID is required for CLOUDFLARE_SYNC_MODE=api"
    exit 1
  fi
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
    -d "$(jq -n --arg state "$state" --arg description "$description" --arg environment_url "$environment_url" '{state: $state, description: $description, environment_url: $environment_url}')" >/dev/null

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
    echo "🧪 [dry-run] curl ${args[*]}" >&2
    return 0
  fi

  curl "${args[@]}"
}

verify_cloudflare_access() {
  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "🧪 [dry-run] Skipping live Cloudflare token/account verification"
    return 0
  fi

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
  local kv_id
  kv_id="$(cf_api GET "/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces" | jq -r '.result[] | select(.title | contains("GOLDSHORE_KV")) | .id' | head -n1)"

  if [[ -z "$kv_id" ]]; then
    echo "⚠️ Warning: GOLDSHORE_KV namespace not found (API mode)."
  else
    for key in "${KV_KEYS[@]}"; do
      local key_value encoded_key
      key_value="$(resolve_config_value "${KV_VALUES_JSON}" "${key}")"
      if [[ -n "${key_value}" ]]; then
        encoded_key="$(urlencode "${key}")"
        echo "📤 API sync KV ${key} -> ${kv_id}"
        cf_api PUT "/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${kv_id}/values/${encoded_key}" "text/plain" "${key_value}" >/dev/null
      fi
    done
  fi

  for app in "${WORKER_APPS[@]}"; do
    local service_name
    service_name="${app##*/}"

    local existing_secret_names="[]"
    if [[ "${DRY_RUN}" != "1" ]]; then
      existing_secret_names="$(cf_api GET "/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/services/${service_name}/environments/${CLOUDFLARE_WORKER_ENV}/secrets" | jq -c '[.result[]?.name]')"
    fi

    for secret_key in "${SECRET_KEYS[@]}"; do
      local secret_val
      secret_val="$(resolve_config_value "${SECRET_VALUES_JSON}" "${secret_key}")"
      if [[ -n "${secret_val}" ]]; then
        echo "🔐 API updating secret ${secret_key} for ${service_name} (${CLOUDFLARE_WORKER_ENV})"
        cf_api PUT "/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/services/${service_name}/environments/${CLOUDFLARE_WORKER_ENV}/secrets" "application/json" "$(jq -n --arg n "$secret_key" --arg t "${secret_val}" '{name:$n,text:$t,type:"secret_text"}')" >/dev/null

        if [[ "${DRY_RUN}" == "1" ]]; then
          echo "🧪 [dry-run] Would verify secret exists after update: ${secret_key}"
        elif jq -e --arg n "$secret_key" '.[] | select(.==$n)' <<<"${existing_secret_names}" >/dev/null; then
          echo "✅ Secret present (pre-update check): ${secret_key}"
        else
          echo "ℹ️ Secret did not exist before update: ${secret_key}"
        fi
      fi
    done
  done
}

sync_via_wrangler() {
  local kv_id
  kv_id="$(npx wrangler kv:namespace list | jq -r '.[] | select(.title | contains("GOLDSHORE_KV")) | .id' | head -n1)"

  if [[ -n "${kv_id}" ]]; then
    for key in "${KV_KEYS[@]}"; do
      local key_value
      key_value="$(resolve_config_value "${KV_VALUES_JSON}" "${key}")"
      if [[ -z "$(npx wrangler kv:key get --namespace-id "${kv_id}" "${key}" 2>/dev/null || true)" && -n "${key_value}" ]]; then
        echo "📤 Wrangler sync ${key} -> ${kv_id}"
        if [[ "${DRY_RUN}" != "1" ]]; then
          npx wrangler kv:key put --namespace-id "${kv_id}" "${key}" "${key_value}"
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
        local secret_val
        secret_val="$(resolve_config_value "${SECRET_VALUES_JSON}" "${secret_key}")"
        if [[ -n "${secret_val}" ]]; then
          echo "🔐 Wrangler updating secret ${secret_key} for ${app}"
          if [[ "${DRY_RUN}" != "1" ]]; then
            echo "${secret_val}" | npx wrangler secret put "${secret_key}"
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

init_lists_from_json
preflight_env_checks

node -e "const fs=require('fs'); try { const p=JSON.parse(fs.readFileSync('package.json', 'utf8')); fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n'); } catch(e) { const raw=fs.readFileSync('package.json', 'utf8').replace(/,(\s*[\]}])/g, '$1'); fs.writeFileSync('package.json', raw); }"

if [[ -z "$(resolve_config_value "${SECRET_VALUES_JSON}" "AIPROXYSIGNING_KEY")" && -z "${AIPROXYSIGNING_KEY:-}" ]]; then
  export AIPROXYSIGNING_KEY
  AIPROXYSIGNING_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
  SECRET_VALUES_JSON="$(jq -c --arg k "AIPROXYSIGNING_KEY" --arg v "${AIPROXYSIGNING_KEY}" '. + {($k): $v}' <<<"${SECRET_VALUES_JSON}")"
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
