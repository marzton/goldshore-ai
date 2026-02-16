#!/usr/bin/env bash
set -euo pipefail

REPORT_PATH="reports/branch-audit.md"
BASE_REF="origin/main"
INTEGRATION_BRANCH="integration/consolidation-check/$(date -u +%Y%m%dT%H%M%SZ)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report)
      REPORT_PATH="$2"; shift 2 ;;
    --base)
      BASE_REF="$2"; shift 2 ;;
    --integration)
      INTEGRATION_BRANCH="$2"; shift 2 ;;
    -h|--help)
      cat <<USAGE
Usage: scripts/consolidate-main-coverage.sh [--report <path>] [--base <ref>] [--integration <name>]
USAGE
      exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1 ;;
  esac
done

now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
head_sha="$(git rev-parse HEAD)"
mkdir -p "$(dirname "$REPORT_PATH")"

write_blocked() {
  local reason="$1"
  cat > "$REPORT_PATH" <<MARKDOWN
# Branch Audit Report

- Generated at (UTC): ${now}
- Source commit (local HEAD): \
\`${head_sha}\`

## Status

- ⚠️ Audit blocked: ${reason}

## Open Conflicts

- Source of truth unavailable until remote branch refs are accessible.

## Next Step

- Configure credentials for the upstream repository, then rerun:
  - \`git fetch --all --prune\`
  - \`bash scripts/consolidate-main-coverage.sh\`
MARKDOWN
}

if ! git remote get-url origin >/dev/null 2>&1; then
  write_blocked "no \`origin\` remote is configured in this checkout."
  exit 0
fi

if ! git fetch --all --prune >/dev/null 2>&1; then
  write_blocked "unable to fetch \`origin/*\` refs (authentication or connectivity issue)."
  exit 0
fi

if ! git show-ref --verify --quiet "refs/remotes/${BASE_REF}"; then
  write_blocked "base ref \`${BASE_REF}\` is missing after fetch."
  exit 0
fi

mapfile -t remote_refs < <(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed '/^origin\/HEAD$/d; /^origin\/main$/d')

if [[ ${#remote_refs[@]} -eq 0 ]]; then
  cat > "$REPORT_PATH" <<MARKDOWN
# Branch Audit Report

- Generated at (UTC): ${now}
- Source commit (local HEAD): \
\`${head_sha}\`

## Status

- ✅ No remote branches found beyond \`${BASE_REF}\`.

## Open Conflicts

- None detected.
MARKDOWN
  exit 0
fi

merged=()
unmerged=()
for ref in "${remote_refs[@]}"; do
  if git merge-base --is-ancestor "$ref" "$BASE_REF"; then
    merged+=("$ref")
  else
    unmerged+=("$ref")
  fi
done

conflict_lines=()
if [[ ${#unmerged[@]} -gt 0 ]]; then
  current_branch="$(git rev-parse --abbrev-ref HEAD)"
  git switch -C "$INTEGRATION_BRANCH" "$BASE_REF" >/dev/null
  for ref in "${unmerged[@]}"; do
    if git merge --no-commit --no-ff "$ref" >/dev/null 2>&1; then
      conflict_lines+=("- ✅ ${ref#origin/}: merges cleanly into ${BASE_REF}")
      git merge --abort >/dev/null 2>&1 || true
    else
      conflict_files="$(git diff --name-only --diff-filter=U | paste -sd ', ' -)"
      if [[ -z "$conflict_files" ]]; then
        conflict_files="(files not detected)"
      fi
      conflict_lines+=("- ❌ ${ref#origin/}: conflicts (${conflict_files})")
      git merge --abort >/dev/null 2>&1 || true
    fi
  done
  git switch "$current_branch" >/dev/null
  git branch -D "$INTEGRATION_BRANCH" >/dev/null 2>&1 || true
fi

{
  echo "# Branch Audit Report"
  echo
  echo "- Generated at (UTC): ${now}"
  echo "- Source commit (local HEAD): \\`${head_sha}\\`"
  echo "- Base ref: \\`${BASE_REF}\\`"
  echo
  echo "## Consolidation Summary"
  echo
  echo "- Total remote branches reviewed: ${#remote_refs[@]}"
  echo "- Already consolidated into main: ${#merged[@]}"
  echo "- Not yet on main: ${#unmerged[@]}"
  echo
  echo "## Branches already on main"
  echo
  if [[ ${#merged[@]} -eq 0 ]]; then
    echo "- None"
  else
    for ref in "${merged[@]}"; do
      echo "- ${ref#origin/}"
    done
  fi
  echo
  echo "## Branches missing from main"
  echo
  if [[ ${#unmerged[@]} -eq 0 ]]; then
    echo "- None"
  else
    for ref in "${unmerged[@]}"; do
      echo "- ${ref#origin/}"
    done
  fi
  echo
  echo "## Conflict Probe (unmerged branches)"
  echo
  if [[ ${#conflict_lines[@]} -eq 0 ]]; then
    echo "- None"
  else
    printf '%s\n' "${conflict_lines[@]}"
  fi
} > "$REPORT_PATH"
