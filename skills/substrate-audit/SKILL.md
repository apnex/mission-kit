---
name: substrate-audit
description: "Use when you need a deep, code-grounded, evidence-triangulated audit of a single open-source repository — the per-repo descriptive pass that feeds later cross-substrate analysis. Produces a self-contained per-substrate folder with summary, architecture map, goal mapping, prober assessment, sources, and one file per feature, each feature triangulated across claim, doc, and source. Enforces a three-tier knowledge discipline (Tier 1 claim / Tier 2 source / Tier 3 analysis) so future readers can reuse the output without re-probing."
when_to_use:
  - User asks for a deep evaluation of a single OSS project (substrate, library, framework, service)
  - You are building a substrate corpus where each entry will later be compared across a domain
  - L1 survey-level information (stars, README one-liner) is insufficient and you need to know what the code actually does
  - Output is intended to live in a documentation repo (e.g. apnex/kate) as a reusable evidence corpus
when_not_to_use:
  - You only need a one-line summary or feature comparison → use survey/landscape-style notes
  - You are doing cross-substrate analysis across multiple already-probed substrates → that is a separate downstream pass (crossprobe / TBD), not nanoprobe
  - You are evaluating a deployment, not a project → use operational runbook patterns instead
  - The brief is forward-looking ("what should we build") → use writing-plans / plan / spike
related_skills: [research-artefacts, brief-driven-research, codebase-inspection, writing-plans]
---

> **Foundational dependency:** this skill builds on `research-artefacts`,
> which defines the four generic discipline rules (tier separation, signal
> density, scaffolding before execution, two-pass discipline) that all
> persistent research artefacts must follow. Load `research-artefacts`
> first if you don't already have those rules in working memory. This
> skill adds OSS-audit-specific shape on top.

# nanoprobe — per-repo deep audit

## Overview

