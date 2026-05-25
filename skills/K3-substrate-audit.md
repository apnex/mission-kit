---
id: K3
category: skill
title: substrate-audit — code-grounded substrate audit
added: 2026-05-24
status: active
supersedes: []
related: [M1, M3]
---

# K3 — substrate-audit

## Rule

When evaluating an OSS substrate (memory layer, framework, runtime,
queue, etc.) for adoption or comparison, run a **substrate audit**
(colloquially: a *nanoprobe*) instead of a survey. A substrate audit
is a code-grounded, evidence-triangulated analysis pinned to a
specific upstream tag, structured around a fixed artefact layout
and executed as a **five-pass meta-process**:

1. **Sweep** — exhaustively enumerate features from source, configs,
   migrations, and docs. Cite every claim with `path:line` or
   commit SHA.
2. **Triangulation** — every non-trivial claim must be supported by
   at least two independent sources (e.g. code + test, code + config
   schema, code + migration). Single-source claims are marked
   speculative.
3. **Promotion audit** — re-evaluate every feature already cited
   inside another feature's spec against the promotion heuristic
   (own config namespace, own source file >300 LOC, non-trivial
   algorithm, independently configurable — meet ≥2 → promote to
   own spec). Already-cited features are the most-missed.
4. **Synthesis** — apply analysis lenses (locus of enforcement,
   operator impact, failure mode, peer comparison, structural
   criticality, cross-feature invariants) across the spec set to
   surface emergent properties.
5. **Reconciliation** — update summary / coverage / index documents
   to match the delivered spec count, drivers, and methodology.

Descriptive work (per-substrate audit using substrate-native
vocabulary, no cross-references) and comparative work
(cross-substrate analysis) are **strictly separate passes**. Mixing
them contaminates the descriptive pass with comparison bias.

## Artefacts

Each audit lives under `docs/<domain>/<substrate>/` with this layout:

```
00-summary.md         — abstract + companion counts + methodology
02-architecture.md    — descriptive substrate map (substrate-native
                        vocabulary, no cross-substrate references)
03-mapping.md         — goal alignment (only if a goal doc exists)
04-assessment.md      — analytical interpretation (separate from
                        descriptive map)
05-coverage.md        — spec index + promotion drivers
features/<name>.md    — one spec per discrete capability
sources.md            — pinned upstream tag + commit SHA + repo URL
```

## Rationale

Surveys collapse under their own abstraction — "supports X" hides
whether X is a working code path, a stub, or a doc-only claim.
A substrate audit forces every claim back to source, which is the
only honest answer to "is this substrate viable for our use case?".
The five-pass structure exists because earlier three-pass runs
repeatedly missed (a) promotion candidates buried in passing
mentions and (b) cross-feature invariants only visible after
the spec set is complete.

## When to apply

- Choosing between OSS substrates for a production dependency.
- Auditing a substrate's documented vs implemented behavior
  (especially when docs and code might disagree — they often do).
- Building a reusable knowledge artefact about a substrate for
  future cross-substrate comparison.
- Any time "supports X" / "has Y" claims need to be verified
  against actual source before commitment.

Skip the substrate-audit and use a lightweight survey when:

- The decision is reversible and low-stakes (e.g. dev tooling).
- The substrate is already deeply familiar to the operator.
- A comparative benchmark (L5) already exists and is fresh.

## Origin

Codified during the Honcho `v3.0.7` audit
(`apnex/kate` `docs/memory/honcho/`), commit `76da77f`. The
five-pass structure was discovered iteratively — promotion audits
and lens synthesis emerged as distinct repeatable phases after the
initial three-pass run missed three promotable features and several
cross-feature invariants.

## Tooling

Full procedure, templates, references, and analysis lenses live in
the skill tree at [`substrate-audit/`](substrate-audit/). The
SKILL.md entrypoint, eight reference documents (rung definitions,
evidence triangulation, feature taxonomy, source citation, tier
discipline, execution strategy, closing-pass exemplars, substrate
analysis lenses), and seven artefact templates ship together. That
tree is the canonical source; this entry is the mission-kit index
handle.

This skill is also the centrepiece of the `nanoprobe` bundle
(see [`bundles/nanoprobe.yaml`](../bundles/nanoprobe.yaml)) — a
role composition for operators performing code-grounded substrate
research.
