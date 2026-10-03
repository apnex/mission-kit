# Delta-2 - the explain set - a set spanning layers

```yaml
status:       revision 2 withdrawn from ratification - its premise rested on an instrument that does not measure communication with a human; no stage has run
row:          B38
intent:       director rulings under B38
from-state:   docs/ARCHITECTURE.md, at 3d55cc6
baseline:     docs/evals/runs/2026-10-03-explain-baseline-rescored
review:       revision 1 audited by a fresh adversarial reviewer; findings in section 8
```

---

## 0. From-state -> to-state

**From.**\
Guidance on communicating with a human exists in pieces nothing gathers: `M3`'s honest yield, `M7`'s *present one decision at a time*, `K5`'s survey, `AR3`'s board, `W24`'s walkthrough, and `A13`'s economy of the director's attention and its *intent interfaces*.\
No set charters them, so no territory states the moments they cover or the moments nothing covers.

**What the baseline measured**, re-scored after the director's ruling that a competent cold reader knows general engineering terms:

| Two independent blind scorers, 3 readers per arm | With the corpus | Without |
|---|---|---|
| first scorer | 7.00 / 8 | 7.00 / 8 |
| second scorer | 7.00 / 8 | 6.67 / 8 |

The scorers agreed exactly on 23 of 24 answers.
> **CORRECTION - this read: *agents of this family already write well for a cold human, with or without the corpus.***\
> The instrument cannot support that.\
> It scores the absence of six or seven defects the author chose, judged by agents of the same family that wrote the messages; it does not measure whether a human can act on the message, and no human judged any of it.\
> The director, the human the set exists for, reports clear gaps.\
> What the scores do support is narrower: on the author's checklist, scored by agents, the corpus made no difference.

On that checklist, the misses were scattered - three of six status updates longer than needed, one giving an unrelated bug more than a line.\
Every arm also carried the harness's always-on doctrine (`B40`), which may be doing work a truly empty control would expose.

**So this delta gathers, and authors nothing.**\
No new entry is justified by a measured difference, which `M0`'s admission test requires of every kind.\
What a set charter adds is measurable on its own terms: whether a cold agent can *find* the guidance for the moment it is in.

**To.**

| Layer or entry | What it is | Prefix | Category |
|---|---|---|---|
| `sets/` | charters of populations that span layers - one concern, so it passes `E2`'s altitude test as a topic-named folder would not | `ST` | `set` |
| `ST0` | the layer's charter: what earns a spanning set, how members are declared | | |
| `ST1` | the explain set's charter | | |

---

## 1. The fence

### The mechanism

| Part | Shape |
|---|---|
| **Membership** | declared by the set's charter in a `members` list. The set's territory gives membership its meaning - "governs a moment of communicating with a human" is not part of what `M3` or `K5` *is* - so by the corpus's rule a relationship is declared on the side whose meaning includes it, the charter's |
| **Check** | every `members` id must exist and be active; the generator fails otherwise, as it does for a dangling `related` edge |
| **Index** | generated into each set charter from its `members` list, grouped by the member's layer; `INDEX.md` carries `sets/` as a section like any layer's |
| **Contract** | `ST` in the id pattern; `set` in the category enum; `members` required of every `set` entry other than `ST0`; `sets` added to the schema test's catalogue directories |

No member's file changes.

### `ST1`, the explain set

Written under `E4`.
**Purpose:** a human with limited context, who may be reading cold, can act on what an agent tells them.\
**Territory**, derived from its population and the director's list:

| Moment | The human must be able to | Members |
|---|---|---|
| **Asking** | give the agent the intent it needs | `K5` |
| **Deciding** | choose between options they can compare | `M7`, `AR3`, `W24` |
| **Being told the state** | know what is done, what is not, and what needs them | `M3` |
| **Following reasoning** | judge an unsettled matter without redoing it | none in the corpus |
| **Learning** | understand a concept well enough to act | none in the corpus |

The members column is generated from `members`, grouped by moment through a `moment` map in the same frontmatter, so the table cannot drift from the list.\
**Two moments have no member**, recorded as gaps, not filled: the baseline found agents doing them well, and an entry would have to produce measurably better work to earn its place.
**Axiom alignment:** `A13` - where it binds, its *intent interfaces* are what this set gathers. It is cited, not enrolled; an axiom is a standing commitment, not a situated move.\
**Boundaries:** messages between agents are not in scope; the set governs communication with a human.\
**Faults**, of the population: a moment with guidance that no cold agent finds; two members giving a cold agent opposite instructions for one moment; a member admitted for importance rather than a measured difference.

