---
id: E7
category: entity
title: gate - a point past which work proceeds only if a stated condition is shown to hold, decided by a machine, an independent agent or the director
status: active
hydrate-when: You are about to say work passed, failed or is waiting at a gate, or to decide who may judge one
supersedes: []
related: [A8, A9, M7, R3, R4, W0, E1, E8]
---

# E7 - gate

## Definition

A **gate** is a point past which work proceeds only if a stated condition is shown to hold.

Every gate has three parts: the **condition**, stated before the work reaches it; the **judge**, who or what decides whether the condition holds; and the **verdict**, which is pass or fail.

**Three kinds, by who judges.**

| Kind | The judge | Examples |
|---|---|---|
| **Machine** | a deterministic check - a script, a test suite, a validator | the build gate, `tools/check-all.sh`; a parity gate that regenerates and diffs; a model validator with zero syntax errors |
| **Independent agent** | an agent who did not author the work - a verifier, or a code owner who is not the author | a verifier's attested verdict on a build ([`W8`](../work-types/W8-verify-gate-reactive.md)); a code owner's approval ([`W13`](../work-types/W13-code-owner-approve.md)) |
| **Director** | the director, or an architect holding a documented delegation from the director | ratifying a decision ([`W23`](../work-types/W23-capture-decision-and-ratify.md)); a decision point the director is engaged at ([`A13`](../axioms/A13-director-intent-amplification.md)) |

A gate's kind is fixed by its condition, with one exception: where an independent agent is required and none exists, the director may decide the gate instead.\
That is a change of kind, recorded as such, and the gate passes or fails on the director's decision.

**The verdict is binary.**\
A gate passes or fails; there is no partial credit ([`A8`](../axioms/A8-gated-recursive-integrity.md)).\
A richer result is a pass or a fail with something recorded beside it:

| Result reported | Verdict | What is recorded |
|---|---|---|
| pass with guardrails, pass with conditions | **pass** | the conditions the work must keep |
| revise before implementing, blocked, changes requested | **fail** | the reason, and what would let a later attempt pass |

---

## Discriminators

**No verdict is not a third result.**\
A gate that has not been validly run has no verdict, and the work waits.\
It has not been validly run when its inputs are invalid: the evidence is for another revision, the judge lacks the authority, the judge is the work's author, or the input is a party's own account of what it did that the judge cannot check ([`E8`](E8-evidence.md)).\
A valid run that finds the condition false is a fail; an invalid run is no run at all.\
Waiting for a verifier is no verdict, never "blocked".

**An override is not a pass.**\
The director may let work proceed past a gate that failed.\
The verdict stays a fail, and the override is recorded as the director's decision, never folded into the gate's result.\
An override applies only to a failed gate; the director deciding a gate no independent agent can judge is a change of kind, above, and nothing is overridden.

**A gate against a condition.**\
The condition is what a gate checks; the gate is the point that checks it.\
"The gate is constraint 7" names a condition, and says so more exactly as "the load-bearing constraint is 7".

**A gate against a wait.**\
Work that cannot start until something happens - a director being available, a dependency landing - is waiting, not gated, unless something is shown to hold before it proceeds.

---

## Boundaries

- **Not a review that informs.** An advisory check that reports and never blocks is not a gate, however it is run.
- **Not a role.** A verifier is a role ([`R3`](../roles/R3-verifier.md)); judging a gate is one thing a verifier does.
- **Not a step in the coordination system.** A gate node in a work graph is how a coordination system represents a gate; the gate is the condition, judge and verdict, wherever they are recorded.
- **Not the author's own check.** An author's check of their own work is evidence for a gate; it never satisfies an independent-agent gate.

---

## Relations

| Edge | Target | Reading |
|---|---|---|
| mandated by | [`A8`](../axioms/A8-gated-recursive-integrity.md) | nothing is promoted past a gate it has not passed, and gates are pass or fail |
| machine kind demanded by | [`A9`](../axioms/A9-chaos-validated-deployment.md) | promotion to production is gated on a deterministic proof |
| independent kind judged by | [`R3`](../roles/R3-verifier.md) | the verifier holds independent assurance |
| director kind judged by | [`R4`](../roles/R4-director.md) | the director holds ratification, and may decide a gate no independent agent can |
| held to by | [`W0`](../work-types/README.md) | the composition constraints state which gates a unit of work must carry and who may satisfy them |
| one instance | [`M7`](../methods/M7-axiom-alignment-audit.md) | the axiom-alignment audit is a gate on implementation |
| ordered by | [`E1`](E1-sovereign-hierarchy.md) | which judge a gate needs follows from which layer holds the decision |
| receives | [`E8`](E8-evidence.md) | a gate's judge receives evidence and decides the verdict; a party's own account the judge cannot check is no valid input |

---

## Why precision matters

"Did it pass the gate?" had three answers in this corpus - the build check, a verifier's attestation, the director's ratification - and a fourth reading where "gate" named the condition itself.\
A reader who meant the build check would report a pass that a reader who meant the verifier would reject.\
The verdict was worse: one method returned four results, a skill returned three, and a template a third label, so "passed" could mean "passed with conditions nobody recorded".\
Fixing who judges and that the verdict is binary makes every gate's result one fact that can be checked, and makes an override visible as a decision rather than a pass.
