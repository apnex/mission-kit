# Tier discipline — the three-tier knowledge model

This is the load-bearing principle that keeps nanoprobe outputs reusable
months after the probe ran. A future operator reading your output needs to
be able to tell, on every sentence, *what kind of knowledge they're
looking at*.

## The three tiers

### Tier 1 — Substrate's claim (what it says about itself)

**Source of truth:** the substrate's maintainers.
**Where you find it:** README, official docs site, CLAUDE.md, AGENTS.md,
maintainer blog posts, conference talks, marketing copy.
**Authority:** the project. Whoever shipped the code shipped the framing.
**Ages with:** the project. Docs get rewritten, READMEs change, framing
shifts as the project evolves.

Examples:
- "Honcho is a memory system that reasons" (README)
- "The current architecture is 'minimal deriver' — a single LLM call per
  batch using structured output" (CLAUDE.md)
- "Honcho extracts all latent information by reasoning about everything"
  (reasoning.mdx)

### Tier 2 — Substrate's source (what the code actually shows)

**Source of truth:** the code at the pinned SHA.
**Where you find it:** `src/`, configuration files, schemas, migrations,
test fixtures.
**Authority:** the SHA. As long as the pin holds, the citation holds.
**Ages with:** the SHA pin. Doesn't age within the pin; ages instantly
if the pin is broken.

Examples:
- `HonchoSettings(BaseSettings)` at `src/config.py:579`
- `QueueItem` imported from `src.models` at `src/deriver/queue_manager.py:32`
  (confirming queue is Postgres-backed)
- `uvloop.EventLoopPolicy()` set at `src/deriver/__main__.py:78`

### Tier 3 — Prober's analysis (interpretation of Tier 1+2)

**Source of truth:** the prober's reasoning.
**Where you find it:** the prober's notes — `04-assessment.md`, the
"Behaviour notes" section of feature specs (when interpretive), `03-mapping.md`,
`00-summary.md`.
**Authority:** the prober, signed and dated. A future operator can disagree
with Tier 3 without disagreeing with the substrate.
**Ages with:** the prober's understanding. May be refuted by later evidence
or by the substrate evolving.

Examples:
- "Postgres-backed queue trades throughput for durability — this is unusual
  for a substrate of this scale" (interpretation, not stated by the project)
- "The Summarizer-in-utils asymmetry suggests it was retro-fitted" (the
  prober's reading of structural facts)
- "AGPL license is sovereignty-relevant for managed-service futures, moot
  for single-user self-host" (operator-context-dependent assessment)

## Why this discipline matters

**The failure mode it prevents:** a future operator reads the architecture
map and can't tell which sentences are facts about the substrate (durable,
re-verifiable via the SHA) and which are the prober's opinion at a moment
in time (potentially wrong, definitely dated). Without tier discipline,
the entire document gets demoted to "vibes" — the operator either trusts
all of it (and re-uses interpretation as if it were fact) or trusts none
of it (and re-probes the repo, defeating the artefact's purpose).

**The artefact's value scales with tier separation.** A Tier 1+2 architecture
map is durable foundational knowledge — re-readable years later without
re-probing. A Tier 3 assessment is dated commentary — useful, but distinct.
Mixing them collapses the value of both.

## Artefact-to-tier mapping

| Artefact | Primary tier | Tier 3 allowed? | Notes |
|---|---|---|---|
| `02-architecture.md` | Tier 1+2 | NO | Pure descriptive. Strip all interpretation. |
| `features/*.md` | Tier 1+2 | YES — in "Behaviour notes" only, labelled | Requirement + Scenarios + Evidence are Tier 1+2; "Behaviour notes" may carry labelled Tier 3 interpretation |
| `03-mapping.md` | Tier 3 | (entire file is Tier 3) | Bounded by the goal list — analytical but scoped |
| `04-assessment.md` | Tier 3 | (entire file is Tier 3) | Open-ended prober commentary, dated/signed |
| `00-summary.md` | Tier 3 (synthesis) | (entire file is Tier 3) | Final analytical distillation, written last |
| `sources.md` | Reproducibility | NO | Pure citations, no interpretation |

## Writing rules per tier

### When writing Tier 1+2 content (`02-architecture.md`, feature specs):

- **No "trade-off" language.** "Honcho uses Postgres for the queue" — fine.
  "Honcho trades throughput for durability by using Postgres" — Tier 3,
  move to assessment.
- **No "I think / appears / suggests / unusual / surprising".** These are
  interpretation markers. If you find yourself writing one, the sentence
  belongs in `04-assessment.md`.
- **No "this means / implies / one of the following".** Implication chains
  are interpretation. State the fact, cite it, stop.
- **No "the gotcha is".** Operator gotchas are Tier 3.
- **Every claim cited** — either `[claim: Tier 1 source]`, `[doc: Tier 1
  source]`, or `[code: file:line]`. A claim without a citation is the
  prober's assertion, which means it's Tier 3 mis-tiered.

### When writing Tier 3 content (`04-assessment.md`, `03-mapping.md`,
`00-summary.md`):