### `ST0`, the layer

States what earns a spanning set - members in two or more layers governing one concern with rules of its own (`E3`) - and that membership is declared by the set.\
`E2` and `E3` are amended to name the layer; `E3`'s *a set with no folder* becomes *a set whose charter lives in `sets/`*.

---

## 2. Build order - certifiable stages

1. **Mechanism.** Schema, generator, structure checks. Certified by mutation, each confirmed applied by a reviewer who did not write it: a `members` id that does not exist fails; a superseded member fails; removing an id from `members` removes it from the generated index.
2. **Charters.** `ST0`, then `ST1`, each evaluated under `M2` with a key committed first.
3. **Evaluation.** Run before the change reaches `main`, so the control does not receive it through the ledger (`B40`).

---

## 3. Coverage map

| Ruling | This delta | Criterion |
|---|---|---|
| explain designed now, as a set spanning layers | **proves** | 1, 2 |
| spanning-set charters live in `sets/` | **proves** | 1 |
| a cold reader knows general engineering terms | **applied** to the key; already absorbed | - |
| new entries only where a measured difference exists | **proves** - none authored | 4 |
| guidance for following reasoning and learning | **defers**. *Trigger: a probe at that moment scores below 2 in two of three runs by both scorers* | - |
| style scoped by medium (`B39`) | **not fired**: no single-medium rule is authored | - |
| the standing doctrine entering the corpus | **defers**. *Trigger: `B40` is resolved and a control without it scores lower* | - |

---

## 4. Verification targets

- `tools/check-all.sh`, with the stage-1 mutation proof.
- A new **explain-routing** suite: a cold agent, given a moment - about to present a decision, about to report status - names the corpus guidance for it. Key and held-out probes committed and reviewed before `ST1` is drafted.
- The `explain` suite and every standing suite, against the baseline.

---

## 5. Binary exit criteria

1. The stage-1 mutation proof: each malformed fixture fails, each confirmed applied by a reviewer other than the author, and each passes once corrected.
2. `ST1`'s generated index lists exactly `K5`, `M7`, `AR3`, `W24`, `M3`, and nothing else.
3. `tools/check-all.sh` passes.
4. **explain-routing**, by each of two scorers: with the after-corpus, the guidance for each probed moment is found in at least two of three runs; with the before-corpus, a held-out moment is found in at most one. The before-corpus result is recorded whatever it is.
5. No probe in any standing suite, `explain` included, regresses under the rule in `docs/evals/README.md`.

**If criterion 4 fails**, the set is not ratified: a charter no cold agent finds is the population fault it names.\
**Who evaluates.**\
Criteria 1 to 3 are mechanical, criterion 1's mutants confirmed by a second agent.\
Criteria 4 and 5 are scored blind by agents who did not author the change.\
Ratification is the director's.

---

## 6. Named costs and non-claims

- **One new layer** whose entries are charters. Its population starts at one set.
- **Delta-1 and Delta-2 edit the same schema, generator and structure checks.** Whichever runs second rebases its stage 1 on the first.
- **This delta claims findability, not better communication.** The baseline shows no communication gap for the corpus to close, within the limits of three readers and an instrument that carries the doctrine into every arm.

---

## 7. The anti-scope fence

- No new method, rule, practice or style entry.
- No change to any member's file.
- No `style/` sub-directory.

---

## 8. Revision 1 review - findings and their disposition

| Finding | Disposition |
|---|---|
| `explain/` with `EX0` is a layer, against the ruling | director decision: a `sets/` layer for spanning-set charters |
| the control carried the harness's always-on context | `B40`; stated in `docs/evals/README.md`; after-runs taken before `main` |
| head below bare was within noise; 5.34 a rounding of rounded means | withdrawn; the re-scored baseline is the reference |
| the failing property was general vocabulary, which may be the key's strictness | director decision: general terms may be assumed; key corrected and re-scored - the failure disappears |
| `A13` enrolled as a member | cited under axiom alignment instead |
| membership declared by members | declared by the charter, with a generated moment table |
| criteria 2, 5, 6 weak | replaced by a fixed membership list, a findability criterion with held-out probes, and the regression rule as written |
| `M7` dropped | restored, at *deciding* |
| `M5` may push agents to over-report deferrals | `B41`, held |
| the dependency on Delta-1's schema work unstated | stated in section 6 |
