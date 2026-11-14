#!/usr/bin/env bash
# architecture.test.sh - hold generate-architecture.mjs to structural derivation, link rebasing, and --check.
#
# Sovereign duty: generate-architecture.mjs's derived tables, root-to-docs relative link rebasing,
# missing-region failure, and --check staleness refusal.
#
# Usage:  tools/architecture.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tool="$root/tools/generate-architecture.mjs"
sandbox=$(mktemp -d /tmp/mk-arch-test-XXXXXX)
trap 'rm -rf "$sandbox"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

# Case 1: repository with no docs/ARCHITECTURE.md passes cleanly.
mkdir -p "$sandbox/empty"
out=$(node "$tool" --root "$sandbox/empty" 2>&1)
if [ $? -eq 0 ] && grep -q "no docs/ARCHITECTURE.md" <<< "$out"; then
	ok "bootstrap repository with no docs/ARCHITECTURE.md passes"
else
	no "bootstrap repository with no docs/ARCHITECTURE.md passes"
fi

reset_fixture() {
	rm -rf "$sandbox/proj"
	mkdir -p "$sandbox/proj/axioms" "$sandbox/proj/artifacts" "$sandbox/proj/tools" "$sandbox/proj/docs"
	cat > "$sandbox/proj/README.md" <<'EOF'
# fixture

| Prefix | Layer | Owns |
| --- | --- | --- |
| `A` | [`axioms/`](axioms/) | First principles. |
| `AR` | [`artifacts/`](artifacts/README.md) | Document types. |
| - | [`tools/`](tools/README.md) | Gate scripts. |
| - | [`docs/`](docs/README.md) | Held where [`AR0`](artifacts/README.md) and [Board](docs/BOARD.md#held) say, keeping `[code](artifacts/README.md)`, `` `[double](artifacts/README.md)` `` and [ext](https://example.com) literal. |
EOF
	cat > "$sandbox/proj/axioms/README.md" <<'EOF'
---
id: A0
category: axiom
title: Axioms - standing commitments
status: active
related: [AR0, A1]
---
EOF
	cat > "$sandbox/proj/axioms/A1-one.md" <<'EOF'
---
id: A1
category: axiom
title: One
status: active
---
EOF
	cat > "$sandbox/proj/axioms/A2-old.md" <<'EOF'
---
id: A2
category: axiom
title: Old
status: superseded
---
EOF
	cat > "$sandbox/proj/artifacts/README.md" <<'EOF'
---
id: AR0
category: artifact
title: Artifacts - document types
status: active
related: [A1]
---
EOF
	printf '#!/usr/bin/env bash\nrun "structure holds" ./tools/check-structure.sh\n' > "$sandbox/proj/tools/check-all.sh"
	printf '#!/usr/bin/env bash\n' > "$sandbox/proj/tools/check-structure.sh"
	cat > "$sandbox/proj/docs/ARCHITECTURE.md" <<'EOF'
# architecture

<!-- BEGIN GENERATED: architecture-layers. Run tools/generate-architecture.mjs; do not edit by hand. -->
<!-- END GENERATED: architecture-layers -->

<!-- BEGIN GENERATED: architecture-other-layers. Run tools/generate-architecture.mjs; do not edit by hand. -->
<!-- END GENERATED: architecture-other-layers -->

<!-- BEGIN GENERATED: architecture-checks. Run tools/generate-architecture.mjs; do not edit by hand. -->
<!-- END GENERATED: architecture-checks -->
EOF
}

# Case 2: generation derives member counts, cross-layer draws, tool count, gate checks, and rebases root links into docs/.
reset_fixture
out=$(node "$tool" --root "$sandbox/proj" 2>&1)
if [ $? -eq 0 ] \
	&& node "$tool" --root "$sandbox/proj" --check >/dev/null 2>&1 \
	&& grep -qF '| `axioms/` | `A` | standing commitments | 1 | `AR` |' "$sandbox/proj/docs/ARCHITECTURE.md" \
	&& grep -qF '| `tools/` | Gate scripts. 2 scripts. |' "$sandbox/proj/docs/ARCHITECTURE.md" \
	&& grep -qF '[`AR0`](../artifacts/README.md) and [Board](BOARD.md#held) say, keeping `[code](artifacts/README.md)`, `` `[double](artifacts/README.md)` `` and [ext](https://example.com) literal.' "$sandbox/proj/docs/ARCHITECTURE.md"; then
	ok "derives structural tables and rebases root-relative links into docs/"
else
	no "derives structural tables and rebases root-relative links into docs/"
fi

# Case 3: --check refuses a stale generated section.
reset_fixture
node "$tool" --root "$sandbox/proj" >/dev/null
sed -i 's/2 scripts/99 scripts/' "$sandbox/proj/docs/ARCHITECTURE.md"
if ! grep -q "99 scripts" "$sandbox/proj/docs/ARCHITECTURE.md"; then
	no "--check refuses stale derived section (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" --check 2>&1)
	if [ $? -ne 0 ] && grep -q "are stale" <<< "$out"; then
		ok "--check refuses stale derived section"
	else
		no "--check refuses stale derived section"
	fi
fi

# Case 4: missing generated region marker exits non-zero.
reset_fixture
sed -i '/architecture-checks/d' "$sandbox/proj/docs/ARCHITECTURE.md"
if grep -q "architecture-checks" "$sandbox/proj/docs/ARCHITECTURE.md"; then
	no "missing generated region marker fails (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" --check 2>&1)
	if [ $? -ne 0 ] && grep -q "has no checks region" <<< "$out"; then
		ok "missing generated region marker fails"
	else
		no "missing generated region marker fails"
	fi
fi

# Case 5: missing --root argument is refused with exit status 2.
out=$(node "$tool" --root 2>&1)
if [ $? -eq 2 ] && grep -q "FAIL  usage" <<< "$out"; then
	ok "missing --root argument is refused"
else
	no "missing --root argument is refused"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
