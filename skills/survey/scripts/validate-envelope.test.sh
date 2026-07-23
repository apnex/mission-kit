#!/usr/bin/env bash
# Test cases for validate-envelope.sh — Survey envelope schema enforcement.
# Pure bash asserts. Covers happy-path, each schema-fail branch, optional/configurable
# classification, arg-errors (EX_USAGE 64), and bug-144 cwd-robustness.

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SCRIPT="${SCRIPT_DIR}/validate-envelope.sh"

PASS=0
FAIL=0
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT INT TERM HUP

assert_exit() {
  local expected=$1 actual=$2 label=$3
  if [[ "$actual" -eq "$expected" ]]; then
    echo "  ✓ $label (exit $actual)"
    PASS=$((PASS+1))
  else
    echo "  ✗ $label (expected exit $expected, got $actual)" >&2
    FAIL=$((FAIL+1))
  fi
}

run() { set +e; bash "$SCRIPT" "$@" >/dev/null 2>&1; local rc=$?; set -e; echo "$rc"; }

# A complete, valid envelope fixture (classification present but no enum configured).
make_valid_envelope() {
  cat > "$1" <<'EOF'
---
survey-title: My Survey
work-item: TICKET-42
methodology-source: skills/survey/SKILL.md
lifecycle-handoff:
  from: intent-open
  to: intent-captured
  authority-ref: decision-42
  planning-input-ref: self
stakeholder-picks:
  round-1:
    Q1: a
    Q2: b
    Q3: c
  round-2:
    Q4: d
    Q5: a
    Q6: bc
classification: feature
outcome-axis:
  primary: [reliability, speed]
  secondary: [cost]
  round-1:
    primary: [reliability]
    secondary: [cost]
  round-2:
    primary: [speed]
    secondary: [cost]
axiom-principle-anchors:
  primary: [A0]
  secondary: [A8]
  round-1: [A0]
  round-2: [A8]
anti-goals-count: 2
flags-count: 1
calibration-data:
  stakeholder-time-cost-minutes: 7
  comparison-baseline: none
  notes: clean run
---

# My Survey — Survey envelope

## §0 Context
Provenance paragraph.

## §1 Round 1 picks
| Q | Pick | Reading |
|---|---|---|

### §1.Q1 — Per-question interpretation
Real interpretation text for Q1.

### §1.Q2 — Per-question interpretation
Real interpretation text for Q2.

### §1.Q3 — Per-question interpretation
Real interpretation text for Q3.

**Round-1 composite read**: The picks establish one coherent intent envelope.

**Round-1 axiom / principle anchoring**: A0 makes intent-to-execution delegation load-bearing.

## §2 Round 2 picks
| Q | Pick | Round-1 aggregate relation | Reading |
|---|---|---|---|
| Q4 | d | refines | reading |
| Q5 | a | challenges | reading |
| Q6 | bc | deepens | reading |

### §2.Q4 — Per-question interpretation
Real interpretation text for Q4.

### §2.Q5 — Per-question interpretation
Real interpretation text for Q5.

### §2.Q6 — Per-question interpretation
Real interpretation text for Q6.

**Round-2 composite read**: Round 2 disambiguates and sharpens the Round-1 aggregate.

**Round-2 axiom / principle anchoring**: A8 requires the sharpened intent to be independently gated.

## §3 Composite intent envelope
The solved matrix.

**Final axiom / principle anchoring:** A0 and A8 require autonomous execution behind independent gates.

## §4 Scope summary
| Axis | Bound |
|---|---|

## §5 Anti-goals (out-of-scope; deferred)
| AG | Description | Composes-with |
|---|---|---|

## §6 Flags / open questions for the design phase
| # | Flag | Recommendation |
|---|---|---|

## §7 Sequencing / cross-work considerations
Sequencing.

## §calibration — Calibration data point
- Stakeholder time-cost (minutes): 7

## §8 Cross-references
- methodology
EOF
}

