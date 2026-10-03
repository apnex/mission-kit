# Delta-2 - the explain set - a set spanning layers

```yaml
status:       proposed, revision 1 - reviewed; two director decisions open before revision 2; no stage has run
row:          B38, and B39's trigger
intent:       director ruling under B38 - communication with a human of limited context, who may be cold
from-state:   docs/ARCHITECTURE.md, at 2710898
baseline:     docs/evals/runs/2026-10-03-explain-baseline
```

---

## 0. From-state -> to-state

**From.**\
Guidance on communicating with a human exists in pieces that nothing gathers: `A13`'s economy of the director's attention and its *intent interfaces*, `M3`'s honest yield, `K5`'s survey, `AR3`'s board for selection, `W24`'s walkthrough, and the standing doctrine's rule to state what was measured and what inferred.\
Measured with live agents, it does not help:

| Baseline, 3 readers each, two independent blind scorers | With the corpus | With an empty corpus |
|---|---|---|
| first scorer | 5.33 / 8 | 6.00 / 8 |
| second scorer | 5.33 / 8 | 6.33 / 8 |

The scorers agreed exactly on 21 of 24 answers and within one point on all 24.\
Readers with the corpus did find `A13` and the doctrine, and cited them; the guidance they found is about claims, not about the reader.

**The failure is one property, in both groups.**\
A message to a cold reader must stand alone, every term explained or avoided.\
Across the status updates and reasoning messages - six per arm - it failed, by the first scorer, in 6 with the corpus and 5 without; by the second, 5 and 4.\
The terms left unexplained were *continuous integration* and *staging* in the status updates, *race* and *lock* in the reasoning.\
Presenting a decision scored 2 in every run, and teaching a concept nearly so, with no corpus help.

**To.**

- An **explain set** with a charter, stating the territory - the moments an agent communicates with a human - and gathering its members from the layers their kind puts them in.
- **One new member, where the baseline shows a failure:** a style rule that a message to a human stands alone for a reader with no context.
- **Membership declared on the member**, in the way `category` declares a layer, and the set's index generated from those declarations.

No new entry is written where agents already do well; `M0`'s admission test - following it must produce measurably different work - applies to every kind.

---

## 1. The fence

### The mechanism for a set spanning layers

`E3` admits a set with no folder, *"several entries across two layers governing one concern between them"*, and nothing supports one.\
This delta adds the support:

| Part | Shape |
|---|---|
| **Charter** | `explain/README.md`, id `EX0`. The directory holds the charter only; its members live in the layers their kind places them in |
| **Membership** | a member declares `sets: [explain]` in its frontmatter; the member side holds the edge, as it holds `category` |
| **Index** | generated into `EX0` from those declarations, by `tools/generate-index.mjs`, and into `INDEX.md` as a section like any layer's |
| **Contract** | `sets` added to the catalogue schema, its values constrained to the set charters that exist, so a misspelled set is refused |

The same mechanism is what `B39` needs for style scoped by medium, which this delta's new rule triggers - see section 3.

### The charter, `EX0`

Written under `E4`.
**Purpose:** a human with limited context, who may be reading cold, can act on what an agent tells them.\
**Territory**, derived from its population and the director's list, with gaps checked:

| Moment | What the human must be able to do | Members today |
|---|---|---|
| **Asking** | give the agent the intent it needs | `K5` survey |
| **Deciding** | choose, from options they can compare | `A13`, `AR3` board, `W24` walkthrough |
| **Being told the state** | know what is done, what is not, and what needs them | `M3` honest yield |
| **Following reasoning** | judge an unsettled matter without redoing it | none - the standing doctrine holds it, outside the corpus |
| **Learning** | understand a concept well enough to act | none |
| **Across every moment** | read it cold | the new style rule |

**Faults** it names: the message that needs its context; the recommendation that narrows the choices; the status that leads with effort rather than outcome; the unsettled cause presented as settled.

### The new member

A style rule - checkable from the message alone - in `style/`: **a message written for a human stands alone for a reader with no context.**\
Every term of art, system name or identifier the reader needs is explained in plain words where it first appears, or replaced; nothing relies on an earlier conversation.\
Trigger: *you are about to write a message a human will read without the context you have.*\
It declares `sets: [explain]`.

### Memberships declared on existing entries

`A13`, `K5`, `AR3`, `W24`, `M3` each gain `sets: [explain]` - a frontmatter field only, no content change.

---

## 2. Build order - certifiable stages

1. **Mechanism.** Schema `sets`; generator renders a set's index from member declarations; structure checks accept a charter-only directory. Certified by a mutation proof: an entry naming a set that does not exist fails; a charter-only directory with a member elsewhere generates its index; removing the declaration removes the member.
2. **Charter.** `EX0`, evaluated under `M2` with a key committed first.
3. **Members.** The new style rule, and the five memberships.
4. **Evaluation.** The `explain` suite, with the corpus before and after and the empty-corpus control, in one blind run with two scorers; every standing suite against the baseline.

