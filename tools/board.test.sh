#!/usr/bin/env bash
# board.test.sh - hold check-board.mjs to R1-R8 and its generated ledger and held-list views.
#
# Sovereign duty: every refusal and derived view of tools/check-board.mjs - bootstrap no-board pass,
# inline-code pipe and trigger extraction, R1/R2 citations, R3 column/score/evidence/trigger checks,
# R4 closed-row planning, R5 milestone order, R6 DONE-item and DONE-milestone closure, R7 staleness,
# and R8 narrative agreement.
#
# Usage:  tools/board.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tool="$root/tools/check-board.mjs"
sandbox=$(mktemp -d /tmp/mk-board-test-XXXXXX)
trap 'rm -rf "$sandbox"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

# Case 1: bootstrap repository with no docs/BOARD.md passes cleanly.
mkdir -p "$sandbox/empty"
out=$(node "$tool" --root "$sandbox/empty" 2>&1)
if [ $? -eq 0 ] && grep -q "no board and backlog pair" <<< "$out"; then
	ok "bootstrap repository with no board passes"
else
	no "bootstrap repository with no board passes"
fi

reset_fixture() {
	rm -rf "$sandbox/proj"
	mkdir -p "$sandbox/proj/docs"
	cat > "$sandbox/proj/docs/BACKLOG.md" <<'EOF'
# test - backlog

## Open

| id | impact | principle | finding | evidence | revival trigger |
|---|---|---|---|---|---|
| **B1** | S1 | A2 mandate | **Closed milestone row.** Details. | `[V, file:1]` | **CLOSED** - landed in M1.1. |
| **B2** | S2 | A8 signal | **Planned live row with `` `a | b` `` pipe.** Details. | `[V, file:2]` | open - TRIGGER: `gate` next runs |
| **B3** | S3 | A12 signal | **Held row citing `adherence-a13.on-trigger.f.5`.** Details. | `[V, file:3]` | The ledger's reading instructions are next changed (`adherence-a13.on-trigger.f.5` and `` `note: TRIGGER: fake` `` timed out). |
| **B4** | S5 | A3 signal | **Moved trigger row.** Details. | `[V, file:4]` | **Open. TRIGGER FIRED and moved:** first rule landed. **TRIGGER: a second single-medium rule.** |
| **B5** | S3 | A8 signal | **Closed item row in open milestone.** Details. | `[V, file:5]` | **CLOSED** - landed in M2.1. |
EOF
	cat > "$sandbox/proj/docs/BOARD.md" <<'EOF'
# test - board

## Where we are

```text
M1  foundation    DONE
M2  active slice  WIP  <- HERE
```

## Triage ledger

<!-- BEGIN GENERATED: ledger. Run tools/check-board.mjs --write; do not edit by hand. -->
<!-- END GENERATED: ledger -->

## M1 - foundation - `DONE`

| # | Item | Row | Status |
|---|---|---|---|
| M1.1 | Land foundation | `B1` | `DONE` |

## M2 - active slice - `WIP`

| # | Item | Row | Status |
|---|---|---|---|
| M2.1 | Finish first half | `B5` | `DONE` |
| M2.2 | Finish second half | `B2` | `TODO` |

## Held

<!-- BEGIN GENERATED: held. Run tools/check-board.mjs --write; do not edit by hand. -->
<!-- END GENERATED: held -->
EOF
	node "$tool" --write --root "$sandbox/proj" >/dev/null
}

# Case 2: valid fixture generates clean views, preserves inline-code 'on-trigger' and '`note: TRIGGER: fake`', and picks active TRIGGER:.
reset_fixture
out=$(node "$tool" --root "$sandbox/proj" 2>&1)
if [ $? -eq 0 ] \
	&& grep -qF "| \`B3\` | S3 | A12 signal | Held row citing \`adherence-a13.on-trigger.f.5\`. | The ledger's reading instructions are next changed (\`adherence-a13.on-trigger.f.5\` and \`\` \`note: TRIGGER: fake\` \`\` timed out). |" "$sandbox/proj/docs/BOARD.md" \
	&& grep -qF "| \`B4\` | S5 | A3 signal | Moved trigger row. | a second single-medium rule. |" "$sandbox/proj/docs/BOARD.md"; then
	ok "valid fixture reconciles and extracts inline-code and moved triggers cleanly"
else
	no "valid fixture reconciles and extracts inline-code and moved triggers cleanly"
fi

# Case 3: R7 refuses stale generated views when --write is not passed.
reset_fixture
sed -i 's/a second single-medium rule/stale hand edit/' "$sandbox/proj/docs/BOARD.md"
if ! grep -q "stale hand edit" "$sandbox/proj/docs/BOARD.md"; then
	no "R7 refuses stale generated held table (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  R7" <<< "$out"; then
		ok "R7 refuses stale generated held table"
	else
		no "R7 refuses stale generated held table"
	fi
fi

