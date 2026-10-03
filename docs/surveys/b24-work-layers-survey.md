---
survey-title: B24 - how mission-kit says how to do work
work-item: B24
methodology-source: K5 survey (skills/survey/SKILL.md), run from a local clone of the skill
lifecycle-handoff:
  from: intent-open
  to: intent-captured
  authority-ref: director picks given in session on 2026-10-03, recorded in this envelope; Q6 delegated by the director to the proposer
  planning-input-ref: self
stakeholder-picks:
  round-1:
    Q1: abcd
    Q1-rationale: all four kinds - procedures, practices, rules, units of work - are distinct
    Q2: abc
    Q2-rationale: cold agent by trigger, agent with it installed, coordinating system; humans not primary
    Q3: b
    Q3-rationale: amend the vision to state procedures are core; ceremony and cadence stay out
  round-2:
    Q4: bc
    Q4-rationale: contradictory multi-pick - a layer per kind, and procedures apart with practices and rules together
    Q5: ac
    Q5-rationale: the procedure is the single source; a skill exists only where tooling makes packaging necessary
    Q6: a
    Q6-rationale: NOT A DIRECTOR PICK - delegated ("defer to your recommendation"); a is the proposer's recommendation, to be ratified at design review
classification: refactor
outcome-axis:
  primary: [A-context-less-composition, B-single-home]
  secondary: [C-deployable, D-prescriptive-force, E-low-churn]
  round-1:
    primary: [B-single-home, D-prescriptive-force]
    secondary: [C-deployable]
  round-2:
    primary: [A-context-less-composition, B-single-home]
    secondary: [C-deployable, E-low-churn]
axiom-principle-anchors:
  primary: [VISION one-place-for-each-judgement, director rule 1 declare-once-generate-reverse]
  secondary: [A3 sovereign-composition, A12 precision-context, A11 cognitive-minimalism]
  round-1: [VISION one-place-for-each-judgement, VISION authority-amended-not-rewritten]
  round-2: [director rule 1 declare-once-generate-reverse, A3 earned-boundary, A11 cognitive-minimalism]
anti-goals-count: 4
flags-count: 5
calibration-data:
  stakeholder-time-cost-minutes: 4
  comparison-baseline: none - first survey run in this corpus; prior intent capture was turn-by-turn question and recommendation
  notes: time is an estimate from two question rounds, not measured. Q4 drew a contradictory multi-pick, which the skill treats as signal. Q6 was delegated rather than picked, a case the skill does not cover - it treats a missing authority as a hard stop but says nothing of an explicit delegation. The scaffold script wrote its first output into the skill's own directory, not this repository, because it resolves the root from its own location.
contradictory-constraints:
  - round: 2
    questions: [Q4]
    picks: [b, c]
    constraint-envelope: procedures are a layer of their own and units of work stay separate - both picks agree; whether practices and rules are one layer or two is open, to be decided by whether their populations have differing rules (E3)
---

# B24 - how mission-kit says how to do work -- Survey envelope

**Methodology:** `K5` survey (2-round, 3-orthogonal-questions-per-round pick-list)\
**Work item:** B24\
**Classification candidate:** refactor\
**Lifecycle handoff:** `intent-open -> intent-captured` only; this envelope grants no design, seed, implementation, or delivery effect.

---

## S0 Context

**Source work-item text** (provided at survey init):

> B24 - the layers that say how to do work: methodology/, skills/, work-types/.

Director direction (recorded under B24): prescriptive guidance on how to do work is intended content of mission-kit, and VISION.md's "not a process framework" may predate that intent.\
A skill is a deployable package of a prescriptive procedure, installed into an agent; a procedure is the same content not packaged as a skill. methodology/ might be renamed "method".

Measured (docs/audits/M5.5h-01-bypassed-interface.md section 4): cold agents place obvious items correctly (11.67/12), but no text separates methodology from work-types (3/3 readers), and M7/W22, M1/W8-W13, K3/W9 overlap with nothing to tell them apart; K3 and K4 are skills written in methodology form.

Open: the boundary between the three layers, the name that follows from it, and whether VISION.md is amended first.

<1-2 paragraphs: where this work item came from + surrounding context + which methodology anchor governs this survey.\
Cite the work item and any related items.>

---

**Outcome axes for this survey:**
A - a context-less agent composes what it needs, deterministically; B - one home for each piece of judgement; C - deployable into agents; D - prescriptive force; E - low churn for adopters.

---

## S1 Round 1 picks

| Q | Question | Pick |
|---|---|---|
| Q1 | Which kinds of how-to-do-work content are distinct? | procedures, practices, rules, units of work - all four |
| Q2 | Who consumes procedures? | cold agent by trigger; agent with it installed; coordinating system |
| Q3 | What happens to the vision's *not a process framework*? | amend: procedures are core |

