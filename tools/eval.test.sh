#!/usr/bin/env bash
# eval.test.sh - hold the evaluation harness to the properties that make its verdicts worth trusting.
#
# Sovereign duty: eval.mjs's behaviour and no other. The harness exists to take scoring away from
# the author and to catch regressions, so a harness that leaks a version label to a scorer, accepts
# an unscored answer, or passes a regression would report trust it has not earned. Each of those is
# tested here by constructing it and requiring the tool to refuse it - a check that only ever sees
# good input cannot show it would notice bad input.
#
# Usage:  tools/eval.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

tool="tools/eval.mjs"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export EVAL_SUITES_DIR="$tmp/suites"

pass=0
fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

mkdir -p "$EVAL_SUITES_DIR/alpha" "$tmp/oldc" "$tmp/newc"
cat > "$EVAL_SUITES_DIR/alpha/suite.json" <<'EOF'
{ "id": "alpha", "mode": "corpus",
  "probes": [
    { "id": "Q1", "question": "What is one?", "key": "one", "rubric": "2 if one" },
    { "id": "Q2", "question": "What is two?", "key": "two", "rubric": "2 if two" } ] }
EOF
echo "# index" > "$tmp/oldc/INDEX.md"
echo "# index" > "$tmp/newc/INDEX.md"

# export never carries docs/, so no reader can reach a key.
exp=$(node "$tool" export --out "$tmp/exp" --ref HEAD | cut -f1)
if [ -f "$exp/INDEX.md" ] && [ ! -e "$exp/docs" ]; then ok "export copies the corpus and drops docs/"; else no "export copies the corpus and drops docs/"; fi
case "$(basename "$exp")" in *base*|*after*|*before*|*old*|*new*) no "export path carries no version word" ;; *) ok "export path carries no version word" ;; esac

# prepare refuses a corpus that still holds docs/.
mkdir -p "$tmp/leaky/docs"; echo x > "$tmp/leaky/INDEX.md"
if node "$tool" prepare --suites alpha --corpus x="$tmp/leaky" --readers 1 --out "$tmp/r0" 2>/dev/null; then no "prepare refuses a corpus containing docs/"; else ok "prepare refuses a corpus containing docs/"; fi

run="$tmp/run"
node "$tool" prepare --suites alpha --corpus OLDLABEL="$tmp/oldc" --corpus NEWLABEL="$tmp/newc" --readers 2 --out "$run" >/dev/null
n=$(ls "$run/prompts" | wc -l)
[ "$n" -eq 4 ] && ok "one prompt per corpus per reader" || no "one prompt per corpus per reader (got $n)"
if grep -rqE 'OLDLABEL|NEWLABEL' "$run/prompts" "$run/TASKS.md"; then no "reader prompts carry no corpus label"; else ok "reader prompts carry no corpus label"; fi

node "$tool" status --run "$run" >/dev/null 2>&1 && no "status fails while answers are missing" || ok "status fails while answers are missing"

# Readers on the old corpus answer Q2 wrongly; readers on the new one answer both correctly.
python3 - "$run" <<'PY'
import json, sys, os
run = sys.argv[1]
m = json.load(open(f"{run}/sealed/manifest.json"))
for p in m["prompts"]:
    q2 = "two" if p["label"] == "NEWLABEL" else "three"
    open(f"{run}/answers/{p['pid']}.txt", "w").write(f"### alpha.Q1\none\n\n### alpha.Q2\n{q2}\n\n### OBSERVATIONS\nnone\n")
PY
node "$tool" status --run "$run" >/dev/null 2>&1 && ok "status passes when every answer is present" || no "status passes when every answer is present"

node "$tool" blind --run "$run" --seed fixed >/dev/null
if grep -qE 'OLDLABEL|NEWLABEL|r-[0-9a-f]{6}' "$run/scorers/alpha.txt"; then no "scorer prompt carries no label and no reader id"; else ok "scorer prompt carries no label and no reader id"; fi
items=$(grep -c '^--- answer ' "$run/scorers/alpha.txt")
[ "$items" -eq 8 ] && ok "every answer reaches the scorer" || no "every answer reaches the scorer (got $items)"

