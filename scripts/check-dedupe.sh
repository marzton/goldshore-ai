#!/bin/bash
set -e

echo "Checking for duplicate dependencies..."

if pnpm dedupe --check; then
  echo "✅ No duplicate dependencies found."
  exit 0
else
  echo "❌ Duplicate dependencies found. Please run 'pnpm dedupe' to fix this."
  exit 1
fi
