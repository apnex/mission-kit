#!/usr/bin/env bash
# survey-init.sh — scaffold a Survey envelope from the template.
#
# Project-agnostic. Scaffolds a 2-round / 3-questions-per-round stakeholder-intent
# survey envelope into an output directory, optionally seeding the §0 Context with
# the work-item text the operator provides on disk.
#
# This is the INIT gate of the survey skill. No network, no external tools: the
# operator supplies the work-item text (--item-text-file); there is no fetch step.
#
# Usage:
#   survey-init.sh --title=<TITLE> --item-id=<ID> \
#       [--item-text-file=<path>] [--out-dir=<dir>] [--template=<path>] [--slug=<slug>]
#
# Config (flags override env which overrides defaults):
#   --title          required; human title for the envelope header
#   --item-id        required; opaque work-item identifier (issue key, ticket, slug —
#                    any non-empty string; NO format is imposed)
#   --item-text-file optional; file whose contents seed §0 Context. Missing/empty →
#                    a manual-fill placeholder is retained.
#   --out-dir        output directory for the envelope. Default: env SURVEY_OUT_DIR,
#                    else "surveys". Relative paths anchor to the repo root (bug-144).
#   --template       envelope template path. Default: ../templates/envelope.md.tmpl
#                    next to this script. Relative paths anchor to the repo root.
#   --slug           file slug. Default: derived from --title (lowercased,
#                    non-alphanumerics → '-'). Output file is <out-dir>/<slug>-survey.md
#
# Exit codes:
#   0  scaffolded
#   64 EX_USAGE — bad/missing arguments (bug-145: distinct from runtime failure)
#   1  runtime failure (template missing, refuse-overwrite, etc.)
#
# Pure bash + grep/awk/sed. No python/yq/npm.

set -euo pipefail

EX_USAGE=64

# bug-144: anchor artifact reads/writes to the repo root, not the caller's CWD.
# A relative --out-dir / --template otherwise resolves against PWD, which is only
# correct when invoked from the repo root. git-rev-parse with a SCRIPT_DIR-relative
# fallback makes the script cwd-robust.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../../.." && pwd))

usage() {
  echo "[survey-init] usage: survey-init.sh --title=<TITLE> --item-id=<ID> [--item-text-file=<path>] [--out-dir=<dir>] [--template=<path>] [--slug=<slug>]" >&2
}

TITLE=
ITEM_ID=
ITEM_TEXT_FILE=
OUT_DIR=${SURVEY_OUT_DIR:-surveys}
TEMPLATE_PATH=
SLUG=

for arg in "$@"; do
  case "$arg" in
    --title=*)          TITLE="${arg#*=}" ;;
    --item-id=*)        ITEM_ID="${arg#*=}" ;;
    --item-text-file=*) ITEM_TEXT_FILE="${arg#*=}" ;;
    --out-dir=*)        OUT_DIR="${arg#*=}" ;;
    --template=*)       TEMPLATE_PATH="${arg#*=}" ;;
    --slug=*)           SLUG="${arg#*=}" ;;
    *)
      echo "[survey-init] unknown argument: $arg" >&2
      usage
      exit "$EX_USAGE"
      ;;
  esac
done

if [[ -z "$TITLE" || -z "$ITEM_ID" ]]; then
  echo "[survey-init] required arguments missing (--title and --item-id)" >&2
  usage
  exit "$EX_USAGE"
fi

# Default template lives beside the skill. Resolve relative paths against REPO_ROOT.
if [[ -z "$TEMPLATE_PATH" ]]; then
  TEMPLATE_PATH="${SCRIPT_DIR}/../templates/envelope.md.tmpl"
elif [[ "$TEMPLATE_PATH" != /* ]]; then
  TEMPLATE_PATH="${REPO_ROOT}/${TEMPLATE_PATH}"
fi

if [[ ! -f "$TEMPLATE_PATH" ]]; then
  echo "[survey-init] envelope template not found at $TEMPLATE_PATH" >&2
  exit 1
fi

# Derive a file slug from the title unless one was supplied. Lowercase, then map
# any run of non-alphanumeric characters to a single '-', and trim leading/trailing '-'.
if [[ -z "$SLUG" ]]; then
  SLUG=$(printf '%s' "$TITLE" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
fi
if [[ -z "$SLUG" ]]; then
  echo "[survey-init] could not derive a slug from --title='$TITLE'; pass --slug=<slug>" >&2
  exit "$EX_USAGE"
fi

# Resolve out-dir against REPO_ROOT when relative (bug-144).
if [[ "$OUT_DIR" != /* ]]; then
  OUT_DIR="${REPO_ROOT}/${OUT_DIR}"
fi

ENVELOPE_PATH="${OUT_DIR}/${SLUG}-survey.md"

if [[ -e "$ENVELOPE_PATH" ]]; then
  echo "[survey-init] envelope already exists at $ENVELOPE_PATH (refusing to overwrite)" >&2
  echo "[survey-init] delete or rename it first if you want to re-scaffold" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Substitute placeholders. <TITLE> and <ITEM-ID> are the only mandatory tokens.
sed \
  -e "s|<TITLE>|$TITLE|g" \
  -e "s|<ITEM-ID>|$ITEM_ID|g" \
  "$TEMPLATE_PATH" > "$ENVELOPE_PATH"

# Seed §0 Context with the work-item text the operator provided (happy path).
if [[ -n "$ITEM_TEXT_FILE" && -s "$ITEM_TEXT_FILE" ]]; then
  ITEM_TEXT=$(cat "$ITEM_TEXT_FILE")
  TMP_OUT=$(mktemp)
  trap 'rm -f "$TMP_OUT"' EXIT INT TERM HUP
  awk -v item_text="$ITEM_TEXT" '
    /^## §0 Context$/ {
      print
      getline blank; print blank
      print "**Source work-item text** (provided at survey init):"
      print ""
      print "> " item_text
      print ""
      next
    }
    { print }
  ' "$ENVELOPE_PATH" > "$TMP_OUT"
  mv "$TMP_OUT" "$ENVELOPE_PATH"
  trap - EXIT INT TERM HUP
  echo "[survey-init] scaffolded $ENVELOPE_PATH (work-item text seeded from $ITEM_TEXT_FILE)"
else
  echo "[survey-init] scaffolded $ENVELOPE_PATH (no work-item text provided; §0 Context placeholder retained for manual fill)"
fi

echo "[survey-init] Next: design Round-1 questions and dispatch (see references)"
exit 0
