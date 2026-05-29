#!/usr/bin/env bash
# format-pick-presentation.sh — render a round's questions in canonical shape.
#
# Project-agnostic. Reads a markdown questions-file containing Q-N definitions and
# emits the standard survey question shape (Q-N: <axis>: <context>; (a)/(b)/(c)/(d)
# labels), normalized to stdout. Round 1 covers Q1-Q3; Round 2 covers Q4-Q6.
#
# Input questions-file format:
#   **Q-N — <axis>:** <context>
#   - (a) <option>
#   - (b) <option>
#   - (c) <option>
#   - (d) <option>
#
# Usage:
#   format-pick-presentation.sh --round=1|2 --questions-file=<path>
#
# Exit codes:
#   0  rendered
#   64 EX_USAGE — bad/missing arguments
#   1  one or more expected questions missing from the file
#
# Pure bash + grep/awk/sed. No python/yq/npm.

set -euo pipefail

EX_USAGE=64

ROUND=
QUESTIONS_FILE=

usage() {
  echo "[format-pick-presentation] usage: format-pick-presentation.sh --round=1|2 --questions-file=<path>" >&2
}

for arg in "$@"; do
  case "$arg" in
    --round=*)          ROUND="${arg#*=}" ;;
    --questions-file=*) QUESTIONS_FILE="${arg#*=}" ;;
    *)
      echo "[format-pick-presentation] unknown argument: $arg" >&2
      usage
      exit "$EX_USAGE"
      ;;
  esac
done

if [[ -z "$ROUND" || -z "$QUESTIONS_FILE" ]]; then
  echo "[format-pick-presentation] --round and --questions-file are required" >&2
  usage
  exit "$EX_USAGE"
fi

case "$ROUND" in
  1|2) ;;
  *)
    echo "[format-pick-presentation] --round must be 1 or 2 (got: $ROUND)" >&2
    exit "$EX_USAGE"
    ;;
esac

# bug-144: anchor a relative --questions-file to the repo root (cwd-robust).
if [[ "$QUESTIONS_FILE" != /* ]]; then
  SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../../.." && pwd))
  QUESTIONS_FILE="${REPO_ROOT}/${QUESTIONS_FILE}"
fi

if [[ ! -f "$QUESTIONS_FILE" ]]; then
  echo "[format-pick-presentation] questions-file not found: $QUESTIONS_FILE" >&2
  exit 1
fi

# The expected Q numbers for this round.
case "$ROUND" in
  1) Q_RANGE="Q1 Q2 Q3" ;;
  2) Q_RANGE="Q4 Q5 Q6" ;;
esac

echo "[format-pick-presentation] rendering Round-$ROUND questions ($Q_RANGE) from $QUESTIONS_FILE"

EXIT_CODE=0
for q in $Q_RANGE; do
  if ! grep -qE "^\*\*${q}( |\*\*)" "$QUESTIONS_FILE"; then
    echo "[format-pick-presentation] WARNING: $q header not found in $QUESTIONS_FILE" >&2
    EXIT_CODE=1
    continue
  fi
  awk -v q="$q" '
    BEGIN { in_block = 0; lines = 0 }
    /^\*\*Q[1-6]/ {
      if ($0 ~ "^\\*\\*" q "( |\\*\\*)") {
        in_block = 1
        print ""
        print $0
        lines = 1
        next
      } else if (in_block) {
        in_block = 0
      }
    }
    in_block {
      print
      lines++
      if (lines > 10 && /^$/) { in_block = 0 }
    }
  ' "$QUESTIONS_FILE"
done

if [[ "$EXIT_CODE" -ne 0 ]]; then
  echo "[format-pick-presentation] one or more questions missing; exit 1" >&2
  exit 1
fi

echo "[format-pick-presentation] Round-$ROUND rendering complete"
exit 0
