#!/usr/bin/env bash
set -euo pipefail

TARGET_APP="${TARGET_APP:-all}"
REPO_ROOT="${REPO_ROOT:-/workspace/goldshore-ai}"
API_HOST="${API_HOST:-api.goldshore.ai}"
CORE_URL="${CORE_URL:-https://${API_HOST}/v1/status}"
DRY_RUN="${DRY_RUN:-0}"

KV_KEYS=("ALPACA_PAPER" "ENVIRONMENT_TAG")
SECRET_KEYS=("OPENAI_API_KEY" "ANTHROPIC_API_KEY" "AIPROXYSIGNING_KEY")
WORKER_APPS=("apps/gs-api" "apps/gs-gateway")

HEALTH_RESULT="failure"
DNS_RESULT="failure"
TLS_RESULT="failure"
CORE_RESULT="failure"

cf_api_json_or_skip() {
  local operation="$1"
  shift

  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "ℹ️ ${operation} skipped in dry-run"
    return 2
  fi

  "$@"
}

verify_cloudflare_access() {
  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "ℹ️ Cloudflare token verification skipped in dry-run"
    return 0
  fi

  local verify_response
  if ! verify_response="$(cf_api_json_or_skip "Cloudflare token verification" curl -fsS -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")"; then
    echo "❌ Cloudflare token verification failed"
    return 1
  fi

  if jq -e '.success == true' >/dev/null <<<"${verify_response}"; then
    echo "✅ Cloudflare token verification passed"
  else
    echo "❌ Cloudflare token verification returned invalid response"
    return 1
  fi
}

sync_via_api() {
  if [[ "${DRY_RUN}" == "1" ]]; then
    echo "ℹ️ Cloudflare KV/secret sync skipped in dry-run"
    return 0
  fi

  local kv_list
  if ! kv_list="$(npx wrangler kv:namespace list)"; then
    echo "❌ Failed to list Cloudflare KV namespaces"
    return 1
  fi

  local kv_id
  kv_id="$(jq -r '.[] | select(.title | contains("GOLDSHORE_KV")) | .id' <<<"${kv_list}" | head -n1)"

  if [[ -n "${kv_id}" ]]; then
    for key in "${KV_KEYS[@]}"; do
      if [[ -z "$(npx wrangler kv:key get --namespace-id "${kv_id}" "${key}" 2>/dev/null || true)" && -n "${!key:-}" ]]; then
        echo "📤 Syncing ${key} to KV namespace ${kv_id}..."
        npx wrangler kv:key put --namespace-id "${kv_id}" "${key}" "${!key}"
      fi
    done
  else
    echo "⚠️ Warning: GOLDSHORE_KV namespace not found."
  fi

  for app in "${WORKER_APPS[@]}"; do
    if [[ -d "${app}" ]]; then
      pushd "${app}" >/dev/null
      for secret_key in "${SECRET_KEYS[@]}"; do
        if [[ -n "${!secret_key:-}" ]]; then
          echo "🔐 Updating Worker Secret: ${secret_key} for ${app}..."
          echo "${!secret_key}" | npx wrangler secret put "${secret_key}"
        fi
      done
      popd >/dev/null
    fi
  done
}

post_github_deployment_status() {
  if [[ -z "${GITHUB_TOKEN:-}" || -z "${GITHUB_REPOSITORY:-}" || -z "${GITHUB_DEPLOYMENT_ID:-}" ]]; then
    echo "ℹ️ Skipping GitHub deployment status update (missing GITHUB_TOKEN, GITHUB_REPOSITORY, or GITHUB_DEPLOYMENT_ID)."
    return 0
  fi

  local state="$1"
  local description="$2"
  local environment_url="https://${API_HOST}/health"

  curl -fsS -X POST \
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

echo "🚀 Initializing GoldShore Audit & Deployment: ${TARGET_APP}"

cd "${REPO_ROOT}" || {
  echo "❌ Failed to enter ${REPO_ROOT}"
  exit 1
}

node -e "const fs=require('fs'); try { const p=JSON.parse(fs.readFileSync('package.json', 'utf8')); fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\\n'); } catch(e) { console.error('Repairing JSON structure...'); const raw=fs.readFileSync('package.json', 'utf8').replace(/,(\\s*[\\]}])/g, '$1'); fs.writeFileSync('package.json', raw); }"

if [[ -z "${AIPROXYSIGNING_KEY:-}" ]]; then
  export AIPROXYSIGNING_KEY
  AIPROXYSIGNING_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")"
  echo "✅ AIPROXYSIGNING_KEY generated"
fi

if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "🔍 Auditing Cloudflare Production State..."
  verify_cloudflare_access
  sync_via_api
else
  echo "⚠️ Warning: CLOUDFLARE_API_TOKEN not detected."
fi

npm install -g pnpm
pnpm install --no-frozen-lockfile
pnpm run build --filter "./apps/**"

echo "📡 Running Production Health Audit..."

if getent hosts "${API_HOST}" >/dev/null; then
  DNS_RESULT="success"
  echo "✅ DNS resolve ok"
else
  echo "❌ DNS failed"
fi

if echo | openssl s_client -connect "${API_HOST}:443" -servername "${API_HOST}" -verify_return_error 2>/dev/null | grep -q "Verification: OK"; then
  TLS_RESULT="success"
  echo "✅ TLS validation ok"
else
  echo "❌ TLS validation failed"
fi

if curl -fsS -m 10 -H "Accept: application/json" "https://${API_HOST}/health" >/dev/null; then
  HEALTH_RESULT="success"
  echo "✅ /health check passed"
else
  echo "❌ /health check failed"
fi

if curl -fsS -m 10 -H "Accept: application/json" "${CORE_URL}" >/dev/null; then
  CORE_RESULT="success"
  echo "✅ core route check passed (${CORE_URL})"
else
  echo "⚠️ core route check failed/skipped (${CORE_URL})"
fi

if [[ "${DNS_RESULT}" == "success" && "${TLS_RESULT}" == "success" && "${HEALTH_RESULT}" == "success" ]]; then
  post_github_deployment_status "success" "GoldShore health checks passed"
else
  post_github_deployment_status "failure" "GoldShore health checks failed"
  exit 1
fi
