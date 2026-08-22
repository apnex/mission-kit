---
id: MREQ-0
category: mission-required
title: Backlog - deferred requests to run a future mission, each carrying a revival trigger
status: active
hydrate-when: You are deferring or parking a unit of work and it must not quietly become forgetting
supersedes: []
related: [M5, AR5, A14]
---

# Backlog - mission-required notes

Deferred **requests to run a future mission**, not the missions themselves.

A `mission-required` (`MREQ-N`) entry captures work that is *known to be needed* but deliberately parked - so it is not silently lost.\
It is distinct from the tactical `S`/`M`/`P`/`K` entries (which are situated moves you reach for) and from the axioms (standing invariants): an `MREQ` is a *pending unit of work with an armed revival condition*.

Every entry MUST carry a `revival-trigger` (per [M5 - Anti-amnesia deferral](../methodology/M5-anti-amnesia-deferral.md)): the observable condition under which the item should be re-triaged.\
A deferral without a revival trigger is rejected the same way a malformed record is.

**Revival re-triages, it does not resume.**\
When a trigger fires, the item routes back through fresh intake - its parked findings are re-examined against the world as it is then, not silently resumed.

## Entries

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [MREQ-0](README.md) | Backlog - deferred requests to run a future mission, each carrying a revival trigger | You are deferring or parking a unit of work and it must not quietly become forgetting |
| [MREQ-1](mreq-1-axiom-application-methodology.md) | Axiom-application methodology for non-code missions | You are applying axioms to a mission that produces no code |
| [MREQ-2](mreq-2-extend-the-corpus-work-type.md) | Work-type for extending the corpus itself | You are adding or retiring a layer and want the work claimable rather than hand-run |
| [MREQ-3](mreq-3-component-design-spec-altitude.md) | The component design and specification altitude | You need to specify one component's configuration and implementation and find no artifact type for it |
| [MREQ-4](mreq-4-derive-the-layer-set.md) | Deriving the layer set rather than declaring it in the generator | You are adding or renaming a layer and find the index generator must be edited before it will see it |
| [MREQ-5](mreq-5-retire-legacy-style-debt.md) | Retiring the legacy style debt that keeps the whole-corpus gate red | You need the whole-corpus style gate to be green rather than known-red before you can trust it |
| [MREQ-6](mreq-6-ledger-retrieval-strategy.md) | The retrieval strategy for a ledger that outgrows always-on context | You are deciding how the ledger reaches an agent once it no longer fits comfortably in always-on context |
| [MREQ-7](mreq-7-provenance-and-trust-vocabulary.md) | A provenance and trust vocabulary for an agent-maintained corpus | You need to know when an entry was last verified or who asserted it, and the corpus does not record either |
| [MREQ-8](mreq-8-delta-post-ratification-shape.md) | The post-ratification half of a delta, and whether its required sections are two shapes | You are recording what a delta produced after it was ratified and find the type specifies only its opening |
| [MREQ-9](mreq-9-artifact-work-axis-binding.md) | The binding between the work axes and the artifact layer | You are composing a unit of work and cannot tell from the corpus which document type it is supposed to produce |
| [MREQ-10](mreq-10-recurrence-tier-evidence.md) | The evidence a recurrence tier rests on, in a corpus that bars naming it | You need to know whether an artifact type's recurrence tier rests on wide evidence or on one instance, and the entry does not say |
<!-- END GENERATED -->

Each entry's `revival-trigger` is in its frontmatter, which is the one place it is authored.

---

## Entry shape

```yaml
id: MREQ-N
category: mission-required
title: One-line title - noun phrase, no period
status: active            # see schemas/catalog-entry for the vocabulary
fulfilment: deferred      # deferred | partial | done | wont-do (all reopenable per M5)
revival-trigger: >        # REQUIRED - the observable condition to re-triage
  ...
related-axioms: []        # axioms the future mission bears on
related: []               # cross-links to S/M/P/K/MREQ entries
```
