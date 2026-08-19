---
id: W15
category: work-type
title: convene-a-council - multi-lens deliberation + synthesis
status: active
roleEligibility: [architect]
evidenceContract:
  - kind: doc
    description: seat docs + synthesis resolving disagreements
evidenceAuthority: executor-evidence
domainEligibility: [coordination-substrate]
domainFreedom: pinned
parameters:
  - name: target
    fills: the question to deliberate
    bindingSource: operator-supplied
generationMode: arc-seeded
falsifier: minority claims erased or no convergence record
compositionHooks: dependsOn the per-lens seat docs; synthesis node completionDependsOn the lens contributions
---

# W15 — convene-a-council

## Definition

Run a multi-lens deliberation over an open question — independent seats
contribute framings, then a synthesis reconciles their disagreements into a
convergence record that preserves minority claims.

## Evidence & closeability

The evidence contract is a single `doc`: the per-seat lens docs plus a synthesis
that resolves the disagreements. Authority is `executor-evidence` — the
convening architect owns the synthesis. Closeability is governed by the
canonical constraint set and the seed-time closeability preflight authored once
in `work-types/README.md`; this entry satisfies those constraints (it does not
restate them). `domainFreedom: pinned` to `coordination-substrate` — the
generator does not vary the domain.

## Generation

`arc-seeded`: a driver mints the council inside a blueprint (as worktax0 itself
did) rather than pooling it idly. The `target` question is `operator-supplied` at
seed. idea-425/451/403 instantiate it as a `role × work-type × domain` triple
whose seat contributions are `dependsOn` inputs to a synthesis node. The
falsifier is concrete: the node FAILs if **minority claims are erased or there is
no convergence record** — a synthesis that flattens dissent is not a council
outcome.

## Axiom alignment

- **A3** — honest boundaries over false symmetry: the synthesis must preserve
  minority claims rather than manufacture false consensus (this is the
  falsifier).
- **A13** — director-frame deliberation: multi-lens convening surfaces the
  reconciled judgment a single seat cannot self-produce.