---

## 3. Coverage map

| Decision | This delta |
|---|---|
| explain designed now, as a set spanning layers (`B38`) | **proves** |
| primary goal: a cold, context-limited human | **proves** for the property the baseline found failing |
| new entries only where measured need exists | **proves** - one entry, for one measured failure |
| style scoped by medium (`B39`) | **fires its trigger**: the new rule applies to one medium, messages to a human. **Defers** the `style/` nested set: one rule does not differ from the parent's rules enough to earn a sub-set (`E3`); it is recorded as the first member of that medium |
| guidance for following reasoning and learning | **defers**: no measured failure at those moments beyond the cold-reader property. *Trigger: a probe at that moment scores below 2 in two of three runs once the new rule is in place* |
| the standing doctrine's measured-or-inferred rule entering the corpus | **defers**: it lives in `AGENTS.md`, outside the catalogue. *Trigger: the doctrine is next revised, or a cold agent without `AGENTS.md` loaded fails a measured-or-inferred property* |

---

## 4. Verification targets

- `tools/check-all.sh`, with the stage-1 mutation proof.
- `tools/eval.mjs`, the `explain` suite: corpus after, corpus before, empty corpus, three readers each, two independent scorers, one blind run.
- Every standing suite against the baseline.

---

## 5. Binary exit criteria

1. The stage-1 mutation proof: each malformed fixture fails, and passes once corrected.
2. `EX0`'s generated index lists exactly the entries that declare `sets: [explain]`.
3. `tools/check-all.sh` passes.
4. In the `explain` run, by each scorer: the property *stands alone* fails in no more than one of the six status and reasoning messages written with the after-corpus - against 6 and 5 of 6 with the corpus at baseline.
5. By both scorers: the after-corpus total exceeds the empty-corpus total. Today it is below it.
6. No probe in the `explain` suite scores lower after than before, and no standing suite regresses under the rule in `docs/evals/README.md`.

**Who evaluates.**\
Criteria 1 to 3 are mechanical.\
Criteria 4 to 6 are scored blind by two agents who did not author the change.\
Ratification is the director's.

---

## 6. Named costs and non-claims

- **A charter-only directory is a new shape** - a top-level folder with no entries of its own. `E2` and `E3` are amended to say so.
- **Criterion 5 sets a bar above zero effect, not a large one.** The baseline shows agents already communicate fairly well unaided; the claim is only that the corpus then helps rather than not.
- **The properties scored come from the director's goal and four cited sources**, applied by the author; the teaching probe is the most exposed to the author's preference, and the key says so.
- **Three readers per arm** detect a failure in most runs, not a small difference.

---

## 7. The anti-scope fence

- No new method, rule or practice beyond the one style rule. The other moments get members when a measurement shows a need.
- No content change to the five entries gaining membership.
- No `style/` sub-directory; no change to how style is scoped beyond recording the first single-medium rule.
- No dependency on Delta-1: the members it moves keep their membership declaration when they move.

---

## 8. Revision 1 review - findings, pending revision 2

A fresh adversarial reviewer verified every quoted number against the run data and found six must-fixes; revision 2 waits on two director decisions they raise.

- **`explain/` with `EX0` is a layer** by the root charter, `E2` and the tools, against `B38`'s *a set spanning layers rather than a layer*. Decision 1.
- **The control was not empty.** Readers also received the harness's always-on context (`B40`); head below bare is within noise, so *today it is below it* is withdrawn. Head is 5.33, not 5.34 - a rounding of rounded means. The second scorer's totals are in `scores-second/` of the run.
- **The measured failure is general engineering vocabulary** - *continuous integration*, *staging*, *lock*, *race* - not system names, which agents explained every time. Whether a competent cold reader needs those explained is the director's intent, not a measurement. Decision 2.
- **`A13` is an axiom**, scoped to the director, and enrolling it recasts a standing commitment as a situated move; it is to be related through the charter's axiom alignment instead.
- **Membership is better declared by the charter**: the set's territory supplies the meaning, not the members', so a charter-side list, checked against existing IDs, follows the corpus's own rule and edits no member.
- **Criteria** 2, 5 and 6 are replaced: a fixed membership list, a noise-robust bar or none, and the regression rule as written; held-out probes added for criterion 4, keyed before the rule is drafted.
- Also taken into revision 2: `M7`'s *one decision at a time* restored; `S0`'s scope amended; `B39` given a new trigger; `M5`'s possible over-reporting recorded as `B41`; the dependency on Delta-1's schema changes stated.
