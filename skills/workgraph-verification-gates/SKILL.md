---
name: workgraph-verification-gates
description: "Scaffold stub. Planned WorkGraph-series skill for designing and operating verifier gates: verifier WorkItems, evidence requirements, verifier-attestation authority, non-vacuity checks, advisory versus binding verdicts, and offline-verifier fallbacks."
metadata:
  prerequisite: workgraph-arc-operator
  related-skills: substrate-audit, workgraph-arc-operator
  series: workgraph
  parent-skill: workgraph-arc-operator
  series-role: specialist
  substrate: Hub WorkGraph / verifier-gate / attest_evidence
---

# workgraph-verification-gates — scaffold

**Status:** scaffold stub; content intentionally pending a dedicated authoring pass.

## Planned scope

- When an arc needs explicit verifier nodes.
- Executor evidence versus verifier-attestation authority.
- Non-vacuity and mutation-style verification expectations.
- Advisory verifier review versus close-blocking requirements.
- Recovery when verifier capacity is unavailable.

## Relationship

This will specialize `workgraph-arc-operator` for independent proof: how verifier gates are authored, satisfied, interpreted, and bound into close decisions.