### S1.Q1 -- kinds of content

All four kinds are to be told apart.\
Today `methodology/` holds three of them under one name - procedures (`M1`, `M2`, `M7`, `M8`), a practice (`M6`) and rules (`M3`, `M4`, `M5`) - and `work-types/` holds the fourth.\
A skill is absent from the list, consistent with the director's earlier statement that a skill is packaging rather than a kind of content.\
Reading: the corpus currently conflates three kinds, and the design must make each kind declared and checkable.

### S1.Q2 -- consumers

Three consumers, and humans are not the primary one.\
One procedure must reach a cold agent through its trigger, an agent that installed it, and a coordinating system that attaches it to a unit of work.\
Reading: three delivery routes for one content - which, under the director's rule 1, means one source and derived deliveries, never three hand-kept copies.

### S1.Q3 -- the vision clause

The non-goal is narrowed, not dropped: ceremony, cadence, meetings and status rituals stay out; prescriptive procedures become stated core content.\
Reading: the vision is amended first, through its own process - recorded, then absorbed - before any layer change rests on it.

**Round-1 composite read.**\
Four distinct kinds of content, one source per procedure serving three consumers, and a vision amended to say so.\
Tensions carried to Round 2: how four kinds map to layers, and which side holds the link from a procedure to its packaging and to the work it conducts.

**Round-1 axiom / principle anchoring.**\
`VISION.md`'s *one place a given piece of judgement lives* is the load-bearing principle: three consumers make duplication the default failure.\
`VISION.md`'s authority clause - *amended, never quietly rewritten*, a ruling recorded first and absorbed afterwards - governs Q3.

---

## S2 Round 2 picks

| Q | Question | Relation to Round 1 | Pick |
|---|---|---|---|
| Q4 | How do the four kinds map onto layers? | deepens Q1 | a layer per kind; and procedures apart, practices and rules together - contradictory |
| Q5 | Which is the single source: procedure or skill? | refines Q2 | procedure is the source; a skill only where tooling needs it |
| Q6 | Which side declares the procedure-to-work-type link? | deepens Q2 | delegated to the proposer |

### S2.Q4 -- structure

Deepens Q1.\
The two picks are mutually exclusive as written, and agree on everything but one point: procedures are a layer of their own, and units of work stay separate.\
They disagree only on whether practices and rules share a layer.\
Reading: a constraint envelope - procedures separated firmly, practices and rules left to evidence; see *Scontradictory*.

### S2.Q5 -- procedure against skill

Refines Q2.\
The procedure entry holds the content; a skill exists only where scripts or assets make packaging necessary, and is derived from or checked against the procedure.\
Reading: most skills that are prose today would become procedures, and the skills layer narrows to packages that carry tooling - which reverses today's split, where the skill body is the content and the ledger entry a stub.

### S2.Q6 -- the work-type link

Deepens Q2.\
**Not a director pick.**\
The director delegated: *defer to your recommendation*.\
The proposer's recommendation, to be ratified at design review: **the work-type cites the procedures that conduct it, and the reverse view is generated.**\
Reasoning from the corpus: a relationship belongs to the side whose meaning includes it (rule 1).\
A work-type defines a unit a coordinating system makes claimable, with its evidence contract, and how that unit is conducted is part of what the system needs to attach.\
A procedure is reused across several work-types - `M1` triangulated review serves the review gates - and also outside any work-type, by a cold agent.\
A procedure naming work-types would couple a stable procedure to a mutable taxonomy, the same reason the corpus forbids an axiom naming a domain.\
Overlapping pairs such as `M7` and `W22` would then resolve by citation - the unit cites the procedure - rather than by merging, unless measurement shows they are one act.

**Round-2 composite read.**\
Procedures become their own single-source layer; skills shrink to tooling packages derived from procedures; units of work cite their procedures; practices and rules are separated from procedures, with their own split left to evidence.

**Round-2 axiom / principle anchoring.**\
Rule 1 (declare once, generate reverse views) governs Q5 and Q6.\
`A3`'s earned boundary governs Q4: a layer earns its place by one concern, and `E3` says a population whose rules do not differ is not a separate set.\
`A11` governs Q5's *only where tooling needs it*: packaging is for what a script must do.

---

## S3 Composite intent envelope

