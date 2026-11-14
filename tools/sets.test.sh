#!/usr/bin/env bash
# sets.test.sh - hold the spanning-set mechanism to the refusals that make a set trustworthy.
#
# Sovereign duty: the set checks in generate-index.mjs and the set clauses of the catalogue schema,
# and no other. A set routes a reader to everything that governs one situation, so a set that could
# gather an entry that does not exist, is superseded or is still a draft would route a reader to
# guidance not in force. Each case writes a fixture into sets/, confirms the fixture applied, runs the
# checks, and removes it.
#
# Usage:  tools/sets.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
pass=0; fail=0
fx=sets/ST9-test-fixture.md
mx=style/S90-test-fixture.md
# No entry is superseded in the corpus, so the test supplies one of its own.
sx=practices/PC99-superseded-fixture.md
printf -- '---\nid: PC99\ncategory: practice\ntitle: fixture\nstatus: superseded\nhydrate-when: You are testing that a superseded member is refused by the gate\nrelated: [PC0]\n---\n\n# fixture\n' > "$sx"
s0_bak=$(mktemp /tmp/mk-s0-bak-XXXXXX)
cp style/README.md "$s0_bak"
trap 'cp "$s0_bak" style/README.md 2>/dev/null || true; rm -f "$fx" "$sx" "$mx" "$s0_bak"; node tools/generate-index.mjs >/dev/null 2>&1' EXIT
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }
mk() { printf -- '---\nid: ST9\ncategory: set\ntitle: fixture\nstatus: active\nhydrate-when: You are testing that a malformed set is refused by the gate\nrelated: [ST0]\n%b---\n\n# fixture\n\n<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->\n<!-- END GENERATED -->\n' "$1" > "$fx"; }
draft=$(grep -l '^status: draft' */*.md 2>/dev/null | head -1 | xargs -r awk '/^id:/{print $2; exit}')

refuses() { # label, members-frontmatter, expected message
	mk "$2"
	if ! grep -qF "$(printf '%b' "$2" | head -1)" "$fx"; then no "$1 (fixture did not apply)"; return; fi
	# Herestring, not a pipe: grep -q exits on the first match, and under pipefail the writer killed by
	# SIGPIPE makes the pipeline fail, so a correct refusal intermittently read as absent.
	out=$(node tools/generate-index.mjs 2>&1); rc=$?
	if [ "$rc" -ne 0 ] && grep -qF "$3" <<< "$out"; then ok "$1"; else no "$1"; fi
}
refuses "a member that is not an entry is refused" 'members: [S999]\n' 'member S999 is not an entry'
refuses "a superseded member is refused" 'members: [PC99]\n' 'member PC99 is superseded'
[ -n "$draft" ] && refuses "a draft member is refused" "members: [$draft]\n" "member $draft is draft"
refuses "an empty members list is refused" 'members: []\n' 'a set with no members'
refuses "a block-list member is read, and refused if superseded" 'members:\n  - S6\n  - PC99\n' 'member PC99 is superseded'

mk 'members:\n  - S6\n  - M1\n'
node tools/generate-index.mjs >/dev/null 2>&1
grep -q 'S6-one-sentence' "$fx" && grep -q 'M1-triangulated' "$fx" && ok "a valid set's index is generated from its members" || no "a valid set's index is generated from its members"
mk 'members:\n  - S6\n'
node tools/generate-index.mjs >/dev/null 2>&1
grep -q 'M1-triangulated' "$fx" && no "removing a member removes it from the index" || ok "removing a member removes it from the index"
rm -f "$fx"

mk_style() { printf -- '---\nid: S90\ncategory: style\ntitle: fixture\nstatus: active\nhydrate-when: You are testing that a malformed style medium is refused by the gate\nrelated: [S0]\n%b---\n\n# fixture\n' "$1" > "$mx"; }
mk_style ''
if grep -q '^id: S90' "$mx"; then
	out=$(node tools/generate-index.mjs 2>&1); rc=$?
	[ "$rc" -ne 0 ] && grep -qF "style/S90-test-fixture.md: a style rule with no medium" <<< "$out" && ok "a style rule with no medium is refused" || no "a style rule with no medium is refused"
else no "a style rule with no medium is refused (fixture did not apply)"; fi

mk_style 'medium: slides\n'
if grep -q '^medium: slides' "$mx"; then
	out=$(node tools/generate-index.mjs 2>&1); rc=$?
	[ "$rc" -ne 0 ] && grep -qF "medium 'slides' is not one of" <<< "$out" && ok "a style rule with an unknown medium is refused" || no "a style rule with an unknown medium is refused"
else no "a style rule with an unknown medium is refused (fixture did not apply)"; fi

mk_style 'medium: commits\n'
if grep -q '^medium: commits' "$mx"; then
	node tools/generate-index.mjs >/dev/null 2>&1 \
		&& grep -q '^### Sub-set: commits$' style/README.md \
		&& grep -q '^| \[S90\](S90-test-fixture\.md) | fixture | reading |' style/README.md \
		&& ok "a commits-medium style rule ending in 0 renders under ### Sub-set: commits with Held by reading" \
		|| no "a commits-medium style rule ending in 0 renders under ### Sub-set: commits with Held by reading"
else no "a commits-medium style rule ending in 0 renders under ### Sub-set: commits with Held by reading (fixture did not apply)"; fi
rm -f "$mx"

sed -i '/^category: style$/a medium: documents' style/README.md
if grep -q '^medium: documents' style/README.md; then
	out=$(node tools/generate-index.mjs 2>&1); rc=$?
	cp "$s0_bak" style/README.md
	[ "$rc" -ne 0 ] && grep -qF "medium is declared on S0 (style), not a style member" <<< "$out" && ok "medium on the S0 charter is refused" || no "medium on the S0 charter is refused"
else
	cp "$s0_bak" style/README.md
	no "medium on the S0 charter is refused (fixture did not apply)"
fi

printf -- '---\nid: PC99\ncategory: practice\nmedium: documents\ntitle: fixture\nstatus: superseded\nhydrate-when: You are testing that a superseded member is refused by the gate\nrelated: [PC0]\n---\n\n# fixture\n' > "$sx"
if grep -q '^medium: documents' "$sx"; then
	out=$(node tools/generate-index.mjs 2>&1); rc=$?
	[ "$rc" -ne 0 ] && grep -qF "medium is declared on PC99 (practice), not a style member" <<< "$out" && ok "medium on a non-style entry is refused" || no "medium on a non-style entry is refused"
else no "medium on a non-style entry is refused (fixture did not apply)"; fi
rm -f "$sx"

node tools/generate-index.mjs >/dev/null 2>&1
s10_count=$(grep -c '^| \[S10\](S10-horizontal-rule-between-h2-sections\.md) | .* | `tools/s10-section-rules\.sh` |' style/README.md || true)
s0_count=$(grep -c '^| \[S0\](README\.md) |' style/README.md || true)
if grep -q '^### Sub-set: documents$' style/README.md \
	&& grep -q '^### Sub-set: messages$' style/README.md \
	&& grep -q '^### Sub-set: code$' style/README.md \
	&& [ "$s0_count" -eq 1 ] && [ "$s10_count" -eq 1 ]; then
	ok "style/README.md index partitions members into medium sub-sets and keeps S10 in documents"
else
	no "style/README.md index partitions members into medium sub-sets and keeps S10 in documents"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
