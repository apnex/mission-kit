---
id: W16
category: work-type
title: bank-idea-or-knowledge-capital - capture reusable capital
status: active
hydrate-when: You have reusable capital in hand and are capturing it
roleEligibility: [architect, engineer, verifier, director]
evidenceContract:
  - kind: freeform
    description: idea/doc created with source + revival trigger
evidenceAuthority: executor-evidence
domainEligibility: [knowledge-methodology]
domainFreedom: pinned
parameters:
  - name: target
    fills: the insight to bank
    bindingSource: discover-from-substrate
generationMode: proactive-poolable
falsifier: no source, no actionability, or duplicate of an existing ledger entry
compositionHooks: proactive-poolable under constraint 7 - the banked entry carries an embedded revival trigger (M5 anti-amnesia) so a deferred insight self-resurfaces; idle-pool minting is bracketed per the idle-safety rule
---

# W16 - bank-idea-or-knowledge-capital

## Definition

Capture a reusable insight - an idea, a friction, a durable lesson - as a first-class ledger entry carrying its source and a revival trigger, so the capital compounds instead of evaporating.

---

## Evidence & closeability

The evidence contract is a single `freeform` item: an **idea/doc created with source + revival trigger** - a durable substrate entity, not a claim that the insight was noted.\
Closeability is governed by the canonical constraint set / closeability preflight in `work-types/README.md` (referenced, not restated).\
The load-bearing gate is **constraint 5**: the falsifier below is the concrete observation that FAILs the seed.\
Constraint 3 also binds - the `target` param carries a `discover-from-substrate` bindingSource, so the banked entry resolves to a real insight rather than a vacuous node.

---

## Generation

`proactive-poolable` - mintable against the existing substrate with no trigger, so it enters the idle-QoS pool (idea-403/404), and it is one of the honest proactive-poolable set named in `work-types/README.md`. idea-425/451/403 instantiate it as an idle agent (any role) surfacing an insight, minting the ledger entry with `target` bound from substrate discovery and an embedded revival trigger.\
The falsifier is **no source, no actionability, or a duplicate of an existing ledger entry** - any of the three fails the seed's preflight rather than banking dead capital.

Incident friction-harvest routes here: an incident is not a generatable work-type (`recover-incident` is a posture note, `work-types/README.md`), so the friction it surfaces is banked through W16.

---

## Axiom alignment

- **A4** - perfect institutional memory is a first-class invariant; banking
  reusable capital is how the engine keeps that memory instead of re-learning.
- **A1** - the entry is durable backplane truth with a revival trigger, so the
  insight survives restart rather than being lost as ephemeral truth.
