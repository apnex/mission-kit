# mission-kit - system architecture

**Instant: current state.**\
This document describes mission-kit as it is built and holds today, not as it is intended to become.\
There is no target-state companion, because current and target have not yet diverged in structure: the open work recorded in [`BACKLOG.md`](BACKLOG.md) adds to this shape rather than replacing it.\
Ratifying a decision that changes the shape without building it creates that divergence, and the split happens then rather than in anticipation of it.

Written in the present tense of a system that exists.\
It contains no plan, estimate, migration or progress report; those belong to a delta and to the board.

**This document fails `AR1`'s own acceptance falsifier, and does so structurally.**\
`AR1` requires a current projection to be derived from the exit criteria of completed transitions and never hand-authored.\
This corpus has run no transitions, so that source does not exist and this document is hand-authored.\
The defect was predicted before it was met and is recorded as `B8`; it is stated here rather than concealed, because an architecture that hid its own non-conformance would be the drifted specification this corpus exists to prevent.

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
| 6. Entity model and interfaces | **provisional** | `B5` lands and `set` becomes a defined term |
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
| **A3** Sovereign Composition | `any-system` | Sixteen layers, one concern each, cited by prefix and never merged. Composition is by edge and citation rather than by nesting. | The components layer holds one entry, so composition is asserted more than exercised. |
| **A4** Zero-Loss Knowledge | `any-system` | Corrections are retained under banners; deferrals carry revival triggers; claims distinguish measured from inferred. | Rulings live in commit messages rather than a register (`B15`), so rationale is recoverable only by reading history. |
| **A8** Gated Recursive Integrity | `any-system` | Sixteen checkers gate every change, and the corpus's own author is refused by them. | Enforcement covers structure and style; it cannot reach whether an entry's reasoning is correct. |
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

Sixteen sovereign directories, one duty each.\
**A layer that holds knowledge takes an ID prefix and appears in the ledger; a layer that holds mechanism takes none.**\
That split is the load-bearing rule of this section.

### Knowledge layers - ID-bearing, indexed, citable

| Layer | Prefix | Duty | Exposes | Consumes |
|---|---|---|---|---|
| `axioms/` | `A` | first principles: why a design is correct rather than merely working | standing commitments, tagged by applicability | nothing - the root of the chain |
| `roles/` | `R` | who may attest, approve or decide | the M axis of work composition | `A` |
| `domains/` | `D` | subject surfaces work acts on | the N axis of work composition | `A` |
| `work-types/` | `W` | units of work and their evidence contracts | the composition rule and closeability preflight | `A`, `R`, `D` |
| `methodology/` | `M` | how work is conducted | procedures: review, audit, deferral, bootstrap | `A`, `AR` |
| `style/` | `S` | how artifacts are written | writing rules, each paired with an enforcer | `A` |
| `patterns/` | `P` | recurring solution shapes | shapes to build to | `A` |
| `skills/` | `K` | executable operator capability | invocable procedures with declared edges | `A`, `M` |
| `entities/` | `E` | what a thing is - definition, never mechanism | precise terms the corpus leans on | `A` |
| `components/` | `C` | sovereign shareable substrates | a registry of units to use rather than rebuild | `A`, `AR` |
| `artifacts/` | `AR` | engineering document types | shapes with acceptance falsifiers | `A`, `M` |
| `schemas/` | `SC` | machine-verifiable entity contracts | JSON Schema, validatable without a runtime | nothing - contracts are self-contained |
| `backlog/` | `MREQ` | deferred requests to run a future mission | parked work with armed revival conditions | `A`, `M` |

### Mechanism layers - no prefix, no ledger entry

| Layer | Duty | Exposes | Consumes |
|---|---|---|---|
| `tools/` | hold the corpus to its own rules | sixteen checkers and two generators | every layer, as input |
| `bundles/` | compose skills into operator roles by declared edge | role definitions | `K` |
| `plugins/` | operator artifacts that run inside a specific agent host | host-specific surfaces | `K`, `M` |

### Instance layer - the single exception

| Layer | Duty |
|---|---|
| `docs/` | this corpus's own artifact instances, at the address [`AR0`](../artifacts/README.md) prescribes |

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
It is a set reference that resolves to nothing a reader can open, which is `B5`.

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

**Sixteen checkers, run as one gate.**\
A claim about this corpus is proved by running them, not by reading it.

| Class | Holds |
|---|---|
| Structure | every directory documented and carrying a README; the tool index matching the directory |
| Identity | IDs unique, resolvable, never duplicated |
| Contract | frontmatter valid against `SC1`; body sections valid against `SC6` |
| Derivation | every generated region regenerable and byte-identical - the index is derived, never typed |
| Graph | every citation resolves; the skill graph is acyclic; bundle edges resolve |
| Style | six rules, each with a paired enforcer, each auto-fixable or explicitly not |
| Pairing | every rule that claims enforcement has an enforcer, checked by `check-enforcers.sh` |

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
| **Set-level properties are unstated.** All four claimed properties are per-entry; nothing is claimed or checked about the corpus as a whole. | No set can detect its own gaps, imbalance, or redundancy. Three findings this session sat on this axis. | `B3`, `B4`, `B5`, `B6` |
| **Ten of sixteen layers have no observed consumer.** | Composition may be theoretical. A layer nothing cites cannot be shown to be load-bearing. | `B13` |
| **No decision register.** Rulings live in commit messages. | Rationale is recoverable only by reading history, and `AR4` is prescribed to adopters while unheld here. | `B15` |
| **The corpus cannot observe its own adopters.** | Its central success measures are unmeasurable from inside. | `T3`, `MREQ-10` |
| **Instance coverage is incomplete.** | Vision and backlog exist; architecture is this document; no board. `AR3` remains the only type never checked against an instance. | `B1`, `B9` |

**Owed and not yet designed.**

- A **board**, which is the next position in the loop and the artifact that would rank everything above.
- A **decision register**, and a ruling on whether commit messages are a conformant carrier.
- A **set entity**, on which four of the five structural risks depend.
- A **territory statement** for every set, without which completeness is unaskable.

---

## 10. Mechanics, rationale, and consequence

**Mechanics.**\
Sixteen sovereign layers, one duty each, split by whether their contents state what must be true or do something.\
Every ID-bearing entry carries machine-checked frontmatter, a stable identity, and a routing condition.\
Derived surfaces are generated from the entries.\
Sixteen checkers gate every change and refuse it on any failure.

**Rationale.**\
The reader starts cold and retains nothing, so a rule must be findable from a situation rather than from prior knowledge, citable so a decision can name what it rests on, and held by a machine wherever a machine can hold it.\
One home per rule is what keeps the corpus trustworthy as it grows: two copies read as authoritative in both places and drift in one.

**Consequence of violation.**

- A rule in two places drifts silently, and both copies keep reading as authoritative.
- A hand-typed index omits what nobody remembered to add, and nothing detects it.
- An entry with no routing condition is reachable only by someone who already knew it existed, which is the population that needs it least.
- A reused ID makes an old citation resolve to new content, which fails silently and is worse than a broken link.
- A rule claiming enforcement it does not have is trusted exactly where it is weakest.
