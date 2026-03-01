#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-origin/main}"
HEAD_REF="${2:-HEAD}"

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "[error] Base ref '$BASE_REF' is missing locally."
  echo "        Run: git fetch origin main"
  exit 2
fi

if ! git rev-parse --verify "$HEAD_REF" >/dev/null 2>&1; then
  echo "[error] Head ref '$HEAD_REF' is missing locally."
  exit 2
fi

if git merge-base "$BASE_REF" "$HEAD_REF" >/dev/null 2>&1; then
  base_sha=$(git merge-base "$BASE_REF" "$HEAD_REF")
  echo "[ok] Comparable histories detected."
  echo "     merge-base: $base_sha"
  exit 0
fi

cat <<MSG
[fail] '$BASE_REF' and '$HEAD_REF' do not share history.
       GitHub will show: "There isn’t anything to compare."

Recovery (safe sequence):
  1) git fetch origin main
  2) git checkout <your-pr-branch>
  3) git rebase origin/main
     - or if branch was created from wrong repository/root:
       a) git checkout -b <new-branch> origin/main
       b) git cherry-pick <old-branch-commit-range>
  4) git push --force-with-lease

Tip:
  Re-run: scripts/check-pr-ancestry.sh origin/main HEAD
MSG

exit 1
