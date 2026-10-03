# Delta-1 - the work layers - a horizontal layer change

```yaml
status:       proposed, revision 4 - rename and Q4 ruled; awaiting ratification; no stage has run
row:          B24
intent:       docs/surveys/b24-work-layers-survey.md
from-state:   docs/ARCHITECTURE.md, at 719351d
review:       revision 1 audited by a fresh adversarial reviewer; every must-fix answered in section 8
```

The first delta this corpus has authored about itself.\
`B8` fires when this corpus *runs* its first delta; authoring one does not.

---

## 0. From-state -> to-state

**From** - `docs/ARCHITECTURE.md` as it stands:

- `methodology/` (`M`) holds procedures, rules and a practice under one name, and its charter uses "practice" to mean procedure.
- `skills/` (`K`) holds twenty-eight entries. Six use the methodology body shape (`K1`-`K6`); `K1` and `K2` have no skill directory at all, which `K0` itself names a fault - a stub without a body.
- `work-types/` cites procedures in places - `W14` and `W23` name `M7`, `W16` names `M5` - but no rule says a work-type cites the procedures that conduct it.
- No text separates methodology from work-types: 3 / 3 cold readers (`docs/audits/M5.5h-01-bypassed-interface.md` section 4).

**To** - the target state.\
`docs/ARCHITECTURE.md` says that ratifying a shape change it has not built creates a divergence, and *the split happens then*.\
This delta's section 0 is that target state until stage 4 brings the current state to it, rather than a separate target-state companion; the stages are meant to run in close succession, and a companion that lived a few changes would be a second copy to keep in step.\
If the stages stall, a target-state `AR1` is authored from this section.

| Layer | Holds | Prefix | Category |
|---|---|---|---|
| `methods/`, titled **Methods** - renamed from `methodology/` | procedures: steps that produce a result of their own | `M` | `method` |
| `rules/` | rules: what governs how other work is done, leaving a trace a check could test | `RU` | `rule` |
| `practices/` | practices: what governs how other work is done, leaving no trace | `PC` | `practice` |
| `skills/` | packages of a procedure, unchanged in this delta | `K` | `skill` |
| `work-types/` | units of work, unchanged in this delta | `W` | `work-type` |

### The test, written down

**A procedure produces a result of its own** - a verdict, an artifact, a record - that would not exist without following it.\
**A practice or a rule governs how other work is done**, and produces nothing of its own.\
Between those two: **a rule leaves an observable trace** a check could test - a field present, a record unrewritten, a justification written; **a practice does not**.

### Every entry classified against that test

| Entry | Produces a result of its own? | Trace a check could test? | Kind | Destination |
|---|---|---|---|---|
| `M1` triangulated review | yes - a verdict | - | procedure | stays `M1` |
| `M2` test-drive docs | yes - an evaluation result | - | procedure | stays `M2` |
| `M3` default-reject, honest yield | no - governs triage and reporting | yes - a report leads with yield | rule | `rules/` |
| `M4` frozen history | no - governs how records are treated | yes - the record is unrewritten | rule | `rules/` |
| `M5` anti-amnesia deferral | no - governs deferral | yes - the trigger field is present | rule | `rules/` |
| `M6` author from exemplar | no - governs authoring | no - reading a peer leaves no trace | practice | `practices/` |
| `M7` axiom alignment audit | yes - an audit artifact | - | procedure | stays `M7` |
| `M8` artifact bootstrap | yes - the first artifacts | - | procedure | stays `M8` |
| `K1` history content scrub | yes - rewritten history and its proof | - | procedure | `methods/` |
| `K2` publishing rewritten history | no - governs force-push | yes - a named justification exists | rule | `rules/` |

`M6` is a practice, as the survey classified it.\
Revision 1 relabelled it a rule, which defined the distinction away; corrected.

### Q4 - two layers, ruled

The survey's Q4 picks were contradictory: a layer per kind, and practices and rules together.\
Measured against `E3`'s list - territory, admission, naming, placement - one rule differs: a rule's admission requires it to declare the trace a check could test, in a `trace` field, and to name its enforcer in `enforced-by` when one exists - the contract `style/` uses for enforced and unenforced rules alike; a practice has no trace to declare.\
So the two are separable by `E3`.\
Offered a declared `kind` in one layer or two layers, **the director ruled two layers**, to keep the separation simple: `rules/` (`RU`) and `practices/` (`PC`).\
`practices/` starts with one member, `M6`.
---