echo "[validate-envelope.test] Valid envelope → exit 0"
E="$TMPDIR/valid.md"; make_valid_envelope "$E"
assert_exit 0 "$(run --envelope-path="$E")" "complete valid envelope passes"

echo "[validate-envelope.test] Multi-pick (Q6: bc) accepted"
# Already exercised by the valid fixture (Q6: bc); assert it did not fail there.
assert_exit 0 "$(run --envelope-path="$E")" "multi-pick letters accepted"

echo "[validate-envelope.test] classification optional — absent key passes"
E2="$TMPDIR/no-class.md"; make_valid_envelope "$E2"
sed -i '/^classification: feature$/d' "$E2"
assert_exit 0 "$(run --envelope-path="$E2")" "absent classification key passes (optional)"

echo "[validate-envelope.test] classification enum — configured + matching passes"
assert_exit 0 "$(run --envelope-path="$E" --classes="feature|refactor|spike")" "classification in configured enum passes"

echo "[validate-envelope.test] classification enum — configured + non-matching fails"
assert_exit 1 "$(run --envelope-path="$E" --classes="refactor|spike")" "classification outside configured enum fails"

echo "[validate-envelope.test] classification enum via SURVEY_CLASSES env"
set +e; SURVEY_CLASSES="refactor|spike" bash "$SCRIPT" --envelope-path="$E" >/dev/null 2>&1; rc=$?; set -e
assert_exit 1 "$rc" "SURVEY_CLASSES env enum enforced"

echo "[validate-envelope.test] Missing pick Q5 → exit 1"
E3="$TMPDIR/no-q5.md"; make_valid_envelope "$E3"
sed -i '/^    Q5: a$/d' "$E3"
assert_exit 1 "$(run --envelope-path="$E3")" "missing pick fails"

echo "[validate-envelope.test] Pick out of a-d domain → exit 1"
E4="$TMPDIR/bad-pick.md"; make_valid_envelope "$E4"
sed -i 's/^    Q1: a$/    Q1: z/' "$E4"
assert_exit 1 "$(run --envelope-path="$E4")" "pick letter outside a-d fails"

echo "[validate-envelope.test] Unfilled placeholder pick → exit 1"
E5="$TMPDIR/placeholder-pick.md"; make_valid_envelope "$E5"
sed -i 's/^    Q1: a$/    Q1: <a|b|c|d>/' "$E5"
assert_exit 1 "$(run --envelope-path="$E5")" "placeholder pick fails"

echo "[validate-envelope.test] Missing required frontmatter key → exit 1"
E6="$TMPDIR/no-key.md"; make_valid_envelope "$E6"
sed -i '/^work-item: TICKET-42$/d' "$E6"
assert_exit 1 "$(run --envelope-path="$E6")" "missing work-item key fails"

echo "[validate-envelope.test] Non-integer time-cost → exit 1"
E7="$TMPDIR/bad-calib.md"; make_valid_envelope "$E7"
sed -i 's/^  stakeholder-time-cost-minutes: 7$/  stakeholder-time-cost-minutes: lots/' "$E7"
assert_exit 1 "$(run --envelope-path="$E7")" "non-integer time-cost fails"

echo "[validate-envelope.test] Missing per-round outcome-axis → exit 1"
E8="$TMPDIR/no-round2-axis.md"; make_valid_envelope "$E8"
# Remove the round-2 block from outcome-axis (its primary+secondary lines).
sed -i '/^  round-2:$/,/^    secondary: \[cost\]$/d' "$E8"
assert_exit 1 "$(run --envelope-path="$E8")" "missing round-2 outcome-axis fails"

echo "[validate-envelope.test] Missing whole-survey outcome-axis roll-up → exit 1"
E8b="$TMPDIR/no-rollup-axis.md"; make_valid_envelope "$E8b"
# Drop the two top-level (2-space-indent) roll-up lines, keeping the per-round blocks.
sed -i '/^  primary: \[reliability, speed\]$/d; /^  secondary: \[cost\]$/d' "$E8b"
assert_exit 1 "$(run --envelope-path="$E8b")" "missing whole-survey outcome-axis roll-up fails"

