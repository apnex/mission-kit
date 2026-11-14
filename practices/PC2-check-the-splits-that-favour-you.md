---
id: PC2
category: practice
title: Check the splits that favour you - inspect passing and generous cells with the same scrutiny as failing ones
status: active
hydrate-when: You have received a test run, evaluation table, or review where some cells favour your change and you are deciding which results to inspect before trusting the outcome
supersedes: []
related: [PC0, A16, M1, M2, RU1]
---

# PC2 - Check the splits that favour you

## Rule

When a measurement, evaluation run, test suite, or review returns a mix of outcomes - or a clean pass that supports the claim you wanted to make - **inspect the cells that favour you with the same scrutiny you give the cells that went against you.**\
The ground rules:

1. **Failure-triggered checks are one-sided.** An author who re-reads only the cells where `head` lost, a gate failed, or a reviewer objected will catch every false negative against their change and keep every false positive in their favour. Over a multi-cell table, one-sided auditing guarantees an upward-biased result.
2. **Audit at least one favourable split back to its raw input.** In a paired evaluation (`M2`), open the raw reader answers and scorer reasons for cells where `head` gained or scored `2` of `2`, not only where `head` dropped. Verify that the question did not leak the key, the scorer did not misread a hedge, and the rubric did not penalise a valid control answer.
3. **Verify that a passing probe actually landed.** In a guard or falsifier test (`W5`), a mutation or fixture that failed to apply produces the same exit status `0` as a guard that held, and a refusal test that matches a generic error string passes even when the specific refusal never fired. Check the intermediate state or exact refusal message before banking the pass.
4. **Question corroboration produced to defend a standing claim.** When a second reading arrives from the same instrument family, the same mental model, or a check written after the conclusion was chosen, ask what the reading would have looked like if the claim were false before counting it as independent confirmation (`A16`, `M1`).

---

## Rationale

Only the beneficiary of a generous reading has both the standing and the context to challenge it, and doing so feels ungracious or wasteful when the gate is already green.\
A check triggered by failure cannot reach a wrong belief that is currently passing.\
In an agent-maintained corpus where changes are gated by paired cold-reader evaluations and fixture tests, a flawed rubric that caps valid `base` answers or a fixture that fails to apply looks identical in the summary table to a genuine improvement.\
Nothing in the finished artifact afterwards shows whether the author inspected the passing cells when those cells turn out to be sound, which is why this guidance is a practice (`PC0`) rather than a traced rule (`RU0`); its effect appears only in the false positives caught and corrected before a claim is ratified.

**Evidence.**\
Observed repeatedly across this corpus's evaluation and gate history (`docs/DECISIONS.md` `0136` / `B129`, `0138`, `0140`, and `0141` / `B133`, `docs/audits/delta-2/stage-1.md`, plus the `AGENTS.md` section 5.2 doctrine): inspecting cells where `head` won, where an arm tied, or where a test reported green uncovered a rubric that capped valid `base` hedges on a cell `head` won (`board.B3` in `0136` / `B129`), a rubric that capped valid answers across both arms of a tied cell (`gate.G1` in `0141` / `B133`), an export flag bug where both arms silently exported `HEAD` and returned a `17.34`-of-`18` tie on identical arms (`0140`), and fixture or mutation checks that passed without landing (`sets.test.sh` in `docs/audits/delta-2/stage-1.md` and `climb5_mutants.log` Mutant 2 in `0138`, motivating the `(fixture did not apply)` guards in `sets.test.sh` and `entry-body.test.sh`).

---

## Examples

**Bad:**

> Author runs a paired evaluation across six probes. Four probes score `2.00` on both arms, one gains `+1.00` on `head`, and one drops `-0.67` on `head`. The author reads the three transcripts for the `-0.67` drop, finds a rubric defect, fixes it, and reports the `+1.00` gain as a confirmed win without reading the `+1.00` cell's transcripts - missing that the `base` readers gave the right answer in pre-rename terminology that the key omitted.

**Good:**

> Author inspects both the `-0.67` drop and the `+1.00` gain in the raw transcripts before trusting the summary table. Finds that the `+1.00` gain came from a rubric that required naming a newly minted heading rather than the concept it held, widens the key to accept both corpora's wording, and re-runs before claiming an improvement.

---

## When to apply

- Reviewing the per-probe or per-reader table of a paired evaluation (`M2`) before recording a gain or regression pass.
- Writing or modifying a `.test.sh` or schema test that asserts a refusal or kills a mutant (`W5`).
- Weighing concordant review verdicts (`M1`) when every reviewer shared the same framing or summary.
- Especially when a run returns a clean pass or a net positive delta on the first attempt - that is when a favourable error has no failure signal to expose it.