# Score as an honest scorer would: Q2 answered "three" scores 0.
score_all() { # file to write, optional item to omit
	python3 - "$run" "$1" "${2:-}" <<'PY'
import json, sys, re
run, out, omit = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(f"{run}/scorers/alpha.txt").read()
lines = []
for block in re.split(r"^--- answer ", text, flags=re.M)[1:]:
    item, _, body = block.partition(" ---\n")
    if item == omit: continue
    s = 0 if body.strip().startswith("three") else 2
    lines.append(json.dumps({"item": item, "score": s, "reason": "fixture"}))
open(out, "w").write("\n".join(lines) + "\n")
PY
}

first=$(grep -m1 '^--- answer ' "$run/scorers/alpha.txt" | sed 's/^--- answer \(a-[0-9a-f]*\) ---$/\1/')
score_all "$run/scores/alpha.txt" "$first"
# Require the refusal itself: a crash on the missing item also exits non-zero, and passed this test
# when the check was deleted.
out=$(node "$tool" score --run "$run" 2>&1 >/dev/null)
if printf '%s' "$out" | grep -q "not scored"; then ok "score refuses an unscored answer"; else no "score refuses an unscored answer"; fi

score_all "$run/scores/alpha.txt"
echo "{\"item\": \"$first\", \"score\": 2}" >> "$run/scores/alpha.txt"
node "$tool" score --run "$run" >/dev/null 2>&1 && no "score refuses an answer scored twice" || ok "score refuses an answer scored twice"

score_all "$run/scores/alpha.txt"
sed -i '0,/"score": 2/s//"score": 5/' "$run/scores/alpha.txt"
node "$tool" score --run "$run" >/dev/null 2>&1 && no "score refuses a score outside 0..2" || ok "score refuses a score outside 0..2"

score_all "$run/scores/alpha.txt"
node "$tool" score --run "$run" >/dev/null 2>&1 && ok "score accepts a complete, valid set" || no "score accepts a complete, valid set"
q2new=$(python3 -c "import json;print(json.load(open('$run/RESULT.json'))['mean']['alpha.Q2']['NEWLABEL'])")
q2old=$(python3 -c "import json;print(json.load(open('$run/RESULT.json'))['mean']['alpha.Q2']['OLDLABEL'])")
python3 -c "import sys;sys.exit(not (float($q2new)==2 and float($q2old)==0))" && ok "unblinding returns each score to its corpus" || no "unblinding returns each score to its corpus (new $q2new old $q2old)"

# The gate: new against old improves; old against new is a regression and must fail.
grep -q "## What this measures" "$run/RESULT.md" && grep -q "one measurement family" "$run/RESULT.md" && ok "every result states what it measures" || no "every result states what it measures"
node "$tool" compare --base "$run/RESULT.json:OLDLABEL" --head "$run/RESULT.json:NEWLABEL" >/dev/null && ok "compare passes an improvement" || no "compare passes an improvement"
node "$tool" compare --base "$run/RESULT.json:NEWLABEL" --head "$run/RESULT.json:OLDLABEL" >/dev/null && no "compare fails a regression" || ok "compare fails a regression"
node "$tool" compare --base "$run/RESULT.json:NEWLABEL" --head "$run/RESULT.json:OLDLABEL" --tolerance 2 >/dev/null && ok "compare honours a stated tolerance" || no "compare honours a stated tolerance"

