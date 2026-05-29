#!/usr/bin/env bash
# Test cases for format-pick-presentation.sh — Round-N question rendering.
# Pure bash asserts. Covers happy-path render, missing-question, arg-errors
# (EX_USAGE 64), and bug-144 cwd-robustness.

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SCRIPT="${SCRIPT_DIR}/format-pick-presentation.sh"

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

assert_contains() {
  if grep -q "$1" "$2" 2>/dev/null; then
    echo "  ✓ $3"
    PASS=$((PASS+1))
  else
    echo "  ✗ $3 (pattern '$1' not in output)" >&2
    FAIL=$((FAIL+1))
  fi
}

cat > "$TMPDIR/questions.md" <<'EOF'
**Q1 — MVP scope:** What feature scope?
- (a) minimal
- (b) targeted
- (c) extended
- (d) full

**Q2 — Depth:** How deep?
- (a) shallow
- (b) medium
- (c) deep
- (d) exhaustive

**Q3 — Posture:** How explicit?
- (a) implicit
- (b) noted
- (c) documented
- (d) enforced

**Q4 — Round-2 axis:** Second-round question?
- (a) one
- (b) two
- (c) three
- (d) four

**Q5 — Round-2 axis:** Another?
- (a) one
- (b) two
- (c) three
- (d) four

**Q6 — Round-2 axis:** Last?
- (a) one
- (b) two
- (c) three
- (d) four
EOF

echo "[format-pick-presentation.test] Round 1 render → exit 0"
set +e
OUT=$(bash "$SCRIPT" --round=1 --questions-file="$TMPDIR/questions.md" 2>/dev/null); rc=$?
set -e
assert_exit 0 "$rc" "round-1 render succeeds"
echo "$OUT" > "$TMPDIR/out1.txt"
assert_contains "Q1 — MVP scope" "$TMPDIR/out1.txt" "Q1 emitted"
assert_contains "Q3 — Posture" "$TMPDIR/out1.txt" "Q3 emitted"

echo "[format-pick-presentation.test] Round 2 render → exit 0"
set +e
OUT=$(bash "$SCRIPT" --round=2 --questions-file="$TMPDIR/questions.md" 2>/dev/null); rc=$?
set -e
assert_exit 0 "$rc" "round-2 render succeeds"
echo "$OUT" > "$TMPDIR/out2.txt"
assert_contains "Q4 — Round-2 axis" "$TMPDIR/out2.txt" "Q4 emitted"
assert_contains "Q6 — Round-2 axis" "$TMPDIR/out2.txt" "Q6 emitted"

echo "[format-pick-presentation.test] Missing question → exit 1"
cat > "$TMPDIR/incomplete.md" <<'EOF'
**Q1 — only one:** present?
- (a) yes
- (b) no
- (c) maybe
- (d) unknown
EOF
set +e; bash "$SCRIPT" --round=1 --questions-file="$TMPDIR/incomplete.md" >/dev/null 2>&1; rc=$?; set -e
assert_exit 1 "$rc" "missing Q2/Q3 in round-1 → runtime failure"

echo "[format-pick-presentation.test] Bad --round → EX_USAGE 64"
set +e; bash "$SCRIPT" --round=9 --questions-file="$TMPDIR/questions.md" >/dev/null 2>&1; rc=$?; set -e
assert_exit 64 "$rc" "invalid round value → EX_USAGE"

echo "[format-pick-presentation.test] Missing required arg → EX_USAGE 64"
set +e; bash "$SCRIPT" --round=1 >/dev/null 2>&1; rc=$?; set -e
assert_exit 64 "$rc" "missing --questions-file → EX_USAGE"

echo "[format-pick-presentation.test] Unknown arg → EX_USAGE 64"
set +e; bash "$SCRIPT" --round=1 --questions-file="$TMPDIR/questions.md" --bogus=1 >/dev/null 2>&1; rc=$?; set -e
assert_exit 64 "$rc" "unknown argument → EX_USAGE"

echo "[format-pick-presentation.test] File not found → exit 1"
set +e; bash "$SCRIPT" --round=1 --questions-file="$TMPDIR/does-not-exist.md" >/dev/null 2>&1; rc=$?; set -e
assert_exit 1 "$rc" "absent questions-file → runtime failure (not EX_USAGE)"

echo "[format-pick-presentation.test] bug-144 cwd-robustness — relative path anchors to repo root"
WD="$TMPDIR/cwd-repo"
mkdir -p "$WD/skills/survey/scripts"
cp "$SCRIPT" "$WD/skills/survey/scripts/format-pick-presentation.sh"
git -C "$WD" init -q
cp "$TMPDIR/questions.md" "$WD/questions.md"
mkdir -p "$WD/some/sub"
set +e
rc=$( cd "$WD/some/sub" && bash "$WD/skills/survey/scripts/format-pick-presentation.sh" --round=1 --questions-file="questions.md" >/dev/null 2>&1; echo $? )
set -e
assert_exit 0 "$rc" "relative --questions-file resolved against REPO_ROOT from a subdir"

echo
echo "[format-pick-presentation.test] Result: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]] || exit 1
exit 0
