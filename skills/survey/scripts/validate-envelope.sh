#!/usr/bin/env bash
# validate-envelope.sh — schema-check a Survey envelope.
#
# Project-agnostic. Validates the generalized 2-round / 3-questions-per-round survey
# envelope produced by survey-init.sh. Each check emits a diagnostic naming the first
# failure and exits 1.
#
# Checks:
#   1. Frontmatter required keys present (survey-title, work-item, methodology-source,
#      stakeholder-picks, outcome-axis, calibration-data)
#   2. All 6 picks (Q1..Q6) present, non-placeholder, one-or-more letters a-d
#      (multi-pick supported)
#   3. classification — OPTIONAL. Validated against an enum ONLY when both the key is
#      present AND a non-empty enum is configured (--classes / SURVEY_CLASSES, a
#      pipe-separated set). With no configured enum, any non-placeholder value passes;
#      absent key is always fine.
#   4. Outcome-axis present: a whole-survey roll-up (top-level primary + secondary)
#      AND a per-round mapping (round-1 + round-2 each need primary + secondary).
#      This is the generic outcome/goal-axis mapping — the kernel's drift-check surface.
#   5. Calibration-data fields (stakeholder-time-cost-minutes numeric; comparison-baseline
#      + notes non-empty)
#   6. Contradictory-constraints frontmatter ↔ §contradictory prose consistency
#   7. Per-question interpretation sub-sections (§1.Q1..§1.Q3, §2.Q4..§2.Q6) present + non-empty
#   8. Required prose sections present (§0/§1/§2/§3/§4/§5/§6/§7/§calibration/§8)
#
# Usage:
#   validate-envelope.sh --envelope-path=<path> [--classes="a|b|c"]
#
# Exit codes:
#   0  envelope conforms
#   64 EX_USAGE — bad/missing arguments
#   1  validation failure or file-not-found
#
# Pure bash + grep/awk/sed. No python/yq/npm.

set -euo pipefail

EX_USAGE=64

ENVELOPE_PATH=
CLASSES=${SURVEY_CLASSES:-}

usage() {
  echo "[validate-envelope] usage: validate-envelope.sh --envelope-path=<path> [--classes=\"a|b|c\"]" >&2
}

for arg in "$@"; do
  case "$arg" in
    --envelope-path=*) ENVELOPE_PATH="${arg#*=}" ;;
    --classes=*)       CLASSES="${arg#*=}" ;;
    *)
      echo "[validate-envelope] unknown argument: $arg" >&2
      usage
      exit "$EX_USAGE"
      ;;
  esac
done

if [[ -z "$ENVELOPE_PATH" ]]; then
  echo "[validate-envelope] --envelope-path is required" >&2
  usage
  exit "$EX_USAGE"
fi

