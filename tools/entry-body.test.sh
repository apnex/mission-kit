#!/usr/bin/env bash
# entry-body.test.sh - hold check-entry-body.sh to its category and charter refusals.
#
# Sovereign duty: every refusal of tools/check-entry-body.sh - missing section in a governed
# category, out-of-order sections in an ordered category, missing E4 heading in a <prefix>0 layer
# charter, and missing E4 heading in a spanning-set charter declaring category: set. Runs inside an
# isolated temporary git copy so fixtures never touch the live working tree.
#
# Usage:  tools/entry-body.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
sandbox=$(mktemp -d /tmp/mk-entry-body-test-XXXXXX)
trap 'chmod -R u+w "$sandbox" 2>/dev/null || true; rm -rf "$sandbox"' EXIT

mkdir -p "$sandbox"
tar -C "$root" --exclude='.git' --exclude='schemas/node_modules' --exclude='docs/evals/runs' --exclude='docs/evals/human' --exclude='docs/evals/context-lab' --exclude='docs/evals/standing' --exclude='docs/investigations' --exclude='docs/audits' --exclude='docs/DELTAS' --exclude='docs/surveys' -cf - . | tar -C "$sandbox" -xf -
cd "$sandbox"
git init -q
git config user.name "Test"
git config user.email "test@localhost"
git add -A
git commit -q -m "fixture base"

pass=0; fail=0
ax=axioms/A99-body-test-fixture.md
ex=entities/E99-body-test-fixture.md
sx=sets/ST99-body-test-fixture.md
lx_dir=zz-body-test-layer
lx="$lx_dir/README.md"
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

# Case 1: governed category missing a required section (axiom missing Faults) is refused.
cat > "$ax" <<'EOF'
---
id: A99
category: axiom
title: Body test fixture
status: active
hydrate-when: You are testing that a missing governed section is refused by check-entry-body
applies-to: [any-system]
related: [A0]
---

# A99 - Fixture

## Mandate
One.

## Mechanics
Two.

## Rationale
Three.

## Success signals
Four.
EOF
if ! grep -q '^id: A99$' "$ax"; then
	no "missing governed section is refused (fixture did not apply)"
else
	out=$(./tools/check-entry-body.sh 2>&1)
	rc=$?
	if [ "$rc" -ne 0 ] && grep -qF "$ax (axiom) has no '## Faults'" <<< "$out"; then
		ok "missing governed section is refused"
	else
		no "missing governed section is refused"
	fi
fi
rm -f "$ax"

# Case 2: ordered category with sections out of order (entity swapping Boundaries and Discriminators) is refused.
cat > "$ex" <<'EOF'
---
id: E99
category: entity
title: Body order test fixture
status: active
hydrate-when: You are testing that out-of-order governed sections are refused by check-entry-body
related: [E0]
---

# E99 - Fixture

## Definition
One.

## Boundaries
Two.

## Discriminators
Three.

## Relations
Four.

## Why precision matters
Five.
EOF
if ! grep -q '^id: E99$' "$ex"; then
	no "out-of-order governed sections are refused (fixture did not apply)"
else
	out=$(./tools/check-entry-body.sh 2>&1)
	rc=$?
	if [ "$rc" -ne 0 ] && grep -qF "$ex (entity) declares ordered sections" <<< "$out"; then
		ok "out-of-order governed sections are refused"
	else
		no "out-of-order governed sections are refused"
	fi
fi
rm -f "$ex"

# Case 3: <prefix>0 layer charter missing an E4 heading (Vision) is refused.
mkdir -p "$lx_dir"
cat > "$lx" <<'EOF'
---
id: ZZ0
category: style
title: Zz - body test layer charter
status: active
hydrate-when: You are testing that a layer charter missing an E4 heading is refused
related: [S0]
---

# ZZ0 - Fixture

## Territory
One.

## Operation
Two.

## Faults
Three.

## Index
Four.
EOF
if ! grep -q '^id: ZZ0$' "$lx"; then
	no "layer charter missing Vision is refused (fixture did not apply)"
else
	out=$(./tools/check-entry-body.sh 2>&1)
	rc=$?
	if [ "$rc" -ne 0 ] && grep -qF "$lx (charter ZZ0) has no '## Vision'" <<< "$out"; then
		ok "layer charter missing Vision is refused"
	else
		no "layer charter missing Vision is refused"
	fi
fi
rm -rf "$lx_dir"

# Case 4: spanning-set charter (category: set) missing an E4 heading (Operation) is refused.
cat > "$sx" <<'EOF'
---
id: ST99
category: set
title: Set charter body test fixture
status: active
hydrate-when: You are testing that a spanning-set charter missing Operation is refused
members: [S15]
related: [ST0]
---

# ST99 - Fixture

## Vision
One.

## Territory
Two.

## Faults
Three.

## Index
Four.
EOF
if ! grep -q '^id: ST99$' "$sx"; then
	no "spanning-set charter missing Operation is refused (fixture did not apply)"
else
	out=$(./tools/check-entry-body.sh 2>&1)
	rc=$?
	if [ "$rc" -ne 0 ] && grep -qF "$sx (charter ST99) has no '## Operation'" <<< "$out"; then
		ok "spanning-set charter missing Operation is refused"
	else
		no "spanning-set charter missing Operation is refused"
	fi
fi

# Case 5: conformant spanning-set charter with all five E4 headings passes.
cat > "$sx" <<'EOF'
---
id: ST99
category: set
title: Set charter body test fixture
status: active
hydrate-when: You are testing that a conformant spanning-set charter passes check-entry-body
members: [S15]
related: [ST0]
---

# ST99 - Fixture

## Vision
One.

## Territory
Two.

## Operation
Three.

## Faults
Four.

## Index
Five.
EOF
out=$(./tools/check-entry-body.sh 2>&1)
rc=$?
if [ "$rc" -eq 0 ]; then
	ok "conformant spanning-set charter with all five E4 headings passes"
else
	no "conformant spanning-set charter with all five E4 headings passes"
fi
rm -f "$sx"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
