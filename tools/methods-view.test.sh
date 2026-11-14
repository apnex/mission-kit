#!/usr/bin/env bash
# methods-view.test.sh - hold generate-index.mjs to generating a procedure's citing work-types.
#
# Sovereign duty: the reverse view of work-types' methods on M* procedure entries, declared in SC1
# and measured by W0 Attachment. Runs inside an isolated temporary copy of the repository so a
# failing mutant can never leave live methods/ files dirty.
#
# Usage:  tools/methods-view.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
sandbox=$(mktemp -d /tmp/mk-methods-view-test-XXXXXX)
trap 'chmod -R u+w "$sandbox" 2>/dev/null || true; rm -rf "$sandbox"' EXIT

mkdir -p "$sandbox"
tar -C "$root" --exclude='.git' --exclude='schemas/node_modules' --exclude='docs/evals/runs' --exclude='docs/evals/human' --exclude='docs/evals/context-lab' --exclude='docs/evals/standing' --exclude='docs/investigations' --exclude='docs/audits' --exclude='docs/DELTAS' --exclude='docs/surveys' -cf - . | tar -C "$sandbox" -xf -
cd "$sandbox"

pass=0; fail=0
mx=methods/M99-reverse-view-fixture.md
wx=work-types/W99-reverse-view-fixture.md
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

cat > "$mx" <<'EOF'
---
id: M99
category: method
title: Reverse view fixture procedure
status: active
hydrate-when: You are testing that generate-index builds a procedure's reverse view from methods
supersedes: []
related: [M0]
---

# M99 - Fixture

## Rule

Fixture rule.

---

## Work-types that cite this procedure

Generated from each work-type's `methods`; a procedure no work-type cites shows an empty table.

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
<!-- END GENERATED -->
EOF

cat > "$wx" <<'EOF'
---
id: W99
category: work-type
title: reverse-view-fixture - test citing procedure M99
status: active
hydrate-when: You are testing that a work-type's methods field populates the procedure's reverse view
roleEligibility: [engineer]
domainEligibility: [delivery-code]
evidenceAuthority: executor-evidence
methods: [M99]
related: [W0]
---

# W99 - Fixture
EOF

if ! grep -q '^id: M99$' "$mx" || ! grep -q '^methods: \[M99\]$' "$wx"; then
	no "fixtures applied"
else
	out_stale=$(node tools/generate-index.mjs --check 2>&1)
	rc_stale=$?
	if [ "$rc_stale" -ne 0 ] && grep -qF "FAIL  stale  $mx" <<< "$out_stale"; then
		ok "--check refuses a stale procedure reverse view"
	else
		no "--check refuses a stale procedure reverse view"
	fi

	node tools/generate-index.mjs >/dev/null 2>&1
	if grep -q 'W99-reverse-view-fixture.md' "$mx"; then
		ok "a citing work-type is generated into the procedure's reverse view"
	else
		no "a citing work-type is generated into the procedure's reverse view"
	fi

	rm -f "$wx"
	node tools/generate-index.mjs >/dev/null 2>&1
	if grep -q 'W99-reverse-view-fixture.md' "$mx"; then
		no "removing the citing work-type clears it from the procedure's reverse view"
	else
		ok "removing the citing work-type clears it from the procedure's reverse view"
	fi
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
