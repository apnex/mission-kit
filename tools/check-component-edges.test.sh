#!/usr/bin/env bash
# check-component-edges.test.sh - hold check-component-edges.mjs to bidirectional symmetry and status guards.
#
# Sovereign duty: check-component-edges.mjs edge symmetry, dangling-ref, self-loop, draft-consumer (0116),
# and retired tombstone isolation checks (B112). Runs exclusively against isolated /tmp copies.
#
# Usage:  tools/check-component-edges.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

copy_comp() {
	rm -rf "$tmp/components"
	cp -R components "$tmp/components"
}

# 1. Live components/ directory passes.
node tools/check-component-edges.mjs >/dev/null 2>&1 \
	&& ok "live components/ directory passes check-component-edges.mjs" \
	|| no "live components/ directory failed check-component-edges.mjs"

# 2. Asymmetric Consumes (C12 consumes C11 without C11 listing C12 in Consumed-by).
copy_comp
sed -i 's/\*\*Consumes\*\* - nothing/\*\*Consumes\*\* - [`C11`](C11-snap-grid.md)/' "$tmp/components/C12-input-binding.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "omits C12 from Consumed-by" <<< "$out" \
	&& ok "asymmetric Consumes without Consumed-by is refused (B112)" \
	|| no "asymmetric Consumes was not refused (rc=$rc): $out"

# 3. Asymmetric Consumed-by (C11 lists C12 in Consumed-by without C12 consuming C11).
copy_comp
sed -i 's/\*\*Consumed-by\*\* - `drawv2`/\*\*Consumed-by\*\* - [`C12`](C12-input-binding.md) and `drawv2`/' "$tmp/components/C11-snap-grid.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "omits C11 from Consumes" <<< "$out" \
	&& ok "asymmetric Consumed-by without Consumes is refused (B112)" \
	|| no "asymmetric Consumed-by was not refused (rc=$rc): $out"

# 4. Dangling component ID reference is refused.
copy_comp
sed -i 's/\*\*Consumes\*\* - nothing/\*\*Consumes\*\* - [`C999`](C999-missing.md)/' "$tmp/components/C11-snap-grid.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "dangling component reference in Consumes -> C999" <<< "$out" \
	&& ok "dangling component reference is refused" \
	|| no "dangling reference was not refused (rc=$rc): $out"

# 5. Self-loop is refused.
copy_comp
sed -i 's/\*\*Consumes\*\* - nothing/\*\*Consumes\*\* - [`C11`](C11-snap-grid.md)/' "$tmp/components/C11-snap-grid.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "self-loop in Consumes -> C11" <<< "$out" \
	&& ok "self-loop edge is refused" \
	|| no "self-loop was not refused (rc=$rc): $out"

# 6. Active component declaring symmetric Consumes -> draft C15 is refused (0116).
copy_comp
sed -i 's/\*\*Consumes\*\* - nothing/\*\*Consumes\*\* - [`C15`](C15-entity-graph.md)/' "$tmp/components/C11-snap-grid.md"
sed -i 's/\*\*Consumed-by\*\* - candidates/\*\*Consumed-by\*\* - [`C11`](C11-snap-grid.md) and candidates/' "$tmp/components/C15-entity-graph.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "active component declares Consumes -> draft C15" <<< "$out" \
	&& ok "active component consuming draft component is refused (0116)" \
	|| no "active consuming draft was not refused (rc=$rc): $out"

# 7. Retired tombstone holding an active edge (C7 retired while consuming C1/C3 and consumed by C10) is refused.
copy_comp
sed -i 's/^status: active$/status: retired/' "$tmp/components/C7-caller-identity.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "status 'retired' must isolate with zero edges" <<< "$out" \
	&& ok "retired component carrying active edges is refused (tombstone isolation)" \
	|| no "retired component with active edges was not refused (rc=$rc): $out"

# 8. Symmetric Contains <-> Contained-by pair (with blank line after ## Edges) passes.
copy_comp
sed -i 's/\*\*Contains\*\* - /\*\*Contains\*\* - [`C12`](C12-input-binding.md) and /' "$tmp/components/C11-snap-grid.md"
sed -i 's/\*\*Contained-by\*\* - nothing/\*\*Contained-by\*\* - [`C11`](C11-snap-grid.md)/' "$tmp/components/C12-input-binding.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -eq 0 ] \
	&& ok "symmetric Contains <-> Contained-by passes (paragraph 0 after ## Edges blank line)" \
	|| no "symmetric Contains <-> Contained-by failed (rc=$rc): $out"

# 9. Asymmetric Contains without Contained-by is refused.
copy_comp
sed -i 's/\*\*Contains\*\* - /\*\*Contains\*\* - [`C12`](C12-input-binding.md) and /' "$tmp/components/C11-snap-grid.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "omits C11 from Contained-by" <<< "$out" \
	&& ok "asymmetric Contains without Contained-by is refused" \
	|| no "asymmetric Contains was not refused (rc=$rc): $out"

# 10. Asymmetric Contained-by without Contains is refused.
copy_comp
sed -i 's/\*\*Contained-by\*\* - nothing/\*\*Contained-by\*\* - [`C11`](C11-snap-grid.md)/' "$tmp/components/C12-input-binding.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "omits C12 from Contains" <<< "$out" \
	&& ok "asymmetric Contained-by without Contains is refused" \
	|| no "asymmetric Contained-by was not refused (rc=$rc): $out"

# 11. Self-loop in Contains (paragraph 0) is refused.
copy_comp
sed -i 's/\*\*Contains\*\* - /\*\*Contains\*\* - [`C11`](C11-snap-grid.md) and /' "$tmp/components/C11-snap-grid.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "self-loop in Contains -> C11" <<< "$out" \
	&& ok "self-loop in Contains is refused" \
	|| no "self-loop in Contains was not refused (rc=$rc): $out"

# 12. Active component declaring symmetric Contains -> draft C15 is refused.
copy_comp
sed -i 's/\*\*Contains\*\* - /\*\*Contains\*\* - [`C15`](C15-entity-graph.md) and /' "$tmp/components/C11-snap-grid.md"
sed -i 's/\*\*Contained-by\*\* - nothing/\*\*Contained-by\*\* - [`C11`](C11-snap-grid.md)/' "$tmp/components/C15-entity-graph.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "active component declares Contains -> draft C15" <<< "$out" \
	&& ok "active component containing draft component is refused" \
	|| no "active containing draft was not refused (rc=$rc): $out"

# 13. Retired tombstone holding a Contains edge (paragraph 0) is refused.
copy_comp
sed -i 's/^status: active$/status: retired/' "$tmp/components/C11-snap-grid.md"
sed -i 's/\*\*Contains\*\* - /\*\*Contains\*\* - [`C12`](C12-input-binding.md) and /' "$tmp/components/C11-snap-grid.md"
out=$(node tools/check-component-edges.mjs --dir "$tmp/components" 2>&1); rc=$?
[ "$rc" -ne 0 ] && grep -qF "status 'retired' must isolate with zero edges, found Contains -> C12" <<< "$out" \
	&& ok "retired component carrying Contains edge is refused" \
	|| no "retired component with Contains edge was not refused (rc=$rc): $out"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