# Case 4: R1 and R2 refuse missing and unknown row citations.
reset_fixture
sed -i 's/| M2.2 | Finish second half | `B2` | `TODO` |/| M2.2 | Orphaned | - | `TODO` |\n| M2.3 | Ghost | `B99` | `TODO` |/' "$sandbox/proj/docs/BOARD.md"
if ! grep -q "M2.3" "$sandbox/proj/docs/BOARD.md"; then
	no "R1 and R2 refuse orphaned and unknown citations (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  R1  M2.2" <<< "$out" && grep -q "FAIL  R2  M2.3 cites B99" <<< "$out"; then
		ok "R1 and R2 refuse orphaned and unknown citations"
	else
		no "R1 and R2 refuse orphaned and unknown citations"
	fi
fi

# Case 5: R3 refuses an empty trailing revival trigger cell, 'later', and missing evidence.
reset_fixture
cat >> "$sandbox/proj/docs/BACKLOG.md" <<'EOF'
| **B6** | S3 | A8 signal | **Blank trigger.** | `[V, file:6]` |  |
| **B7** | S3 | A8 signal | **Vague trigger.** | - | TRIGGER: later |
EOF
if ! grep -q "B7" "$sandbox/proj/docs/BACKLOG.md"; then
	no "R3 refuses empty trigger, 'later' and missing evidence (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] \
		&& grep -q "FAIL  R3  B6 is open with no observable revival trigger" <<< "$out" \
		&& grep -q "FAIL  R3  B7 cites no evidence" <<< "$out" \
		&& grep -q "FAIL  R3  B7 is open with no observable revival trigger" <<< "$out"; then
		ok "R3 refuses empty trigger, 'later' and missing evidence"
	else
		no "R3 refuses empty trigger, 'later' and missing evidence"
	fi
fi

# Case 6: R4 refuses planning a CLOSED row in a live item.
reset_fixture
sed -i 's/| M2.2 | Finish second half | `B2` | `TODO` |/| M2.2 | Re-plan closed | `B1` | `TODO` |/' "$sandbox/proj/docs/BOARD.md"
if ! grep -q "Re-plan closed" "$sandbox/proj/docs/BOARD.md"; then
	no "R4 refuses a closed row planned in a live item (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  R4  M2.2" <<< "$out"; then
		ok "R4 refuses a closed row planned in a live item"
	else
		no "R4 refuses a closed row planned in a live item"
	fi
fi

# Case 7: R5 refuses milestones out of ascending order, and R8 refuses stale 'Where we are'.
reset_fixture
sed -i 's/M1  foundation    DONE/M1  foundation    DONE  <- HERE/' "$sandbox/proj/docs/BOARD.md"
sed -i 's/## M2 - active slice - `WIP`/## M0 - out of order - `WIP`/' "$sandbox/proj/docs/BOARD.md"
if ! grep -q "M0 - out of order" "$sandbox/proj/docs/BOARD.md"; then
	no "R5 and R8 refuse out-of-order milestones and DONE current pointer (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  R5  M0 appears after M1" <<< "$out" && grep -q "FAIL  R8  \"Where we are\" marks M1 as current" <<< "$out"; then
		ok "R5 and R8 refuse out-of-order milestones and DONE current pointer"
	else
		no "R5 and R8 refuse out-of-order milestones and DONE current pointer"
	fi
fi

# Case 8: R6 refuses a DONE item inside an open milestone leaving its row open and unplanned elsewhere,
# while permitting it when another live item still plans the row's remaining work.
reset_fixture
sed -i 's/| \*\*B5\*\* | S3 | A8 signal | \*\*Closed item row in open milestone.\*\* Details. | `\[V, file:5\]` | \*\*CLOSED\*\* - landed in M2.1. |/| **B5** | S3 | A8 signal | **Left open by mistake.** Details. | `[V, file:5]` | open - TRIGGER: next run |/' "$sandbox/proj/docs/BACKLOG.md"
node "$tool" --write --root "$sandbox/proj" >/dev/null 2>&1 || true
if grep -q 'B5.*CLOSED' "$sandbox/proj/docs/BACKLOG.md"; then
	no "R6 refuses DONE item in open milestone with open unplanned row (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  R6  M2.1 (M2) is DONE but B5 is still open and planned in no live item" <<< "$out"; then
		sed -i 's/| M2.2 | Finish second half | `B2` | `TODO` |/| M2.2 | Carry remaining work | `B2`, `B5` | `TODO` |/' "$sandbox/proj/docs/BOARD.md"
		node "$tool" --write --root "$sandbox/proj" >/dev/null
		out2=$(node "$tool" --root "$sandbox/proj" 2>&1)
		if [ $? -eq 0 ]; then
			ok "R6 refuses DONE item leaving orphan open row and allows live handoff"
		else
			no "R6 allows DONE item when another live item still plans the row"
		fi
	else
		no "R6 refuses DONE item in open milestone with open unplanned row"
	fi
fi

# Case 9: missing --root argument is refused with exit status 2.
out=$(node "$tool" --root 2>&1)
if [ $? -eq 2 ] && grep -q "FAIL  usage" <<< "$out"; then
	ok "missing --root argument is refused"
else
	no "missing --root argument is refused"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
