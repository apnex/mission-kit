<!-- GENERATED FILE. Edit canonical fragments and projection recipes. -->

## Validation

Run binary gates in order:

1. G0 preserves the frozen v1 baseline and its 17, 12 and 24 assertions.
2. G1 validates every schema with positive and negative instances.
3. G2 proves fragment IDs, capability graph and contribution coverage.
4. G3 proves deterministic projection, Mermaid/FLOW parse-back and relocation.
5. G4 proves every legal and illegal protocol transition and authority guard.
6. G5 proves atomic state, dependency snapshots, failures, retry and cold resume.
7. G6 proves the self-contained envelope and blind transcript behavior.
8. G7 remains the separately authorized live canary and promotion gate.

Register every test explicitly. Bind each test descriptor to one obligation,
one behavior, one executable and one evidence class. Never infer membership or
coverage from filenames.

Keep this package at staging path `skills/survey-v2`, excluded from bundles,
routers and normal skill installation. Generate immutable frontmatter
`name: survey` from the first build so a later canary or promotion never
rewrites bytes.

Do not run a live Director canary under implementation authority. A separately
authorized canary may copy the complete sealed root to an isolated
`<CODEX_HOME>/skills/survey` with no v1 present and invoke it explicitly.

Canonical promotion requires separate reviewed authority, all G0–G7 evidence,
an exact package digest, an atomic no-rewrite replacement of `skills/survey`,
discovery updates, staging retirement and tested v1 rollback. This package
cannot perform or authorize that effect.

The directory containing this package is the complete installable Survey
system. Resolve every owned path from that directory. Never search for a Git
root, governance document, sibling skill, parent package, or parent
`node_modules`.

Use `./compile.sh` as the sole build entry. It may only locate the physical
root and execute `source/executables/compiler/build.mjs`. Treat `SKILL.md`,
`references/`, `scripts/`, `assets/`, and `generated/` as checked projections,
never compiler inputs.

Install and test the whole root. Do not install a generated subset, expose the
staging root through automatic discovery, or modify canonical
`skills/survey`.
