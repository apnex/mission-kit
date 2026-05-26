---
name: research-artefacts
description: "Use when producing any research artefact intended for future reuse — OSS audits, technical investigations, vendor evaluations, architecture reviews, comparative analyses. Enforces four discipline rules that keep research outputs durable, reusable, and free of common contamination patterns: three-tier knowledge separation (claim / source / analytical), signal-density-first writing, scaffolding-before-execution for large tasks, and descriptive-before-comparative two-pass discipline. This is a generic methodology skill that other research skills (substrate-audit, brief-driven-research, vendor-evaluation, etc.) build on top of."
when_to_use:
  - You are producing a research artefact that future operators (you, the user, or others) will need to reason with later — without redoing the underlying research
  - You are evaluating, auditing, investigating, or comparing things and the output will live in a documentation repo
  - You are writing a piece longer than ~500 words that captures findings, facts, and your interpretation of them
  - You're about to delegate research work to subagents and need to specify what "done" looks like
  - You're tempted to mix descriptive content (what is) with analytical content (what it means) in the same artefact
when_not_to_use:
  - One-off chat answers that won't be persisted — no artefact, no discipline needed
  - Pure implementation work (writing code, configuring systems) — use task-specific skills
  - Creative writing where signal density and tier separation actively hurt the output
  - Short factual lookups where the answer is one sentence
related_skills: [substrate-audit, brief-driven-research, writing-plans, plan]
---

# research-artefacts — generic methodology for durable research outputs

## Overview

This skill encodes four discipline rules that emerged from real OSS-audit work
where artefacts kept failing the "can a reader reason with this in six months
without redoing the research" test. The rules are not OSS-specific — they apply
to any research artefact whose value is its reusability over time.

The four rules:

1. **Tier separation** — claim / source / analytical are different kinds of
   knowledge and need different homes
2. **Signal density** — default to terse structured entries; paragraph prose
   is the exception, not the rule
3. **Scaffolding before execution** — large research tasks need a plan
   artefact before any reading begins
4. **Two-pass discipline** — descriptive work comes before comparative work;
   mixing them contaminates the descriptive pass

Each rule is load-bearing. Skipping any one of them produces artefacts that
either (a) age poorly, (b) drown the reader in volume, (c) waste budget on
unbounded exploration, or (d) contaminate the analysis with comparative bias.

## Rule 1: Tier separation

Research artefacts contain three kinds of knowledge. They are not the same and
should not live in the same file without explicit labelling.

| Tier | What | Authority | Ages |
|---|---|---|---|
| **Tier 1 — Claim** | The subject's own self-description | The subject (maintainers, vendors, authors) | With the subject (re-readable but truth-of-the-day) |
| **Tier 2 — Source** | Verifiable facts about the subject at a pinned point | The subject's code/artefacts at a SHA/version | Durable as long as the pin holds |
| **Tier 3 — Analytical** | Your interpretation, trade-off naming, gaps, gotchas | You, signed and dated | Useful but interpretive — disagreement is legitimate |

**The failure mode of conflating tiers:** a future reader cannot tell what's
fact vs interpretation. "Stripe's API is RESTful" (Tier 2 — verifiable) gets
mixed with "Stripe's API is well-designed" (Tier 3 — opinion). Six months
later, the reader trusts both equally — but only one is verifiable.

### How to separate

**Different files for different tiers** is the strongest enforcement:

- Descriptive artefacts (architecture maps, feature specs, primitive inventories,
  API surfaces) carry **Tier 1 + Tier 2 only**. Source-cite every claim.
- Analytical artefacts (assessment, gotcha lists, trade-off analyses,
  recommendations) are **Tier 3**. Open with an explicit Tier 3 banner so
  the reader knows they're reading interpretation.
- Goal-mapping or fitness assessments are also Tier 3 but **bounded** by an
  external goal list — keep them separate from open-ended Tier 3 assessment.

