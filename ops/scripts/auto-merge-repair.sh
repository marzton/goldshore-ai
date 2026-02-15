#!/bin/bash
set -e

echo "Fetching and rebasing main..."
git fetch origin main
git rebase origin/main

echo "Resetting lockfile and docs to main..."
git checkout origin/main -- pnpm-lock.yaml README.md || true

echo "Validating and building..."
pnpm validate
pnpm build
