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
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [MREQ-1](mreq-1-axiom-application-methodology.md) | Axiom-application methodology for non-code missions | active | You are applying axioms to a mission that produces no code |
| [MREQ-2](mreq-2-extend-the-corpus-work-type.md) | Work-type for extending the corpus itself | active | You are adding or retiring a layer and want the work claimable rather than hand-run |
| [MREQ-3](mreq-3-component-design-spec-altitude.md) | The component design and specification altitude | active | You need to specify one component's configuration and implementation and find no artifact type for it |
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