- **Date every entry.** `**Date:** YYYY-MM-DD`.
- **Sign the document** (probe author).
- **Open with an explicit Tier 3 warning** in `04-assessment.md` — a single
  callout that says "this document is analytical interpretation, not
  factual claim".
- **Anchor every assessment to Tier 1+2 evidence.** Pure speculation is
  fine as long as it's labelled — "speculative assessment" with cited
  facts that triggered the speculation. "I have no source for this but"
  is acceptable; "Honcho does X" without a source is not (that's a
  mis-tiered claim).
- **Distinguish factual corrections from interpretive assessments.** An
  AGPL-vs-Apache license correction is a Tier 2 fact that LIVES in
  `sources.md` and `02-architecture.md` — but its IMPLICATION ("this
  matters for managed-service futures") is Tier 3 and lives in
  `04-assessment.md`.

### When writing feature spec "Behaviour notes":

The notes section is where labelled Tier 3 may appear inside a Tier 1+2
artefact. Convention:

- **Pure observations** (default values discovered in source, edge cases,
  surprises in behaviour) are Tier 2 — cite source, no label needed.
- **Interpretation** ("this default is conservative", "this seems
  retrofitted", "operators should know") is Tier 3 — prefix with
  `[T3: analytical]` or similar marker so a reader skimming the notes
  can tell which bullets are observations vs commentary.

## Working pattern: how to seed `04-assessment.md`

You will start accumulating Tier 3 material from the moment step 2
(license verification) reveals a discrepancy with prior surveys. Open
`04-assessment.md` after step 5 (architecture map) and seed it with:

- **Factual corrections** uncovered during the probe (license, version,
  scope discrepancies vs prior surveys)
- **Structural asymmetries** worth noting (e.g. one subsystem in `utils/`
  while others have top-level directories)
- **Vocabulary smells** (e.g. public-API-name vs code-symbol-name mismatches)
- **Operator gotchas** spotted in the architecture (e.g. "X is async from
  Y, so users querying right after Y might not find what they expect")
- **Open assessments** (numbered placeholders to resolve as feature specs
  are written — e.g. "A8 — does X actually use information theory or
  is it metaphor?")

Then add to it as you write feature specs. Each assessment is dated and
labelled; resolve open assessments by editing them in place when feature
specs surface the evidence.

## Anti-patterns

1. **"This is unusual for a substrate of this scale."** Pure Tier 3. If
   it's in `02-architecture.md`, move it to `04-assessment.md`.
2. **"The maintainers chose to..."** — speculation about intent. Tier 3.
3. **"This design trades X for Y."** Trade-off framing is interpretation
   unless the maintainers themselves named it as a trade-off (in which
   case quote them and cite as Tier 1).
4. **"Common misconception: ..."** — useful, but it's prober commentary
   about how OTHER people interpret the substrate. Tier 3.
5. **"The right way to think about this is..."** — Tier 3 with extra
   evangelism. Belongs in assessment with the prober's name on it.

## The test

Read any sentence in `02-architecture.md` or a feature spec's main body.
Ask: **if the maintainers reviewed this, would they say "we did not say
that, the prober inferred it"?** If yes, the sentence is mis-tiered —
move it to `04-assessment.md`.

Conversely, read any sentence in `04-assessment.md`. Ask: **does this carry
a date, a signature, or sit under a dated heading?** If no, you've lost
the time-stamped quality that makes Tier 3 honest about its shelf life.
