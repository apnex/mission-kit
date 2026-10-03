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
trap 'rm -f "$fx"; node tools/generate-index.mjs >/dev/null 2>&1' EXIT
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }
mk() { printf -- '---\nid: ST9\ncategory: set\ntitle: fixture\nstatus: active\nhydrate-when: You are testing that a malformed set is refused by the gate\nrelated: [ST0]\n%b---\n\n# fixture\n\n<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->\n<!-- END GENERATED -->\n' "$1" > "$fx"; }
draft=$(grep -l '^status: draft' */*.md 2>/dev/null | head -1 | xargs -r awk '/^id:/{print $2; exit}')

refuses() { # label, members-frontmatter, expected message
	mk "$2"
	if ! grep -qF "$(printf '%b' "$2" | head -1)" "$fx"; then no "$1 (fixture did not apply)"; return; fi
	out=$(node tools/generate-index.mjs 2>&1); if printf '%s' "$out" | grep -qF "$3"; then ok "$1"; else no "$1"; fi
}
refuses "a member that is not an entry is refused" 'members: [S999]\n' 'member S999 is not an entry'
refuses "a superseded member is refused" 'members: [M3]\n' 'member M3 is superseded'
[ -n "$draft" ] && refuses "a draft member is refused" "members: [$draft]\n" "member $draft is draft"
refuses "an empty members list is refused" 'members: []\n' 'a set with no members'
refuses "a block-list member is read, and refused if superseded" 'members:\n  - S6\n  - M3\n' 'member M3 is superseded'

mk 'members:\n  - S6\n  - M1\n'
node tools/generate-index.mjs >/dev/null 2>&1
grep -q 'S6-one-sentence' "$fx" && grep -q 'M1-triangulated' "$fx" && ok "a valid set's index is generated from its members" || no "a valid set's index is generated from its members"
mk 'members:\n  - S6\n'
node tools/generate-index.mjs >/dev/null 2>&1
grep -q 'M1-triangulated' "$fx" && no "removing a member removes it from the index" || ok "removing a member removes it from the index"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