# bug-144: anchor a relative --envelope-path to the repo root so the script works
# from any CWD. Absolute paths pass through unchanged.
if [[ "$ENVELOPE_PATH" != /* ]]; then
  SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  REPO_ROOT=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../../.." && pwd))
  ENVELOPE_PATH="${REPO_ROOT}/${ENVELOPE_PATH}"
fi

if [[ ! -f "$ENVELOPE_PATH" ]]; then
  echo "[validate-envelope] envelope file not found: $ENVELOPE_PATH" >&2
  exit 1
fi

# Extract frontmatter block (between first two '---' lines).
FRONTMATTER=$(awk '
  BEGIN { in_fm = 0; count = 0 }
  /^---$/ {
    count++
    if (count == 1) { in_fm = 1; next }
    if (count == 2) { in_fm = 0; exit }
  }
  in_fm { print }
' "$ENVELOPE_PATH")

if [[ -z "$FRONTMATTER" ]]; then
  echo "[validate-envelope] FAIL: no YAML frontmatter found (expected '---' delimited block at top)" >&2
  exit 1
fi

fail() {
  echo "[validate-envelope] FAIL: $1" >&2
  exit 1
}

# (1) Frontmatter required keys.
for key in survey-title work-item methodology-source stakeholder-picks outcome-axis calibration-data; do
  if ! grep -qE "^${key}:" <<<"$FRONTMATTER"; then
    fail "frontmatter missing required key: $key"
  fi
done

# (2) Stakeholder picks — all 6 present, non-placeholder, one-or-more letters a-d.
for q in Q1 Q2 Q3 Q4 Q5 Q6; do
  if ! grep -qE "^[[:space:]]+${q}:" <<<"$FRONTMATTER"; then
    fail "stakeholder-picks missing required pick: $q"
  fi
  pick_value=$(grep -E "^[[:space:]]+${q}:" <<<"$FRONTMATTER" | head -1 | sed 's/.*: *//;s/^"//;s/"$//')
  if [[ "$pick_value" =~ ^\<.*\>$ || -z "$pick_value" ]]; then
    fail "stakeholder-picks $q is unfilled placeholder or empty (got: '$pick_value')"
  fi
  # Multi-pick (e.g. 'ac') is always supported at the stakeholder's discretion.
  if [[ ! "$pick_value" =~ ^[a-d]+$ ]]; then
    fail "stakeholder-picks $q must be one or more letters a-d (multi-pick supported) (got: '$pick_value')"
  fi
done

# (3) classification — OPTIONAL; enum-checked only when present AND an enum is configured.
if grep -qE "^classification:" <<<"$FRONTMATTER"; then
  CLASSIFICATION=$(grep -E "^classification:" <<<"$FRONTMATTER" | head -1 | sed 's/^classification: *//;s/^"//;s/"$//')
  if [[ "$CLASSIFICATION" =~ ^\<.*\>$ || -z "$CLASSIFICATION" ]]; then
    fail "classification key present but unfilled placeholder or empty (delete the key if unused)"
  fi
  if [[ -n "$CLASSES" ]]; then
    ok=0
    OLD_IFS=$IFS
    IFS='|'
    for c in $CLASSES; do
      [[ "$CLASSIFICATION" == "$c" ]] && ok=1
    done
    IFS=$OLD_IFS
    if [[ "$ok" -ne 1 ]]; then
      fail "classification '$CLASSIFICATION' not in configured enum: $CLASSES"
    fi
  fi
fi

# (4a) Whole-survey outcome-axis roll-up — top-level primary + secondary keys
# (the two-space-indented keys directly under `outcome-axis:`, before any round block).
if ! awk '
  BEGIN { in_oa = 0; found_p = 0; found_s = 0 }
  /^outcome-axis:/ { in_oa = 1; next }
  in_oa && /^[a-zA-Z]/ { in_oa = 0 }
  in_oa && /^[[:space:]]+(round-1|round-2):/ { in_oa = 0 }
  in_oa && /^[[:space:]]{2}primary:/ { found_p = 1 }
  in_oa && /^[[:space:]]{2}secondary:/ { found_s = 1 }
  END { exit !(found_p && found_s) }
' <<<"$FRONTMATTER"; then
  fail "outcome-axis missing whole-survey roll-up (top-level primary + secondary keys)"
fi

# (4b) Per-round outcome-axis — round-1 + round-2 each need primary + secondary.
for round in round-1 round-2; do
  if ! awk -v r="$round" '
    BEGIN { in_oa = 0; in_round = 0; found_p = 0; found_s = 0 }
    /^outcome-axis:/ { in_oa = 1; next }
    in_oa && /^[a-zA-Z]/ { in_oa = 0 }
    in_oa && $0 ~ "^[[:space:]]+" r ":" { in_round = 1; next }
    in_round && $0 ~ "^[[:space:]]{2,}primary:" { found_p = 1 }
    in_round && $0 ~ "^[[:space:]]{2,}secondary:" { found_s = 1 }
    in_round && /^[[:space:]]{0,2}[a-z]/ && $0 !~ "^[[:space:]]{2,}primary:" && $0 !~ "^[[:space:]]{2,}secondary:" { in_round = 0 }
    END { exit !(found_p && found_s) }
  ' <<<"$FRONTMATTER"; then
    fail "outcome-axis.$round missing required primary + secondary keys (per-round mapping discipline)"
  fi
done

# (5) Calibration-data fields.
CALIB_BLOCK=$(awk '
  BEGIN { in_cd = 0 }
  /^calibration-data:/ { in_cd = 1; next }
  /^[a-zA-Z]/ && in_cd { in_cd = 0 }
  in_cd { print }
' <<<"$FRONTMATTER")

if ! grep -qE "^[[:space:]]+stakeholder-time-cost-minutes:" <<<"$CALIB_BLOCK"; then
  fail "calibration-data missing stakeholder-time-cost-minutes"
fi
STC_VALUE=$(grep -E "^[[:space:]]+stakeholder-time-cost-minutes:" <<<"$CALIB_BLOCK" | head -1 | sed 's/.*: *//;s/^"//;s/"$//')
if [[ "$STC_VALUE" =~ ^\<.*\>$ || -z "$STC_VALUE" ]]; then
  fail "calibration-data.stakeholder-time-cost-minutes is unfilled placeholder or empty"
fi
if ! [[ "$STC_VALUE" =~ ^[0-9]+$ ]]; then
  fail "calibration-data.stakeholder-time-cost-minutes must be an integer (got: '$STC_VALUE')"
fi
for f in comparison-baseline notes; do
  if ! grep -qE "^[[:space:]]+${f}:" <<<"$CALIB_BLOCK"; then
    fail "calibration-data missing $f"
  fi
  val=$(grep -E "^[[:space:]]+${f}:" <<<"$CALIB_BLOCK" | head -1 | sed 's/.*: *//;s/^"//;s/"$//')
  if [[ -z "$val" || "$val" =~ ^\<.*\>$ ]]; then
    fail "calibration-data.$f is unfilled placeholder or empty"
  fi
done

# (6) Contradictory-constraints frontmatter ↔ prose consistency.
if grep -qE "^contradictory-constraints:" <<<"$FRONTMATTER"; then
  CC_BLOCK=$(awk '
    BEGIN { in_cc = 0 }
    /^contradictory-constraints:/ { in_cc = 1; next }
    /^[a-zA-Z]/ && in_cc { in_cc = 0 }
    in_cc { print }
  ' <<<"$FRONTMATTER")
  CC_NONCOMMENT=$(grep -vE '^[[:space:]]*#' <<<"$CC_BLOCK" | grep -vE '^[[:space:]]*$' || true)
  if [[ -n "$CC_NONCOMMENT" ]]; then
    if ! grep -qE "^## §contradictory" "$ENVELOPE_PATH"; then
      fail "contradictory-constraints declared in frontmatter but §contradictory prose section missing"
    fi
  fi
fi

# (7) Per-question interpretation sub-sections present + non-empty.
for q in Q1 Q2 Q3 Q4 Q5 Q6; do
  if ! grep -qE "^### §[12]\.${q}" "$ENVELOPE_PATH"; then
    fail "missing §[1|2].${q} per-question interpretation sub-section"
  fi
  if ! awk -v q="$q" '
    BEGIN { found_header = 0; non_empty = 0 }
    /^### §[12]\./ {
      if ($0 ~ "^### §[12]\\." q "[ \t]*—") { found_header = 1; next }
      else if (found_header) { exit !non_empty }
    }
    /^## §/ { if (found_header) exit !non_empty }
    found_header && NF > 0 && !/^<[^>]+>$/ { non_empty = 1 }
    END { exit !(found_header && non_empty) }
  ' "$ENVELOPE_PATH"; then
    fail "§[1|2].${q} per-question interpretation sub-section is empty or contains only placeholder text"
  fi
done

# (8) Required prose sections.
REQUIRED_SECTIONS=("## §0 Context" "## §1 Round 1 picks" "## §2 Round 2 picks" "## §3 Composite intent envelope" "## §4 Scope summary" "## §5 Anti-goals" "## §6 Flags" "## §7 Sequencing" "## §calibration" "## §8 Cross-references")
for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -qE "^${section}" "$ENVELOPE_PATH"; then
    fail "required prose section missing: $section"
  fi
done

echo "[validate-envelope] PASS: $ENVELOPE_PATH conforms to the survey envelope schema"
exit 0
