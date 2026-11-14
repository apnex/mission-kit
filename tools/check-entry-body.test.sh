#!/usr/bin/env bash
# check-entry-body.test.sh - hold check-entry-body.sh to every category, order and charter refusal.
#
# Sovereign duty: check-entry-body.sh's body-shape and charter-heading contract, and no other.
# Exercises missing required sections, section ordering, layer charters (<prefix>0), spanning-set
# charters (category: set, B104), and exemptIds against isolated /tmp fixtures.
#
# Usage:  tools/check-entry-body.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

# Build a minimal valid repo clone with real SC6 declaration and representative fixtures.
build_fx() {
	local d=$1
	rm -rf "$d"
	mkdir -p "$d/schemas/entry-body/v1alpha1" "$d/axioms" "$d/entities" "$d/sets"
	cp schemas/entry-body/v1alpha1/entry-body.json "$d/schemas/entry-body/v1alpha1/"
	cat > "$d/axioms/README.md" <<'EOF'
---
id: A0
category: axiom
title: Axioms - fixture charter
status: active
hydrate-when: You are testing that an exempt layer charter is checked against spec.charters
---

# Axioms

## Vision
## Territory
## Operation
## Faults
## Index
EOF
	cat > "$d/axioms/A99-fixture.md" <<'EOF'
---
id: A99
category: axiom
title: Fixture axiom
status: active
hydrate-when: You are testing a valid axiom entry body shape
---

# A99

## Mandate
## Mechanics
## Rationale
## Faults
## Success signals
EOF
	cat > "$d/entities/README.md" <<'EOF'
---
id: E0
category: entity
title: Entities - fixture charter
status: active
hydrate-when: You are testing entity charter checking in isolated fixtures
---

# Entities

## Vision
## Territory
## Operation
## Faults
## Index
EOF
	cat > "$d/entities/E99-fixture.md" <<'EOF'
---
id: E99
category: entity
title: Fixture entity
status: active
hydrate-when: You are testing a valid ordered entity entry body shape
---

# E99

## Definition
## Discriminators
## Boundaries
## Relations
## Why precision matters
EOF
	cat > "$d/sets/README.md" <<'EOF'
---
id: ST0
category: set
title: Sets - fixture charter
status: active
hydrate-when: You are testing spanning set layer charter checking
---

# Sets

## Vision
## Territory
## Operation
## Faults
## Index
EOF
	cat > "$d/sets/ST9-fixture.md" <<'EOF'
---
id: ST9
category: set
title: Fixture spanning set
status: active
hydrate-when: You are testing spanning set charter body validation (B104)
---

# ST9

## Vision
## Territory
## Operation
## Faults
## Index
EOF
	git -C "$d" init -q
	git -C "$d" config user.email test@example.com
	git -C "$d" config user.name test
	git -C "$d" add -A
	git -C "$d" commit -q -m init
}

# 1. Live repository passes.
./tools/check-entry-body.sh >/dev/null 2>&1 \
	&& ok "live repository passes check-entry-body.sh" \
	|| no "live repository passes check-entry-body.sh"

# 2. Clean fixture passes (including A0 exempt from axiom shape, holding charter headings).
fx="$tmp/repo"
build_fx "$fx"
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1)
[ $? -eq 0 ] && ok "valid isolated fixture passes (including exemptIds)" || no "valid isolated fixture failed: $out"

# 3. Missing required section on a governed category fails.
build_fx "$fx"
sed -i '/^## Mechanics$/d' "$fx/axioms/A99-fixture.md"
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "has no '## Mechanics'" <<< "$out" \
	&& ok "missing section on governed category is refused" \
	|| no "missing section was not refused (rc=$rc): $out"

# 4. Out-of-order sections on an ordered category fail.
build_fx "$fx"
awk '{if (/^## Boundaries$/) next; print} /^## Why precision matters$/{print "\n## Boundaries"}' "$fx/entities/E99-fixture.md" > "$fx/entities/E99-fixture.md.tmp"
mv "$fx/entities/E99-fixture.md.tmp" "$fx/entities/E99-fixture.md"
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "section order" <<< "$out" \
	&& ok "out-of-order sections on ordered category are refused" \
	|| no "out-of-order sections were not refused (rc=$rc): $out"

# 5. Missing charter heading on a <prefix>0 layer charter fails.
build_fx "$fx"
sed -i '/^## Faults$/d' "$fx/entities/README.md"
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "(charter E0) has no '## Faults'" <<< "$out" \
	&& ok "layer charter missing required heading is refused" \
	|| no "layer charter missing Faults was not refused (rc=$rc): $out"

# 6. Spanning-set charter (category: set, ST9) missing Vision or Operation is refused (B104).
build_fx "$fx"
sed -i '/^## Operation$/d' "$fx/sets/ST9-fixture.md"
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "(charter ST9) has no '## Operation'" <<< "$out" \
	&& ok "spanning-set charter missing Operation is refused (B104)" \
	|| no "spanning-set charter missing Operation was not refused (rc=$rc): $out"

# 7. Untracked spanning-set charter is still caught before git add.
build_fx "$fx"
cat > "$fx/sets/ST10-untracked.md" <<'EOF'
---
id: ST10
category: set
title: Untracked spanning set missing Vision
status: active
hydrate-when: You are testing that untracked spanning-set charters are checked
---

# ST10

## Purpose
## Territory
## Faults
## Index
EOF
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "(charter ST10) has no '## Vision'" <<< "$out" \
	&& ok "untracked spanning-set charter missing Vision is refused" \
	|| no "untracked spanning-set charter was not refused (rc=$rc): $out"

# 8. Quoted frontmatter category ("set") is normalized and still checked.
build_fx "$fx"
sed -i 's/^category: set$/category: "set"/' "$fx/sets/ST9-fixture.md"
sed -i '/^## Operation$/d' "$fx/sets/ST9-fixture.md"
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "(charter ST9) has no '## Operation'" <<< "$out" \
	&& ok "quoted frontmatter category is normalized and refused on missing heading" \
	|| no "quoted frontmatter category bypassed check (rc=$rc): $out"

# 9. spec.charters.exemptIds exempts a declared charter id.
build_fx "$fx"
sed -i '/^## Operation$/d' "$fx/sets/ST9-fixture.md"
node -e '
	const fs = require("fs");
	const p = process.argv[1];
	const d = JSON.parse(fs.readFileSync(p, "utf8"));
	d.spec.charters.exemptIds = ["ST9"];
	fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
' "$fx/schemas/entry-body/v1alpha1/entry-body.json"
out=$(./tools/check-entry-body.sh --root "$fx" 2>&1); rc=$?
[ "$rc" -eq 0 ] \
	&& ok "spec.charters.exemptIds exempts a declared charter id" \
	|| no "spec.charters.exemptIds failed to exempt ST9 (rc=$rc): $out"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
