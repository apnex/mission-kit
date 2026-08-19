# Bundles

A bundle composes skills into an operator-facing role.\
It is a small YAML file naming the skills required to perform a particular kind of work, so a consumer can assemble a capability without knowing the catalogue.

## Bundles are not entries

The distinction is deliberate, and it is the reason bundles sit outside the ID scheme.

- **Entries** (`A`, `S`, `M`, `R`, `D`, `W`, `P`, `K`) are units of *knowledge*.
  They are authored, reviewed and curated, and each carries a stable ID.
- **Bundles** are units of *deployment composition*.
  They tell a consumer system which skill subdirectories to pull when assembling a role.

Bundles therefore take no ID and appear in no ledger.\
They are managed by convention on filename: `bundles/<role>.yaml`.

## Agent-agnostic by construction

A bundle must carry no harness-specific field and no tool name.\
Any agent that consumes `SKILL.md` trees from a directory must be able to resolve a bundle by reading its `skills:` list alone.

A harness-specific field in a bundle makes the capability unportable, which fails the admission test in the root charter.

## Composition is expressed as edges

The catalogue is a hierarchy expressed as edges, not as numbered names.\
Each skill declares `prerequisite` for what must be read first, and `composes` for the primitives a specialist system is built from.

Level is derived from those edges, never stored in a name.\
Encoding depth into a name freezes it, and it rots on the first change to the graph.

[`tools/skill-graph.mjs`](../tools/skill-graph.mjs) lints the graph: every edge must resolve, the graph must be acyclic, and every bundle's `skills:` entry must name a real skill.

## Current bundles

| Bundle | Composes |
| --- | --- |
| [`nanoprobe.yaml`](nanoprobe.yaml) | Code-grounded substrate research. |
| [`sysml-modelling.yaml`](sysml-modelling.yaml) | Reading and authoring SysML v2 models. |
| [`workgraph-arc.yaml`](workgraph-arc.yaml) | Operating a staged arc against a coordination substrate. |