# A reader who skips a heading is scored 0 for it, not silently dropped from the mean.
run2="$tmp/run2"
node "$tool" prepare --suites alpha --corpus ONLY="$tmp/newc" --readers 1 --out "$run2" >/dev/null
pid=$(ls "$run2/prompts" | sed 's/\.txt$//')
printf '### alpha.Q1\none\n' > "$run2/answers/$pid.txt"
node "$tool" blind --run "$run2" --seed s >/dev/null
python3 - "$run2" <<'PY'
import json, sys, re
run = sys.argv[1]
text = open(f"{run}/scorers/alpha.txt").read()
items = re.findall(r"^--- answer (a-[0-9a-f]+) ---$", text, flags=re.M)
open(f"{run}/scores/alpha.txt", "w").write("\n".join(json.dumps({"item": i, "score": 2}) for i in items) + "\n")
PY
node "$tool" score --run "$run2" >/dev/null 2>&1
q2=$(python3 -c "import json;print(json.load(open('$run2/RESULT.json'))['mean']['alpha.Q2']['ONLY'])")
python3 -c "import sys;sys.exit(not float($q2)==0)" && ok "an unanswered probe scores 0" || no "an unanswered probe scores 0 (got $q2)"

# A suite's own instructions replace the default answering rules, which would distort an answer
# that is itself an artifact - a message written for a human.
mkdir -p "$EVAL_SUITES_DIR/beta"
cat > "$EVAL_SUITES_DIR/beta/suite.json" <<'EOF'
{ "id": "beta", "mode": "corpus", "instructions": "WRITE-THE-MESSAGE-ITSELF",
  "probes": [ { "id": "X1", "question": "Write it.", "key": "k", "rubric": "r" } ] }
EOF
node "$tool" prepare --suites beta --corpus ONLY="$tmp/newc" --readers 1 --out "$tmp/run3" >/dev/null
p3=$(ls "$tmp/run3/prompts"/*.txt)
if grep -q 'WRITE-THE-MESSAGE-ITSELF' "$p3" && ! grep -q 'Under eight sentences' "$p3"; then ok "suite instructions replace the default answering rules"; else no "suite instructions replace the default answering rules"; fi

# An artifact suite replaces the default "cite files" instruction, cuts the reader's self-explanation
# before the scorer sees it, and replaces the scorer's guess cap, which would penalise answers that
# are required to label what was inferred.
mkdir -p "$EVAL_SUITES_DIR/gamma"
cat > "$EVAL_SUITES_DIR/gamma/suite.json" <<'EOF'
{ "id": "gamma", "mode": "corpus", "instructions": "WRITE IT", "stripFrom": "CORPUS-SOURCES:",
  "scorerInstructions": "SCORER-OVERRIDE",
  "probes": [ { "id": "X1", "question": "Write it.", "key": "k", "rubric": "r" } ] }
EOF
node "$tool" prepare --suites gamma --corpus ONLY="$tmp/newc" --readers 1 --out "$tmp/run4" >/dev/null
p4=$(ls "$tmp/run4/prompts"/*.txt)
grep -q 'citing files and text' "$p4" && no "artifact suites drop the citing instruction" || ok "artifact suites drop the citing instruction"
pid4=$(basename "$p4" .txt)
printf '### gamma.X1\nDear reader, the message.\nCORPUS-SOURCES: E99 only-in-one-version\n' > "$tmp/run4/answers/$pid4.txt"
node "$tool" blind --run "$tmp/run4" --seed s >/dev/null
if grep -q 'E99' "$tmp/run4/scorers/gamma.txt"; then no "self-explanation is cut before the scorer"; else ok "self-explanation is cut before the scorer"; fi
grep -q 'Dear reader, the message.' "$tmp/run4/scorers/gamma.txt" && ok "the message itself reaches the scorer" || no "the message itself reaches the scorer"
if grep -q 'SCORER-OVERRIDE' "$tmp/run4/scorers/gamma.txt" && ! grep -q 'scores at most 1 unless' "$tmp/run4/scorers/gamma.txt"; then ok "scorer instructions replace the guess cap"; else no "scorer instructions replace the guess cap"; fi
grep -q 'E99' "$tmp/run4/answers/$pid4.txt" && ok "the full answer is kept in answers/" || no "the full answer is kept in answers/"

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
