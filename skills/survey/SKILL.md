---
name: survey
description: "Use BEFORE committing to a design, when you need to capture stakeholder intent on a piece of work whose direction is still open. Runs a two-round, three-orthogonal-questions-per-round pick-list with the decision-authority, then assembles the answers — plus a per-question interpretation, an outcome-axis mapping, and a calibration data point — into a single self-contained envelope artifact. The envelope becomes the load-bearing input the design phase concretizes, so the design starts from captured intent rather than the proposer's guess."
when_to_use:
  - A work item (feature, refactor, initiative) has been accepted in principle but its shape is still open, and you are about to start designing
  - The person who will implement the work is NOT the person who owns the intent, and you need to capture that intent cheaply before investing in a design
  - You want a durable, auditable record of WHY the design took the direction it did, traceable back to specific stakeholder picks
  - Multiple plausible designs exist and you need to narrow the space before any one of them is written up
  - You are tempted to start a design doc by guessing what the stakeholder wants
when_not_to_use:
  - The direction is already fully specified by the stakeholder — there is nothing to survey; go straight to design
  - The work is a trivial bug fix or a mechanical change with one obvious correct outcome
  - You need a deep technical evaluation of an existing system → use a code-grounded audit skill instead
  - The decision-authority is unavailable and cannot answer two short rounds of questions — the survey is interactive by design and degrades to a guess without them
related_skills: [arc-lifecycle, workgraph-arc-planning, substrate-audit, research-artefacts]
---

# survey — stakeholder-intent capture before design

## Overview

A **survey** is a short, structured conversation that converts open-ended
stakeholder intent into a concrete, auditable artifact — run **before** anyone
commits to a design. It is NOT a design, NOT a requirements document, and NOT a
technical investigation. It is the cheapest possible instrument for answering
one question: *given this accepted-in-principle work item, what does the person
who owns the intent actually want?*

The instrument is a **two-round pick-list**: each round poses **three
orthogonal multiple-choice questions** to the decision-authority, who answers by
picking options (one or more per question). Between and after the rounds, the
proposer records a per-question interpretation, maps each pick to a shared set of
**outcome axes** (the goals the work is meant to advance), and captures one
**calibration data point** measuring how the survey itself performed. Everything
lands in a single **envelope artifact** that the design phase then concretizes.

Two design properties make the survey cheap and durable:

- **Bounded stakeholder cost.** Six pick-list questions across two rounds is a
  few minutes of the decision-authority's time — far cheaper than reviewing a
  speculative design and far more reliable than the proposer guessing.
- **Auditable provenance.** Every design decision downstream can be traced back
  to a specific pick + the proposer's recorded reading of it. When the design is
  later questioned, the envelope answers "why this direction?" without anyone
  re-litigating intent from memory.

This skill is **self-contained**: the envelope schema, the round-design
guidance, and the validation contract all live inside this skill directory. It
does not depend on any external methodology document, any particular issue
tracker, or any particular team's role names.

## Roles

The survey involves three generic roles. Map them onto your team's actual titles
however you like — the skill makes no assumption beyond the responsibilities
below.

| Role | Responsibility |
|---|---|
| **decision-authority** | Owns the intent. Answers the pick-list questions. Does NOT design or implement. The minimal-time participant. |
| **proposer** | Runs the survey. Designs the questions, captures picks, writes interpretations, assembles the envelope. Will typically go on to write (or commission) the design. |
| **reviewer** | Optionally audits the envelope before it feeds the design phase. May be the same person as the implementer. |

The survey is **proposer-driven**: the proposer initiates it as a normal part of
moving a work item from "accepted" to "designed." The decision-authority should
not have to ask for it.

## Lifecycle boundary and handoff

The canonical WorkGraph lifecycle is `../arc-lifecycle/assets/workgraph-lifecycle-v1.json`.
Survey owns only `intent-open -> intent-captured`.
It does not design, approve implementation, seed a graph, or authorize an effect.

Every completed survey envelope carries a `lifecycle-handoff` block:

```yaml
lifecycle-handoff:
  from: intent-open
  to: intent-captured
  authority-ref: <Director/stakeholder decision or message ref>
  planning-input-ref: self
```

When direction is already fully specified, do not fabricate a survey.
The architect records an explicit bypass outside the survey artifact with the fixed-intent authority ref and rationale; the lifecycle transition still requires `survey-envelope-or-explicit-bypass`.
A missing decision-authority is not a bypass: it is a hard stop because answering on their behalf would launder intent.

