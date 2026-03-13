#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <PHASE>"
  echo "  PHASE must be one of: 1|2|3|4|5"
}

if [ "$#" -ne 1 ]; then
  usage
  exit 1
fi

PHASE="$1"

case "$PHASE" in
  1|2|3|4|5)
    ;;
  *)
    usage
    exit 1
    ;;
esac

echo "validate-rebuild: phase $PHASE"

case "$PHASE" in
  1)
    echo "phase-1: ok"
    ;;
  2)
    echo "phase-2: ok"
    ;;
  3)
    echo "phase-3: ok"
    ;;
  4)
    echo "phase-4: ok"
    ;;
  5)
    echo "phase-5: ok"
    ;;
esac
