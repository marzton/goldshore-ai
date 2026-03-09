#!/usr/bin/env bash
set -euo pipefail

TARGET_APP="${TARGET_APP:-all}"
REPO_ROOT="${REPO_ROOT:-/workspace/goldshore-ai}"
API_HOST="${API_HOST:-api.goldshore.ai}"
CORE_URL="${CORE_URL:-https://${API_HOST}/v1/status}"
CLOUDFLARE_SYNC_MODE="${CLOUDFLARE_SYNC_MODE:-wrangler}"
DRY_RUN="${DRY_RUN:-0}"

KV_KEYS=("ALPACA_PAPER" "ENVIRONMENT_TAG")
SECRET_KEYS=("OPENAI_API_KEY" "ANTHROPIC_API_KEY" "AIPROXYSIGNING_KEY")
WORKER_APPS=("apps/gs-api" "apps/gs-gateway")

HEALTH_RESULT="failure"
DNS_RESULT="failure"
TLS_RESULT="failure"
CORE_RESULT="failure"

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

preflight_env_checks() {
  local has_error=0

  case "${CLOUDFLARE_SYNC_MODE}" in
    wrangler|api)
      ;;
    *)
      echo "❌ Unsupported CLOUDFLARE_SYNC_MODE='${CLOUDFLARE_SYNC_MODE}'. Use 'wrangler' or 'api'."
      return 1
      ;;
  esac

  echo "🔎 Running preflight checks (mode=${CLOUDFLARE_SYNC_MODE}, dry-run=${DRY_RUN})..."

  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    if [[ "${CLOUDFLARE_SYNC_MODE}" == "api" ]]; then
      echo "❌ Missing CLOUDFLARE_API_TOKEN (required in api mode). Export a scoped token with Workers + KV permissions."
      has_error=1
    else
      echo "⚠️ CLOUDFLARE_API_TOKEN is unset. Wrangler sync will be skipped; export it to enable Cloudflare sync."
    fi
  fi

  if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    if [[ "${CLOUDFLARE_SYNC_MODE}" == "api" ]]; then
      echo "❌ Missing CLOUDFLARE_ACCOUNT_ID (required in api mode). Set it from Cloudflare dashboard > Workers & Pages."
      has_error=1
    else
      echo "⚠️ CLOUDFLARE_ACCOUNT_ID is unset. Some Wrangler/API commands may fail; export account id for reliable sync."
    fi
  fi

  if [[ -n "${CF_ZONE_ID:-}" && -z "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    echo "⚠️ Detected CF_ZONE_ID but CLOUDFLARE_ZONE_ID is unset. Rename/export as CLOUDFLARE_ZONE_ID to avoid tooling mismatches."
  fi

  for secret_key in "${SECRET_KEYS[@]}"; do
    if [[ "${secret_key}" == "AIPROXYSIGNING_KEY" ]]; then
      continue
    fi

    if [[ -z "${!secret_key:-}" ]]; then
      echo "⚠️ Missing expected secret ${secret_key}. Export ${secret_key} before deploy to sync Worker secrets."
    fi
  done

  if [[ "${has_error}" -eq 1 ]]; then
    echo "❌ Preflight checks failed due to blocking Cloudflare configuration issues."
    return 1
  fi

  echo "✅ Preflight checks completed"
}

echo "🚀 Initializing GoldShore Audit & Deployment: ${TARGET_APP}"

for arg in "$@"; do
  if [[ "${arg}" == "--dry-run" ]]; then
    DRY_RUN=1
  fi
done

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

preflight_env_checks

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "🧪 Dry-run mode: skipping Cloudflare sync mutations."
elif [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "🔍 Auditing Cloudflare Production State..."

  if curl -fsS -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" >/dev/null; then
    echo "✅ Cloudflare token verification passed"
  else
    echo "❌ Cloudflare token verification failed"
    exit 1
  fi

  KV_ID="$(npx wrangler kv:namespace list | jq -r '.[] | select(.title | contains("GOLDSHORE_KV")) | .id' | head -n1)"

  if [[ -n "${KV_ID}" ]]; then
    for key in "${KV_KEYS[@]}"; do
      if [[ -z "$(npx wrangler kv:key get --namespace-id "${KV_ID}" "${key}" 2>/dev/null || true)" && -n "${!key:-}" ]]; then
        echo "📤 Syncing ${key} to KV namespace ${KV_ID}..."
        npx wrangler kv:key put --namespace-id "${KV_ID}" "${key}" "${!key}"
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