**When Tier 3 must appear inside a Tier 1+2 artefact** (e.g. a "Behaviour
notes" section in a feature spec), label it explicitly: `## Behaviour notes
(Tier 3 — interpretation)`. The label is non-negotiable.

### Hard rules

- **Descriptive artefacts use no analytical language.** Remove all of:
  "trade-off", "I think", "this is unusual", "this is good/bad", "elegant",
  "kludgy", "well-designed", "concerning". These are Tier 3 — move them.
- **Analytical artefacts cite Tier 1+2 evidence by reference.** Don't restate
  facts in your assessment; cite them. "See `architecture.md` §3.2 — the queue
  is Postgres-backed. **Assessment:** this trades throughput for durability."
- **Cross-tier references go one way: analytical → descriptive.** The
  assessment cites the architecture map. The architecture map never cites
  the assessment.

## Rule 2: Signal density

The default writing mode for research artefacts is **terse and structured**.
Paragraph-form prose is the exception, reserved for entries that genuinely
need argument.

### Why this matters

A reader six months from now is more likely to skim 6k chars than 21k. Dense
beats eloquent. The signal-to-noise ratio determines whether the artefact
gets used or skipped.

A real example: an early assessment file had 16 entries averaging 1300 chars
each (21k total). The same information in structured single-line entries was
~90 chars each (~1.5k total) — **14x denser**. The longer version felt
thorough; the shorter one was actually used.

### Default format for assessment-style entries

```
Id (Date) — Severity — Claim in one sentence [citation]. Implication. Action if any.
```

Example:
```
A1 (2026-05-24) — License is AGPLv3, not Apache-2 [LICENSE@7470866].
Network-use copyleft. Substrate-landscape row wrong — fix separately.
```

Same information as a 350-char paragraph version, 4x denser, faster to
read, easier to scan.

### When paragraph-form is justified

- The entry is a structural argument with multiple linked claims (~2-3
  per artefact at most)
- The entry is the load-bearing finding of the whole probe (1 per artefact)
- The entry corrects a prior published claim and needs context to be fair

For everything else: structured single-line entries.

### Stripping pattern

Look for these phrases — they signal Tier-3 drift that should be moved or
cut:
- "Implications for our system…" → move to dedicated implications/assessment file
- "This is unusual because…" → move to assessment, replace with the fact only
- "It's worth noting that…" → cut entirely; if it's worth noting, just note it
- "Interestingly…" → cut; let the fact be interesting on its own
- "It would be worth investigating…" → make it an open-question entry in
  the assessment with an explicit "to-verify" tag

## Rule 3: Scaffolding before execution

Any research task large enough to require ≥3-5 reads/searches/investigations
needs an explicit **plan artefact** before execution begins. The plan is
typically scratch (not persisted), but writing it down is non-negotiable.

### Why this matters

Without a plan:
- You (or a subagent) dive into reading and never declare scope
- Reading expands to fill all available time
- Output is written at the end (or never), when budget is already spent
- Subagents in particular fail this way — they read for 10 minutes and
  produce nothing

With a plan:
- Scope is committed before reading begins
- Reading order is chosen, not stumbled into
- Output structure is decided up front
- Subagents have a contract to execute against
- Drift is detectable (am I still on plan?)

### What goes in a research-task plan

- **What you're going to read, in what order** (the paths through the
  material)
- **Provisional output structure** — file names, sections, anything that
  will be produced
- **Vocabulary to preserve** — internal terms of art that the artefact
  should use rather than translate
- **Notable absences to look for** — explicit list of things you expect to
  find but haven't yet (negative findings have value)
- **Temptations parked** — comparative thoughts that should be deferred to
  later passes (see Rule 4)

### When to skip

Trivial tasks (≤2 reads, ≤500 words of output) don't need a plan artefact.
The judgment call: if you can hold the whole task in your head and produce
the output in one pass, skip. If you can't, scaffold.

## Rule 4: Two-pass discipline (descriptive before comparative)

Descriptive work (what a thing IS) and comparative work (how things RELATE
to each other) are different passes. Mixing them contaminates the descriptive
pass with comparison bias and produces both worse description and worse
comparison.

### The contamination pattern

When you're describing Substrate A and you know Substrate B does something
similar, the temptation is to say "Substrate A's foo is like Substrate B's
bar, but…". This:
- Frames Substrate A in Substrate B's vocabulary (loss of native terms)
- Anchors the reader to one comparison axis (the one you happened to pick)
- Pre-empts the comparative pass with cherry-picked comparisons
- Locks in your current understanding of Substrate B, which may shift

The discipline: **finish the descriptive pass in the subject's own terms
first. Then, in a separate pass, do the comparative work that consumes the
descriptive outputs as inputs.**

### What this looks like in practice

**Descriptive pass output:** N substrate-scoped artefacts, each in that
substrate's native vocabulary, with no cross-substrate references anywhere
— not in the descriptive content, not in the Tier 3 assessment.

**Comparative pass output:** an artefact that consumes the N descriptive
outputs and produces taxonomy reconciliation, comparison matrices, capability
gap analysis. This is the only place comparative language appears.

### Hard rules

- **No "unlike X" or "similar to Y" anywhere in descriptive artefacts.**
  Even when caveated, even in Tier 3 sections.
- **Park comparative temptations explicitly.** Drop them as TODOs at the
  bottom of the descriptive artefact for the comparative pass to pick up.
- **The comparative pass must wait until ≥2 descriptive passes are
  complete.** Comparative work on one substrate is just description with
  comparison contamination.

## Multi-session research collaboration

When research spans multiple sessions with a steering human collaborator,
the four rules above are necessary but not sufficient — folder layout,
append-only design-journal discipline, open-questions as the primary
steering mechanism, and a layered evidence model for auditing another
substrate become load-bearing. That protocol is out of scope for this
skill's current codification.

## How this skill interacts with other research skills

Other research skills inherit these four rules. They add domain-specific
shape on top:

- **`substrate-audit`** — applies these rules to deep audits of individual OSS
  repositories. Domain-specific additions: code-as-source-tier, triangulation
  status taxonomy, feature-spec shape with OpenSpec scenarios, architectural-
  seams principle for code-path selection.
- **`brief-driven-research`** — applies these rules to investigation against
  a frozen research brief. Domain-specific additions: brief immutability,
  citation requirements for web-sourced facts.
- **`writing-plans` / `plan`** — apply Rule 3 (scaffolding before execution)
  to implementation planning. Domain-specific additions: file paths,
  task sequencing, test strategy.

If you're building a new research skill that produces persistent artefacts,
build on top of this one rather than re-deriving the rules.

## Methodology evolution: retroactive refactor of in-flight artefacts

Methodology rarely arrives complete. You'll discover discipline rules
mid-project — a Tier 3 leak you didn't notice, a verbosity pattern you
didn't catch until artefact 5, a comparative phrase you let through three
times before naming the problem. When this happens, you have a choice:
**forward-only** (apply the new rule to new artefacts; leave old ones as
verbose outliers) or **retroactive** (refactor existing artefacts to
match).

Default to retroactive when the project will continue producing
artefacts. Forward-only leaves the early artefacts as a permanent reference
contradiction — readers can't tell which version is canonical, and the
rules feel optional rather than rules.

### When retroactive refactor is the right call

- More than 2 artefacts remain to produce → consistency matters more than
  re-work cost
- The new rule is structural (where content lives, what status to use, what
  cross-references look like), not cosmetic (word choice)
- The refactor is mechanical enough that a single focused pass produces
  the right result without re-reading underlying sources
- The methodology change has been codified in the relevant skill — refactor
  applies the now-encoded discipline rather than re-deriving it

### When forward-only is acceptable

- The project is one or two artefacts from completion
- The new rule is cosmetic (e.g. preferred dash style) and old artefacts
  are still functional
- The earlier artefacts are about to be retired or replaced anyway

### Process for retroactive refactor

1. **Codify first.** The methodology change goes into the skill(s) before
   any refactor work. Otherwise the refactor itself can drift — you're
   applying a remembered rule, not a documented one. Patch the skill,
   confirm it reads correctly, then refactor.
2. **Scope explicitly.** List the artefacts to change and what rule each
   one violates. Concrete: "artefacts A/B/C: assessment-entry verbosity;
   D/E: cross-feature analysis in Behaviour notes; F: ad-hoc status
   string." Do NOT do "improve quality" — name the rule applied.
3. **Refactor in parallel where possible.** Mechanical refactors of N
   sibling artefacts can usually be written concurrently in one editor
   pass — N parallel write_file calls in a single turn. Sequential edits
   waste budget when no dependency exists between them.
4. **One commit, descriptive message.** The refactor is one logical
   change ("apply rule X to existing artefacts"). Single commit makes
   the diff reviewable and the methodology-evolution event traceable
   in history.
5. **Verify volume change in the commit message.** "593 → 380 lines"
   tells future readers the refactor was substantive without forcing
   them to compute the diff. Volume reduction is also a sanity check
   on the rule — if a "tighten" refactor *grew* the artefacts, you
   probably misread the rule.

### What NOT to do during retroactive refactor

- **Don't re-investigate underlying sources.** The refactor is about
  applying discipline to existing facts, not finding new facts. If the
  refactor reveals a missing fact, capture it as a separate follow-up
  task — don't expand scope.
- **Don't combine refactor with new work.** "While I'm in here, I'll
  also add the next feature spec" makes the diff incomprehensible and
  the commit message useless. Refactor lands as its own commit; new
  work as the next one.
- **Don't tighten beyond the rule.** The rule says "default to terse" —
  it does not say "delete examples that justify their length". Apply
  the rule; don't over-rotate.

## In-place corrections: preserve the audit trail

When a later artefact (or a later batch) reveals that an earlier claim in a
*completed and committed* artefact was wrong, do NOT silently rewrite the
earlier claim. Use a strike-through correction that preserves what you
originally said alongside what you now know.

### Why this matters

Silent rewrites destroy the audit trail. A future reader (or you, six
months later) sees the corrected text and has no way to know:
- That the claim ever was different
- What evidence triggered the change
- Whether their *own* mental model — built from reading an earlier
  version — is now stale

If a reader cited the original claim in their own work, they have no way
to discover their citation is now wrong. The methodology becomes
unfalsifiable: the artefact always reads as if it were always right.

### How to format an in-place correction

```markdown
- **Original claim.** ~~Strike-through of the wrong text exactly as it
  appeared, preserving phrasing.~~ **CORRECTED (batch N / date / event):**
  New claim with the evidence that overturned the original [citation].
  Brief note on why the original was wrong — usually \"I only had X
  evidence at the time; reading Y revealed Z\".
```

The strike-through MUST contain the original wording, not a paraphrase.
The CORRECTED tag MUST identify *when* the correction was made and
ideally *what triggered it* (which batch, which new evidence). The
new claim cites its own evidence; the citation isn't optional just
because it's a correction.

### When to correct in-place vs cross-reference

- **Correct in-place** when the original claim is wrong as stated and a
  reader following the original claim would draw a wrong conclusion.
  The reader needs to be intercepted at the point of the error.
- **Cross-reference forward** when the original claim is correct but
  incomplete, or when later work adds nuance that doesn't invalidate the
  original. Add \"See §X for refinement\" rather than strike-through.

### When NOT to correct in-place

- Don't strike-through *open assessments* — they're explicitly provisional
  by status, not wrong. Update the status (\"RESOLVED batch N\") instead.
- Don't strike-through *clearly time-stamped findings* about a version
  that has moved on (\"As of SHA X, behaviour was Y\"). The original
  is correct for its pinned point.
- Don't strike-through *first-impression Tier-3 commentary* — interpretation
  is signed and dated; new interpretation goes in a new entry, not a
  rewrite of the old one.

The strike-through pattern is for *factually wrong descriptive claims*
where a future reader would otherwise be misled.

Before declaring a research artefact complete:

- [ ] Tier 1+2 content lives in descriptive artefacts; Tier 3 content lives
      in analytical artefacts; embedded Tier 3 inside Tier 1+2 artefacts is
      labelled
- [ ] Descriptive artefacts contain no "trade-off"/"unusual"/"I think"/
      "good/bad" language
- [ ] Analytical artefact opens with explicit Tier 3 banner
- [ ] Default-mode entries use terse structured format; paragraph-form is
      used only for entries that genuinely need argument
- [ ] No phrases like "Implications for our system" / "It's worth noting that"
      survive in descriptive artefacts
- [ ] If the task was large, a plan artefact existed before execution began
- [ ] If the work is comparative, ≥2 descriptive passes existed first
- [ ] Cross-subject references appear only in comparative artefacts, never in
      descriptive ones

## Pitfalls

1. **Letting Tier 3 leak into Tier 1+2 artefacts because "it's just one
   sentence".** One sentence becomes the precedent; the next entry adds two;
   within a probe the artefact is contaminated. Hold the line.

2. **Writing paragraph-form by default and tightening later.** Tightening
   later rarely happens. Write terse first; expand only entries that demand it.

3. **Skipping the scaffolding pass on "this won't take long" tasks.** You're
   usually wrong about the size; even when you're right, the plan artefact
   takes 5 minutes and prevents the failure mode.

4. **Doing comparative work in a descriptive artefact "just this once".**
   Just this once becomes the pattern.

5. **Treating these rules as guidelines.** They're rules. The artefacts that
   ignore them are the ones that don't get used.

## Where these rules came from

These rules were extracted from the methodology friction notes accumulated
during the Honcho nanoprobe (2026-05-24). Each rule corresponds to a
load-bearing failure mode caught during real work:

- **Tier separation** — the original `02-code-trace.md` mixed prober-journal
  with reader-overview; readers couldn't tell what was fact vs interpretation
- **Signal density** — early assessment file was 14x larger than needed
- **Scaffolding** — first subagent delegation read source for 10 minutes
  and wrote nothing; methodology had no "produce a plan first" step
- **Two-pass discipline** — early architecture map drifted toward
  "trade-offs" language; cross-substrate comparison crept into Tier 3
  assessment as "most agent-memory systems we surveyed…"

The methodology is grounded in real failure, not theory.
