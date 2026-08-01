# Assurance and package boundary

The evaluator root is sovereign and relocatable. It must not import the
governance project, canonical Survey v1, candidate Survey v2, a repository
parent, or a sibling runtime package.

`source/evidence/e0-baseline-evidence.json` is the package-owned E0
prerequisite and threat-model record. It freezes the ratified Survey v2
design, normative lifecycle projection refinement, exact candidate commit and
mechanical package identity, evaluator design/intent, Mission Kit baseline,
terminal-ratification erratum and canonical v1 characterization identities
without importing those external sources. Its deterministic assurance ceiling
is E5; it claims no E6, E7, canary, release, or promotion result.

`compile.sh` is the sole build authority. It generates schemas, operator
references, role capsules, scripts, UI metadata, `generated.lock.json`, and
`package.manifest.json`. Generated targets never become canonical inputs.

The package manifest inventories every regular file except itself using exact
path, portable mode, byte length, and raw SHA-256. Its payload fold uses
`evaluator-payload`. The generated lock excludes itself and the package
manifest from its internal generated-target fold, while the finished lock is an
ordinary payload member. The external evaluator digest is derived from the
semantic manifest digest and payload root and is never stored in the manifest.

Reject unsafe links, special files, path traversal, ASCII case-fold collisions,
invalid UTF-8 paths, and partial execute-bit modes. A recommendation or
assurance certificate is evidence, never release authority.