`nanoprobe` is the **descriptive, per-repo pass** of a multi-stage OSS research
methodology. One nanoprobe = one repository = one substrate's own feature list,
characterised on its own terms with evidence triangulated across **claim** (what
the project says about itself), **doc** (how it's documented), and **source**
(what the code actually does).

A nanoprobe output is **self-contained and substrate-scoped**. It does NOT
compare against other substrates, does NOT reconcile feature names against an
abstract taxonomy, and does NOT attempt to map features to other projects'
vocabulary. That cross-cutting analysis is a separate downstream pass
(`crossprobe` — TBD) that consumes N nanoprobe outputs and produces
higher-order comparative artefacts.

Keep the boundary clean: **describe here, compare elsewhere.**

## Core principles

1. **One repo per probe.** Pick the canonical upstream repository. Satellite
   repos (client SDKs, docs sites, examples) are cited in `sources.md` only —
   never code-traced. Monorepo exception: if the substrate lives as one
   package inside a monorepo, scope the probe to that package's directory.
2. **Substrate-native vocabulary.** Name features what the project itself calls
   them. If the project calls it "dialectic", the file is `dialectic.md`, not
   `derived-memory.md`. Renaming is crossprobe's job.
3. **No cross-substrate references.** A nanoprobe output cannot say "similar
   to X" or "Y does this differently" — **anywhere, including in Tier 3
   assessment**. Even caveated comparisons contaminate the descriptive pass
   and pre-empt crossprobe's job. The rule applies uniformly across all
   artefacts in the nanoprobe output. When you spot a comparison creeping
   in (especially in Tier 3 entries phrased as "most substrates of this
   kind…" or "this is unusual because most projects…"), park it as a
   crossprobe TODO and rewrite the entry in pure substrate-scoped terms.
4. **Triangulation required for every feature.** Each feature spec must cite
   claim + doc + source. Mismatches between the three are *findings*, not
   failures — write them up.
5. **Depth floor: L3 (code probe).** A nanoprobe always reads the actual
   source for every feature. README and docs are not enough.
6. **Reproducibility.** Every URL, commit SHA, file path, and retrieval date
   is recorded in `sources.md`. A future operator must be able to redo the
   probe and either confirm or detect drift.

## Rung definitions (where nanoprobe sits)

| Rung | Action | Per-substrate output |
|---|---|---|
| L1 | Triage / survey | row in domain-level landscape doc |
| L2 | Doc walk — enumerate advertised features | (folded into L3 for nanoprobe) |
| **L3** | **Code probe — trace core paths, map every feature to source** | **nanoprobe output (this skill)** |
| L4 | Behavioural probe — stand up + run scenario suite | separate post-nanoprobe pass |
| L5 | Comparative benchmark — scenario suite across shortlist | crossprobe / benchmark skill |

L2 collapses into L3 in practice — when you're reading source anyway, you read
docs simultaneously. Don't produce a separate L2 artefact; just ensure both
claim and doc evidence are captured per feature.

See `references/rung-definitions.md` for full criteria.

## When you start a probe

User input must include:

- **Substrate name** (slug — lowercase, hyphens; matches the folder name)
- **Canonical repository URL** and the **commit SHA / tag** to probe (pin a
  specific commit; "main" is not reproducible)
- **Domain folder** where the output lives (e.g. `kate/docs/memory/`)
- **Goals doc reference** (e.g. `kate/docs/memory/00-goals.md`) — used for the
  goal-mapping artefact

If any of these is missing, ask before probing. Do not guess.

## Output structure

Every nanoprobe produces this exact tree:

```
<domain>/<substrate>/
├── 00-summary.md          ← Tier 3 abstract — distilled findings, written LAST
├── 02-architecture.md     ← Tier 1+2 — substrate-shaped descriptive map
├── 03-mapping.md          ← Tier 3 — how this substrate addresses domain goals
├── 04-assessment.md       ← Tier 3 — probe analysis: trade-offs, gotchas, gaps
├── sources.md             ← reproducibility — every URL, SHA, path, date
└── features/              ← Tier 1+2 — one file per feature
    ├── <feature-1>.md
    ├── <feature-2>.md
    └── ...
```

There is no `01-features.md`. Features live one-per-file in `features/`. This
is the critical unit of comparison for later analysis — keep each file
substrate-scoped, self-contained, and named in the substrate's own vocabulary.

**Tier discipline (load-bearing — see `references/tier-discipline.md`):**

- **Tier 1 (claim)** — the substrate's own self-description; cited from
  README / docs / maintainer-authored guides
- **Tier 2 (source)** — file:line citations at the pinned SHA; verifiable
  facts about the code
- **Tier 3 (analytical)** — the prober's interpretation; trade-offs, gotchas,
  alignment with goals; signed and dated

Tier 1+2 artefacts (`02-architecture.md`, `features/*.md`) are **descriptive
only** — no "trade-offs", no "I think", no "this is unusual because". Tier 3
content goes in `04-assessment.md` (open-ended) or `03-mapping.md` (goal-bounded)
or `00-summary.md` (final synthesis). When Tier 3 appears inside a Tier 1+2
artefact (e.g. "Behaviour notes" in a feature spec), label it explicitly.

**Why `02-architecture.md`, not `02-code-trace.md`:** the artefact is for
future readers, not the prober's reading journal. Document the substrate as
the substrate organises itself (subsystems, primitives, runtime topology,
storage tiers, pluggable surfaces) — not as you happened to traverse it. The
3-5 code paths from the probe plan are EXECUTION SCAFFOLDING; the
ARCHITECTURE MAP is the persistent knowledge. Code paths drive your reading
order during step 5; the architecture map is the deliverable.

See `templates/` for fillable templates of each file.

## Per-feature spec format

Every file in `features/` follows this shape (OpenSpec-inspired
Requirement+Scenario format, adapted for substrate description):

```markdown
# Feature: <substrate-native-name>

**Substrate:** <substrate> <version-or-sha>
**Category:** <Storage | Derivation | Retrieval | Lifecycle | Surface | Identity | Ops | Extensibility | Other>
**Triangulation:** ✓ Triangulated | ⚠ Partial | ✗ Single-source
**Last probed:** YYYY-MM-DD

## What it is
One paragraph in the substrate's own terms. No comparison to other substrates.

## Requirement
The system SHALL <observable behaviour, present-tense, single sentence>.

## Scenarios
### Scenario: <descriptive name>
- GIVEN <precondition>
- WHEN <trigger>
- THEN <observable outcome>
- AND <additional outcome>

(Multiple scenarios per feature when the behaviour has distinct branches.)

## Evidence
| Type | Reference |
|---|---|
| Claim | <quoted text or section> — <URL>, retrieved <date> |
| Doc | <doc section / API field> — <URL or path> |
| Source | <file:line-range> @ commit <SHA> |

## Behaviour notes
- Bullet points capturing what the code actually does that the docs don't say
- Default values discovered in code
- Edge cases / surprises / undocumented limits
- Gaps between claim and source (if triangulation is partial)

## Configuration surface
Optional. List config knobs that affect this feature, with default values
discovered in source. Cite source per knob.
```

See `templates/feature.md.tmpl` for the canonical version.

## Behaviour notes — scope contract

"Behaviour notes" is the ONLY place Tier 3 commentary is allowed inside a
feature spec. Its scope is **strictly limited to behaviour of THIS feature**:

- **Allowed:** race conditions, edge cases, defaults that matter, observable
  patterns, undocumented limits, gaps between claim and source, surprising
  behaviour the source reveals
- **Forbidden:** cross-cutting interpretation ("implications for our system",
  "this affects how we should…"), strategic recommendations, comparisons to
  other features in the substrate, anything that reads as broader analysis

**Cross-cutting interpretation lives in `04-assessment.md` with a back-
reference from the feature spec** — e.g. `See 04-assessment.md §A8 for the
implications of this finding for downstream usage`.

The behaviour-notes section is a tightly-scoped Tier 3 sidecar to feature
description, not a mini-essay. If a note is longer than 2-3 sentences, ask:
does this describe behaviour of this feature, or am I analysing the
substrate? If the latter — move it.

## Scenarios — observable behaviour, not implementation

Scenarios describe what an OBSERVER of the running system would see — not
what the code does step-by-step internally. The distinction matters for
artefact longevity: implementation-detail scenarios rot when the substrate
refactors; observable-behaviour scenarios survive.

**Good (observable):**
```
- GIVEN reasoning.enabled = false in resolved config
- WHEN the batch processor is invoked
- THEN the function returns without making any LLM call
```

**Bad (implementation):**
```
- WHEN process_representation_tasks_batch is invoked
- THEN messages are sorted by id, formatted via format_new_turn_with_timestamp
- AND minimal_deriver_prompt(peer_id, messages) is constructed
- AND honcho_llm_call is made with response_model=PromptRepresentation, json_mode=True...
```

The bad version reads the source back at you. If Honcho renames
`format_new_turn_with_timestamp`, the scenario breaks — but the actual
behaviour (messages get formatted) hasn't changed.

**Rule:** scenarios describe outcomes — telemetry events emitted, side
effects observable from outside the function, return values, persisted
state changes, errors raised, log messages produced. Implementation
details (which internal helper is called, what arguments it receives,
what order private methods run) go in the **Evidence** table, not in
Scenario lines.

## Signal-density discipline (assessments and summaries)

`04-assessment.md` and `00-summary.md` default to **terse structured
entries**, not paragraph prose. Paragraph form is reserved for ≤2-3 entries
per artefact that genuinely need argument.

Default format for assessment entries:

```
A{N} ({date}) — {one-sentence claim with citation}.
{One-sentence implication}. {Action if any}.
```

Reserve paragraphs for: structural arguments with multiple linked claims,
the load-bearing finding of the whole probe, or corrections to prior
published claims that need context to be fair.

See `research-artefacts` §"Rule 2: Signal density" for the full discipline
including phrases to strip.

For the memory-substrate domain, the working categories are:

- **Storage** — vector, graph, KV, tiered, hybrid
- **Derivation** — none, extract, reflect, dialectic, consolidate
- **Retrieval** — semantic, temporal, hybrid, re-rank
- **Lifecycle** — TTL, decay, merge, rewrite, archive
- **Surface** — REST, SDK, MCP, library
- **Identity** — per-user, per-session, per-peer, multi-tenant
- **Ops** — deploy, scale, backup, observability
- **Extensibility** — plugins, hooks, custom embedders, model swap

Categories are **labels for in-substrate organisation**, not abstractions.
Two substrates having a feature in the same category does NOT mean they
implement the same thing — only crossprobe is allowed to assert equivalence.

For non-memory domains, define a new domain-appropriate taxonomy at the start
of the first probe in that domain and record it in the domain's index doc.

## Triangulation status definitions

Four statuses — choose the one that fits, not the prettiest one:

- **✓ Triangulated** — all three of claim, doc, source present and consistent.
- **⚠ Partial** — at least two of three present, with no documented
  inconsistency. Typical: claim + source agree, doc is missing or stale.
- **⚠ Mismatch** — all three present, but the docs/claim actively
  describe behaviour different from what the source does. This is a
  *finding*, not a failure. MUST be called out in the feature spec's
  Behaviour notes AND surfaced in `04-assessment.md` as a dated assessment.
  Example from a real probe: docs describe the deriver as producing
  explicit + deductive observations; source shows the production prompt
  only requests explicit. Three sources present, claim contradicts source
  — that is `⚠ Mismatch`, not `⚠ Partial`.
- **✗ Single-source** — only one of claim, doc, or source present. Flag
  explicitly: source-only = undocumented behaviour; claim-only = vapourware
  or unimplemented promise.

A feature with **only claim and no source** is not a feature for nanoprobe
purposes — record it as "claimed, not found in source" in `00-summary.md`
under "Findings" rather than creating a feature file. Future re-probes may
upgrade it.

**Do not invent new statuses.** If you find yourself reaching for
"⚠ Significant" or "⚠ Major" or similar, you've spotted a `⚠ Mismatch`
and the right action is to use that status and write up the contradiction
in detail in Behaviour notes + assessment, not to invent a new severity
level. The taxonomy is fixed; severity lives in the prose.

## Probe workflow

1. **Confirm scope.** Resolve the canonical repo, pin the commit SHA / tag,
   verify the domain folder exists, locate the goals doc. Create the output
   folder skeleton with empty files using the templates.

2. **Survey the repo structure AND verify license.** Use
   `search_files(target='files')` to map the top-level layout. Use
   `codebase-inspection` (if available) for LOC by language. **Read the
   actual `LICENSE` file at the pinned SHA** — do not trust prior surveys,
   landscape docs, or the project's marketing copy. License determines
   downstream sovereignty / portability assessment (especially for G7-style
   portability goals); a wrong license at L1 contaminates the whole
   evaluation. Record top-level layout AND verified license in
   `00-summary.md` under "Scope".

3. **Read README + docs in one pass.** Don't summarise yet — note every claim
   that smells like a feature. Capture URLs + section anchors as you go for
   `sources.md`. Also capture: substrate-native vocabulary (primitive names,
   subsystem names, anything that's an internal term of art) — you will use
   this vocabulary for feature names in step 6.

4. **Scaffolding pass — write the probe plan BEFORE any L3 reading.**
   This is a distinct deliverable, not just a mental note. Produce a
   `probe-plan.md` (working doc, not committed) containing:
     - The **3-5 code paths** you intend to trace, named, with the files
       each path will visit
     - A **provisional feature inventory** — names + categories only, no
       triangulation, no source refs yet (expect ~20 entries; ~12-15 will
       survive). **Treat this as a rough estimate, not a contract.** The
       inventory adjusts on the fly as reading reveals features the L1
       survey couldn't see (see step 6.5 — end-of-batch scope-gap scan).
     - **Explicit in-scope / out-of-scope declaration with rationale.**
       Name what the probe IS characterising (typically: conceptual
       model, named subsystems, primary data flows, pluggable surfaces)
       and what it is NOT characterising (typically: framework
       infrastructure layers like LLM/embedding clients, cache layer,
       telemetry, web framework routers, auth, generic utilities). The
       rationale is usually \"this probe answers 'what is X conceptually
       as a substrate' — infrastructure layers are uniform-ish across
       Python web services and don't shape the substrate's identity\".
       Without this declaration, the probe drifts: every directory the
       prober opens becomes an implicit obligation. With it, the prober
       (and any reader) can tell whether a missing topic was a deliberate
       skip or an oversight.
     - **Substrate-native vocabulary lock** — the terms you'll preserve
     - **Notable absences to look for** — explicit list of things you
       expect to find but haven't yet
     - **TODOs for crossprobe** — comparison temptations parked here
   Writing the plan up front forces commitment, prevents drift, and gives
   delegated subagents a contract to execute against. Skipping this step
   is the failure mode that causes subagents to read source forever and
   write nothing — see `references/execution-strategy.md`.

5. **Read code along your 3-5 paths and produce `02-architecture.md`.** The
   code paths are your READING ORDER, not the output structure. As you read,
   write the substrate's architecture as the substrate organises itself:
   runtime topology, named subsystems, data primitives, configuration, storage
   tiers, pluggable surfaces. Cite every claim — either Tier 1 (`[claim: ...]`,
   `[doc: ...]`) or Tier 2 (`[code: file:line]`). **Strip all Tier 3
   interpretation** (trade-offs, gotchas, "I think") from this file — that
   content goes in `04-assessment.md`. Write incrementally — finish each
   section before starting the next. Incremental writes survive timeouts;
   batched end-of-task writes do not.

   **Reading technique for large files: docstrings + signatures first,
   not line-by-line.** For files above ~300 LOC, start by reading the
   module-level docstring, the entry-point function docstring, the class
   `__init__` signatures, and `search_files` for `^class |^def |^async def`
   to get the public surface. This alone usually answers 70% of architectural
   questions and tells you which 50-100 line slice is actually load-bearing.
   Only descend into line-by-line reading for the slice that needs it.
   Reading a 957-line file end-to-end produces no architectural insight
   beyond what the docstring + signatures already gave you, and burns
   30% of your budget per file. Architecture lives in the seams between
   functions, not inside their bodies.

6. **For each discovered feature, write a `features/<name>.md` file.** Use
   the template. Triangulate as you go. Fill the Evidence table with concrete
   references, not "see docs". If you can't triangulate, document why in
   "Behaviour notes" and set status to ⚠ or ✗. Use the substrate-native
   vocabulary locked in step 3. **"Behaviour notes" is the only section
   where Tier 3 commentary is allowed inside a feature spec — label it as
   such if it veers into interpretation rather than observation.**

6.5. **End-of-batch scope-gap scan.** At the end of each feature-spec batch
   (typically 3-5 specs written together), pause and scan for **features
   that appeared in source but not in your spec list**. The L1 survey is
   never exhaustive — reading source surfaces things the docs didn't name.
   For each gap, decide explicitly:

   - **Inline-mention** — the gap is a sub-component of a parent spec
     you're already writing (e.g. `dream_scheduler.py` as a sub-component
     of the `dreamer` spec). Add a Behaviour note in the parent spec
     calling out its existence and that it isn't separately characterised.
   - **Sub-spec** — the gap is load-bearing enough to deserve its own
     feature spec. Add it to the inventory and write it in the current
     or next batch.

     **Promotion heuristic:** a sub-component warrants its own spec when
     it meets **two or more** of these criteria:
       1. Owns its own config namespace (a dedicated settings class /
          config block, not just a couple of knobs on a parent class)
       2. Lives in its own source file >300 LOC, OR its own subdirectory
       3. Implements a non-trivial algorithm (multiple strategies,
          pluggable backends, computed mathematics) rather than glue code
       4. Is independently configurable on/off — operators interact with
          it as a distinct capability, not as an implementation detail
     One criterion alone = inline-mention. Two+ = promote. Three+ = the
     fact that you nearly missed it is itself a finding worth noting.
     Example from the honcho probe: surprisal sampling met all four
     (own `SurprisalSettings`, own 492-LOC file + 7-file `trees/`
     subdir, geometric tree algorithm with 7 backends, `ENABLED=False`
     toggle). Initially filed as a dreamer sub-component; promoted to
     `features/surprisal.md` after user-driven scope check.
   - **Defer to crossprobe** — the gap is infrastructure that doesn't
     shape the substrate's identity (LLM client, cache, telemetry). Note
     it as out-of-scope per the Step 4 scope declaration; cross-reference
     the declaration.
   - **Open assessment** — the gap is something you can't decide yet.
     Capture it as an open `04-assessment.md` entry with the question
     and what evidence would resolve it.

   Without this scan, gaps accumulate silently and the final probe quietly
   under-claims its coverage. The scan also produces good closing-pass
   material: \"here's what I deliberately didn't cover and why\" is more
   valuable to a reader than implicit silence.

   The provisional inventory from Step 4 is a rough estimate. By the end
   of the probe, it has typically (a) lost 2-5 entries that proved
   non-substantial, (b) gained 1-3 entries discovered mid-probe, and
   (c) inlined 3-5 sub-features into parent specs. This is normal —
   the scan makes the adjustment explicit rather than ad-hoc.

7. **Write `04-assessment.md` as you go.** This is the prober's voice —
   trade-off interpretation, surprising findings, operator gotchas, suspicious
   gaps, things that don't fit the descriptive shape of architecture or the
   goal-bounded shape of mapping. Each entry is dated and labelled Tier 3.
   Seed it with corrections to prior surveys (e.g. license discrepancies),
   structural asymmetries (e.g. one subsystem in `utils/` while others have
   top-level dirs), and vocabulary smells (e.g. public-API-name vs
   code-symbol-name mismatches). Open assessments (questions to resolve
   during feature-spec writing) are also captured here; resolve them as
   evidence accumulates. See `references/tier-discipline.md` for the full
   contract. **At end of each batch and during the closing pass, apply
   the analytical lenses from `references/substrate-analysis-lenses.md`
   to surface load-bearing Tier 3 findings that the descriptive pass
   misses (writer-cadence, provenance chain, abstraction completeness,
   classification smells, aspirational-vs-implemented gaps, cost
   asymmetries).**

8. **Write `03-mapping.md`.** For each goal in the domain's goals doc, write
   one paragraph: how this substrate addresses (or fails to address) that
   goal. Cite specific feature files. This is the only artefact that
   references the goals doc; feature files do not. This is Tier 3 — it is
   interpretation of source-anchored facts against the goals — but bounded
   by the goal list.

9. **Verify `sources.md` is complete.** Every URL touched, every commit SHA,
   every file path with line ranges, every retrieval date. A future probe at
   the same SHA must be able to reproduce the work.

10. **Write `05-coverage.md` BEFORE the summary.** This artefact reconciles
    the L1 provisional inventory (from Step 4) against what actually got
    specced, what got inlined, what got explicitly deferred, and what
    remains as open questions. Without it, a future reader cannot tell
    whether a missing topic was deliberate scoping or oversight.

    Required sections:
      - **Planned vs delivered** — L1 inventory beside final spec list, with
        delta annotations (added mid-probe / inlined into parent / dropped
        as non-substantial).
      - **Inlined sub-features** — components mentioned within parent specs
        but not separately characterised, with one-line rationale each
        (e.g. "`dream_scheduler.py` — trigger logic for dreamer cycles,
        inlined into `dreamer.md` Behaviour notes; would warrant own spec
        if cadence tuning becomes operationally important").
      - **Deliberately deferred (out-of-scope)** — infrastructure layers
        the probe skipped per the Step 4 scope declaration (LLM provider
        abstraction, cache layer, telemetry, web framework, etc.), with
        per-item rationale. This is the persistent home for the
        defer-decisions made during each end-of-batch scope-gap scan
        (Step 6.5).
      - **Open assessments still unresolved** — questions captured in
        `04-assessment.md` that the probe could not resolve, with what
        evidence would resolve them.
      - **Coverage caveat** — explicit statement of what kind of map this
        probe produces (typically: "conceptual substrate map" — the named
        subsystems, primary data flows, pluggable surfaces) vs what it
        does not (typically: "complete codebase inventory" — every file,
        every helper, every framework integration).

    The coverage artefact makes scoping choices auditable. Without it,
    silent gaps accumulate and the probe quietly under-claims its
    own coverage.

11. **Write `00-summary.md` LAST.** Like a paper abstract — distil findings,
    call out anything surprising, list features that fell into ⚠ / ✗
    triangulation status, note features the docs claim but the code doesn't
    appear to implement, AND include the verified license, AND include any
    TODOs deferred to crossprobe. Cite the other artefacts rather than
    restating them. Reference `05-coverage.md` for scope decisions rather
    than restating them.

12. **Commit and push from the host where the repo lives.** Commit message:
    `<domain>: nanoprobe <substrate> @ <short-sha>`.

## Multi-pass meta-process (load-bearing — read this section)

The probe workflow above describes a linear sequence, but a real nanoprobe
of a non-trivial substrate is NEVER single-pass. Treating the workflow as
"do steps 1-12 once and you're done" produces under-promoted features,
stale Tier 3 framing, and missed cross-feature lenses. The substrate is
larger than your working memory; depth-of-understanding builds in waves;
each wave reveals what the previous wave couldn't see.

Codify the probe as **five explicit passes**, each with a distinct purpose:

### Pass 1 — Sweep (descriptive coverage)

Steps 1-6 of the workflow, executed in batches. Produces the bulk of the
feature specs: substrate-native vocabulary, claim+doc+source triangulation,
behaviour notes scoped to each feature. Goal is **coverage** — every
advertised feature has a spec, every code path has been read at least once.

End-of-pass-1 checkpoint: provisional inventory from step 4 versus delivered
specs. Discrepancies trigger pass 1 extensions (batches 2, 3, 4 of feature
specs in the same shape).

### Pass 2 — Triangulation (evidence depth)

For every feature spec written in pass 1, audit the Evidence table:
- Every Source citation resolved at the pinned SHA?
- Every claim cross-referenced to a doc citation (not just README)?
- Mismatches (`⚠ Mismatch`) called out in Behaviour notes AND added to
  `04-assessment.md` as dated entries?
- Triangulation status set on every feature (`✓` / `⚠ Partial` / `⚠ Mismatch`
  / `✗ Single-source`)?

This pass is usually fast (10-15% of pass 1 time) but catches the silent
"I assumed the doc said X but it doesn't" failure mode that contaminates
downstream analysis.

### Pass 3 — Promotion audit (structural depth)

For every Source citation in every feature spec, apply the 4-criterion
promotion heuristic from step 6.5:
1. Owns its own config namespace?
2. Lives in own file >300 LOC OR own subdirectory?
3. Non-trivial algorithm (multiple strategies, pluggable backends, computed
   math) rather than glue code?
4. Independently configurable on/off (operators interact with it as a
   distinct capability)?

2+ criteria = promote to its own feature spec. 3+ criteria = the fact you
nearly missed it is itself a finding worth recording. This pass is what
catches the "I cited `src/big_file.py` in three different feature specs but
never made it its own spec" failure mode (pitfall #22). It typically
promotes 2-4 hidden features per substrate; for substrates above 5k LOC
expect 3-5 promotions.

**Critical: this pass enumerates EVERY Source row in EVERY Evidence
table, not just gaps you haven't cited yet.** The in-batch scope-gap
scan (step 6.5) is biased toward catching unmentioned components; the
retro-audit pass 3 is specifically for re-evaluating components already
mentioned in passing. Empirically (honcho v3.0.7 retro-audit, D.1) this
pass surfaced 3 promotions that the in-batch scan missed — all of them
were already cited as Source rows in parent specs but never got their
own characterisation. The pattern: the in-batch scan sees "I mentioned
it, so it's covered"; the retro-audit asks "is the mention adequate, or
does the cited thing meet promotion criteria in its own right?".

When a promotion happens, back-patch every parent spec that cited the
promoted file: add a `## Scope split` section that says "this spec covers
X; the promoted concern lives in `features/<new>.md`". This prevents
overlap and keeps each spec single-purpose.

### Pass 4 — Synthesis (cross-feature lenses)

For each feature spec, apply the analytical lenses from
`references/substrate-analysis-lenses.md` (writer-cadence, provenance
chain, abstraction completeness, classification smells, aspirational-vs-
implemented gaps, cost asymmetries, plus the locus-of-enforcement,
operator-impact, failure-mode, structural-criticality, and cross-feature-
invariant lenses).

For each lens, ask: does this feature spec have at least one Tier 3 bullet
that uses this lens? If a spec has thin Tier 3 (≤3 bullets, all narrowly
scoped to in-feature behaviour), add one cross-feature lens bullet that
connects this feature to other features in the substrate. The output of
this pass is **denser cross-feature linkage in Tier 3** — readers can
navigate from any spec to related specs via the analytical bullets, not
just via the Evidence table.

### Pass 5 — Reconciliation (closing pass)

Steps 7-11 of the workflow, executed AFTER passes 1-4 are complete:
- `04-assessment.md` — backfill cross-cutting findings from passes 2-4
- `03-mapping.md` — goal-by-goal evaluation citing the final spec set
- `05-coverage.md` — planned-vs-delivered, inlined, deferred, open
  assessments, coverage caveat (per step 10)
- `00-summary.md` — final distillation referencing the other artefacts

This pass is where the probe earns its keep as a reusable artefact. Without
it, the feature specs sit as a pile; with it, future readers can navigate
the probe top-down from the summary, decide which features to read, and
return to the assessment for "what should I worry about".

### Retro-audit (optional but recommended for non-trivial probes)

After pass 5, run a retro-audit on passes 1-3:
- **Promotion-heuristic backward-application**: re-run pass 3 against the
  final spec set, looking for promotions that the in-pass scan missed
- **Tier-3-leak pass**: scan every feature spec's "What it is" / Requirement
  / Evidence sections for Tier-3 analytical framing that should be in
  Behaviour notes
- **Signal-density pass**: re-read every Tier 3 bullet — is it terse,
  cited, and load-bearing? Compress prose bullets that say one thing in
  three sentences.

The retro-audit catches the "stability bias" failure mode: once a spec is
written, you stop questioning it. The audit forces a fresh pass against
the same criteria the spec was written under, often revealing 1-2 hidden
issues per spec. Worth the 10-15% extra budget for any probe you intend
to publish or re-use.

### Anti-pattern: collapsing passes

The temptation is always to merge passes — "I'll do triangulation and
promotion at the same time", "I'll write Tier 3 lenses while I'm writing
the spec". Don't. Each pass uses a different cognitive frame:
- Pass 1 = descriptive
- Pass 2 = evidence-auditing
- Pass 3 = structural-classification
- Pass 4 = analytical-synthesis
- Pass 5 = reconciliation

Switching frames mid-spec produces shallow output in both frames. Run
each pass to completion across the whole spec set before starting the
next pass. The 5-pass discipline is the load-bearing process; the
workflow steps are the execution scaffolding within each pass.

### Decision: full format conversion vs targeted compression (D.2-style)

When a retro-audit pass reveals format drift across the spec corpus
(some specs in a tight Tier-1/2/3 §A/§B/§C layout, others in the older
verbose Gherkin-scenario layout), you face a binary:

- **Option X — Convert all specs to the tight format.** Pro: format
  consistency, easier cross-spec navigation, Tier-3 leaks become
  structurally impossible. Con: high rewrite volume (typically
  ~600 LOC for 8 specs), and the Gherkin scenarios — which seed
  executable tests / behavioural probes — are lost or have to be
  reconstructed.
- **Option Y — Keep both formats; do targeted compression + Tier-3-leak
  audit on the verbose ones.** Pro: preserves scenario seeds (real
  downstream value for behavioural probes), much lower edit volume.
  Con: mixed format across the corpus stays.

**Default to Option Y unless the user explicitly wants format unification.**
Scenario seeds are load-bearing for L4 (behavioural probe) work and
crossprobe testability comparisons; losing them to chase format uniformity
trades a concrete asset for a navigational nicety. If you pick Y, surface
the choice and the reversal cost explicitly in `04-assessment.md` or
`05-coverage.md` so a future operator can switch to X if cross-spec
navigation pain shows up. Honcho v3.0.7 D.2 pass took this shape: 7 specs
compressed, scenarios preserved, format drift accepted.

## Output discipline

- **Cite inline, not in a trailing bibliography.** `[code: src/foo.py:42]`,
  `[doc: docs/api.md §Retrieval]`, `[claim: README §Features]`. Inline
  citations let a reviewer verify a single claim without scrolling.
- **No prose without evidence.** If you assert behaviour, cite the source
  file:line that demonstrates it. "The system uses Postgres" needs a citation.
- **Mark assumptions explicitly.** "ASSUMED default — verify by running X"
  is acceptable; silently asserting a value you didn't verify is not.
- **Preserve substrate vocabulary.** If the project calls something "the
  deriver", call it "the deriver" in your output. Don't translate to
  "the background worker" — translation is loss.

## Pitfalls

1. **Reading docs and stopping there.** L3 floor means you read source for
   every feature, every probe. Docs lie, omit, or lag. Source is the only
   load-bearing evidence for behaviour.

2. **Naming features with abstract / cross-substrate language.** Tempting,
   especially after the first few probes when patterns emerge — DON'T.
   Substrate vocabulary keeps the output substrate-scoped. Abstraction is
   crossprobe's job.

3. **Comparing across substrates.** No "unlike X" or "similar to Y" sentences
   anywhere in nanoprobe output. Such sentences contaminate the descriptive
   pass with comparative bias and pre-empt crossprobe.

4. **Pinning to "main" instead of a SHA.** Outputs become unverifiable the
   moment upstream pushes. Always pin a tag or commit SHA up front and
   record it in `00-summary.md` AND every Evidence row.

5. **Probing multiple repos in one nanoprobe.** One repo per probe. If the
   substrate spans an ecosystem, pick the canonical one and cite satellites
   in `sources.md` without code-tracing them.

6. **Skipping the goals mapping.** `03-mapping.md` is what makes the probe
   useful for the user's specific deployment. Don't skip it because the
   substrate looks irrelevant — explicit "does not address G4" findings are
   valuable.

7. **Writing the summary first.** The summary is a distillation of what
   you found. Writing it first anchors you to conclusions you haven't earned.
   `00-summary.md` is always the LAST file written.

8. **Subagent delegation that loses context.** If you delegate the probe to a
   subagent, pass: the canonical repo URL + pinned SHA, the domain folder
   path, the goals doc content (or path + verified-readable), the output
   templates, the substrate vocabulary you want preserved, the probe plan
   from step 4 (or instruct the subagent to produce one first), and an
   explicit "no cross-substrate references" constraint. Subagents currently
   don't inherit memory, so any of these omitted = contaminated output.

9. **Skill loader is cached at session start — including for subagents
   spawned in this session.** A skill created or patched mid-session is NOT
   visible via `skill_view` or `skills_list` for the rest of the session,
   nor for any subagent spawned from it. If you must use a fresh / patched
   skill before session-end, INLINE the SKILL.md + references + templates
   into the subagent prompt rather than telling it to call `skill_view`.
   Plan for this when you patch a skill you intend to use immediately.

10. **Skipping the scaffolding pass (step 4).** Diving from "I read the
    docs" straight to "I'm reading source" produces unbounded code-reading
    and zero written output. The probe plan is what bounds the work.
    Without it, subagents (and you) burn the entire budget on reads.

11. **Assuming license / metadata from prior surveys.** L1 landscape docs
    are not authoritative for license, version, or scope. Always re-verify
    by reading `LICENSE` and `pyproject.toml`/`package.json`/equivalent at
    the pinned SHA in step 2. Surveys lie; SHAs don't.

12. **Treating absence of a feature as absence of evidence.** If a substrate
    does NOT have derivation, record that finding in `00-summary.md` under
    "Notable absences". Crossprobe relies on knowing what's absent, not just
    what's present.

13. **Over-tracing or arbitrary path-count.** 3-5 core paths is the
    target *range*, not a default. Don't pick 5 because the range allows
    it; don't pick 3 because it sounds tidy. **Paths trace architectural
    SEAMS — places where data crosses a boundary between subsystems
    (queue → worker, sync → async, write → read, foreground → background).
    Pick the natural seam count for THIS substrate.** For a substrate
    with N major subsystems, paths are usually N-1 (when two subsystems
    share one seam) or N (when each subsystem owns one seam), rarely
    N+1. If your paths overlap (Path A and Path B end up reading the
    same files) or fake-split a single causal chain (Path A enqueues,
    Path B dequeues, both narrate the same flow), collapse them.
    Tracing every code path in a large repo produces unreadable output
    and burns the budget. Pick paths that anchor the *advertised*
    behaviour; everything else is feature-spec evidence (cite file:line
    in the feature file, no narrative needed).

14. **Treating large substrates as single-shot work.** Substrates above
    ~5k LOC or ~10 subsystems don't fit a single subagent budget. Decompose
    along the 3-5 code paths from step 4 — scaffolding shot, parallel
    path shots, synthesis shot. See `references/execution-strategy.md`.

15. **Conflating Tier 1+2 (descriptive) with Tier 3 (analytical) in the
    same artefact.** This is the most insidious failure mode. The original
    `02-code-trace.md` design mixed "here's the code path I read" (Tier 3
    journal of the prober) with "here's what the substrate is" (Tier 1+2
    description) — readers couldn't tell what was fact vs interpretation.
    Fixes: (a) `02-architecture.md` is descriptive ONLY — substrate-shaped,
    source-cited, no interpretation; (b) `04-assessment.md` carries ALL
    open-ended prober commentary, signed and dated; (c) when Tier 3 appears
    inside a Tier 1+2 artefact (e.g. feature spec Behaviour notes), label
    it. See `references/tier-discipline.md`.

16. **Letting the architecture map become a path-walk.** The order in
    which you read code is not the order a future reader needs to learn
    the substrate. Path order is execution scaffolding (from the probe
    plan); architecture order is substrate-shaped (subsystems, primitives,
    topology). If your `02-architecture.md` reads like "first I looked at
    X, then I followed it to Y", you've written the wrong artefact —
    rewrite it as "the substrate consists of A, B, C, here is how they
    relate".

17. **Behaviour notes drifting into mini-essays.** "Implications for our
    system" / "this affects how we should…" / strategic recommendations
    inside a feature spec's Behaviour notes section is a category error.
    Those are cross-cutting analysis — they belong in `04-assessment.md`
    with a back-reference from the feature spec. Behaviour notes are
    tightly scoped to behaviour of THIS feature only. If a note is longer
    than 2-3 sentences, ask: am I describing behaviour, or am I analysing
    the substrate? If the latter — move it.

18. **Scenarios that read the source back at you.** "WHEN function_x is
    invoked THEN messages are sorted by id and formatted via helper_y AND
    function_z is called with arguments A, B, C…" is implementation
    narration, not observable behaviour. Scenarios should describe what an
    observer of the running system sees — telemetry events, side effects,
    return values, persisted state changes. Implementation details go in
    the Evidence table, not in Scenario lines. The artefact ages better:
    if the substrate renames `helper_y`, the implementation-narration
    scenario breaks but the actual behaviour didn't change.

19. **Verbose prose where structured single-line entries would do.**
    `04-assessment.md` and `00-summary.md` default to terse structured
    entries (`A{N} ({date}) — {claim with citation}. {implication}.
    {action}.`). Paragraph form is reserved for ≤2-3 entries per artefact
    that need structural argument. Verbose-by-default produces artefacts
    14x larger than needed; readers skim and miss the signal. Write terse
    first; expand only entries that demand it.

20. **Cross-substrate language creeping into Tier 3 entries.** Even with
    the "kept abstract here, will inform crossprobe" caveat, phrases like
    "most substrates we surveyed do X" or "this is unusual compared to
    other projects" are forbidden in nanoprobe output. The no-cross-
    substrate rule applies uniformly — Tier 1+2 AND Tier 3. If you spot
    the temptation, park it as a crossprobe TODO and rewrite in pure
    substrate-scoped terms. See `references/tier-discipline.md` and the
    `research-artefacts` skill §"Rule 4: Two-pass discipline".

21. **Line-by-line reading of large files instead of docstring-first
    triage.** A 700+ LOC file read end-to-end gives you almost no
    additional architectural signal beyond what the module docstring +
    function docstrings + signatures already gave you — but it costs 5-10x
    the budget. The failure mode: you finish reading hours later, have no
    spare budget for synthesis, and the artefact suffers. **Rule:** for
    files above ~300 LOC, read docstrings + run `search_files` for
    `^class |^def |^async def` first; descend into bodies only for the
    function(s) that are load-bearing for the architectural claim you're
    making. Architecture lives in the seams between functions; bodies
    are evidence for individual feature specs, cited file:line in the
    Evidence table without narration. See step 5 reading technique.

22. **Filing a substantial sub-component as "internal mechanism" of its
    parent.** The agent's own scope-gap scan (step 6.5) is biased toward
    treating things as sub-components when they're already mentioned in
    a parent spec — the path of least resistance is to add a Behaviour
    note and move on. Apply the four-criterion promotion heuristic in
    step 6.5 **even for components you've already cited in a parent
    spec**. Re-evaluate every Source row in the Evidence table: does
    that cited file (or subdirectory) meet 2+ promotion criteria? If
    yes, you have a missed promotion. Real example: in the honcho
    probe, `src/dreamer/surprisal.py` and `src/dreamer/trees/` were
    cited in `features/dreamer.md`'s Evidence table for batches 1-3.
    They sat there as "sub-component of dreamer" for three batches
    before user-driven scrutiny ("is surprisal a feature?") triggered
    re-evaluation against the criteria — at which point they obviously
    warranted their own spec. **Lesson:** at the end of each batch,
    run the promotion heuristic against the Source citations in every
    feature spec written that batch, not just against gaps you haven't
    cited yet. The most dangerous gaps are the ones you've already
    mentioned in passing — they pass the "did I notice this?" filter
    but fail the "did I characterise it adequately?" filter.

23. **Silently rewriting an earlier wrong claim instead of striking it
    through.** When batch N discovers that something asserted in batch M
    (M<N) is wrong, the temptation is to edit the earlier artefact in
    place to make it now-correct. Don't — that destroys the audit trail.
    A future reader can't see that the claim ever was different, what
    evidence overturned it, or whether their own mental model (built from
    reading the earlier version) is now stale. Use the strike-through
    pattern: preserve the original wording with `~~strike~~`, mark
    `**CORRECTED (batch N):**`, cite the new evidence. See
    `research-artefacts` skill §"In-place corrections: preserve the audit
    trail" for the format and the when-to-correct-in-place vs
    when-to-cross-reference-forward decision.

## Verification checklist

Before declaring a probe complete:

- [ ] Probe plan (step 4) existed before any code-trace work began
- [ ] License verified by reading `LICENSE` at the pinned SHA (recorded
      in `00-summary.md` and `04-assessment.md` if corrects a prior survey)
- [ ] Output folder exists at `<domain>/<substrate>/` with all five files
      (`00-summary.md`, `02-architecture.md`, `03-mapping.md`,
      `04-assessment.md`, `sources.md`) + `features/` directory
- [ ] Every feature has its own file in `features/`
- [ ] Every feature file has Requirement + ≥1 Scenario + Evidence table +
      Behaviour notes
- [ ] Every Evidence row cites concrete refs (URL+date for claim/doc,
      file:line@SHA for source) — no "see docs"
- [ ] Triangulation status set on every feature (✓ / ⚠ / ✗)
- [ ] `02-architecture.md` describes substrate-as-substrate-organises-itself
      (subsystems, primitives, topology, storage, pluggable surfaces) — NOT
      a path-walk in reading order
- [ ] `02-architecture.md` contains zero Tier 3 interpretation (no
      "trade-offs", no "I think", no "this is unusual" — those belong in
      `04-assessment.md`)
- [ ] `04-assessment.md` exists, opens with explicit Tier 3 warning, contains
      dated entries with both factual references and interpretation labelled
- [ ] `03-mapping.md` addresses every goal in the domain's goals doc
- [ ] `sources.md` is complete: all URLs, SHAs, paths, dates
- [ ] `00-summary.md` exists, written LAST, distils findings + verified
      license + notable absences + triangulation gaps + crossprobe TODOs
- [ ] No cross-substrate references anywhere in the output (including
      Tier 3 assessment entries)
- [ ] All feature names use substrate-native vocabulary
- [ ] Behaviour notes in feature specs are tightly scoped to behaviour of
      THIS feature — no "implications for our system" / strategic analysis
      (those live in `04-assessment.md` with back-references)
- [ ] Scenarios describe observable behaviour (telemetry events, side
      effects, return values, state changes) — not implementation steps
      (function call chains, internal helpers, argument values)
- [ ] Assessment and summary entries use terse structured single-line
      format by default; paragraph form only for entries that need
      structural argument
- [ ] Commit pushed with message `<domain>: nanoprobe <substrate> @ <short-sha>`

## Support files

- `references/rung-definitions.md` — L1-L5 full criteria + cull-gate definitions
- `references/evidence-triangulation.md` — claim/doc/source protocol details
- `references/feature-taxonomy.md` — category guidance + how to add new
  categories for new domains
- `references/source-citation.md` — citation format rules + reproducibility
- `references/execution-strategy.md` — when to single-shot vs decompose;
  scaffolding-shot + parallel-path-shots + synthesis-shot pattern for large
  substrates; subagent context-passing checklist
- `references/closing-pass-exemplars.md` — known-good section shapes for
  `05-coverage.md`, `03-mapping.md`, `00-summary.md`, drawn from the
  honcho v3.0.7 probe. Read before writing the closing pass.
- `references/tier-discipline.md` — the three-tier knowledge model
  (claim / source / analytical) and how it maps to the output artefacts;
  the load-bearing principle that keeps probe outputs reusable
- `templates/00-summary.md.tmpl` — substrate summary template (written LAST)
- `templates/02-architecture.md.tmpl` — substrate-shaped architecture map
  (Tier 1+2, descriptive only)
- `templates/03-mapping.md.tmpl` — goal-mapping template
- `templates/04-assessment.md.tmpl` — probe assessment template (Tier 3,
  dated/signed)
- `templates/sources.md.tmpl` — sources index template
- `templates/feature.md.tmpl` — per-feature spec template
- `templates/02-code-trace.md.tmpl` — DEPRECATED narrative path-walk
  template; retained for reference but use `02-architecture.md.tmpl`
  instead (see pitfall #16)

## Boundary with crossprobe (downstream)

Crossprobe (TBD, separate skill) consumes N nanoprobe outputs as input and
produces:

- Feature taxonomy reconciliation across substrates (e.g. "Honcho's dialectic
  and mem0's fact-extraction are both members of the abstract concept
  *background-derived-memory*")
- Cross-substrate comparison matrices
- Capability gap analysis (features present in some, absent in others)
- Abstract-concept-to-goal mapping across the full substrate set

If you find yourself wanting to do any of the above inside a nanoprobe — stop.
Note the temptation in a TODO at the bottom of `00-summary.md` for crossprobe
to pick up. Then go back to describing the substrate in its own terms.
