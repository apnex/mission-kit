#!/usr/bin/env bash
# component-edges.test.sh - hold check-component-edges.mjs to its bidirectional and shape refusals.
#
# Sovereign duty: every refusal of tools/check-component-edges.mjs - missing edge declaration line,
# asymmetric Consumes vs Consumed-by in either direction, asymmetric Contains vs Contained-by,
# unknown or self peer IDs, unlinked bare peer IDs, and contradictory "nothing" declarations.
#
# Usage:  tools/component-edges.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tool="$root/tools/check-component-edges.mjs"
sandbox=$(mktemp -d /tmp/mk-comp-edges-test-XXXXXX)
trap 'rm -rf "$sandbox"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

reset_fixture() {
	rm -rf "$sandbox/components"
	mkdir -p "$sandbox/components"
	cat > "$sandbox/components/C1-alpha.md" <<'EOF'
---
id: C1
category: component
title: alpha - base unit
status: active
hydrate-when: You are testing component edge symmetry in check-component-edges
sovereignty: internal
---

# C1 - alpha

## Edges

**Contains** - nothing; `alpha` is a leaf component.

**Contained-by** - nothing; `alpha` is top-level.

**Consumes** - nothing; `alpha` depends on no peer component.

**Consumed-by** - [`C2`](C2-beta.md) (`beta`) and `example-app`.
EOF
	cat > "$sandbox/components/C2-beta.md" <<'EOF'
---
id: C2
category: component
title: beta - consumer unit
status: active
hydrate-when: You are testing component edge symmetry in check-component-edges
sovereignty: internal
---

# C2 - beta

## Edges

**Contains** - nothing; `beta` is a leaf component.

**Contained-by** - nothing; `beta` is top-level.

**Consumes** - [`C1`](C1-alpha.md) (`alpha`) through its declared contract.

**Consumed-by** - `example-app`.
EOF
}

# Case 1: symmetric fixture passes.
reset_fixture
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -eq 0 ] && grep -q "2 component(s) declare all four edge lines and agree across 1 peer edge(s)" <<< "$out"; then
	ok "symmetric component edges pass"
else
	no "symmetric component edges pass"
fi

# Case 2: Consumes without matching Consumed-by is refused.
reset_fixture
sed -i 's/\*\*Consumed-by\*\* - .*/**Consumed-by** - `example-app`./' "$sandbox/components/C1-alpha.md"
if grep -q 'C2-beta' "$sandbox/components/C1-alpha.md"; then
	no "Consumes without matching Consumed-by is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox" 2>&1)
	if [ $? -ne 0 ] && grep -qF "C2 Consumes names C1, and C1 Consumed-by does not name C2" <<< "$out"; then
		ok "Consumes without matching Consumed-by is refused"
	else
		no "Consumes without matching Consumed-by is refused"
	fi
fi

# Case 3: Consumed-by without matching Consumes is refused.
reset_fixture
sed -i 's/\*\*Consumes\*\* - .*/**Consumes** - nothing; `beta` depends on no peer./' "$sandbox/components/C2-beta.md"
if grep -q 'C1-alpha' "$sandbox/components/C2-beta.md"; then
	no "Consumed-by without matching Consumes is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox" 2>&1)
	if [ $? -ne 0 ] && grep -qF "C1 Consumed-by names C2, and C2 Consumes does not name C1" <<< "$out"; then
		ok "Consumed-by without matching Consumes is refused"
	else
		no "Consumed-by without matching Consumes is refused"
	fi
fi

# Case 4: Contains without matching Contained-by is refused.
reset_fixture
sed -i 's/\*\*Contains\*\* - .*/**Contains** - [`C2`](C2-beta.md) (`beta`)./' "$sandbox/components/C1-alpha.md"
if ! grep -q 'Contains.*C2-beta' "$sandbox/components/C1-alpha.md"; then
	no "Contains without matching Contained-by is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox" 2>&1)
	if [ $? -ne 0 ] && grep -qF "C1 Contains names C2, and C2 Contained-by does not name C1" <<< "$out"; then
		ok "Contains without matching Contained-by is refused"
	else
		no "Contains without matching Contained-by is refused"
	fi
fi

# Case 5: missing **Consumed-by** line is refused.
reset_fixture
sed -i '/^\*\*Consumed-by\*\*/d' "$sandbox/components/C2-beta.md"
if grep -q 'Consumed-by' "$sandbox/components/C2-beta.md"; then
	no "missing edge declaration line is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox" 2>&1)
	if [ $? -ne 0 ] && grep -qF "components/C2-beta.md (C2) has no '**Consumed-by** -'" <<< "$out"; then
		ok "missing edge declaration line is refused"
	else
		no "missing edge declaration line is refused"
	fi
fi

# Case 6: unknown component and self-edge are refused.
reset_fixture
sed -i 's/\*\*Consumes\*\* - .*/**Consumes** - [`C1`](C1-alpha.md), [`C2`](C2-beta.md), and [`C99`](C99-ghost.md)./' "$sandbox/components/C2-beta.md"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "names itself" <<< "$out" && grep -qF "names C99, which is not a registered component" <<< "$out"; then
	ok "self-edge and unknown peer component are refused"
else
	no "self-edge and unknown peer component are refused"
fi

# Case 7: unlinked bare peer ID and contradictory 'nothing' are refused.
reset_fixture
sed -i 's/\*\*Consumes\*\* - .*/**Consumes** - nothing, except [`C1`](C1-alpha.md) and `C2`./' "$sandbox/components/C2-beta.md"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "without a markdown link" <<< "$out" && grep -qF "says 'nothing' and also names C1" <<< "$out"; then
	ok "unlinked peer ID and contradictory nothing are refused"
else
	no "unlinked peer ID and contradictory nothing are refused"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
