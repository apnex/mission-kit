#!/usr/bin/env bash
# traits.test.sh - hold check-traits.mjs to vocabulary parity, floor exclusivity, and CLI validation.
#
# Sovereign duty: every refusal of tools/check-traits.mjs - a trait declared in traits/ and absent
# from the applies-to enum, an enum value not defined in traits/, a missing floor value, an axiom
# combining any-system with a trait in applies-to (inline, reversed, block list with comments and
# trailing list keys, or multi-line flow array, B118), an axiom with empty or unknown applies-to,
# empty traits/ or axioms/ directories, and missing/flag-like/nonexistent --root or unknown flags.
#
# Usage:  tools/traits.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tool="$root/tools/check-traits.mjs"
sandbox=$(mktemp -d /tmp/mk-traits-test-XXXXXX)
trap 'rm -rf "$sandbox"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

reset_fixture() {
	rm -rf "$sandbox/schemas" "$sandbox/traits" "$sandbox/axioms"
	mkdir -p "$sandbox/schemas/catalog-entry/v1alpha1" "$sandbox/traits" "$sandbox/axioms"
	cat > "$sandbox/schemas/catalog-entry/v1alpha1/catalog-entry.schema.json" <<'EOF'
{
  "properties": {
    "applies-to": {
      "items": {
        "enum": ["any-system", "stateful", "multi-agent"]
      }
    }
  }
}
EOF
	touch "$sandbox/traits/T1-stateful.md" "$sandbox/traits/T3-multi-agent.md"
	cat > "$sandbox/axioms/A1-state.md" <<'EOF'
---
id: A1
category: axiom
title: State
status: active
applies-to:
  - stateful # inline comment
related:
  - any-system
---
EOF
	cat > "$sandbox/axioms/A3-floor.md" <<'EOF'
---
id: A3
category: axiom
title: Floor
status: active
applies-to: [any-system] # floor only
---
EOF
}

# Case 1: valid fixture (including block list with inline comment and subsequent list key) passes.
reset_fixture
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -eq 0 ] && grep -q "clean: 2 trait(s) and the floor match the applies-to vocabulary across 2 axiom(s)." <<< "$out"; then
	ok "valid traits and floor-exclusive axioms pass"
else
	no "valid traits and floor-exclusive axioms pass"
fi

# Case 2: trait in traits/ absent from applies-to enum is refused.
reset_fixture
touch "$sandbox/traits/T4-autonomous.md"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  trait autonomous is declared in traits/ and absent from the applies-to enum" <<< "$out"; then
	ok "trait declared in traits/ and absent from enum is refused"
else
	no "trait declared in traits/ and absent from enum is refused"
fi

# Case 3: applies-to enum value with no trait in traits/ is refused.
reset_fixture
rm "$sandbox/traits/T3-multi-agent.md"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  applies-to admits multi-agent, which no trait in traits/ defines" <<< "$out"; then
	ok "enum value without matching trait file is refused"
else
	no "enum value without matching trait file is refused"
fi

# Case 4: applies-to enum missing the floor (any-system) is refused.
reset_fixture
sed -i 's/"any-system", //' "$sandbox/schemas/catalog-entry/v1alpha1/catalog-entry.schema.json"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  applies-to no longer admits the floor, any-system" <<< "$out"; then
	ok "applies-to enum missing any-system floor is refused"
else
	no "applies-to enum missing any-system floor is refused"
fi

# Case 5: axiom combining any-system with a trait (inline list) is refused (B118).
reset_fixture
sed -i 's/applies-to: \[any-system\]/applies-to: [any-system, multi-agent]/' "$sandbox/axioms/A3-floor.md"
if ! grep -q 'any-system, multi-agent' "$sandbox/axioms/A3-floor.md"; then
	no "axiom combining any-system with a trait (inline) is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox" 2>&1)
	if [ $? -ne 0 ] && grep -qF "FAIL  axioms/A3-floor.md combines the floor (any-system) with trait tag(s): multi-agent (T0)" <<< "$out"; then
		ok "axiom combining any-system with a trait (inline) is refused"
	else
		no "axiom combining any-system with a trait (inline) is refused"
	fi
