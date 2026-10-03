#!/usr/bin/env bash
# s6-one-sentence-per-line.test.sh - hold the S6 enforcer to the rule it enforces.
#
# Sovereign duty: this tool's behaviour and no other. S6 owns both halves of its rule -- the
# check and the fix share one definition -- so a fix that corrupts its input makes the gate
# unsatisfiable rather than merely noisy. That failure shape is named in the tool's own header
# and is the reason this file exists.
#
# The load-bearing case is the metadata block. A run of `**Key:** value` lines is not prose: S6
# calls it "coupled, each needing its own rendered line" and prescribes a trailing backslash.
# Joining those lines produces the single rendered block the rule exists to prevent, and because
# no sentence terminator separates them the fix cannot undo itself.
#
# Usage:  tools/s6-one-sentence-per-line.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

tool="tools/s6-one-sentence-per-line.mjs"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

pass=0
fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

# A fix must never destroy content it cannot rebuild. Run the tool, then run it again: a tool
# whose output it can no longer split is a tool that has lost information permanently.
assert_preserves_lines() {
	local name=$1 body=$2 expect=$3
	local f="$tmp/$name.md"
	printf '%s' "$body" > "$f"
	node "$tool" --fix "$f" >/dev/null 2>&1
	local got
	got=$(grep -c '^\*\*' "$f")
	if [ "$got" -eq "$expect" ]; then
		ok "$name: $expect metadata line(s) survive the fix"
	else
		no "$name: expected $expect metadata line(s) after fix, got $got"
		printf '        --- produced ---\n'
		sed 's/^/        /' "$f"
	fi
}

# (1) The defect: consecutive metadata lines must not be fused into one line.
assert_preserves_lines "metadata-block" \
'# T

**Methodology:** K5 survey (2-round)
**Work item:** WI-1
**Classification candidate:** feature
' 3

# (2) A single metadata line adjacent to prose must also keep its own line.
assert_preserves_lines "metadata-then-prose" \
'# T

**Work item:** WI-1
Some ordinary prose follows here.
' 1

# (3) Idempotence: a file the tool has already fixed must report clean, and a file it reports
# clean must be one it would not change. A tool that certifies its own corruption is the
# green-and-wrong failure this suite exists to catch.
f="$tmp/idem.md"
printf '# T\n\n**Methodology:** K5 survey (2-round)\n**Work item:** WI-1\n' > "$f"
node "$tool" --fix "$f" >/dev/null 2>&1
before=$(cat "$f")
node "$tool" --fix "$f" >/dev/null 2>&1
after=$(cat "$f")
if [ "$before" = "$after" ]; then
	ok "idempotence: a second fix run changes nothing"
else
	no "idempotence: the fix is not stable across runs"
fi

# (4) Genuine prose must still be split -- the fix must keep working, not be disabled.
f="$tmp/prose.md"
printf '# T\n\nOne sentence here. Two sentence here.\n' > "$f"
node "$tool" --fix "$f" >/dev/null 2>&1
if [ "$(grep -c 'sentence here' "$f")" -eq 2 ] && grep -q 'One sentence here\.\\$' "$f"; then
	ok "prose: two sentences on one line are still split with a hard break"
else
	no "prose: the splitter stopped splitting real prose"
	sed 's/^/        /' "$f"
fi

# (5) A bold lead-in that is a real sentence is prose, not metadata, and must still split.
# `**Diffs.** Rewording one sentence...` appears throughout the corpus and must not be exempted
# by an over-broad metadata pattern.
f="$tmp/boldlead.md"
printf '# T\n\n**Diffs.** Rewording one sentence becomes a one-line diff. PR review stays focused.\n' > "$f"
node "$tool" --fix "$f" >/dev/null 2>&1
if [ "$(grep -c '.' "$f")" -ge 4 ]; then
	ok "bold lead-in: a bold sentence opener is treated as prose and split"
else
	no "bold lead-in: over-broad metadata match swallowed real prose"
	sed 's/^/        /' "$f"
fi

echo
if [ "$fail" -gt 0 ]; then
	
	exit 1
fi
# With no flag the tool checks and writes nothing: running it to look must never change the file.
g="$tmp/default.md"; printf 'One sentence. Two sentences on one line.\n' > "$g"; cp "$g" "$g.orig"
node "$tool" "$g" >/dev/null 2>&1
if cmp -s "$g" "$g.orig"; then pass=$((pass+1)); else echo "  FAIL  the default writes nothing"; fail=$((fail+1)); fi
[ "$fail" -gt 0 ] && { echo "$fail of $((pass + fail)) s6 behaviour check(s) failed."; exit 1; }
echo "s6: $pass behaviour check(s) hold."