The output feeds `workgraph-arc-planning` as load-bearing intent evidence.
Planning must preserve interpretations, tensions, anti-goals, axiom anchors, and calibration rather than reducing the envelope to a summary sentence.

## Outcome axes (the goals framework)

A survey is run against a **set of outcome axes** — the standing goals or
success dimensions the work is meant to advance (e.g. "reliability," "operator
experience," "cost," "time-to-ship," "extensibility"). These are
**consumer-supplied**: every team has its own. The survey does not define them
and does not require any particular framework.

Provide the axis set as a short labelled list at survey start. If your team has
no formal goals framework, write down 3-6 axes that matter for this work item
and use those. The axes do two jobs:

1. **Pre-anchor question design** — before writing questions, note which axes a
   given question is likely to discriminate, so the questions span the intent
   space rather than clustering on one axis.
2. **Map each pick to axes** — after each round, record which axes each pick
   advances (a primary/secondary split works well). This is the **drift check**:
   if the picks consistently fail to touch an axis the work was supposed to
   serve, that is a finding to surface, not to bury.

Outcome-axis labels are free text. Reference them by whatever stable identifier
your team uses; the envelope just needs the labels to be consistent within the
artifact.

## The five-phase flow

The survey runs as five phases. Phases 2-5 split into a question-design half and
a capture half; phases 2-3 are Round 1, phases 4-5 are Round 2. The middle is
**interactive** — the proposer and the decision-authority exchange questions and
picks in conversation. The init and finalize phases are mechanical.

### Phase 1 — Init (mechanical)

Establish the inputs and scaffold the envelope:

- **Work-item text** — the operator (proposer) provides the accepted work item's
  text directly. Paste it, point at a file, or summarize it. The skill is
  **source-agnostic**: it does not fetch from any tracker. If you have a tool
  that retrieves the text, run it and paste the result.
- **Outcome axes** — the labelled axis list for this survey (see above).
- **Artifact name + output path** — pick a stable name for the work item and a
  directory for the envelope. Default: `surveys/<slug>-survey.md` under the repo
  root. The slug and directory are consumer-configurable.
- **Lifecycle authority ref** — capture the Director/stakeholder authority whose
  answers may move `intent-open` to `intent-captured`; do not infer it from role text.

Scaffold the envelope from `templates/envelope.md.tmpl` to the output path
(either copy it by hand, or run `scripts/survey-init.sh` — see "Optional
automation") and fill the `## §0 Context` section with the work-item text and
provenance. The rest of the envelope is filled as the rounds proceed.

### Phase 2 — Round 1 question design (interactive)

Load `round-1-template.md`. Design **three orthogonal questions**, each with
3-4 pick-list options. Round 1 anchors the **highest-level** intent (the
why / who / at-what-cadence dimensions). See `round-1-template.md` for the
orthogonality and multi-pick discipline. Synthesize the three questions for the
decision-authority.

### Phase 3 — Round 1 capture + interpretation (interactive)

The decision-authority answers. For each question, record into envelope §1:

- The **pick(s)** — one or more options. Multiple picks on one question are
  **not an error** (see "Multi-pick semantics" below).
- A **1-2 paragraph interpretation** — the proposer's reading of what the pick
  means *in the context of the whole picture*: the original work item, the other
  picks in this round, and the outcome axes. State it as a hypothesis: "given the
  aggregate picks + the work item + the axis framework, here is what this pick
  most likely means."
- The **outcome-axis mapping** for Round 1 (which axes the round's picks advance,
  primary/secondary).

Close the round with a 1-2 sentence **composite read** of all three picks
together, flagging any tension as a Round-2 clarification candidate.
Then write a short **Round-1 axiom / principle anchoring** note: name the
load-bearing axiom, principle, goal, or operating constraint the round appears
to advance or tension. This is not decorative citation; it explains why the
round's aggregate intent matters for the eventual design.

### Phase 4 — Round 2 question design (interactive)

Load `round-2-template.md`. Design three Round-2 questions informed by Round 1.
Round 2 is the proposer's **choice of question type**: refine deeper, clarify an
ambiguous Round-1 pick, anchor a newly-surfaced dimension, or mix. Carry the
Round-1 picks + interpretations + Round-1 composite read forward as context.
For each Round-2 question, state whether it **refines**, **challenges**,
**disambiguates**, or **deepens** the Round-1 aggregate interpretation; this
prevents Round 2 from becoming a fresh, disconnected survey. Synthesize for the
decision-authority.

### Phase 5 — Round 2 capture + interpretation + calibration (interactive)

Same capture pattern as Phase 3, applied to the Round-2 questions, into envelope
§2. Close Round 2 with its own aggregate read and axiom / principle anchoring.
Then assemble the **composite intent envelope** (§3) — the aggregate read
across both rounds — by composing the Round-1 aggregate and Round-2 aggregate
into a final intent interpretation. The final intent must include explicit
axiom / principle anchoring: name which axiom, principle, goal, or operating
constraint the derived intent advances or tensions, and how that should shape
the design. Finally capture the **calibration data point** (§calibration):

- **stakeholder-time-cost-minutes** — how long (in whole minutes, as an integer)
  the decision-authority spent across both rounds (the bounded-cost metric this
  instrument is meant to keep low).
- **comparison-baseline** — what this survey is being compared against (a prior
  survey, a prior way of capturing intent, or "none").
- **notes** — free-text observation: a question that landed poorly, a novel
  constraint that surfaced, a candidate improvement to the question-design
  guidance.

### Phase 6 — Finalize (mechanical)

Validate the envelope against the schema (see "Envelope schema" below). Check
that every required section is present and non-empty, every question has a pick
and an interpretation, the outcome-axis carries both a whole-survey roll-up and a
per-round mapping, Round 1 and Round 2 each have aggregate interpretation and
axiom/principle anchoring, the final composed intent has axiom/principle
anchoring, the lifecycle handoff is exactly `intent-open -> intent-captured` with
an authority ref, and the calibration fields are filled. By hand: eyeball the schema.
With automation: run `scripts/validate-envelope.sh --envelope-path=<path>` —
exit 0 means the mechanical baseline conforms; still check any project-specific
axiom/principle anchoring discipline if your validator version does not enforce
it. Fix any gap and re-check. When the envelope passes, publish it where the
design phase will pick it up.

## Multi-pick semantics

Each question accepts **one or more** picks. The meaning depends on whether the
options are orthogonal or mutually exclusive:

- **Orthogonal options** (e.g. "(a) latency (b) observability (c) cost (d) all of
  these") — multiple picks compose. Each pick adds a constraint the design must
  satisfy. This is the natural, expected case for well-designed questions.
- **Mutually-exclusive options** (e.g. "(a) per-user (b) per-team (c) global") —
  multiple picks are **contradictory**, and this is **not an error**. A
  contradictory multi-pick signals that the decision-authority wants a
  **constraint envelope** that satisfies more than one of the options at once.
  Capture it explicitly (envelope §contradictory) as a design-phase brainstorm
  anchor rather than forcing a single answer.

Design questions so the options are orthogonal where you can; treat
contradictory picks on exclusive questions as signal, not noise.

## Envelope schema (self-contained)

The envelope is a single Markdown file with YAML frontmatter and numbered prose
sections. `templates/envelope.md.tmpl` is the fillable starter; this section is
the contract `scripts/validate-envelope.sh` enforces at finalize. Follow it and
the validator passes.

**Frontmatter — required keys:**

| Key | Meaning |
|---|---|
| `survey-title` | Human title for the envelope header |
| `work-item` | Opaque work-item identifier (issue key, ticket, slug — any non-empty string; no format imposed) |
| `methodology-source` | Where the survey methodology came from (free text; e.g. a local `SURVEY.md`, or this skill) |
| `stakeholder-picks` | The decision-authority's picks, grouped `round-1` / `round-2`, one entry per question (`Q1`..`Q6`), each with an optional `<Q>-rationale`. Each pick is one or more letters `a`-`d` (multi-pick supported). |
| `outcome-axis` | The goal/objective axes the picks advance. A **whole-survey roll-up** (top-level `primary` / `secondary`) **and** a **per-round** mapping (`round-1` / `round-2`, each with `primary` / `secondary`). Axis labels are free text, consistent within the file. |
| `axiom-principle-anchors` | The axiom, principle, goal, or operating-constraint anchors used by the survey. Include a whole-survey roll-up and per-round anchors. Free-form labels are acceptable; the load-bearing requirement is that the prose sections explain how the anchors affect intent and design. |
| `lifecycle-handoff` | Exact `from: intent-open`, `to: intent-captured`, non-placeholder `authority-ref`, and `planning-input-ref` (normally `self`). This is a planning handoff, not implementation authority. |
| `calibration-data` | `stakeholder-time-cost-minutes` (integer), `comparison-baseline`, `notes` |

**Frontmatter — optional keys:**

| Key | Meaning |
|---|---|
| `classification` | A consumer-defined category for the work item (e.g. "feature", "refactor", "spike", "migration"). Drop the key entirely if your team has no taxonomy. If present, it must be a filled (non-placeholder) value; it is enum-checked only when you configure an enum via `--classes` / `SURVEY_CLASSES` — there is no built-in enum. |
| `contradictory-constraints` | Present (uncommented) only when a contradictory multi-pick was captured; then the `## §contradictory` prose section must also be present |
| `anti-goals-count` / `flags-count` | Optional convenience counters; not validated |

**Prose sections — required, in order:**

- `## §0 Context` — work-item provenance + the methodology/axis-framework reference
- `## §1 Round 1 picks` — picks table + `### §1.Q1`/`§1.Q2`/`§1.Q3`
  per-question interpretations (each present + non-empty) + a Round-1 composite read + Round-1 axiom/principle anchoring
- `## §2 Round 2 picks` — picks table + `### §2.Q4`/`§2.Q5`/`§2.Q6`
  per-question interpretations (each present + non-empty) + a Round-2 composite read + Round-2 axiom/principle anchoring; each Round-2 question states whether it refines/challenges/disambiguates/deepens the Round-1 aggregate
- `## §3 Composite intent envelope` — the aggregate read across both rounds; the
  load-bearing input the design concretizes, including final axiom/principle anchoring
- `## §4 Scope summary` — title, optional classification, primary/secondary
  outcomes, and the outcome-axis alignment (whole-survey + per-round)
- `## §5 Anti-goals` — explicitly out-of-scope items, each with what they compose
  with later
- `## §6 Flags / open questions for the design phase` — flags batched for the
  design-phase review
- `## §7 Sequencing / cross-work considerations` — branch/review strategy,
  composability with concurrent work, compressed-timeline assessment
- `## §calibration` — the calibration data point
- `## §8 Cross-references` — related work items, prior surveys, the design artifact
  this envelope will feed

The per-question interpretation sub-sections (`### §1.Q1`..`### §1.Q3`,
`### §2.Q4`..`### §2.Q6`) are themselves part of the contract: each must be
present and contain real prose, not just a `<placeholder>` line.

**Prose sections — optional:**

- `## §contradictory` — present only when a contradictory multi-pick was captured
  (and then the `contradictory-constraints` frontmatter must be filled, per the
  frontmatter↔prose consistency check)

## Optional automation

This skill is fully runnable by hand — copy the template, fill it across the
rounds, eyeball the schema at finalize. Teams that run many surveys may want to
add a `scripts/` directory with small helpers (scaffold the envelope; render a
pick table; validate the schema). There is no required script surface, but if
you write any, two disciplines are load-bearing and worth carrying:

- **Anchor file paths to the repo root, not the caller's working directory.**
  Resolve the repo root once via `git rev-parse --show-toplevel`, with a
  script-directory-relative fallback when that fails (not a git checkout).
  Resolve relative input/output paths against that root; let absolute paths pass
  through unchanged. A script that writes `surveys/...` relative to the caller's
  `PWD` silently lands the artifact in the wrong place when invoked from a
  subdirectory.
- **Use a distinct exit code for invocation errors.** Reserve `0` for success
  and keep any semantic exit codes (e.g. a validation-failed code) separate from
  the code you return for bad arguments. Use `64` (`EX_USAGE`, the BSD sysexits
  convention) for missing/unknown-argument errors so a caller can never mistake
  a usage error for a semantic result.

Keep any scripts to pure shell with `grep`/`awk`/`sed` so they run anywhere
without a language runtime, package manager, or YAML tool installed.

## References

- `round-1-template.md` — Round-1 question-design guidance (highest-level intent;
  orthogonality + multi-pick discipline)
- `round-2-template.md` — Round-2 question-design guidance (strategy table keyed
  on Round-1 outcome; concretization heuristics)
- `templates/envelope.md.tmpl` — the fillable envelope artifact (the schema this
  skill enforces)
- `scripts/survey-init.sh` — scaffold an envelope from the template
- `scripts/format-pick-presentation.sh` — render a round's questions in canonical shape
- `scripts/validate-envelope.sh` — finalize-gate schema check (the contract above)
