# Evidence triangulation

Every feature in a nanoprobe output is triangulated across three evidence
types. This document defines what each type IS, what counts as valid evidence
of each type, and how to handle mismatches.

## The three evidence types

### Claim
What the project asserts about itself, in marketing-shaped surfaces.

**Valid sources:**
- Project README
- Landing page on project website
- Project blog posts authored by maintainers
- Academic paper if the project is paper-backed
- Maintainer conference talks (cite slides or video timestamp)

**Invalid sources:**
- Third-party blog posts (these are tertiary; use only when no first-party
  claim exists, and flag explicitly)
- GitHub issue comments (these are noise unless from a maintainer asserting
  intent)
- Forks or contrib repos

**Format:** quoted text + URL + retrieval date.

### Doc
How the project formally documents the feature, in reference-shaped surfaces.

**Valid sources:**
- API reference documentation
- Config schema documentation
- Architectural docs in the repo (`docs/`, `ARCHITECTURE.md`)
- OpenAPI / JSON-schema / Protobuf definitions
- Type stubs (`.pyi`, `.d.ts`) when they document semantics

**Invalid sources:**
- Tutorials and quickstarts (these are claim-shaped, not doc-shaped)
- Comments in source code (those are source-side evidence, not doc-side)

**Format:** section heading or field path + URL or repo path.

### Source
What the code actually does.

**Valid sources:**
- Implementation files in the canonical repo at a pinned SHA
- Migration files (for schema-affecting features)
- Test files when they encode behavioural assertions (cite as
  `tests/foo.py::test_bar:42`)

**Invalid sources:**
- Source from a satellite repo (client SDK, examples) — those go in
  `sources.md` as supporting evidence, not feature evidence
- Source from a different fork or branch than the pinned SHA

**Format:** `path/to/file.py:line-range` @ commit `<short-sha>`.

## Triangulation status

| Status | Definition | When to use |
|---|---|---|
| ✓ Triangulated | All three evidence types present AND consistent | Most features should reach this |
| ⚠ Partial | At least 2 of 3 present, OR all 3 present with documented inconsistency | Common when docs lag source |
| ✗ Single-source | Only 1 of 3 present | Rare; investigate before settling |

A feature with **claim only and no source** is NOT a feature for nanoprobe
purposes. Record under `00-summary.md` "Findings → Claimed but not found in
source" with the claim URL. Such items are flags for re-probing at a later
SHA where the feature might land.

A feature with **source only and no claim** IS a feature — undocumented
behaviour is still behaviour. Set status to ⚠ and call out the absence in
Behaviour notes.

## Handling mismatches

Mismatches between evidence types are **findings**, not errors. Write them up:

- **Claim > Doc:** README says X; docs don't mention X. → "Undocumented but
  claimed. Source confirms: <ref>."
- **Doc > Source:** docs say default is 5; source defaults to 2. → "Doc
  lag: docs assert default=5, source at <SHA> uses default=2. Verified at
  `<file:line>`."
- **Source > Doc:** code does X; docs don't mention X. → "Undocumented
  behaviour: <description>. Source: `<file:line>`."
- **Claim conflicts source:** README says "supports backend Y"; source has
  no Y handler. → "Vapourware flag: <quote>. Searched
  `<paths>`; no implementation found at <SHA>."

Every finding belongs in the feature's Behaviour notes section. Cross-cutting
findings (multiple features affected) get a Findings section in `00-summary.md`.

## Reproducibility requirement

Every Evidence row must support a future operator running:

```
git checkout <SHA>
$EDITOR <path>:<line>
```

…and seeing the same thing you saw. If your evidence can't be reproduced this
way, it doesn't belong in the Evidence table — put it in Behaviour notes with
explicit caveats.

For external URLs (claim, doc), record the retrieval date and use
`archive.org` snapshots when the source is volatile.
