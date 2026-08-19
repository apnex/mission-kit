---
id: W23
category: work-type
title: capture-decision-and-ratify - record + ratify a decision
status: active
hydrate-when: You are recording a decision and having it ratified
roleEligibility: [director, architect]
evidenceContract:
  - kind: freeform
    description: DirectorSignal/Confirmation/Decision proof OR documented ratified delegation
evidenceAuthority: director-ratification
domainEligibility: [authority-governance]
domainFreedom: pinned
parameters:
  - name: authority-holder
    fills: director | architect-under-delegation
    bindingSource: operator-supplied
generationMode: reactive-triggered
falsifier: authority proof absent, or a non-delegable boundary crossed
compositionHooks: brackets the decision entity; ratification gate whose satisfying identity must be the director (or an architect holding a documented ratified delegation), never architect narrative
---

# W23 — capture-decision-and-ratify

## Definition

Record a decision and ratify it under authority — the merged capture+decide act
that turns a director signal (or a documented delegation) into a standing,
authority-backed decision entity.

## Evidence & closeability

The evidence contract is a single `kind: freeform` — a
DirectorSignal/Confirmation/Decision proof, **or** a documented ratified
delegation. Authority is `director-ratification`. Closeability is governed by the
canonical constraint set / closeability preflight in `work-types/README.md` (do
not restate it here). Load-bearing here: constraint 8 (the director-ratification
path is the sanctioned authority) plus the M7 guardrail —
**`director-ratification` cannot be satisfied by architect narrative**; only a
director signal or a documented ratified delegation held by the
`authority-holder` closes it.

## Generation

`generationMode: reactive-triggered` — instantiated by a substrate trigger (a
director signal, or a raised decision needing ratification), never idle-pooled
or auto-minted. idea-425/451/403 instantiate it as the ratification gate that
brackets a decision entity: the `authority-holder` param binds operator-supplied
to either the director or an architect under documented delegation, and
idea-451's conditional edge routes an un-ratified decision back to the
director-ratification authority rather than admitting architect prose. Falsifier:
authority proof is absent, or a non-delegable boundary is crossed — that turns
the node FAIL.

## Axiom alignment

- **A13** — the director-ratification authority is the load-bearing purpose:
  ratifying a decision is a director act, and the delegation path stays under
  director authority so no architect narrative self-certifies a decision.
