#!/bin/bash
set -euo pipefail

echo "Branch Conflict Audit"

git fetch --all --prune

for branch in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/)
do
  echo "Checking $branch"
  git diff --name-status origin/main...$branch
  echo
 done
