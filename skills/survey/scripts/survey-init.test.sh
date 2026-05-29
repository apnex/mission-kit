#!/usr/bin/env bash
# Test cases for survey-init.sh — Survey envelope scaffolding.
# Pure bash asserts. Covers happy-path, work-item seeding, arg-errors (EX_USAGE 64),
# refuse-overwrite, slug derivation, and bug-144 cwd-robustness (subdir invocation).

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SCRIPT="${SCRIPT_DIR}/survey-init.sh"
TEMPLATE="${SCRIPT_DIR}/../templates/envelope.md.tmpl"

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

assert_exists() {
  if [[ -f "$1" ]]; then
    echo "  ✓ $2 exists"
    PASS=$((PASS+1))
  else
    echo "  ✗ $2 missing ($1)" >&2
    FAIL=$((FAIL+1))
  fi
}

assert_grep() {
  if grep -q "$1" "$2" 2>/dev/null; then
    echo "  ✓ $3"
    PASS=$((PASS+1))
  else
    echo "  ✗ $3 (pattern '$1' not found in $2)" >&2
    FAIL=$((FAIL+1))
  fi
}

# Each test runs in an isolated git repo containing a copy of the skill body so the
# bug-144 git-rev-parse anchor resolves to the test workdir, not the real repo.
setup_workdir() {
  local wd=$1
  mkdir -p "$wd/skills/survey/scripts" "$wd/skills/survey/templates"
  cp "$TEMPLATE" "$wd/skills/survey/templates/envelope.md.tmpl"
  cp "$SCRIPT" "$wd/skills/survey/scripts/survey-init.sh"
  git -C "$wd" init -q
}

echo "[survey-init.test] Happy path without item-text-file"
WD="$TMPDIR/happy"
setup_workdir "$WD"
( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title="My Feature Survey" --item-id=TICKET-42 >/dev/null 2>&1 )
rc=$?
assert_exit 0 "$rc" "happy-path without item-text-file"
assert_exists "$WD/surveys/my-feature-survey-survey.md" "envelope file (derived slug)"
assert_grep "My Feature Survey" "$WD/surveys/my-feature-survey-survey.md" "title substituted"
assert_grep "TICKET-42" "$WD/surveys/my-feature-survey-survey.md" "item-id substituted"

echo "[survey-init.test] Happy path with item-text-file (seeds §0)"
WD="$TMPDIR/with-text"
setup_workdir "$WD"
echo "Short description of the work item to survey" > "$TMPDIR/item-text.txt"
( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title="Second Survey" --item-id=abc-123 --item-text-file="$TMPDIR/item-text.txt" >/dev/null 2>&1 )
rc=$?
assert_exit 0 "$rc" "happy-path with item-text-file"
assert_grep "Source work-item text" "$WD/surveys/second-survey-survey.md" "context section seeded"
assert_grep "Short description of the work item" "$WD/surveys/second-survey-survey.md" "item text content present"

echo "[survey-init.test] Custom --out-dir + explicit --slug"
WD="$TMPDIR/custom"
setup_workdir "$WD"
( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title="Anything" --item-id=X1 --out-dir=docs/intent --slug=q3-plan >/dev/null 2>&1 )
rc=$?
assert_exit 0 "$rc" "happy-path with custom out-dir + slug"
assert_exists "$WD/docs/intent/q3-plan-survey.md" "envelope at custom out-dir + slug"

echo "[survey-init.test] Generic item-id (no idea-<N> format imposed)"
WD="$TMPDIR/generic-id"
setup_workdir "$WD"
( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title="Migration" --item-id="JIRA-9001/sub-b" >/dev/null 2>&1 )
rc=$?
assert_exit 0 "$rc" "arbitrary item-id accepted"
assert_grep "JIRA-9001/sub-b" "$WD/surveys/migration-survey.md" "arbitrary item-id substituted"

echo "[survey-init.test] bug-144 cwd-robustness — invoke from a subdir"
WD="$TMPDIR/cwd"
setup_workdir "$WD"
mkdir -p "$WD/deeply/nested/sub"
( cd "$WD/deeply/nested/sub" && bash "$WD/skills/survey/scripts/survey-init.sh" --title="Anchored" --item-id=A1 >/dev/null 2>&1 )
rc=$?
assert_exit 0 "$rc" "invocation from subdir succeeds"
assert_exists "$WD/surveys/anchored-survey.md" "envelope landed at REPO_ROOT not the caller cwd"
[[ ! -e "$WD/deeply/nested/sub/surveys" ]] && { echo "  ✓ no surveys/ leaked into caller cwd"; PASS=$((PASS+1)); } || { echo "  ✗ surveys/ leaked into caller cwd" >&2; FAIL=$((FAIL+1)); }

echo "[survey-init.test] Missing required arg → EX_USAGE 64"
WD="$TMPDIR/missing-arg"
setup_workdir "$WD"
set +e; ( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title="No Item" >/dev/null 2>&1 ); rc=$?; set -e
assert_exit 64 "$rc" "missing --item-id → EX_USAGE"

echo "[survey-init.test] Unknown arg → EX_USAGE 64"
WD="$TMPDIR/unknown-arg"
setup_workdir "$WD"
set +e; ( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title=T --item-id=X --bogus=1 >/dev/null 2>&1 ); rc=$?; set -e
assert_exit 64 "$rc" "unknown argument → EX_USAGE"

echo "[survey-init.test] Refuse overwrite → exit 1"
WD="$TMPDIR/overwrite"
setup_workdir "$WD"
( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title="Once" --item-id=O1 >/dev/null 2>&1 )
set +e; ( cd "$WD" && bash skills/survey/scripts/survey-init.sh --title="Once" --item-id=O1 >/dev/null 2>&1 ); rc=$?; set -e
assert_exit 1 "$rc" "refuse-overwrite on second invocation (runtime failure, not EX_USAGE)"

echo
echo "[survey-init.test] Result: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]] || exit 1
exit 0