fi

# Case 6: axiom combining any-system after a trait ([stateful, any-system]) is refused.
reset_fixture
sed -i 's/applies-to: \[any-system\]/applies-to: [stateful, any-system]/' "$sandbox/axioms/A3-floor.md"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  axioms/A3-floor.md combines the floor (any-system) with trait tag(s): stateful (T0)" <<< "$out"; then
	ok "axiom combining trait before any-system is refused"
else
	no "axiom combining trait before any-system is refused"
fi

# Case 7: axiom combining any-system with a trait (block list) is refused.
reset_fixture
cat > "$sandbox/axioms/A3-floor.md" <<'EOF'
---
id: A3
category: axiom
title: Floor
status: active
applies-to:
  - any-system
  - stateful
---
EOF
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  axioms/A3-floor.md combines the floor (any-system) with trait tag(s): stateful (T0)" <<< "$out"; then
	ok "axiom combining any-system with a trait (block list) is refused"
else
	no "axiom combining any-system with a trait (block list) is refused"
fi

# Case 8: axiom combining any-system with a trait (multi-line flow array) is refused.
reset_fixture
cat > "$sandbox/axioms/A3-floor.md" <<'EOF'
---
id: A3
category: axiom
title: Floor
status: active
applies-to: [
  any-system,
  multi-agent
]
---
EOF
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  axioms/A3-floor.md combines the floor (any-system) with trait tag(s): multi-agent (T0)" <<< "$out"; then
	ok "axiom combining any-system with a trait (multi-line flow array) is refused"
else
	no "axiom combining any-system with a trait (multi-line flow array) is refused"
fi

# Case 9: axiom declaring empty or missing applies-to is refused.
reset_fixture
sed -i 's/applies-to: \[any-system\].*/applies-to: []/' "$sandbox/axioms/A3-floor.md"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  axioms/A3-floor.md declares no applies-to tags" <<< "$out"; then
	ok "axiom with empty applies-to is refused"
else
	no "axiom with empty applies-to is refused"
fi

# Case 10: axiom naming unknown applies-to tag is refused.
reset_fixture
sed -i 's/applies-to: \[any-system\].*/applies-to: [nonexistent-trait]/' "$sandbox/axioms/A3-floor.md"
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  axioms/A3-floor.md names unknown applies-to tag nonexistent-trait" <<< "$out"; then
	ok "axiom with unknown applies-to tag is refused"
else
	no "axiom with unknown applies-to tag is refused"
fi

# Case 11: empty traits/ or empty axioms/ directory is refused.
reset_fixture
rm -f "$sandbox"/axioms/A*.md
out=$(node "$tool" --root "$sandbox" 2>&1)
if [ $? -ne 0 ] && grep -qF "FAIL  no axioms found in axioms/" <<< "$out"; then
	ok "empty axioms/ directory is refused"
else
	no "empty axioms/ directory is refused"
fi

# Case 12: missing --root value, flag-like --root value, nonexistent --root, or unknown flag exits 2 with specific diagnostic.
out=$(node "$tool" --root 2>&1); rc1=$?
out2=$(node "$tool" --root -x 2>&1); rc2=$?
out3=$(node "$tool" --root "$sandbox/no-such-dir" 2>&1); rc3=$?
out4=$(node "$tool" --bogus 2>&1); rc4=$?
if [ $rc1 -eq 2 ] && grep -qF -- "missing argument for --root" <<< "$out" \
	&& [ $rc2 -eq 2 ] && grep -qF -- "missing argument for --root" <<< "$out2" \
	&& [ $rc3 -eq 2 ] && grep -qF -- "--root is not an existing directory" <<< "$out3" \
	&& [ $rc4 -eq 2 ] && grep -qF -- "unknown argument: --bogus" <<< "$out4"; then
	ok "missing, flag-like, or nonexistent --root value and unknown flag exit 2"
else
	no "missing, flag-like, or nonexistent --root value and unknown flag exit 2"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