Mission-kit holds four distinct kinds of how-to-do-work content - **procedures, practices, rules, units of work** - and its vision is amended to say prescriptive procedures are core, with ceremony and cadence still out.\
**Procedures** are their own layer and the single source of their content.\
They reach three consumers from that one source: a cold agent by trigger, an agent that installs a **skill** - which exists only where tooling makes packaging necessary and is derived from or checked against the procedure - and a coordinating system, through **work-types that cite the procedures conducting them**, with reverse views generated (the last ratified at design review).\
**Practices and rules** leave the procedure layer; whether they are one layer or two is decided by whether their populations differ in rules.\
**Units of work** stay in `work-types/`.

**Final axiom / principle anchoring.**\
The design answers to `VISION.md`'s single home for each judgement and the director's rule 1 above all, because three consumers multiply copies by default.\
`A12` and the director's context-less objective set the acceptance test: a cold agent must place a new item, and assemble the procedure it needs, from declared kinds and triggers alone - which the work-layer baseline measured failing today on the methodology and work-type boundary.\
`A3` decides the layer count; `A11` decides when a skill exists.

---

## S4 Scope summary

- **Title:** how mission-kit says how to do work.
- **Classification:** refactor - layer boundaries, a vision amendment, and a rename that follows from the boundary.
- **Primary outcomes:** A context-less composition; B single home.
- **Secondary outcomes:** C deployable; D prescriptive force; E low churn.
- **Outcome-axis alignment:** Round 1 advanced B and D, with C secondary; Round 2 advanced A and B, with C and E secondary. Axis E - low churn - was touched by no pick directly, and a layer split plus a skill inversion is high churn; surfaced as a flag, not buried.

---

## S5 Anti-goals

- **Ceremony, cadence, meetings, status rituals** - stay out of the vision and the corpus; composes with any later evidence that a cadence pays off, which would need its own ruling.
- **Three hand-kept copies of a procedure** - no procedure authored in both a procedure entry and a skill body; composes with a generator or parity check (`P3`).
- **A procedure naming the work-types it serves** - pending ratification of Q6; composes with a generated reverse view.
- **Renaming before the boundary is ruled** - the name follows from the layer structure; composes with the design phase.

---

## S6 Flags / open questions for the design phase

1. **Q6 is the proposer's recommendation, not a director pick** - ratify or replace at design review.
2. **Practices and rules: one layer or two** - the Q4 envelope; decide by measuring whether their populations need differing rules (`E3`). Today: one practice, three rules.
3. **Churn (axis E)** - a new procedure layer, a skills inversion and a rename break outside links to `methodology/` and `skills/` paths, which cannot be redirected; the design must weigh migration against adoption cost.
4. **Which current skills are prose and which carry tooling** - Q5 implies prose skills move to procedures; measure each before moving any.
5. **Where rules sit against axioms** - "always holds once in a situation" is close to the axiom layer's "always in force"; Q4's fourth option was not picked, but the boundary still needs stating.

---

## S7 Sequencing / cross-work considerations

- **Vision first.** The amendment is recorded as a ruling and absorbed into `VISION.md` before any layer change, per its authority clause.
- **Measure before moving.** The work-layer baseline exists (`docs/evals/runs/2026-10-03-regression-bypass`); the design is evaluated against it with the harness, and new probes cover the four kinds.
- **Composes with the `W0` conversion** (`B24`, `B33`, `B37`'s `W22` and `generatable` defects), which edits work-types anyway; the procedure citation from work-types belongs there.
- **Composes with `B36`'s remaining questions**, which touch entities and axioms, not these layers.

---

## Scontradictory

**Q4, picks b and c.**\
*A layer per kind* and *procedures apart, practices and rules together* cannot both hold as written.\
The constraint both satisfy: procedures form their own layer, and units of work stay in theirs.\
The open dimension is whether practices and rules are separated from each other.\
Design anchor: separate them if their populations need different rules - different admission, shape or placement - and keep them together if not, since `E3` says a population without differing rules is not a separate set.

---

## Scalibration

- **stakeholder-time-cost-minutes:** 4 - an estimate from two rounds of three questions; not measured.
- **comparison-baseline:** none; first survey in this corpus.
- **notes:** Q4 produced a contradictory multi-pick, used as a constraint envelope. Q6 was delegated rather than picked; the skill covers a missing authority (hard stop) but not an explicit delegation, and this envelope records the delegation openly rather than presenting the recommendation as a pick. The scaffold script wrote its first output into the skill's own directory, because it resolves the repository root from its own location rather than the caller's; recovered by an absolute output path.

---

## S8 Cross-references

- Work item: `docs/BACKLOG.md` `B24`, with the director direction recorded under it.
- Baseline: `docs/audits/M5.5h-01-bypassed-interface.md` section 4; run `docs/evals/runs/2026-10-03-regression-bypass`.
- Related rows: `B33`, `B37`.
- Feeds: the design for the procedure, practice, rule and work-type layers, and the `VISION.md` amendment.
