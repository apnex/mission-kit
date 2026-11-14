#!/usr/bin/env bash
# decisions.test.sh - hold check-decisions.mjs to AR4's register shape and absorption reporting.
#
# Sovereign duty: the register refusals and pending-absorption accounting in tools/check-decisions.mjs.
# Confirms duplicate ids and missing affects paths fail, live pending general rulings are reported as
# pending absorption, and rulings superseded before absorption are not misreported as pending.
#
# Usage:  tools/decisions.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
pass=0; fail=0
tmp=$(mktemp -d /tmp/mk-decisions-test-XXXXXX)
trap 'rm -rf "$tmp"' EXIT
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

rel_tmp_check() {
	node -e '
		const { execFileSync } = require("node:child_process");
		const path = require("node:path");
		const rel = path.relative(process.cwd(), process.argv[1]);
		try {
			const out = execFileSync("node", ["tools/check-decisions.mjs", rel], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
			process.stdout.write("0\n" + out);
		} catch (e) {
			process.stdout.write((e.status || 1) + "\n" + (e.stdout || "") + (e.stderr || ""));
		}
	' "$1"
}

# Case 1: duplicate id is refused.
f1="$tmp/dup.md"
cat > "$f1" <<'EOF'
| id | date | ruling | kind | authority | status | lineage | affects | absorbed |
|---|---|---|---|---|---|---|---|---|
| 0001 | 2026-10-01 | First ruling. | project | director | ratified | - | - | - |
| 0001 | 2026-10-02 | Duplicate id. | project | director | ratified | - | - | - |
EOF
res=$(rel_tmp_check "$f1")
rc=$(printf '%s' "$res" | head -1)
if [ "$rc" -ne 0 ] && grep -qF "id is not unique" <<< "$res"; then
	ok "duplicate decision id is refused"
else
	no "duplicate decision id is refused"
fi

# Case 2: general ruling naming a non-existent affects path is refused.
f2="$tmp/missing-path.md"
cat > "$f2" <<'EOF'
| id | date | ruling | kind | authority | status | lineage | affects | absorbed |
|---|---|---|---|---|---|---|---|---|
| 0001 | 2026-10-01 | Missing target. | general | director | ratified | - | `axioms/DOES-NOT-EXIST.md` | yes |
EOF
res=$(rel_tmp_check "$f2")
rc=$(printf '%s' "$res" | head -1)
if [ "$rc" -ne 0 ] && grep -qF "which does not exist" <<< "$res"; then
	ok "non-existent affects path is refused"
else
	no "non-existent affects path is refused"
fi

# Case 3: superseded row with absorbed=pending is excluded from pending absorption while live pending row is reported.
f3="$tmp/superseded.md"
cat > "$f3" <<'EOF'
| id | date | ruling | kind | authority | status | lineage | affects | absorbed |
|---|---|---|---|---|---|---|---|---|
| 0001 | 2026-10-01 | Drafted wording replaced before absorption. | general | director | superseded by 0002 | - | `README.md` | pending |
| 0002 | 2026-10-02 | Absorbed replacement ruling. | general | director | ratified | supersedes 0001 | `README.md` | yes |
| 0003 | 2026-10-03 | Live unabsorbed ruling. | general | director | ratified | - | `README.md` | pending |
EOF
res=$(rel_tmp_check "$f3")
rc=$(printf '%s' "$res" | head -1)
if [ "$rc" -eq 0 ] && grep -qxF "pending absorption: 0003" <<< "$res"; then
	ok "superseded pending row is excluded while live pending row is reported"
else
	no "superseded pending row is excluded while live pending row is reported"
fi

# Case 4: superseded row with absorbed=contested is excluded from contested while live contested row is reported.
f4="$tmp/contested.md"
cat > "$f4" <<'EOF'
| id | date | ruling | kind | authority | status | lineage | affects | absorbed |
|---|---|---|---|---|---|---|---|---|
| 0001 | 2026-10-01 | Contested row superseded by later ruling. | general | director | superseded by 0002 | - | `README.md` | contested |
| 0002 | 2026-10-02 | Absorbed replacement ruling. | general | director | ratified | supersedes 0001 | `README.md` | yes |
| 0003 | 2026-10-03 | Live contested ruling. | general | director | ratified | - | `README.md` | contested |
EOF
res=$(rel_tmp_check "$f4")
rc=$(printf '%s' "$res" | head -1)
if [ "$rc" -eq 0 ] && grep -qxF "contested: 0003" <<< "$res"; then
	ok "superseded contested row is excluded while live contested row is reported"
else
	no "superseded contested row is excluded while live contested row is reported"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