## 1. The fence

- **Rename:** `methodology/` to `methods/`, category `methodology` to `method` across every entry in it, the charter titled *Methods*; every path, link and category reference in the corpus updated.
- **Charters:** `RU0` and `PC0` authored, each stating the placement sequence that separates method, style, rule and practice; `M0` rewritten for procedures, and its use of "practice" to mean procedure corrected; `E2`'s layer table; the root `README.md` layer table.
- **Mechanism:** the schema - `method` replacing `methodology`, and `rule` and `practice` added, in the category enum; `RU` and `PC` in the ID pattern; `trace` required of every `rule` entry, and `enforced-by` optional, verified by `check-enforcers.sh` when present; `rules` and `practices` added to the schema test's catalogue directories; whatever `check-structure.sh` and `generate-index.mjs` need for two new layers.
- **Moves:** `M3`, `M4`, `M5`, `K2` to `rules/`; `M6` to `practices/`; `K1` to `methods/`.
- **References:** every `related` edge, link and ID mention that names a moved entry, retargeted to its successor.
- **Architecture:** `docs/ARCHITECTURE.md`, including the layer counts outside section 5.
- **Evaluation:** the `work-layers` suite extended, with its current six probes kept unchanged as controls.

---

## 2. Build order - certifiable stages

1. **Mechanism first.** Schema, enum, ID pattern, catalogue directories, structure checks. Certified by a mutation proof: a malformed `RU` entry, a rule with no `trace`, and an entry in `practices/` with the wrong category each fail the gate, and pass once corrected.
2. **Charters against their populations.** `RU0` and `PC0` are authored with the entries each will receive present as a list of what is arriving, so its territory is derived from a real population (`E4`); `M0` is rewritten for what remains plus `K1`. Each evaluated under `M2`, key committed before drafting.
3. **Moves and references, together.** A move and the retargeting of every reference to it land in one change, so the index never reports a misfiled entry or a dangling edge between stages.
4. **Architecture and evaluation.** `docs/ARCHITECTURE.md` brought to the to-state; the extended suite run before and after in one blind run; every standing suite compared with the baseline.

**How an entry moves.**\
IDs are never reused, so a moved entry takes a new ID and declares `supersedes` with the old one.\
The old file stays at its old path: same category, `status: superseded`, a `hydrate-when` stating the condition of arriving by an old link, and a one-line body naming the successor.\
The superseded entry is kept because the root charter requires it - *a replaced entry keeps its ID and flips `status`* - and because this corpus's own frozen records cite the moved IDs: 65 files in `docs/` and 57 commit messages, which `M4` forbids rewriting.\
It is not kept for downstream links; the director ruled those are not a reason to carry legacy.\
A superseded entry moved by the rename lives at its new path in `methods/`, not its old one.\
The moved body is copied unedited.

---

## 3. Coverage map - decisions proven vs deferred

| Decision | This delta |
|---|---|
| four distinct kinds of content (Q1) | **proves** procedures, rules and practices in separate layers; units of work already apart |
| procedures a single-source layer (Q5) | **proves** for `K1`; **defers** every packaged skill |
| practices and rules (Q4) | **proves** the ruling: two layers |
| the vision amended (Q3) | already absorbed, `719351d` |
| work-types cite their procedures (Q6) | **defers** to the `W0` conversion |
| `methodology/` renamed `methods/` | **proves** - ruled by the director: downstream breakage is not a reason to carry legacy |

**Deferred, each with an observable trigger:**

