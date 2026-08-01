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
