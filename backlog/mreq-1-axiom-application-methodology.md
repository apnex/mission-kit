---
id: MREQ-1
category: mission-required
title: Axiom-application methodology for non-code missions
status: active
fulfilment: partial
hydrate-when: You are applying axioms to a mission that produces no code
revival-trigger: >
  Pick up the remaining guide layers when EITHER (a) a third non-code mission
  (design/governance/planning) is about to start and would benefit from disciplined
  axiom use beyond the M7 audit gate, OR (b) a second observed instance of
  "axiom-laundered wrong conclusion" occurs (an axiom-decorated decision that later
  proved factually unfounded). Re-triage on revival - do not resume assumptions below;
  re-check them against the missions observed by then.
promoted-slice: M7
related-axioms: [A3, A4, A11]
related: [M5]
---

# MREQ-1 - Mission required: axiom-application methodology for non-code missions

## What this is

A **request to run a future mission**, not the mission itself.\
Captured per M5 (anti-amnesia deferral) so it is not silently lost.\
The mission is: define *how* the axioms are applied to missions whose deliverable is NOT code (design docs, governance decisions, distribution/architecture planning), WITHOUT diluting or damaging their code-mission applicability.

**Partially picked up.**\
`M7` now codifies the first reusable slice: axioms are applied as a required alignment audit gate for extensive planning/design before implementation approval.\
The broader layered interpretation guide remains parked here until the revival trigger fires again.

---

## The observed problem (the reality that motivates it)

During the M-Shim-Distribution design dialogue (agentic-network, 2026-07-01), the axioms were mapped onto a non-code design exercise for the first time in the observed record.\
It surfaced a specific, repeatable failure:

- **Axioms were applied generatively, to an unverified model of reality, out of
  sequence.** A confident, axiom-decorated case (A3 "Speculative Surface") was
  built to argue that publishing an npm package graph was a principle-violation -
  when in fact that publishing was already RATIFIED and LIVE in production
  (ADR-029). The axiom did not cause the error (a missed doc did), but it
  **amplified and laundered** it: a well-articulated axiom mapping made a
  factually-unfounded conclusion *look* principled and settled. The whole design
  (v0.1) had to be rewritten (v0.2) once reality was checked.

- **Root cause: on non-code missions the axiom is applied to a model of reality,
  and the axiom does nothing to check whether that model is true.** Code missions
  have an implicit corrective - tests, the compiler, `npm view` - that forces
  fact-before-conclusion and falsifies bad interpretation. Non-code missions strip
  that scaffolding away and expose that **the application method was never written
  down; it was only ever structurally enforced by the substrate.**

---

## Provisional findings to RE-TRIAGE (not resume)

These are the dialogue's conclusions.\
On revival, re-examine each against the missions actually observed by then - do not assume they still hold.

1. **The gap is an APPLICATION-LAYER defect, not axiom CONTENT.** The axioms
   worked as axioms. Changing axiom content to fix an application defect solves the
   wrong layer and risks diluting code applicability. Provisional recommendation:
   **leave the axioms alone; add a thin application/methodology companion.**

2. **Axioms are more reliable as an AUDIT than as a GENERATOR.** Using them to
   *derive* a decision invites motivated reasoning (you can almost always find an
   axiom to bless the answer you already like). Using them to *interrogate a
   decision reached by other means* is falsifiable. Prefer post-hoc audit gates on
   a near-final artifact over up-front generation.

3. **The highest value-to-risk fix is a domain-neutral SEQUENCING rule** (already
   earned by one clean data point): *"Establish and verify reality before invoking
   any axiom. Axioms audit conclusions; they do not generate them."* Cheap,
   domain-independent, addresses the actual failure. This is the most likely thing
   to promote to a real `M`-entry.

4. **A DOMAIN-scoped interpretation layer is promising but NOT yet earned.** The
   idea (Director-originated): an axiom must be interpreted against a target
   *domain*, and domains are enumerated somewhere; the mechanic->artifact
   translation (e.g. A3 "God-Object" for a design doc that decides five things at
   once; A11 "Substrate Leakage" for a manual publish ritual) should be explicit
   and reviewable rather than improvised. CAUTION (A3 turned on the meta-work
   itself): do NOT pre-enumerate a domain taxonomy speculatively - that would be
   Speculative Surface. **Extract domains from missions actually run, not from a
   whiteboard.** The `applies-to` frontmatter field answers "does it apply?"; it
   does NOT answer "how do its mechanics translate for a non-code artifact" - that
   is the real gap.

5. **Distinguish load-bearing axiom citations from decorative ones.** Some
   decision<->axiom mappings in the dialogue were real reasoning; others were
   retrofitted labels on conclusions reachable without any axiom (A6 "one command"
   is just obviously good). Forcing an axiom onto every decision dilutes the ones
   that matter. Any methodology should require marking which citations are
   load-bearing.

---

## Suggested scope when picked up (indicative, re-triage)

- Likely output: a small `methodology/` entry (the sequencing rule - finding #3),
  possibly a second entry or a section for the domain-interpretation layer IF
  enough mission-types have been observed to enumerate domains non-speculatively.
- The meta-work is itself governed by the axioms: establish reality (which
  mission-domains actually exist, from real missions) BEFORE designing the guide;
  earn the domain layer by demonstrated need (A3); do not invent fill-in (A4); do
  not build on speculation (A11).
