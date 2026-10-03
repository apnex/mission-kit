#!/usr/bin/env bash
# check-guidance-placement - hold M10 and S15 to the guidance the director tested.
#
# Sovereign duty: Delta-2's criterion 3 and no other. The guidance was preferred by the director as
# written; landing it must not quietly reword it. Every line of the tested text must appear, verbatim
# apart from markdown links, in the entry the placement table assigns it to.
#
# Usage:  tools/check-guidance-placement.sh

set -uo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import re, sys
tested = open('docs/evals/human/guidance-1/guidance-as-tested.txt').read().split('\n')
m10 = open('methods/M10-guided-dialogue.md').read()
s15 = open('style/S15-message-to-a-human.md').read()
norm = lambda t: re.sub(r'\s+', ' ', re.sub(r'\[`?([^\]`]+)`?\]\([^)]*\)', r'\1', t).replace('\\', '').replace('*', '')).strip()
M10, S15 = norm(m10), norm(s15)
# line numbers in the tested text -> where they must appear, per Delta-2's placement table
# Line 3 is when to use the guidance: M10's opening, and S15's trigger in its own words.
place = {3: 'M10', 4: 'both', 8: 'M10', 9: 'M10', 13: 'M10', 15: 'M10', 17: 'M10',
         21: 'S15', 22: 'S15', 23: 'S15', 24: 'S15', 25: 'S15', 26: 'S15', 27: 'S15', 31: 'S15'}
# lines whose wording the table changes: 14 and 16 are cited from M10 rather than restated
adapted = {14: ('M10', 'Give one step per message'), 16: ('M10', 'Ask for one decision per message')}
fail = 0
for n, where in place.items():
    text = norm(tested[n - 1].lstrip('-0123456789. '))
    for name, body in (('M10', M10), ('S15', S15)):
        if where in (name, 'both') and text not in body:
            print(f'FAIL  placement  line {n} not found verbatim in {name}: {text[:70]}'); fail += 1
for n, (name, phrase) in adapted.items():
    if phrase not in (M10 if name == 'M10' else S15):
        print(f'FAIL  placement  line {n}: expected "{phrase}" in {name}'); fail += 1
print(f'{fail} placement failure(s).' if fail else f'placement: all {len(place) + len(adapted)} tested lines are in their assigned entries.')
sys.exit(1 if fail else 0)
PY