- **Packaged skills becoming derived from method entries** - every skill with a directory, `K3` included: its seven templates make it a package by the same test as `K23`. *Trigger: the first edit to a packaged skill's procedure text, which a commit shows.*
- **`K4`.** Rules 1 and 2 are judged by reading the output, so they are style; rules 3 and 4 govern how the work is done, so they are practices. Moving it means splitting it. *Trigger: this delta lands.*
- **`K27`.** Vendored under licence; its rules govern how code is named. *Trigger: this delta lands; decide with its provenance.*
- **The WorkGraph skills, all of them** - `K6`, `K18`-`K26`, packaged or not. One coordination substrate's procedures in a corpus whose vision answers to no vendor; whether they belong here is its own ruling. *Trigger: this delta lands.*

---

## 4. Verification targets

- `tools/check-all.sh`, with the stage-1 mutation proof recorded.
- **A reference check**, a script committed with stage 3: every old path resolves to a superseded stub naming its successor, and no active entry outside the stubs names a moved ID.
- `tools/eval.mjs`: the extended `work-layers` suite before and after in one blind run; every standing suite on the after-corpus against the baseline.

---

## 5. Binary exit criteria

1. The stage-1 mutation proof: each of the three malformed fixtures fails the gate, and passes once corrected.
2. Every active entry in `methods/` produces a result of its own, and every entry in `rules/` declares a `trace` - the second half checked by the schema.
3. The reference check passes.
4. For each moved entry, its body is byte-identical to its predecessor's body at `719351d`, outside frontmatter and retargeted references.
5. `tools/check-all.sh` passes.
6. The extended `work-layers` suite, key committed and reviewed before drafting:
   - the six existing probes, kept as controls, score no lower after than before;
   - new probes place a rule, a practice and a procedure, and **assemble** the procedure a stated situation needs; after scores higher than before on each.
7. No standing suite regresses against the baseline under the rule in `docs/evals/README.md`.

**Who evaluates.**\
Criteria 1 to 5 are mechanical, run by tools and recorded.\
Criteria 6 and 7 are scored blind by agents who did not author the change.\
Ratification of the delta and of each stage is the director's; the executor evaluates nothing alone.

---

## 6. Named costs and non-claims

- **Every outside link into `methodology/` breaks.** Ruled acceptable: downstream breakage is not a reason to carry legacy.
- **A redirect stub costs one hop**, and adds a superseded row to the ledger.
- **The skills layer still holds procedures as source** in every packaged skill until that deferral is taken.
- **`practices/` starts with one member**, `M6`; ruled acceptable to keep the separation simple.
- **This delta does not show agents use the new layers well**, only that they read them as intended.

---

## 7. The anti-scope fence

- No content edits to a moved entry beyond retargeted references. Corrections found while moving are recorded and made after.
- No change to any packaged skill, any WorkGraph skill, `K4`, or `K27`.
- No change to `work-types/` beyond retargeted references.
- No new procedure, practice or rule authored.

---

## 8. Revision 1 review - every must-fix and its answer

| Must-fix | Answer |
|---|---|
| `K3` is packaged - seven templates - and moving it duplicates the procedure | `K3` stays; deferred with every packaged skill |
| retitling to "Methods" and category `method` break the generator and schema; the rename was recorded as *might* | revision 2 dropped it; revision 3 restores it as a ruling, renaming the directory so title and directory agree, and puts the enum and every reference in the fence |
| the `PR` prefix fails the ID pattern, is unchecked by the schema test, and means *pull request* 98 times | prefix `PC`, unused anywhere; ID pattern, enum, catalogue directories and the root layer table in the fence, with a mutation proof |
| Q4 relabelled `M6`, used a shape test every methodology entry passes, and altered `E3`'s list | test written down; `M6` a practice, as surveyed; `E3`'s own list applied, finding one differing rule; Q4 presented as a director choice |
| a rewritten `K0` would contradict the prose skills that stay | `K0` is not rewritten in this delta |
| criteria 1 and 6 not binary; criterion 6 built to pass | criterion 1 now a mutation proof; criterion 6 keeps the old probes as controls, adds the "assemble" half, and requires a reviewed key first |
| no evaluator named | named in section 5 |
| to-state described, not cited | held in section 0 until ratification, with the divergence handled as `docs/ARCHITECTURE.md` prescribes |

Should-fixes also taken: the from-state counts, stub frontmatter, reference retargeting in the fence, `K4`'s deferral reason, all WorkGraph skills deferred together, observable triggers, the counts outside section 5.
