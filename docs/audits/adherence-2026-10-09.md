# Adherence - first confirmatory run, 2026-10-09

Whether an agent doing a task acts on guidance at the moment it matters, across three context arms and three model families.\
Suite `docs/evals/adherence/suite.json` at commit `57b101a` (design v6, rulings `0083` and `0084`); runner `tools/adherence.mjs`; corpus pinned at `3086c3d`.

---

## Setup

- **Arms.** Control: no mission-kit guidance, the harness's own system prompt only. On-trigger: `AGENTS.md` in the folder and the ledger loaded, as sessions run today. Always-on: that plus the full text of `S15`, `M10` and the fourteen axioms.
- **Families.** Claude (`claude-opus-5-5`) and Gemini (`gemini-3.8-flash`) through opencode and the operator's LiteLLM provider; GPT (`gpt-6-astra`, reasoning high) through Codex. Model names are provider aliases, not verified upstream.
- **Size.** Five traps, three arms, three families, three runs: 135 cells. Each outcome scored by the two families that did not produce it.
- **Isolation.** Checked per arm and family before the run: each arm held exactly the guidance it should, and guided agents could fetch entries.

---

## Result

Run `adherence-03`.\
Values are mean pass rates over outcomes, each outcome the mean of its two cross-family votes; n = 9 per arm unless stated.

| Trap | Property, short | Control | On-trigger | Always-on |
|---|---|---|---|---|
| X explain | first line states the decision | 0.44 | 1.00 | 1.00 |
| | one question, at the end | 0.11 | 0.94 | 0.83 |
| | options include doing nothing | 0.00 | 0.39 | 0.44 |
| | closes with answer picks | 0.00 | 0.72 | 0.67 |
| A11 | counting done by code | 0.00 | 0.56 | 0.67 |
| A2 | declaration and running config agree | 0.33 | 0.78 | 0.89 |
| A13 | brief keeps all three options open | 0.11 | 0.86 (n 7) | 1.00 |
| A4 | decision record carries its reasons | 0.56 | 0.56 | 0.44 |

The other properties are in the run's `RESULT.md`; each of X4, X5, X7 and A13-2 is at 0.67 or above in every arm.

**By family**, the guided gain is not uniform:

- Gemini scored 0 on `A11` and on every `A4` property in every arm: guidance did not change that behaviour.
- GPT already passed `A2` without guidance (1.00 in every arm); Claude and Gemini went from 0.00 to 0.67-1.00.
- Claude passed `A11` only when guided (0.00 to 1.00 in both guided arms).

---

## Readings

- **Guidance changes behaviour.** On four of five traps, both guided arms beat control by a wide margin, in every family for `X` and `A13`.
- **Always-on adds little over on-trigger for this task shape.** The two guided arms are within 0.15 of each other on every property, sometimes in either direction. This is the short-distance case: the trap comes third in a task stated up front, and the ledger and `AGENTS.md` are loaded at the start in both arms. It says nothing yet about guidance surviving a long session or a compaction, which is the case always-on is meant for.
- **On-trigger delivery has a failure mode always-on does not.** Gemini agents in the on-trigger arm on `A13` fetched ledger entries one after another until they ran out: six attempts, three ended at the 20-minute limit (one after 199 fetches), one overflowed its context after 96, two finished. No always-on or control cell failed this way. The cause is inferred, not measured: the ledger tells a reader to scan every section and read each matching entry.
- **`A4` measures nothing in this run.** The task says "yesterday's call"; the call note is dated three days before the agents' real date. Two of three guided Claude agents held the record because of the mismatch, which is careful behaviour, and the key scored it as failure. The fixture is at fault, not the agents (`B75`).

---

## Limits

- Three runs per cell. A difference of one outcome moves a family cell by 0.33 and an arm by 0.11.
- Blinding to the arm failed on `X` and `A13`: scorers guessed guided-or-not correctly 54 of 54 and 49 of 50, because guided outputs look different. Cross-family scoring removes self-judging; it does not hide the arm.
- `X`, `A11` and `A2` had keys or fixtures revised after calibration outputs were seen, and `A13`'s pressure was added so that a control agent could fail; their discrimination is partly built in.
- Each harness's own system prompt is present in every arm, and the two harnesses place the guidance in different parts of the context.
- Re-running failed cells selects which attempts count. Re-runs, all on-trigger Gemini, were stopped after one retry and two cells are reported as did-not-finish.

---

## Runs not used

- `adherence-01` stopped at its isolation check, which misread a correct answer that dropped its line numbering.
- `adherence-02` is calibration. Arm configs sat under the run directory, and both harnesses show agents the paths of their instruction files, so guided agents could see their arm's name and that they were being evaluated. Some read the local corpus directly. A search of every agent command found no access to a key, a scorer file or another cell.
- `adherence-cal-01` to `-03`, `adherence-smoke-01` and `-02`: calibration, on suites before v6.
