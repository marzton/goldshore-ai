#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${1:-main}"
REMOTE_NAME="${2:-origin}"
TARGET_REF="${REMOTE_NAME}/${TARGET_BRANCH}"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: current directory is not a Git repository." >&2
  exit 1
fi

if ! git remote get-url "${REMOTE_NAME}" >/dev/null 2>&1; then
  echo "Error: remote '${REMOTE_NAME}' is not configured." >&2
  echo "Hint: add one with 'git remote add ${REMOTE_NAME} <url>'" >&2
  exit 1
fi

echo "Fetching latest remote state..."
git fetch --all --prune

if ! git show-ref --verify --quiet "refs/remotes/${TARGET_REF}"; then
  echo "Error: target branch '${TARGET_REF}' does not exist." >&2
  exit 1
fi

echo
echo "Target branch: ${TARGET_REF}"
echo

echo "Remote branches already merged into ${TARGET_REF}:"
git branch -r --merged "${TARGET_REF}" | sed '/->/d' || true

echo
printf '%-45s %-12s\n' 'Branch' 'Status'
printf '%-45s %-12s\n' '-----' '------'

mapfile -t branches < <(git for-each-ref --format='%(refname:short)' "refs/remotes/${REMOTE_NAME}" | sed '/->/d' | grep -v "^${TARGET_REF}$" || true)

if [[ ${#branches[@]} -eq 0 ]]; then
  echo "No candidate remote branches found under '${REMOTE_NAME}'."
  exit 0
fi

for branch in "${branches[@]}"; do
  if git merge-base --is-ancestor "${branch}" "${TARGET_REF}"; then
    status="already-merged"
  else
    current_branch="$(git rev-parse --abbrev-ref HEAD)"
    temp_branch="__merge_audit_${TARGET_BRANCH}"

    git checkout -q -B "${temp_branch}" "${TARGET_REF}"

    if git merge --no-commit --no-ff "${branch}" >/dev/null 2>&1; then
      status="mergeable"
    else
      status="conflicts"
    fi

    git merge --abort >/dev/null 2>&1 || true
    git checkout -q "${current_branch}"
    git branch -D "${temp_branch}" >/dev/null 2>&1 || true
  fi

  printf '%-45s %-12s\n' "${branch}" "${status}"
done
