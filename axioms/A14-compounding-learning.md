---
id: A14
category: axiom
title: Compounding Learning
status: active
hydrate-when: You have learned something during work and are deciding whether to capture it
applies-to: [any-system]
related: [A4, A10, A11, A12, A13]
---

# A14 - Compounding Learning

## Mandate

The organization engineers the **path of greatest learning**, not the shortest path.\
Learning - knowledge, insights, hardened substrate, sharpened design - is **invested capital**: captured durably at the moment of discovery, compounding into greater future velocity and returns.\
Over the long horizon, the learning path substantially surpasses shortest-path execution.\
Two corollaries are always in force: an uncaptured insight is a wasted detour, and a friction mined to root cause never recurs.

---

## Mechanics

- **Friction -> root cause, never workaround.** When execution hits a wall, the default is to mine it - diagnose, file, fix, absorb into design - rather than route around it. The two-minute dishonest workaround is the canonical anti-pattern. The corrective loop (A10: failure -> defect record -> post-mortem -> remediation) is the mining apparatus; this axiom governs the *election* to mine.
- **Capture-on-discovery.** The yield of any tangent, incident, or probe is banked into durable, queryable, system-of-record state - evidence registers, backlog entries, defect records, design invariants - the moment it is recognized. Capture IS the investment step: it converts experience into capital. Fidelity of the banked artifact is A4's law; the obligation to bank, and the economics of why, are this axiom's.
- **Tangent discipline.** Side-quests are legitimate and often superior, but investment is separated from wandering by two properties: **adjacency** (the tangent sits under load-bearing infrastructure the main line will stand on - payback scales with proximity) and **capture** (the yield is banked). Friction-rooted, infrastructure-adjacent, durably-captured tangents pay fastest.
- **Toil-vs-learning attention ledger.** Attention spent is typed: *toil* (transcription, chasing, archaeology, re-fighting fixed problems) trends to zero by mechanization; *learning* (tension-probes, meta-questions, root-cause mining, co-design) is protected and provisioned, never optimized away. No efficiency metric may reward suppressing curiosity.
- **Compounding is traceable.** The return on a learning investment is observable as **deleted future friction** (per-item taxes converted into one-time capital costs) and **avoided rework** (lessons entering new designs as invariants before build). Payback cycles are recorded when measured.

---

## Rationale

An organization can scale execution arbitrarily, but its velocity ceiling is set by what it *retains*.\
An org that ships fast and learns nothing pays the same taxes forever; an org that mines its friction and banks the yield gets structurally faster every cycle.\
Without a named invariant, shortest-path pressure silently wins every local decision - workarounds beat root causes under any deadline, insights die in conversation scrollback at session end, and the same lesson is purchased repeatedly.\
Naming the economics makes the trade auditable: a day of mining is visible as investment, and its return is visible as friction that never comes back.

---

## Faults

- **Insight Depreciation** - a discovery lives only in conversation and dies at session end; the detour's cost was paid, the capital never banked.
- **Workaround Culture** - friction routinely routed around instead of mined; the same wall is hit, and paid for, forever.
- **Shortest-Path Myopia** - local completion pressure overrides compounding value; the org ships today and stays exactly as slow tomorrow.
- **Tangent Sprawl** - side-quests without adjacency or capture; wandering dressed as learning, spending attention that never returns.
- **Curiosity Suppression** - efficiency metrics punish learning-attention (probes, meta-questions, deep dives), optimizing the org's highest-yield behavior out of existence.

---

## Success signals
You'll know it holds when:
1. Friction encountered on any path is mined to root cause or *explicitly* deferred with a filed marker - zero silent workarounds.
2. Insights land in durable queryable state at discovery; a cold-start agent can recall every banked lesson from substrate alone, with zero reliance on session memory.
3. Mined friction does not recur; recurrence of a captured lesson's failure mode is itself a fault, filed and mined.
4. Learning investments show traceable payback - deleted future friction and avoided rework are recorded when observed.
5. Attention metrics distinguish toil from learning: toil trends to zero; learning-attention is structurally protected and never appears as a cost to minimize.
6. Lessons flow into new designs as invariants *before* build - a captured finding becomes a stated requirement and then an enforced test - rather than arriving as post-incident patches.
