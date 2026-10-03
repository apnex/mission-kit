# Delta-2 stage 3 - evaluation

---

## Criterion 5 - the human check: passed, 6 of 6

Six scenarios - bad news, a status update, an explanation, teaching a concept, one decision, two linked decisions - written by a fresh agent from the director's statement and the friction log, without sight of the guidance, and committed before any message was written (`2a22b71`).\
A fresh agent given only the landed `M10` and `S15`, and a fresh agent given nothing, each wrote one message per scenario.\
Shown to the director in chat, unaltered, one pair per turn, positions random.\
**The director preferred the guided message in all six.**\
The bar was five of six, ties against; by chance six of six is about one in sixty-four.\
Run: `docs/evals/human/runs/delta2-check-2026-10-03-66f8fb`.

---

## Criterion 6 - findability: passed

A cold agent with the corpus, given each of the six moments, named `M10` or `S15` with what it asks: 2.00 on all six probes, three readers each.
**Deviation, recorded:** the prompts were written by the author, where the delta named a fresh agent.

---

## Criterion 7 - regression: none caused by the change

Every standing suite on the after-corpus, `docs/evals/runs/2026-10-03-delta2-routing`, 84.34 of 88.\
Against the Delta-1 layer run, no drop.\
Against the Delta-1 regression run, three drops, each on text unchanged since that run (`git diff c002a9c HEAD` touches no axiom, `E5`, `E6` or `components/`), so classified as noise under the rule:

| Probe | Drop | Note |
|---|---|---|
| `axiom-direction.Q1` | 2 to 1.67 | one reader hedged which case applies |
| `component-a3.C5` | 1.33 to 1 | the baseline's 1.00; `A3` read alone still does not say the untouched remainder is recorded |
| `boundary-bypass.B3` | 1.67 to 1 | **all three readers** gave reroute and omitted *adjust the interface* - a consistent pattern, not noise in kind; `A3`'s *Bypass as Signal* names both outcomes, but `E5`'s declared-against-honoured passage names only moving the dependency. Recorded for the next touch of `E5` |

---

## Exit criteria

1. Mutants, confirmed by a second agent - stage 1.
2. Membership reviewed by a fresh agent - stage 2; `W24` moved out.
3. Placement: `check-guidance-placement.sh` in the gate, and a fresh agent's line review - stage 2.
4. Gate passes, 24 checks.
5. Human check, 6 of 6.
6. Findability, 2.00 on all six moments, with the prompt-author deviation.
7. No regression caused by the change.

**Delta-2 is complete.**
