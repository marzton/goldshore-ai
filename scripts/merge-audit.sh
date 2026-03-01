#!/usr/bin/env bash
set -euo pipefail

requested_target="${1:-origin/main}"
FETCH_MODE="${MERGE_AUDIT_FETCH:-1}"

if [[ "$FETCH_MODE" == "1" ]]; then
  git fetch --all --prune >/dev/null 2>&1 || true
fi

resolve_target() {
  local target="$1"

  if git rev-parse --verify "$target" >/dev/null 2>&1; then
    echo "$target"
    return 0
  fi

  local local_fallback="${target#origin/}"
  if [[ "$local_fallback" != "$target" ]] && git rev-parse --verify "$local_fallback" >/dev/null 2>&1; then
    echo "$local_fallback"
    return 0
  fi

  if git rev-parse --verify main >/dev/null 2>&1; then
    echo "main"
    return 0
  fi

  local current_branch
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  if [[ -n "$current_branch" ]] && git rev-parse --verify "$current_branch" >/dev/null 2>&1; then
    echo "$current_branch"
    return 0
  fi

  return 1
}

if ! TARGET_BRANCH=$(resolve_target "$requested_target"); then
  echo "Target branch not found: $requested_target" >&2
  echo "Usage: scripts/merge-audit.sh [origin/main|origin/develop|origin/staging|main]" >&2
  exit 1
fi

echo "Merge audit target: $TARGET_BRANCH"
echo
printf "%-40s %-12s %-16s %-16s\n" "BRANCH" "MERGE" "BEHIND(target)" "AHEAD(target)"
printf "%-40s %-12s %-16s %-16s\n" "----------------------------------------" "------------" "----------------" "----------------"

mapfile -t remote_branches < <(git for-each-ref --format='%(refname:short)' refs/remotes/origin | rg -v '^origin/HEAD$' || true)
if [[ ${#remote_branches[@]} -eq 0 ]]; then
  mapfile -t remote_branches < <(git for-each-ref --format='%(refname:short)' refs/heads)
fi

mergeable=0
conflicted=0

for branch in "${remote_branches[@]}"; do
  if [[ "$branch" == "$TARGET_BRANCH" || "$branch" == "origin/$TARGET_BRANCH" ]]; then
    continue
  fi

  base_commit=$(git merge-base "$TARGET_BRANCH" "$branch")
  left_right=$(git rev-list --left-right --count "$TARGET_BRANCH...$branch")
  behind=$(awk '{print $1}' <<<"$left_right")
  ahead=$(awk '{print $2}' <<<"$left_right")

  if git merge-tree --write-tree "$base_commit" "$TARGET_BRANCH" "$branch" >/dev/null 2>&1; then
    status="mergeable"
    ((mergeable+=1))
  else
    status="conflicts"
    ((conflicted+=1))
  fi

  printf "%-40s %-12s %-16s %-16s\n" "$branch" "$status" "$behind" "$ahead"
done

echo
printf "Summary: %s mergeable, %s with conflicts\n" "$mergeable" "$conflicted"
echo "Tip: list already-merged with: git branch -r --merged $TARGET_BRANCH"
