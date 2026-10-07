# mission-kit - system architecture

**Instant: current state.**\
This document describes mission-kit as it is built and holds today, not as it is intended to become.\
There is no target-state companion, because current and target have not yet diverged in structure: the open work recorded in [`BACKLOG.md`](BACKLOG.md) adds to this shape rather than replacing it.\
Ratifying a decision that changes the shape without building it creates that divergence, and the split happens then rather than in anticipation of it.

Written in the present tense of a system that exists.\
It contains no plan, estimate, migration or progress report; those belong to a delta and to the board.

**The structure is derived; the reasoning is authored.**\
`AR1` forbids a hand-authored current projection, because a hand-written statement of where a system is drifts from it.\
For a corpus the running system is the repository, so the structural sections - the layers, their duties and populations, what each draws on, and what the gate holds - are generated from the corpus by `tools/generate-architecture.mjs`, and the gate fails when they are stale.\
The reasoning sections - identity, justification, axiom alignment, risks - remain authored, and say why the structure is as it is.

---

## 1. Status and authority

Per-section maturity, because one status across nine sections either overstates the weakest or is blocked by it.

| Field | Value |
|---|---|
| North star | [`VISION.md`](../VISION.md#north-star) - cited, never restated |
| Governing charter | [`README.md`](../README.md) - the corpus's own admission and layer rules |
| Standing doctrine | [`AGENTS.md`](../AGENTS.md) - what an agent must hold while working here |
| Axiom applicability | section 3 below |
| Verification | section 8, and [`tools/`](../tools/README.md) |
| Open work | [`BACKLOG.md`](BACKLOG.md) |

| Section | Maturity | Reopens on |
|---|---|---|
| 2. Identity, scope and non-goals | approved | a layer is added or retired |
| 3. Justification chain | approved | an axiom changes applicability |
| 4. Axiom alignment | **provisional** | any axiom tension below is discharged or worsens |
| 5. The anchored core | approved | a layer is added, retired, or changes duty |
| 6. Entity model and interfaces | approved | an entity the model names is redefined |
| 7. Run time | approved | the entry lifecycle changes |
| 8. Verification | approved | a checker is added or a rule loses its enforcer |
| 9. Risks and owed | **provisional** | reviewed whenever `BACKLOG.md` is triaged |

---

## 2. Identity, scope and non-goals

mission-kit is **a corpus of engineering judgement, addressed by identity and routed by condition, held to its own rules by scripts that run against it.**

Its unit of work is an **entry**: a markdown file with machine-checkable frontmatter, a stable ID, and a stated condition under which a reader should open it.\
Its output is not software.\
It is a body of reasoning that an agent holding nothing can reach, cite, and be measured against.

**In scope.**\
Judgement that survives transfer: first principles, definitions, document shapes, procedures, conventions, executable capability, and the machine contracts that hold them.

**Not in scope**, and each exclusion is load-bearing rather than an omission:

- **Domain facts.** Nothing here is true only of one system. Content that would be wrong on another project belongs to that project.
- **Runtime or coordination state.** The corpus executes nothing and tracks no work in progress. Substrate machinery has a different lifecycle and would be a second duty.
- **Instances, except its own.** The type layers hold shapes; completed documents live with the projects that produced them. [`docs/`](README.md) is the single exception, and it holds instances *about this corpus*.
- **Authority over adopters.** A project takes what serves it. Guidance nobody adopts is a finding about this corpus first.

---

## 3. Justification chain

Domain, axioms, north star, principles, decisions, model - each layer citing only the layers above it.

**Domain.**\
Portable engineering knowledge for readers who start cold and retain nothing between sessions.\
The constraining fact of the domain is that the reader cannot be trained, cannot be assumed to have read anything, and must be told what matters at the moment it matters.

**Axioms.**\
Fourteen standing commitments in [`axioms/`](../axioms/), tagged by applicability.\
Those tagged `any-system` bind this corpus unconditionally; the rest bind where their declared domain is present.\
Section 4 states which are in force here and where the corpus falls short.

**North star.**\
Held by [`VISION.md`](../VISION.md) and cited, never restated.\
What *this shape* must achieve is narrower and is stated as the principles below.

**Principles.**\
The invariants this structure is built to satisfy.\
A violation is a defect regardless of which decision produced it.

| | invariant | the failure it forbids |
|---|---|---|
| **P1** | **One home per piece of judgement.** Everything else cites it. | A rule restated in two places reads as authoritative in both and drifts in one, silently. |
| **P2** | **Every entry is reachable by condition, not by name.** | A corpus large enough to matter cannot be read end to end, so an entry found only by prior knowledge is unreachable in practice. |
| **P3** | **Every entry is addressable by a stable identity that is never reused.** | A citation that resolves to different content over time is worse than a broken one, because it fails silently. |
| **P4** | **What a script can hold, a script holds.** What it cannot, the corpus says so. | An unchecked rule mistaken for a checked one is trusted exactly where it is weakest. |
| **P5** | **Derived surfaces are generated, never typed.** | A hand-maintained index omits what nobody remembered to add, and nothing detects the omission. |
| **P6** | **A layer owns one concern.** | Two concerns in one layer cannot be cited separately, and neither can be retired. |
| **P7** | **Corrections are retained, never overwritten.** | A silently corrected record teaches the next reader that corrections do not happen. |

**Decisions.**\
Rulings are recorded as [`AR4`](../artifacts/AR4-decision-record.md) instances and absorbed here.\
This corpus holds no decision register yet - its rulings live in commit messages, which is a real gap and is `B15`.

**Model.**\
Sections 5 to 7.

---

## 4. Axiom alignment

**In force: 5 of 14 unconditionally**, by applicability tag.\
The others bind only where their declared domain is present, and this corpus is not a runtime, holds no persistent entity state, and runs no autonomous agent network.

| Axiom | In force via | How this shape serves it | Where it falls short |
|---|---|---|---|
| **A3** Sovereign Composition | `any-system` | Sixteen knowledge layers, one concern each, cited by prefix and never merged. Composition is by edge and citation rather than by nesting. | The components layer holds one entry, so composition is asserted more than exercised. |
| **A4** Zero-Loss Knowledge | `any-system` | Corrections are retained under banners; deferrals carry revival triggers; claims distinguish measured from inferred. | Rulings live in commit messages rather than a register (`B15`), so rationale is recoverable only by reading history. |
| **A8** Gated Recursive Integrity | `any-system` | Every checker in `tools/check-all.sh` gates every change, and the corpus's own author is refused by them. | Enforcement covers structure and style; it cannot reach whether an entry's reasoning is correct. |
| **A9** Chaos-Validated Deployment | `any-system` | Guards are proven by mutation rather than assumed - a mutant that should fail is run and observed to fail. | Applied per-change by discipline, not by a standing harness. No mechanism forces a new guard to be mutation-tested. |
| **A14** Compounding Learning | `any-system` | Friction surfaced during work becomes an entry or a backlog row; the backlog is a first-class artifact. | The corpus cannot measure whether a lesson stopped recurring, because it cannot observe its own adopters. |

**Unresolved tensions, named rather than discharged.**

| # | Tension | Opposed | State |
|---|---|---|---|
| **T1** | **Portability against evidence.** A claim about practice needs its sample named; naming the sample means naming projects, which portability forbids. | `A4` x the charter's no-local-content rule | **Open.** The recurrence tier was removed rather than repaired, and `MREQ-10` records why the general form has no clean answer. |
| **T2** | **Checkability against judgement.** The most-adopted layer, axioms, is enforced by nothing; the most-enforced layer, style, is cited least. Adoption tracks usefulness in argument, not checkability. | `A8` x `A14` | **Open.** Suggests `P4` is necessary and not sufficient, and that the corpus's value may sit where its mechanism cannot reach. |
| **T3** | **Self-reference.** A corpus cannot measure its own uptake from inside itself, so adoption of a rule it published is evidence it was followed, not that it was right. | `A14` x `A8` | **Open by construction.** No internal mechanism can close it; only an external adopter can. |

Compliance everywhere is a result an honest audit rarely earns.\
These three are the finding.

---

## 5. The anchored core

Sovereign directories, one duty each.\
**A layer that holds knowledge takes an ID prefix and appears in the ledger; a layer that holds mechanism or instances takes none.**\
That split is the load-bearing rule of this section.

### Knowledge layers - ID-bearing, indexed, citable

Generated from the root README's layer table and each layer's charter.

<!-- BEGIN GENERATED: architecture-layers. Run tools/generate-architecture.mjs; do not edit by hand. -->
| Layer | Prefix | Duty, from its charter | Members | Draws on, from its charter |
|---|---|---|---|---|
| `axioms/` | `A` | standing commitments, what brings one into force, and how they compose | 14 | `SC`, `W`, `R`, `D`, `E`, `T` |
| `roles/` | `R` | the M axis (pure essence + type-determined authority) | 4 | `W`, `D`, `A`, `E`, `T` |
| `domains/` | `D` | the N axis (subject-surfaces, bimodal freedom) | 7 | `W`, `R`, `A`, `T` |
| `work-types/` | `W` | the composition rule, the canonical closeability preflight, and the entry schema | 26 | `R`, `D`, `T`, `E`, `A` |
| `methods/` | `M` | procedures that produce a result of their own | 9 | `S`, `P`, `K`, `W`, `E`, `RU`, `PC` |
| `rules/` | `RU` | how work is done, where a check could tell whether it was | 4 | `M`, `PC`, `S`, `A`, `E` |
| `practices/` | `PC` | how work is done, where nothing afterwards could tell | 1 | `M`, `RU`, `S`, `A`, `E` |
| `sets/` | `ST` | charters of populations that span layers | 1 | `E` |
| `style/` | `S` | how artifacts are written, and which rules a script can hold | 16 | `M`, `P`, `K`, `A` |
| `patterns/` | `P` | recurring solution shapes, and what separates one from a single good design | 4 | `M`, `S`, `C`, `A` |
| `skills/` | `K` | executable capability, the stub-and-body split, and composition by edge | 26 | `M`, `RU`, `PC`, `P`, `SC`, `A` |
| `entities/` | `E` | precise definitions of load-bearing terms, and what earns one | 9 | `M`, `SC`, `A` |
| `components/` | `C` | sovereign shareable units to be used rather than rebuilt | 1 | `P`, `M`, `A` |
| `artifacts/` | `AR` | the engineering lifecycle loop, and what earns a document type | 6 | `A`, `W` |
| `traits/` | `T` | characteristics of a system that decide which axioms bind it | 5 | `A`, `D`, `E` |
| `schemas/` | `SC` | machine-verifiable entity contracts, validatable without a project runtime | 6 | `A`, `E` |
<!-- END GENERATED: architecture-layers -->

### Mechanism layers and the instance layer - no prefix, no ledger entry

<!-- BEGIN GENERATED: architecture-other-layers. Run tools/generate-architecture.mjs; do not edit by hand. -->
| Layer | Duty |
|---|---|
| `bundles/` | Skills composed into operator-facing roles, by declared edge rather than by name. |
| `tools/` | The scripts that hold the corpus to its own rules. 28 scripts. |
| `plugins/` | Operator-facing artifacts that run inside a specific agent host. |
| `docs/` | This corpus's own artifact instances, held where [`AR0`](artifacts/README.md) says an instance lives. |
<!-- END GENERATED: architecture-other-layers -->

**Why `docs/` is not a contradiction.**\
Every other layer holds types.\
This one holds instances, and holds only instances *about mission-kit*.\
Its existence is the corpus obeying its own placement rule rather than exempting itself from it.

---

## 6. Entity model and interfaces

**The entry is the atom.**\
Everything ID-bearing is one.

```text
entry
  frontmatter          machine-checked against SC1 catalog-entry
    id                 stable, never reused, prefix = layer
    category           the set it belongs to; keys body shape and conditionals
    status             active | draft | superseded | retired
    hydrate-when       the condition under which to open it - the routing surface
    supersedes         entries this replaces
    related            edges to other entries
  body                 sections checked against SC6 entry-body, by category
```

**Interfaces between layers are citations, not imports.**\
An entry names another by ID; nothing is transcluded, and no layer can reach into another's internals.\
That is what makes a layer retirable.

**Four machine contracts hold what prose cannot.**

| Contract | Governs | Enforced by |
|---|---|---|
| `SC1` catalog-entry | frontmatter shape, per-category required fields | `schemas/` test suite |
| `SC6` entry-body | body sections and their order, per category | `check-entry-body.sh` |
| `SC2` standing-context | the always-on doctrine document | `check-standing-context.sh` |
| `SC3` skill | portable skill frontmatter | `skill-graph.mjs` |

**`category` is the set-membership pointer**, in everything but name - the schemas key on it, the body-shape declaration keys on it, and the conditionals key on it.\
It resolves to the layer's charter, the entry whose id is the layer's prefix followed by zero ([`E3`](../entities/E3-set.md), [`E4`](../entities/E4-charter.md)).

---

## 7. Run time

The corpus has no process.\
Its lifecycles are the entry's and the change's.

**Entry lifecycle.**\
`draft` -> `active` -> `superseded` or `retired`.\
An ID is never reused.\
A replaced entry keeps its ID and flips status; the replacement carries `supersedes`, so every citation continues to resolve.\
Retirement removes force, never addressability.

**Change lifecycle.**\
Every change passes the same gate, and the gate does not care who authored it.

```text
edit an entry
  -> regenerate derived regions        generate-index.mjs
  -> run every checker                 check-all.sh
  -> refuse the change on any failure  non-zero exit
  -> commit, one concern per commit
```

**Routing at read time** is the corpus's only runtime behaviour.\
A reader loads the ledger, matches its situation against `hydrate-when` conditions, and opens what matches.\
Nothing is preloaded; nothing is resident.

---

## 8. Verification

**Every checker, run as one gate.**\
A claim about this corpus is proved by running them, not by reading it.

<!-- BEGIN GENERATED: architecture-checks. Run tools/generate-architecture.mjs; do not edit by hand. -->
| The gate holds | By |
|---|---|
| repository structure is documented | `check-structure.sh` |
| rules and enforcers are paired | `check-enforcers.sh` |
| tool index matches the directory | `check-tool-docs.sh` |
| entry bodies match their category | `check-entry-body.sh` |
| the board and the backlog agree | `check-board.mjs` |
| the decision register is well formed | `check-decisions.mjs` |
| applies-to names exactly the declared traits | `check-traits.mjs` |
| a retired id is never issued again | `check-id-reuse.mjs` |
| the tested communication guidance landed unreworded | `check-guidance-placement.sh` |
| index is derived, not typed | `generate-index.mjs` |
| the current architecture's structure is derived | `generate-architecture.mjs` |
| catalogue graph resolves | `skill-graph.mjs` |
| entries conform to their contract | `schemas test suite` |
| standing-context template holds | `check-standing-context.sh` |
| this repo's own standing context holds | `check-standing-context.sh` |
| every changed markdown file keeps the style rules a script can hold | the `s*` tools, on changed files |
<!-- END GENERATED: architecture-checks -->

**Two disciplines the harness cannot hold, applied by hand.**

- **Mutation proof.** A new guard is validated by injecting the defect it claims to catch and observing failure. A guard that has never been shown to bite is not counted.
- **Measured against inferred.** Every claim states which it is. The harness cannot check this, and it is the discipline most load-bearing to the corpus's own credibility.

**What verification cannot reach.**\
Whether an entry's reasoning is correct, whether a rule is worth having, and whether anyone acts on it.\
All three are settled by use and by challenge, not by a script.

---

## 9. Risks, divergence, and the owed-and-open register

Full findings are in [`BACKLOG.md`](BACKLOG.md), which is the register.\
Structural risks only, here.

| Risk | Consequence | Held by |
|---|---|---|
| **The corpus cannot observe its own adopters.** | Its central success measures are unmeasurable from inside. | `B54` |
| **No work-type produces a board, a delta or a vision.** | Those artifacts cannot be claimed as work. | `B71` |

Every artifact type this corpus prescribes and applies to itself is held at its fixed name in `docs/`.\
The delta loop is for projects that use the corpus, not for its own development (`0082`); its two deltas are the record of the changes they declared, and with every ratified decision built there is no separate target.

---

## 10. Mechanics, rationale, and consequence

**Mechanics.**\
Twenty sovereign directories, one duty each, split by whether their contents state what must be true or do something.\
Every ID-bearing entry carries machine-checked frontmatter, a stable identity, and a routing condition.\
Derived surfaces are generated from the entries.\
Every checker in the gate runs on every change and refuses it on any failure.

**Rationale.**\
The reader starts cold and retains nothing, so a rule must be findable from a situation rather than from prior knowledge, citable so a decision can name what it rests on, and held by a machine wherever a machine can hold it.\
One home per rule is what keeps the corpus trustworthy as it grows: two copies read as authoritative in both places and drift in one.

**Consequence of violation.**

- A rule in two places drifts silently, and both copies keep reading as authoritative.
- A hand-typed index omits what nobody remembered to add, and nothing detects it.
- An entry with no routing condition is reachable only by someone who already knew it existed, which is the population that needs it least.
- A reused ID makes an old citation resolve to new content, which fails silently and is worse than a broken link.
- A rule claiming enforcement it does not have is trusted exactly where it is weakest.
