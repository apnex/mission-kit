#!/usr/bin/env bash
# eval-human.test.sh - hold the human evaluation tool to the properties that make a pick mean anything.
#
# Sovereign duty: eval-human.mjs's behaviour and no other. A pick only measures a move if the human
# cannot tell which version applied it, and if every pick is recorded against the right version. A
# tool that always showed the move's version first, or recorded "A" instead of what A was, would
# turn a preference for position into evidence for a move.
#
# Usage:  tools/eval-human.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
tool="tools/eval-human.mjs"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

mkdir -p "$tmp/s"
python3 - "$tmp/s/suite.json" <<'PY'
import json, sys
items = [{"id": f"i{n}", "move": "m1", "scenario": f"case {n}", "with": f"WITH-{n}", "without": f"WITHOUT-{n}"} for n in range(12)]
json.dump({"id": "t", "items": items}, open(sys.argv[1], "w"))
PY

# Pick "a" on every item. Recorded choices must follow what A actually was on each item.
for i in $(seq 12); do printf 'a\n\n'; done | node "$tool" run "$tmp/s" --out "$tmp/r1" --seed fixed > "$tmp/out1" 2>&1
python3 - "$tmp/r1/result.json" "$tmp/out1" > "$tmp/check1" <<'PY'
import json, sys, re
r = json.load(open(sys.argv[1])); out = open(sys.argv[2]).read()
blocks = re.findall(r"--- A -+\n(.*?)\n", out)
print("recorded", all(a["chose"] == a["shownA"] for a in r["answers"]))
print("display", all(("WITH-" in b and not "WITHOUT" in b) == (a["shownA"] == "with") for a, b in zip(r["answers"], blocks)))
print("mixed", len({a["shownA"] for a in r["answers"]}) == 2)
print("count", len(r["answers"]) == 12 and r["complete"])
PY
grep -q 'recorded True' "$tmp/check1" && ok "each pick is recorded as the version it was" || no "each pick is recorded as the version it was"
grep -q 'display True' "$tmp/check1" && ok "the recorded order matches what was shown" || no "the recorded order matches what was shown"
grep -q 'mixed True' "$tmp/check1" && ok "the move's version is not always in one position" || no "the move's version is not always in one position"
grep -q 'count True' "$tmp/check1" && ok "every item is answered and the run is complete" || no "every item is answered and the run is complete"

# Stopping early keeps what was answered and says the run is incomplete.
printf 'a\n\nb\n2\n' | node "$tool" run "$tmp/s" --out "$tmp/r2" --seed s2 > /dev/null 2>&1
python3 -c "import json;r=json.load(open('$tmp/r2/result.json'));import sys;sys.exit(not(len(r['answers'])==2 and not r['complete']))" && ok "stopping early keeps answers and marks the run incomplete" || no "stopping early keeps answers and marks the run incomplete"

# An invalid key is asked again, not recorded.
printf 'x\n=\n' | node "$tool" run "$tmp/s" --out "$tmp/r3" --seed s3 > /dev/null 2>&1
python3 -c "import json;r=json.load(open('$tmp/r3/result.json'));import sys;sys.exit(not(r['answers'][0]['chose']=='same'))" && ok "an invalid key is asked again, not recorded" || no "an invalid key is asked again, not recorded"

node "$tool" summary "$tmp/r1" | grep -q 'm1: with the move' && ok "summary reports wins per move" || no "summary reports wins per move"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
