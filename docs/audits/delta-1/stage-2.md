# Delta-1 stage 2 - charters

`RU0` and `PC0` authored, `M0` rewritten for procedures, the root layer table and `E2` updated.\
Key committed and independently reviewed before any draft: `docs/evals/layer-charters/suite.json`, at `e2d9bb9`.

---

## Every changed sentence in `M0`

| # | Old | New | Kind |
|---|---|---|---|
| 1 | title: *how work is conducted, as against how artifacts are written* | *procedures that produce a result of their own* | correct |
| 2 | trigger: *a review, audit or deferral, or ... here or in style* | *a review, an audit or another procedure, or ... a procedure, a rule, a practice or style* | correct - deferral leaves |
| 3 | *Ways of working. Named procedures for conducting work* | *Procedures. Named steps that produce a result of their own* | correct |
| 4 | *A methodology entry governs conduct: the sequence you follow, the independence you require, the evidence you demand* | a methodology entry is a procedure; guidance producing nothing is a rule or a practice, with links | correct |
| 5 | territory: *the procedural decisions inside a unit of work* | *the procedures inside a unit of work* | reword |
| 6 | *five moments* | six named moments, shared by `rules/` and `practices/`; procedures at four | correct - readers found four rows under "five", and three different moment lists across the charters |
| 7 | moments table: `M6` at entering; rows for deciding what to keep and after the fact | `M6` removed; those rows removed; *treating the record* holds `K1`, arriving; a line saying where `M3`-`M6` go | correct |
| 8 | boundary table: *the process you follow* | three rows: procedures here, rules, practices | correct |
| 9 | *what a reviewer would inspect ... read the output, style ... how you arrived, methodology* | **Placement**, stated once: axiom, procedure, style, rule, practice, with the style question about the object and the axiom question about a system's properties | correct - the old discriminator would file rules as style |
| 10 | *A named practice ... A practice nobody has run* | *procedure*, twice | correct - the charter used *practice* to mean procedure |
| 11 | composition: *two primitives*, `M1` and `M3`; the `M3`-`M4`-`M5` cluster | one primitive, `M1`; the cluster now rules, holding what procedures record | correct |
| 12 | fault: *the unenforceable procedure* | *the procedure that produces nothing* | correct |

`RU0` and `PC0` are new; their territories list their arriving members, and placement in each cites `M0` rather than restating it.

---

## Evaluation

| Run | Before | After |
|---|---|---|
| round 1, `docs/evals/runs/2026-10-03-layer-charters` | 9.67 / 14 | 13.33 / 14 |
| round 2, after corrections, `...-layer-charters-r2` | 10.34 / 14 | 13.67 / 14 |

No regression within either run.\
Round 1's readers found, 3 of 3, the five-moments miscount and three moment lists, and that *in force regardless of situation* admits a universal ban as an axiom; both corrected before round 2.

**One cross-run drop, classified.**\
H2, 2.00 in round 1 to 1.67 in round 2: one reader placed the practice correctly by the sequence, then hedged on whether it would be admitted, citing `PC0`'s admission text, unchanged between rounds.\
Classified as not caused by the change; the classification is the author's, and the answer is in the run for checking.\
It exposed that placement and admission were not distinguished; one sentence in `PC0` now separates them, not re-evaluated.

**Recorded, not changed** - member defects, outside this delta's fence: `M1` is headed *Rule* though it is a procedure, and its title says four inputs where its body allows three.

---

## The misfiled-category proof, deferred from stage 1

A fixture in `practices/` declaring `category: rule` failed the generator as misfiled; corrected to `practice`, it raised no misfiled error; the fixture was removed.
