# Delta-1 stage 4 - evaluation

Before: export of `719351d`, the corpus before Delta-1.\
After: export of `c002a9c`, stages 1 to 3 landed.\
Scored blind by agents who did not author the change; mapping sealed in each run.

---

## Results

| Run | Before | After |
|---|---|---|
| `work-layers` + `layer-charters`, `docs/evals/runs/2026-10-03-delta1-layers` | 21.66 / 28 | 27.00 / 28 |
| every other standing suite, after only, `docs/evals/runs/2026-10-03-delta1-regression` | - | 45.67 / 48 |

`layer-charters` - placing a rule, a practice and a procedure, and the placement sequence - rose from 7.66 to 14 of 14.

---

## Drops, classified under the rule in `docs/evals/README.md`

| Probe | Drop | Text it depends on changed by Delta-1? | Classification |
|---|---|---|---|
| `work-layers.L5` | 2 to 1 | yes | **caused by the change** - see below |
| `system-boundary.S2` | 1.67 to 1, against the re-check | no - `E5`, `A0` untouched | noise: the same versioning hedge appears in both arms of the earlier re-check |
| `system-boundary.S4` | 2 to 1.67 | no | noise: one reader hedged on dependents honouring the interface |
| `boundary-bypass.B3` | 2 to 1.67 | no | noise: one reader omitted reroute-or-adjust |

**`L5`.**\
It asks where guidance for handing over would go, without saying what shape the guidance takes.\
Before Delta-1 there was one answer, `methodology/`.\
After, all three readers answered that it depends on the shape - a procedure, a rule, or a practice - quoted the gap from all three charters, and marked the choice *not settled*; the rubric caps that at 1.\
Their reading is correct for the corpus Delta-1 built: the layers are now separated by kind, and the question does not state the kind.\
Whether that is the change working or the change regressing is a question about the key, asked after the scores were seen, so it is not the author's to settle.

---

## Exit criterion 6 - not met as written

- Controls no lower after than before: **fails on `L5`**.
- New probes higher after than before: `layer-charters` rose on five of seven; **`L7`, the assemble probe, scored 2 in both** - the before corpus already let readers assemble the rules that govern a sweep, under their old names.
