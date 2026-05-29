# Round 1 — question-design guidance

**Goal:** anchor stakeholder intent along **three orthogonal axes** at the
**highest level** — the why / who / at-what-cadence dimensions. Save deeper
how / where / when concretization for Round 2. The whole survey (both rounds,
six questions) should cost the decision-authority only a few minutes, so keep
questions short.

---

## Proposer prompt

Design three orthogonal questions, each with 3-4 pre-determined pick-list
options. Options should be **orthogonal** (composable; multi-pick natural) where
possible — orthogonal options give the decision-authority room to add
constraints rather than forcing a single choice, which improves the refinement
surface in Round 2.

## Question-design heuristics

- **Orthogonality.** Each question partitions the intent space along a *different*
  dimension. Do not probe the same intent surface from two angles — that wastes a
  question and produces co-correlated answers that tell you nothing new.
- **Brevity.** Keep questions short and plain. Avoid jargon unless the context
  genuinely requires it. The decision-authority should be able to answer from a
  quick read, not a study.
- **Highest-level first.** Round 1 anchors the why/who/cadence intent. Resist the
  urge to ask mechanism questions here — those belong in Round 2 once the
  high-level direction is pinned.
- **Multi-pick semantics:**
  - *Orthogonal options* (e.g. "(a) latency (b) observability (c) cost
    (d) all of the above") → multi-pick is natural; each pick adds a constraint.
  - *Mutually-exclusive options* (e.g. "(a) per-user (b) per-team (c) global") →
    multi-pick is contradictory, and that is **not an error**. It signals a
    constraint envelope the decision-authority wants satisfied. Capture it (see
    the envelope's §contradictory) rather than forcing one answer.
- **Self-justification.** Write a one-line rationale per question: *"this question
  discriminates the intent space along axis X by partitioning into A / B / C / D."*
  A future reader (or you, at design time) can then re-trace why the question was
  asked.

## Standard question shape

```markdown
**Q-N — <axis title>:** <brief context; 1-2 sentences>

- (a) <option label>
- (b) <option label>
- (c) <option label>
- (d) <option label>
```

## Outcome-axis pre-anchor

Before designing questions, review the work-item text and the survey's outcome
axes. For each planned question, note the axis it most likely discriminates.
This does two things: it forces the three questions to span the axis space
(orthogonality), and it gives the Round-1 interpretation step a baseline to map
picks against — which is the drift check (did the picks touch the axes this work
was meant to serve?).

| Q | Likely primary axis | Likely secondary axis |
|---|---|---|
| Q1 | <axis-label> | <axis-label> |
| Q2 | <axis-label> | <axis-label> |
| Q3 | <axis-label> | <axis-label> |

## Capture target

Synthesize the three questions for the decision-authority. When the picks come
back, record them into the envelope's `## §1 Round 1 picks` table, write a 1-2
paragraph per-question interpretation in each `### §1.Q<N>` subsection, and fill
the Round-1 outcome-axis mapping. Close with the Round-1 composite read.