echo "[validate-envelope.test] Empty per-question interpretation → exit 1"
E9="$TMPDIR/empty-interp.md"; make_valid_envelope "$E9"
sed -i 's/^Real interpretation text for Q3.$//' "$E9"
assert_exit 1 "$(run --envelope-path="$E9")" "empty §1.Q3 interpretation fails"

echo "[validate-envelope.test] Missing prose section → exit 1"
E10="$TMPDIR/no-section.md"; make_valid_envelope "$E10"
sed -i '/^## §3 Composite intent envelope$/d' "$E10"
assert_exit 1 "$(run --envelope-path="$E10")" "missing §3 section fails"

echo "[validate-envelope.test] Lifecycle handoff wrong transition → exit 1"
E11="$TMPDIR/bad-lifecycle.md"; make_valid_envelope "$E11"
sed -i 's/^  to: intent-captured$/  to: executing/' "$E11"
assert_exit 1 "$(run --envelope-path="$E11")" "survey cannot bypass planning/admission lifecycle stages"

echo "[validate-envelope.test] Lifecycle authority missing → exit 1"
E12="$TMPDIR/no-lifecycle-authority.md"; make_valid_envelope "$E12"
sed -i 's/^  authority-ref: decision-42$/  authority-ref: <authority>/' "$E12"
assert_exit 1 "$(run --envelope-path="$E12")" "intent capture requires authority ref"

echo "[validate-envelope.test] Missing axiom anchors → exit 1"
E13="$TMPDIR/no-anchors.md"; make_valid_envelope "$E13"
sed -i '/^axiom-principle-anchors:$/,/^  round-2: \[A8\]$/d' "$E13"
assert_exit 1 "$(run --envelope-path="$E13")" "axiom/principle anchors are load-bearing"

echo "[validate-envelope.test] Missing Round-2 aggregate relation markers → exit 1"
E14="$TMPDIR/no-r2-relations.md"; make_valid_envelope "$E14"
sed -i 's/refines/relates/g; s/challenges/relates/g; s/disambiguates/relates/g; s/deepens/relates/g' "$E14"
assert_exit 1 "$(run --envelope-path="$E14")" "Round 2 must relate back to Round-1 aggregate"

echo "[validate-envelope.test] Missing final axiom anchor → exit 1"
E15="$TMPDIR/no-final-anchor.md"; make_valid_envelope "$E15"
sed -i '/^\*\*Final axiom \/ principle anchoring:/d' "$E15"
assert_exit 1 "$(run --envelope-path="$E15")" "final intent requires axiom/principle anchor"

echo "[validate-envelope.test] Missing --envelope-path → EX_USAGE 64"
assert_exit 64 "$(run)" "missing --envelope-path → EX_USAGE"

echo "[validate-envelope.test] Unknown arg → EX_USAGE 64"
assert_exit 64 "$(run --envelope-path="$E" --bogus=1)" "unknown argument → EX_USAGE"

echo "[validate-envelope.test] File not found → exit 1"
assert_exit 1 "$(run --envelope-path="$TMPDIR/nope.md")" "absent file → runtime failure (not EX_USAGE)"

echo "[validate-envelope.test] bug-144 cwd-robustness — relative path anchors to repo root"
WD="$TMPDIR/cwd-repo"
mkdir -p "$WD/skills/survey/scripts" "$WD/surveys"
cp "$SCRIPT" "$WD/skills/survey/scripts/validate-envelope.sh"
git -C "$WD" init -q
make_valid_envelope "$WD/surveys/rel.md"
mkdir -p "$WD/some/sub"
set +e
rc=$( cd "$WD/some/sub" && bash "$WD/skills/survey/scripts/validate-envelope.sh" --envelope-path="surveys/rel.md" >/dev/null 2>&1; echo $? )
set -e
assert_exit 0 "$rc" "relative --envelope-path resolved against REPO_ROOT from a subdir"

echo
echo "[validate-envelope.test] Result: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]] || exit 1
exit 0
