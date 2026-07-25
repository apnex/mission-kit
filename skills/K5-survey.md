---
id: K5
category: skill
title: survey — stakeholder-intent capture before design commitment
added: 2026-05-29
status: active
supersedes: []
related: [M1, M3]
---

# K5 — survey

Canonical operational body: [`survey/SKILL.md`](survey/SKILL.md).
A valid envelope advances only the evidence-derived lifecycle transition `intent-open -> intent-captured`, carries a decision-authority ref, and grants no design, seed, implementation, or delivery effect.

## Rule

Before committing to a design for any non-trivial work item, run a
**survey**: a two-round, three-orthogonal-questions-per-round
stakeholder-intent pick-list, captured into a single envelope artefact.
Do not hand the stakeholder a blank "what do you want?" — hand them six
bounded multiple-choice questions across two rounds, and record their
answers plus your interpretation of each before any design work begins.
The survey runs as four steps:

1. **Seed** — the operator supplies the work-item text directly
   (paste, file, or a tool that prints it). The survey does not assume
   any particular tracker or fetch mechanism; the text is the only input.
2. **Round 1 (framing)** — pose three *orthogonal* questions that fix
   the high-level shape: scope boundary, ambition level, and the primary
   outcome axis being optimised. Each question offers a small fixed set
   of picks; the stakeholder may pick more than one and may add a
   free-text rider. Keep the round answerable in a few minutes.
3. **Round 2 (refinement)** — pose three more orthogonal questions whose
   framing *depends on* the Round 1 picks (e.g. if Round 1 chose the
   most-ambitious scope, Round 2 probes sequencing and risk; if it chose
   minimal, Round 2 probes what was deliberately excluded).
4. **Envelope** — assemble one artefact containing: the verbatim picks,
   the proposer's written interpretation of *each* question (so a third
   reader knows what the pick was taken to mean), a mapping from the
   picks to the consumer-supplied **outcome axes / goals**, and a small
   **calibration** block (time the stakeholder spent, a comparison
   baseline, notes). Validate the envelope against a fixed schema before
   treating it as ratified.

The survey is owned by the **proposer** (the role that will write the
design). The **stakeholder** (the role whose intent is being captured)
only answers picks — they should never have to trigger the survey or
learn its mechanics. A **reviewer** later reads the envelope to check
the design honours the captured intent.

## Rationale

Designs that skip intent-capture fail in a predictable way: the proposer
builds toward an *imagined* stakeholder preference, the stakeholder sees
the result only after the design is sunk-cost, and the gap surfaces as
expensive late rework. A free-form "tell me what you want" interview
fails differently — it produces unstructured prose that the proposer
re-interprets silently, and there is no artefact a later reviewer can
check the design against.

The bounded pick-list fixes both. Orthogonal questions force the
stakeholder to make *independent* decisions instead of one fuzzy
all-things judgement, so contradictions surface immediately (picking
"minimal scope" and "optimise for completeness" in the same round is a
visible conflict, not a hidden one). Two rounds let the second round's
framing adapt to the first round's answers, so refinement effort lands
where the early picks left ambiguity rather than being spent uniformly.
Writing the proposer's interpretation *next to* each pick converts the
silent re-interpretation into a reviewable claim. The outcome-axis
mapping ties each pick to a goal the consuming team already cares about,
so "why did we build it this way" always traces back to a recorded
intent. The calibration block makes the survey's own cost legible, so a
team can decide whether the gate is paying for itself.

The envelope is the load-bearing output: it is the contract the design
is written against and the reviewer checks against. A survey that
produces picks but no validated envelope has captured intent into
ephemeral conversation and will decay the same way a skipped survey does.

## Examples

**Bad:** The proposer reads the work-item, decides "they probably want
the full version," and writes a design. Three weeks later the
stakeholder reviews it and says "I only wanted the read path — the write
path is out of scope for this quarter." The design is rebuilt. There was
no artefact recording what "full version" was assumed to mean, so the
miscommunication was invisible until the design existed.

**Bad:** The proposer opens a free-form chat: "What do you want out of
this?" The stakeholder writes two paragraphs. The proposer extracts an
interpretation in their head and starts designing. A second reviewer
later cannot tell which design decisions trace to stated intent and
which are the proposer's invention, because nothing pins picks to a
structured schema or to the team's goals.

**Good:** Before designing, the proposer poses Round 1 — *scope* (pick:
read-only / read-write / full lifecycle), *ambition* (pick: minimal
viable / standard / maximal), *primary outcome axis* (pick from the
team's published goal set). The stakeholder picks "read-only," "minimal
viable," and "operator-safety" with a rider. Round 2's questions are then
framed around a minimal read-only build (sequencing, explicit
exclusions, rollback). The proposer writes one envelope: the six picks,
a one-line interpretation under each, a table mapping each pick to the
goal it serves, and a calibration block ("stakeholder spent ~6 min;
baseline: prior similar item took 40 min of back-and-forth"). The
envelope passes schema validation and becomes the thing the design is
written against and the reviewer checks. When scope questions arise mid-
design, the answer is already recorded.

## When to apply

- At the transition from an accepted work-item to a committed design,
  whenever stakeholder intent is not already pinned in a checkable
  artefact.
- Any time the cost of building the wrong thing exceeds the few minutes
  of stakeholder time a survey costs (most non-trivial design work).
- When multiple people will read the design later and need to verify it
  honours what the stakeholder actually asked for.
- When the work-item text is ambiguous enough that two competent
  proposers might build materially different things from it.

Skip the survey when:

- The work-item is small, reversible, and low-stakes (a typo fix, a
  one-line config change).
- Intent is already captured in an equivalent ratified artefact and the
  survey would only duplicate it.
- The proposer and stakeholder are the same person and there is no later
  reviewer who needs the contract.

## Origin

Codified from the agentic-network *survey* skill
([`skills/survey/`](https://github.com/apnex-org/agentic-network/tree/main/skills/survey)),
which mechanised a recurring pre-design intent-capture step into a
two-round, three-question pick-list with a schema-validated envelope.
The portable kernel — bounded orthogonal questions, an adaptive second
round, and a per-pick interpretation plus outcome-axis mapping plus
calibration block in one validated artefact — is project-agnostic; the
reference implementation's tracker-fetch, goal-framework, and role model
are the substitutable seams. This entry strips those substrate-specific
bindings and keeps only the intent-capture discipline.

## Tooling

If shipping an executable instance of this skill, expose every
substrate-specific binding as a configuration seam rather than hardcoding
it:

- **Work-item source** — accept the item text from a file or stdin; do
  not couple to any one tracker or fetch tool.
- **Outcome axes / goals** — accept the consuming team's goal set as
  input; the survey maps picks onto it but does not define it.
- **Roles** — parametrise the proposer / stakeholder / reviewer role
  names; the kernel only needs the three responsibilities, not specific
  titles.
- **Output path + naming** — configurable; do not hardcode a directory
  or filename convention.
- **Classification enum** (work-item class, mission class, or similar) —
  optional and consumer-supplied via config, or dropped entirely.
- **Survey shape** — rounds and questions-per-round default to 2×3 but
  should be configurable; envelope schema and section naming likewise.

Any shipped helper scripts should be pure shell (`grep`/`awk`/`sed`,
no interpreter dependency), anchor their working directory off the repo
root (e.g. `git rev-parse --show-toplevel`) so they run correctly from
any subdirectory, and exit with a distinct usage exit-code (`64`,
`EX_USAGE`) on bad invocation so callers can distinguish a misuse from a
legitimate failure.