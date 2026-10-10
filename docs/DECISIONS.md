# mission-kit - decision register

The director's rulings on mission-kit, one record per ruling.\
An [`AR4`](../artifacts/AR4-decision-record.md) instance in its register form, held by the corpus that publishes the type.

---

## Status

**Authority.**\
The director, for every row; rows are drafted by agents.\
**Backfilled 2026-10-04** from the audits, the backlog, the board, the surveys, the deltas and commit messages, oldest first.\
**The classification of each row - general or project - was drafted by an agent and confirmed by the director on 2026-10-05, for rows `0001`-`0075`.**\
Attribution is inferred, not recorded, for `0003`, `0009` and `0039`; the director confirmed them with the rest.

**Kinds.**

- **general** - a rule true for any project using the corpus. It belongs in the product, and `affects` names the entries that must state it; `absorbed` says whether they do.
- **project** - a decision about mission-kit's own work. It stays in this record and affects no entry.

**Status.**\
`ratified` for a ruling in force, `proposed` for one not yet ruled, `superseded by` for one replaced.\
A ruling is changed only by a later row that `supersedes` or `amends` it, never by editing the row.

**Adding a row.**\
A ruling gets a row in the change that applies it, and the commit cites the row's id; commit messages are not a carrier of rulings (`0074`).

**Checked by** `tools/check-decisions.mjs`: ids unique and in order, every general row names entries that exist, every project row names none, every lineage reference resolves.\
Whether an entry actually states a ruling is checked by reading, not by script.

**Absorbed during the backfill.**\
`0020` was applied in five places and stated in none; the root README now states it.

**Known defects of the backfill.**

- Rows with no recorded alternative fail `AR4`'s first falsifier; their bodies say so.
- `0008` was contested: a later change, approved within the vision recheck, named protection against hostile actors as a gap, which `0008` read alone placed out of scope. The director ruled on 2026-10-05 that the good-faith assumption covers collaborators only (`0075`).

---

## Decision records

| id | date | ruling | kind | authority | status | lineage | affects | absorbed |
|---|---|---|---|---|---|---|---|---|
| 0001 | 2026-07-05 | A14 Compounding Learning is ratified as an axiom: take the path of greatest learning, treating learning as invested, compounding capital. | general | director | ratified | - | `axioms/A14-compounding-learning.md` | yes |
| 0002 | 2026-07-25 | Mission-kit skills are a living upstream: references to owned upstream are living pointers and are never SHA-pinned; immutable content-addressing is kept for irreversible external effects. | general | director | ratified | - | `skills/workgraph-arc-operator/SKILL.md` | yes |
| 0003 | 2026-08-22 | Recurrence-tier evidence (MREQ-10, now B54) is won't-do: artifact entries stop tracking recurrence, because a corpus cannot measure its own uptake. | project | director | ratified | - | - | - |
| 0004 | 2026-09-02 | VISION.md is ratified as the corpus's own vision, stated as terminal state. | project | director | ratified | - | - | - |
| 0005 | 2026-09-14 | Set becomes its own entity rather than a property of the layer entity. | general | director | ratified | - | `entities/E3-set.md`, `entities/E2-layer.md` | yes |
| 0006 | 2026-10-02 | Growth of a charter must be paid for: added size is acceptable only where it materially advances E4 and improves the charter's quality and efficacy. | general | director | ratified | - | `entities/E4-charter.md`, `methods/M11-change-a-charter.md` | yes |
| 0007 | 2026-10-02 | A charter should expose the weight and balance of its items. | general | director | ratified | - | `entities/E4-charter.md` | yes |
| 0008 | 2026-10-02 | Malice is out of scope by design: collaborating agents are assumed to act in good faith, and defending against accidental misalignment, including an agent's own error, is in scope. | general | director | ratified | - | `axioms/README.md` | yes |
| 0009 | 2026-10-02 | Mission-kit is an operating system for a single agent as much as for a multi-agent system; for a lone agent the actor most likely to be wrong is itself. | general | director | ratified | - | `README.md` | yes |
| 0010 | 2026-10-02 | An organisation is one agent or many, operating with mission-kit; the word is defined in the charter rather than the vision revised. | general | director | ratified | - | `README.md` | yes |
| 0011 | 2026-10-02 | Improvements to existing charter words are permitted where they advance the document toward its best form in context, weighed for cost against quality on the same paid-for test as additions. | general | director | ratified | - | `methods/M11-change-a-charter.md`, `entities/E4-charter.md` | yes |
| 0012 | 2026-10-02 | A board instance is not the product; an artifact type describing boards for any project is, so procedures meant for every project must not be written into a board. | project | director | ratified | - | - | - |
| 0013 | 2026-10-02 | A board can and should cite corpus content; what does not belong in an instance is content intended for every project, so the test is the intended reader, not the kind of content. | project | director | ratified | amends 0012 | - | - |
| 0014 | 2026-10-02 | Multi-tag axiom binding: any one of an axiom's applicability tags suffices for it to bind. | general | director | ratified | - | `traits/README.md`, `axioms/README.md` | yes |
| 0015 | 2026-10-02 | Applicability tags name characteristics of the system being worked on and get their own layer, traits, prefix T. | general | director | ratified | - | `traits/README.md`, `README.md` | yes |
| 0016 | 2026-10-02 | A lone agent must check its own work by means its reasoning cannot bias; a fresh sub-agent with no shared context is the strongest such self-check and is still a self-check, not independent assurance. | general | director | ratified | - | `roles/README.md` | yes |
| 0017 | 2026-10-02 | Any cited online address must be proven empirically, by fetching it, not to be a hallucination. | general | director | ratified | - | `roles/README.md` | yes |
| 0018 | 2026-10-03 | The product-data gap is closed by option B, a seventh domain, D7 product-data. | project | director | ratified | - | - | - |
| 0019 | 2026-10-03 | Domains, work-types and traits are under-defined collections: when a gap is determined it is on us to expand them, closing it with a new member rather than stretching a neighbour. | general | director | ratified | - | `domains/README.md`, `work-types/README.md`, `traits/README.md`, `entities/E4-charter.md` | yes |
| 0020 | 2026-10-03 | Each relationship between the axis layers is declared once, on the side whose meaning includes it, and reverse views are generated, never hand-kept (the director's rule 1). | general | director | ratified | - | `README.md` | yes |
| 0021 | 2026-10-03 | Objective: a context-less agent can read the corpus and compose the context it needs from deterministic tags, definitions and triggers. | general | director | ratified | - | `README.md` | yes |
| 0022 | 2026-10-03 | Q-A: axioms bind systems; a change answers to the system it modifies and every system containing it, but not one it only composes with unless it changes their contract; where no boundary is declared, both bind. | general | director | ratified | - | `axioms/README.md`, `entities/E5-system.md` | yes |
| 0023 | 2026-10-03 | An axiom's mandate is an asymptote: no change may move a system away from it, each change moves toward it as far as its scope allows, a gap outside the scope is recorded with a revival trigger and selection left to the director; M7's caution governs reasoning about facts; a system entity is approved. | general | director | ratified | - | `axioms/README.md`, `methods/M7-axiom-alignment-audit.md`, `entities/E5-system.md` | yes |
| 0024 | 2026-10-03 | Opportunistic improvement to adjacent or related components is considered, not mandated, and judged by compounding learning. | general | director | ratified | - | `axioms/README.md`, `axioms/A14-compounding-learning.md` | yes |
| 0025 | 2026-10-03 | Axiom wording is made consistent with the asymptote reading across all fourteen axioms. | general | director | ratified | - | `axioms/A1-sovereign-state-transparency.md`, `axioms/A2-isomorphic-specification.md`, `axioms/A3-sovereign-composition.md`, `axioms/A4-zero-loss-knowledge.md`, `axioms/A5-perceptual-parity.md`, `axioms/A6-frictionless-agentic-collaboration.md`, `axioms/A7-resilient-agentic-operations.md`, `axioms/A8-gated-recursive-integrity.md`, `axioms/A9-chaos-validated-deployment.md`, `axioms/A10-autopoietic-evolution.md`, `axioms/A11-cognitive-minimalism.md`, `axioms/A12-precision-context-engineering.md`, `axioms/A13-director-intent-amplification.md`, `axioms/A14-compounding-learning.md` | yes |
| 0026 | 2026-10-03 | Component is defined alongside system, so that between them they set duty, interfaces, blast radius and change. | general | director | ratified | - | `entities/E6-component.md`, `entities/E5-system.md` | yes |
| 0027 | 2026-10-03 | A boundary separates two units only where declared and honoured; a unit reaching past a declared interface stays one system with it, and a detected bypass is a signal triggering evaluation of the interface against the component's duty and vision, ending in rerouting the consumer or adjusting the interface. | general | director | ratified | amends 0022 | `entities/E5-system.md`, `entities/E6-component.md`, `axioms/A3-sovereign-composition.md`, `axioms/README.md` | yes |
| 0028 | 2026-10-03 | Undeclared neighbour (A): a change that alters what an undeclared neighbour reaches into owns that boundary, so declaring and honouring the interface is in its scope; adjacency is not widened. | general | director | ratified | - | `entities/E5-system.md` | yes |
| 0029 | 2026-10-03 | Merge transitivity (A): the undeclared-boundary merge chains only through what the change can reach. | general | director | ratified | - | `entities/E5-system.md` | yes |
| 0030 | 2026-10-03 | Container traits (A): a system has a trait if it, or any part it contains, passes the trait's test. | general | director | ratified | - | `entities/E5-system.md`, `traits/README.md` | yes |
| 0031 | 2026-10-03 | Q-B (A): the organisation doing the work is a system with traits of its own; its axioms bind how work is done, asked separately from what a product change answers to. | general | director | ratified | - | `entities/E5-system.md` | yes |
| 0032 | 2026-10-03 | A3 (A, strengthened by the director): a new capability is never bolted onto an existing unit, and improving a unit toward its limit within its duty, including fracturing it, re-cutting its seams and recomposing, is explicitly encouraged, not mandated. | general | director | ratified | - | `axioms/A3-sovereign-composition.md`, `axioms/README.md` | yes |
| 0033 | 2026-10-03 | A declared floating version range is adoption in advance: a release within it alters every consumer bound by the range. | general | director | ratified | - | `entities/E5-system.md` | yes |
| 0034 | 2026-10-03 | 'As much as the touch allows' (A): a change must close only the part of a gap its own work already alters; restructuring beyond that, even in the same component, is encouraged, not required. | general | director | ratified | amends 0024 | `axioms/README.md` | yes |
| 0035 | 2026-10-03 | Changing an unversioned interface does not oblige adding versioning (A): doing so is encouraged, and otherwise the gap is recorded. | general | director | ratified | - | `entities/E5-system.md` | yes |
| 0036 | 2026-10-03 | Four kinds of how-to-do-work content are distinct - procedures, practices, rules and units of work - and a skill is packaging, not a kind of content. | general | director | ratified | - | `README.md`, `methods/README.md` | yes |
| 0037 | 2026-10-03 | A procedure is the single source of its content and reaches a cold agent by trigger, an installed agent and a coordinating system; a skill exists only where tooling makes packaging necessary; humans are not the primary consumer. | general | director | ratified | - | `skills/README.md`, `methods/README.md` | yes |
| 0038 | 2026-10-03 | The vision is amended before any layer change: mission-kit prescribes how work is done, and 'not a process framework' becomes 'not a ceremony framework'. | project | director | ratified | amends 0004 | - | - |
| 0039 | 2026-10-03 | Q6 ratified: a work-type cites the procedures that conduct it, and the reverse view is generated. | general | director | ratified | - | `work-types/README.md`, `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json` | yes |
| 0040 | 2026-10-03 | Rename methodology/ to methods/ (category method). | project | director | ratified | - | - | - |
| 0041 | 2026-10-03 | Downstream breakage is not a reason to carry legacy. | general | director | ratified | - | `README.md`, `methods/M13-change-a-set.md` | yes |
| 0042 | 2026-10-03 | Q4: practices and rules are two layers, rules/ (RU) and practices/ (PC), to keep the separation simple, even with one practice. | general | director | ratified | - | `README.md`, `rules/README.md`, `practices/README.md` | yes |
| 0043 | 2026-10-03 | Communication with a human is designed now, as a set spanning layers rather than a layer, for a human with limited context who may be cold. | project | director | ratified | - | - | - |
| 0044 | 2026-10-03 | Charters of populations spanning layers live in a sets/ layer (ST), whose charter declares its members. | general | director | ratified | - | `sets/README.md`, `entities/E4-charter.md`, `README.md` | yes |
| 0045 | 2026-10-03 | A competent cold reader is assumed to know general engineering terms; only system-specific names must be explained. | general | director | ratified | - | `style/S15-message-to-a-human.md` | yes |
| 0046 | 2026-10-03 | Guide the human through any communication needing them to understand or decide: progressive disclosure, the point first, one question at a time, depth on request; the implementation is the agent's to design. | general | director | ratified | - | `methods/M10-guided-dialogue.md`, `style/S15-message-to-a-human.md` | yes |
| 0047 | 2026-10-03 | End a message with two or three short follow-on picks, each prefixed with one word - Continue, Explore, Return - marking which continues the main work. | general | director | ratified | - | `style/S15-message-to-a-human.md` | yes |
| 0048 | 2026-10-03 | Communication changes are evaluated on the human, through a process the director can run, rather than by agents scoring agents. | project | director | ratified | - | - | - |
| 0049 | 2026-10-03 | Delta-1 revision 4 is ratified, to run before the explain guidance lands (option C). | project | director | ratified | - | - | - |
| 0050 | 2026-10-03 | Delta-1's L5 drop is the change working as intended, so the rubric is corrected after the scores. | project | director | ratified | - | - | - |
| 0051 | 2026-10-03 | backlog/ does not survive as a layer: its ten MREQ entries become rows B45-B54, full text kept in docs/requests/. | project | director | ratified | - | - | - |
| 0052 | 2026-10-04 | Constraint 2/9 (A): same-agent review is never a valid degradation; with no second agent the gate waits or the director ratifies. | general | director | ratified | - | `work-types/README.md`, `roles/README.md` | yes |
| 0053 | 2026-10-04 | Composition (A): a unit of work stays role x work-type x domain; the work-type cites the method that conducts it and the artifact it produces; axioms come from the systems altered; W0 states the reading order once. | general | director | ratified | - | `work-types/README.md` | yes |
| 0054 | 2026-10-04 | A territory claims scope, not holdings: the style set should cover commit messages, code names and code comments, and a missing member does not invalidate the claim - that is how gaps are found. | general | director | ratified | - | `style/README.md` | yes |
| 0055 | 2026-10-04 | A charter holds its set's vision and manages the set against it: a territory's partition comes from the population but its extent from purpose, so an unfilled claim is a gap, never a reason to cut the claim. | general | director | superseded by 0065 | - | `entities/E4-charter.md` | yes |
| 0056 | 2026-10-04 | Ruling A: the organisation's coordination and governance machinery and its knowledge corpus are engineered products, each domain holding its source and live state; a part splits only where work on a portion is proved differently and the split has been found needed. | general | director | ratified | - | `domains/README.md`, `work-types/README.md` | yes |
| 0057 | 2026-10-04 | The corpus carries no legacy: a moved or retired entry leaves no stub, takes a new id, and non-reuse is held by check-id-reuse from git history. | general | director | ratified | amends 0041 | `README.md`, `methods/M13-change-a-set.md` | yes |
| 0058 | 2026-10-04 | P1 Path A / Path B moves to style as S16, under a new identifier with no stub. | project | director | ratified | - | - | - |
| 0059 | 2026-10-04 | Gate, evidence and substrate are defined as entities before the K0 charter is converted. | project | director | ratified | - | - | - |
| 0060 | 2026-10-04 | A gate has one meaning, in three kinds by who judges. | general | director | ratified | - | `entities/E7-gate.md` | yes |
| 0061 | 2026-10-04 | A gate's verdict is binary: extra results map to pass or fail, no verdict is an absence, and an exception is the director's override. | general | director | ratified | - | `entities/E7-gate.md`, `methods/M7-axiom-alignment-audit.md`, `work-types/README.md` | yes |
| 0062 | 2026-10-04 | Director ratification in place of an absent independent agent is the gate decided by the director, a recorded change of kind; the director does not become a verifier. | general | director | ratified | amends 0052 | `entities/E7-gate.md`, `roles/README.md` | yes |
| 0063 | 2026-10-04 | Evidence (A): a verdict is never evidence; evidence is what a judge receives. | general | director | ratified | - | `entities/E8-evidence.md` | yes |
| 0064 | 2026-10-04 | Substrate (A): substrate means the coordination substrate only; every other sense is replaced and the substrate-audit skill is renamed repo-audit. | general | director | ratified | - | `entities/E9-substrate.md`, `skills/repo-audit/SKILL.md` | yes |
| 0065 | 2026-10-04 | A charter is an asymptote: it states end state, scope and growth policy; partitions and gaps belong to dated investigations, gaps become backlog rows weighed by the board, and a charter does not name its members. | general | director | ratified | supersedes 0055 | `entities/E4-charter.md`, `entities/E3-set.md` | yes |
| 0066 | 2026-10-04 | Fork owners are not contacted before a history rewrite - contacting them is rude and not the safeguard; a fork holding no rewritten commit is untouched, one that does is a reason to defer. | general | director | ratified | - | `rules/RU4-publishing-rewritten-history.md` | yes |
| 0067 | 2026-10-04 | Eval runs and their results polluted the published repo: runs are local working material, never published, and history is purged of them as a defect. | project | director | ratified | - | - | - |
| 0068 | 2026-10-04 | A provenance record in another repository pinning a rewritten commit is external and out of scope for the purge. | project | director | ratified | - | - | - |
| 0069 | 2026-10-04 | A charter must not know it is being investigated: no link to or passage naming an investigation; the dependency runs one way. | general | director | ratified | amends 0065 | `entities/E4-charter.md` | yes |
| 0070 | 2026-10-04 | Probes that ask for a gap or partition charters no longer hold are retired, each kept with its question and reason; the class ruling later retires H7, k0 Q5, k0 Q6 and L5. | project | director | ratified | - | - | - |
| 0071 | 2026-10-04 | A charter is a vision applied to its set (AR6's devices) plus operating instructions; Purpose becomes Vision and Operation joins the fixed headings; members need not know their set. | general | director | ratified | amends 0065 | `entities/E4-charter.md`, `entities/E3-set.md`, `schemas/SC6-entry-body.md` | yes |
| 0072 | 2026-10-04 | Operating a charter (changing its text, M11) is distinct from operating the set it governs (changing its population, M13). | general | director | ratified | amends 0071 | `methods/M13-change-a-set.md`, `entities/E4-charter.md`, `methods/M11-change-a-charter.md` | yes |
| 0073 | 2026-10-04 | Close M5: finish what an agent can do now, hold what needs the director (B42), close the milestone. | project | director | ratified | - | - | - |
| 0074 | 2026-10-04 | Commit messages are not a conformant carrier for this corpus's rulings: a history rewrite changes their ids, and a commit cannot be superseded or amended by itself; they may cite a ruling's id. | project | director | ratified | - | - | - |
| 0075 | 2026-10-05 | The good-faith assumption covers collaborating agents only: a collaborator's malice is out of the axioms' scope, while a hostile outsider and untrusted input are inside it. | general | director | ratified | amends 0008 | `axioms/README.md` | yes |
| 0076 | 2026-10-05 | Every structured document has one fixed name and location, in upper case: VISION.md at the component root; docs/ARCHITECTURE.md, ARCHITECTURE-TARGET.md, BOARD.md, BACKLOG.md, DECISIONS.md (or DECISIONS/<NNNN>.md), and DELTAS/DELTA-<N>.md. | general | director | ratified | - | `artifacts/README.md` | yes |
| 0077 | 2026-10-05 | Each artifact type declares the fixed path of its instances in `instance-path`, required by the catalogue contract; the artifacts charter states the rule and its index shows the paths in a generated column, naming no type itself. | general | director | ratified | amends 0076 | `artifacts/README.md`, `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json`, `tools/generate-index.mjs` | yes |
| 0078 | 2026-10-05 | A backlog row's scores are declared once, on the row; the board's triage ledger and held list are generated from the record, holding is read from the plan, and a ruled decision leaves the board. | general | director | ratified | - | `artifacts/AR3-board.md`, `artifacts/AR5-backlog.md`, `tools/check-board.mjs` | yes |
| 0079 | 2026-10-05 | Work-types declare the artifact types they produce: W14 a target architecture, W16 and W20 backlog entries, W23 a decision record; each artifact type shows its producers in a generated section, and the types no work-type produces are a recorded gap. | general | director | ratified | - | `work-types/W14-design-a-contract-or-invariant.md`, `work-types/W16-bank-idea-or-knowledge-capital.md`, `work-types/W20-reconcile-ledger.md`, `tools/generate-index.mjs` | yes |
| 0080 | 2026-10-05 | A current architecture's structural sections are generated from the system's own source where structure can be read from it; its reasoning sections stay authored. | general | director | ratified | - | `artifacts/AR1-system-architecture.md`, `tools/generate-architecture.mjs` | yes |
| 0081 | 2026-10-05 | A delta closes part of the gap between the current architecture and the target, the target being the current plus every ratified decision not yet built; a delta is opened when a ratified decision cannot be built in one change, and is adversarially reviewed by an agent that did not draft it before the director ratifies it. | general | director | ratified | - | `artifacts/AR2-delta.md`, `artifacts/AR1-system-architecture.md`, `artifacts/AR4-decision-record.md` | yes |
| 0082 | 2026-10-05 | The delta loop is for projects that use the corpus, not for mission-kit's own development; its two deltas stay as the record of the changes they declared. | project | director | ratified | - | - | - |
| 0083 | 2026-10-07 | Every axiom is to carry an adherence trap - a task that observes whether an agent acts on it - with the explain guidance and A11, A2, A13 and A4 first, then A3 and A14, then the rest. | project | director | ratified | - | - | - |
| 0084 | 2026-10-09 | The adherence suite runs agents on three model families - Claude, Gemini and GPT - across all three context arms, and each outcome is scored by the two families that did not produce it. | project | director | ratified | - | - | - |
| 0085 | 2026-10-10 | The explain guidance is measured in the standing evaluation suite by agent judges across families in every run, and the director's human-judged evaluation periodically calibrates those judges. | project | director | ratified | - | - | - |
| 0086 | 2026-10-10 | The standing evaluation suite design, draft v3, is ratified as written, including the author's choices it lists: the digest arm, the misreading register, a gate that blocks unless overruled, a full run at each milestone close, and calibration of explain judges every second full run. | project | director | ratified | - | - | - |
| 0087 | 2026-10-10 | The universal part of agent evaluation is a component in its own repository, apnex/agent-evals, used by mission-kit and zorg; mission-kit's standing suite keeps its scenarios, keys and results here and uses that component, and a component entry is admitted only once it is usable. | project | director | ratified | - | - | - |
| 0088 | 2026-10-10 | The shared evaluation component is named context-lab, repository apnex/context-lab, and its north star is that any project can find out, by experiments anyone can repeat, how the context it gives its agents changes what they understand and do. | project | director | ratified | amends 0087 | - | - |
| 0089 | 2026-10-10 | context-lab's vision is ratified; from here its rulings are recorded in its own register, and this register records only rulings about how mission-kit uses it. | project | director | ratified | - | - | - |
| 0090 | 2026-10-10 | The component registry's size is a bound on the registry intended - tens of duties, never thousands - and neither a target nor a cap: the count alone never admits, splits, merges, removes or refuses a member, and a count far beyond that scale calls for an investigation of the set. | general | director | ratified | - | `components/README.md` | yes |

---

## Records

### 0001

**Ruling.**\
A14 Compounding Learning is ratified as an axiom: take the path of greatest learning, treating learning as invested, compounding capital.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - an axiom binding every adopting system

**Source.**\
`[V, commit 80e7294 (subject: 'Director-ratified 2026-07-05')]`

### 0002

**Ruling.**\
Mission-kit skills are a living upstream: references to owned upstream are living pointers and are never SHA-pinned; immutable content-addressing is kept for irreversible external effects.

**Alternatives refuted.** exact SHA-pinned effect inputs (fe56a2f)

**Kind.** general - a rule for any agent referencing the corpus

**Lineage.** fe56a2f inverted the rule to 'effect inputs are exact' (agent change, not a recorded ruling)

**Source.**\
`[V, commit c1e96cc]`

### 0003

**Ruling.**\
Recurrence-tier evidence (MREQ-10, now B54) is won't-do: artifact entries stop tracking recurrence, because a corpus cannot measure its own uptake.

**Alternatives refuted.** keep the two-tier recurrence field; name the evidence sample

**Kind.** project - disposition of one of mission-kit's own deferred requests

**Source.**\
`[V, commit aa5e9b6; docs/BACKLOG.md B54; docs/requests/mreq-10-recurrence-tier-evidence.md]`

### 0004

**Ruling.**\
VISION.md is ratified as the corpus's own vision, stated as terminal state.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** project - mission-kit's own vision, not a rule for adopters

**Source.**\
`[V, commit c78743e]`

### 0005

**Ruling.**\
Set becomes its own entity rather than a property of the layer entity.

**Alternatives refuted.** fold set into E2 layer as a property

**Kind.** general - defines a term every charter and adopter uses

**Source.**\
`[V, commit 24e3e0b ('Q2 ruled'); docs/BOARD.md 'Decisions required' Q2]`

### 0006

**Ruling.**\
Growth of a charter must be paid for: added size is acceptable only where it materially advances E4 and improves the charter's quality and efficacy.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - a rule for writing any charter

**Source.**\
`[V, commit be3c443; commit 10641c9 ('the director's criterion'); docs/audits/M5.4b-trial-verdict-A0.md]`

### 0007

**Ruling.**\
A charter should expose the weight and balance of its items.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - a rule for any charter

**Source.**\
`[V, commit 10641c9 ('per the director's earlier observation'); undated observation, recorded here at its first citation]`

### 0008

**Ruling.**\
Malice is out of scope by design: collaborating agents are assumed to act in good faith, and defending against accidental misalignment, including an agent's own error, is in scope.

**Alternatives refuted.** treat the gap as defence against an adversary

**Kind.** general - sets the scope of the axiom set for every adopter; not yet absorbed: stated only in docs/investigations/axioms-2026-10-04.md, no product entry

**Lineage.** the A0 trial's 'no axiom protects against an adversary'

**Source.**\
`[V, commit b318b85; docs/BACKLOG.md B21; docs/audits/M5.4b-trial-verdict-A0.md ('Corrected after director review')]`

### 0009

**Ruling.**\
Mission-kit is an operating system for a single agent as much as for a multi-agent system; for a lone agent the actor most likely to be wrong is itself.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - states who the corpus serves

**Source.**\
`[V, commit b318b85 ('The second ruling'); docs/BACKLOG.md B21, B23]`

### 0010

**Ruling.**\
An organisation is one agent or many, operating with mission-kit; the word is defined in the charter rather than the vision revised.

**Alternatives refuted.** revise VISION.md to name the lone agent; mint an entity for organisation

**Kind.** general - definition every reader relies on

**Lineage.**\
B23's proposed remedy, a vision revision

**Source.**\
`[V, commit adf823a; docs/BACKLOG.md B23]`

### 0011

**Ruling.**\
Improvements to existing charter words are permitted where they advance the document toward its best form in context, weighed for cost against quality on the same paid-for test as additions.

**Alternatives refuted.** preserve every original sentence verbatim

**Kind.** general - rule for changing any charter

**Lineage.** the M5.3/M5.4b trials' verbatim-preservation rule

**Source.**\
`[V, commit 50a9114]`

### 0012

**Ruling.**\
A board instance is not the product; an artifact type describing boards for any project is, so procedures meant for every project must not be written into a board.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** project - governs where mission-kit places its own content; stated in docs/README.md

**Source.**\
`[V, commit a1e44d5]`

### 0013

**Ruling.**\
A board can and should cite corpus content; what does not belong in an instance is content intended for every project, so the test is the intended reader, not the kind of content.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** project - governs mission-kit's own instance/product split; stated in docs/README.md

**Lineage.** a1e44d5's wording 'an instance holds no product content'

**Source.**\
`[V, commit 056e9e9]`

### 0014

**Ruling.**\
Multi-tag axiom binding: any one of an axiom's applicability tags suffices for it to bind.

**Alternatives refuted.** all tags must be satisfied

**Kind.** general - binding rule for every adopting system

**Source.**\
`[V, commit cda5228; docs/BACKLOG.md B26; docs/audits/M5.5-02-A0.md section 1.3]`

### 0015

**Ruling.**\
Applicability tags name characteristics of the system being worked on and get their own layer, traits, prefix T.

**Alternatives refuted.** fold into domains; fold into entities

**Kind.** general - adds a layer to the product structure

**Source.**\
`[V, commit f4fbb56]`

### 0016

**Ruling.**\
A lone agent must check its own work by means its reasoning cannot bias; a fresh sub-agent with no shared context is the strongest such self-check and is still a self-check, not independent assurance.

**Alternatives refuted.** a lone agent cannot verify its own work (the original R0 key); a fresh sub-agent counts as an independent identity

**Kind.** general - rule for any agent working alone

**Source.**\
`[V, commit a624c7f; docs/audits/M5.5-03-R0.md section 3b; docs/audits/eval-R0/SCORES.md; docs/BACKLOG.md B21, B29]`

### 0017

**Ruling.**\
Any cited online address must be proven empirically, by fetching it, not to be a hallucination.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - self-check rule for any agent

**Source.**\
`[V, commit 687d94e ('Director's example of a strong self-check')]`

### 0018

**Ruling.**\
The product-data gap is closed by option B, a seventh domain, D7 product-data.

**Alternatives refuted.** option A: leave the gap recorded and the set unchanged

**Kind.** project - a one-off admission to mission-kit's domain set

**Source.**\
`[V, docs/audits/M5.5-04-D0.md section 7; commit 0e37a43]`

### 0019

**Ruling.**\
Domains, work-types and traits are under-defined collections: when a gap is determined it is on us to expand them, closing it with a new member rather than stretching a neighbour.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - growth rule for sets in the product

**Source.**\
`[V, docs/audits/M5.5-04-D0.md section 7; commit 0e37a43; docs/BACKLOG.md B31]`

### 0020

**Ruling.**\
Each relationship between the axis layers is declared once, on the side whose meaning includes it, and reverse views are generated, never hand-kept (the director's rule 1).

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - structural rule for the corpus; not yet absorbed: applied per relationship (domains, style Held-by, schema 'methods') but stated as a general rule in no product entry

**Source.**\
`[V, commit 2142704; docs/BACKLOG.md B32; docs/surveys/b24-work-layers-survey.md ('director rule 1')]`

### 0021

**Ruling.**\
Objective: a context-less agent can read the corpus and compose the context it needs from deterministic tags, definitions and triggers.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - acceptance objective for the whole product

**Source.**\
`[V, commit 2142704; docs/BACKLOG.md B32]`

### 0022

**Ruling.**\
Q-A: axioms bind systems; a change answers to the system it modifies and every system containing it, but not one it only composes with unless it changes their contract; where no boundary is declared, both bind.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - binding rule for every adopting system

**Source.**\
`[V, commit b0ae880; docs/BACKLOG.md B32; docs/audits/eval-SYS/KEY.md]`

### 0023

**Ruling.**\
An axiom's mandate is an asymptote: no change may move a system away from it, each change moves toward it as far as its scope allows, a gap outside the scope is recorded with a revival trigger and selection left to the director; M7's caution governs reasoning about facts; a system entity is approved.

**Alternatives refuted.** axioms as invariants or constraints a change must not fail

**Kind.** general - how every axiom binds

**Source.**\
`[V, commits b0ae880, b7c30f4; docs/BACKLOG.md B34; docs/audits/M5.5f-asymptote-and-system.md; docs/audits/eval-AXDIR/KEY.md]`

### 0024

**Ruling.**\
Opportunistic improvement to adjacent or related components is considered, not mandated, and judged by compounding learning.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - rule for any change

**Source.**\
`[V, commit 5d67080; docs/BACKLOG.md B35; docs/audits/M5.5g-component-opportunistic-wording.md section 1; docs/audits/eval-COMPONENT/KEY.md]`

### 0025

**Ruling.**\
Axiom wording is made consistent with the asymptote reading across all fourteen axioms.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - wording of every axiom

**Source.**\
`[V, commit 5d67080; docs/BACKLOG.md B35; docs/audits/M5.5g-component-opportunistic-wording.md section 1]`

### 0026

**Ruling.**\
Component is defined alongside system, so that between them they set duty, interfaces, blast radius and change.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - definition used across the product

**Source.**\
`[V, commit 5d67080; docs/BACKLOG.md B35; docs/audits/M5.5g-component-opportunistic-wording.md section 1]`

### 0027

**Ruling.**\
A boundary separates two units only where declared and honoured; a unit reaching past a declared interface stays one system with it, and a detected bypass is a signal triggering evaluation of the interface against the component's duty and vision, ending in rerouting the consumer or adjusting the interface.

**Alternatives refuted.** declaration alone makes them two systems

**Kind.** general - system-boundary rule

**Lineage.** the Q-A ruling's 'where no boundary is declared, both bind' (amends: declared is no longer sufficient)

**Source.**\
`[V, commits e0e05bb, 428bcd2; docs/BACKLOG.md B36; docs/audits/M5.5h-01-bypassed-interface.md section 1]`

### 0028

**Ruling.**\
Undeclared neighbour (A): a change that alters what an undeclared neighbour reaches into owns that boundary, so declaring and honouring the interface is in its scope; adjacency is not widened.

**Alternatives refuted.** widen adjacency to dependence in fact

**Kind.** general - system-boundary rule

**Source.**\
`[V, commit 0670795; docs/BACKLOG.md B36 (history at d08b657); docs/audits/M5.5h-02-design-rulings.md; docs/audits/M5.5g-component-opportunistic-wording.md P-4]`

### 0029

**Ruling.**\
Merge transitivity (A): the undeclared-boundary merge chains only through what the change can reach.

**Alternatives refuted.** one undeclared reach merges a whole estate; the merge is strictly pairwise

**Kind.** general - system-boundary rule

**Source.**\
`[V, commit dc1db13; docs/BACKLOG.md B36 (history at d08b657); docs/audits/M5.5h-02-design-rulings.md; docs/audits/M5.5g-component-opportunistic-wording.md P-1]`

### 0030

**Ruling.**\
Container traits (A): a system has a trait if it, or any part it contains, passes the trait's test.

**Alternatives refuted.** traits are tested on the whole only

**Kind.** general - trait-binding rule

**Source.**\
`[V, commit 8933c68; docs/BACKLOG.md B36 (history at d08b657); docs/audits/M5.5h-02-design-rulings.md; docs/audits/M5.5g-component-opportunistic-wording.md P-2]`

### 0031

**Ruling.**\
Q-B (A): the organisation doing the work is a system with traits of its own; its axioms bind how work is done, asked separately from what a product change answers to.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - system-binding rule

**Source.**\
`[V, commit 7929a4e; docs/BACKLOG.md B36 (history at d08b657); docs/audits/M5.5h-02-design-rulings.md]`

### 0032

**Ruling.**\
A3 (A, strengthened by the director): a new capability is never bolted onto an existing unit, and improving a unit toward its limit within its duty, including fracturing it, re-cutting its seams and recomposing, is explicitly encouraged, not mandated.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - axiom mechanics

**Lineage.**\
A3's 'composing existing units, never by modifying them'

**Source.**\
`[V, commit d08b657; docs/BACKLOG.md B36; docs/audits/M5.5h-02-design-rulings.md]`

### 0033

**Ruling.**\
A declared floating version range is adoption in advance: a release within it alters every consumer bound by the range.

**Alternatives refuted.** each resolved upgrade is a separate change

**Kind.** general - system-boundary rule

**Source.**\
`[V, commit 724d7ce; docs/audits/M5.5h-02-design-rulings.md; docs/audits/M5.5g-component-opportunistic-wording.md P-5]`

### 0034

**Ruling.**\
'As much as the touch allows' (A): a change must close only the part of a gap its own work already alters; restructuring beyond that, even in the same component, is encouraged, not required.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - scope rule for any change

**Lineage.** amends the opportunistic-improvement ruling of 5d67080

**Source.**\
`[V, commit 7c2ebc2; docs/BACKLOG.md B36; docs/audits/M5.5h-02-design-rulings.md]`

### 0035

**Ruling.**\
Changing an unversioned interface does not oblige adding versioning (A): doing so is encouraged, and otherwise the gap is recorded.

**Alternatives refuted.** changing the interface requires adding versioning

**Kind.** general - interface-change rule

**Source.**\
`[V, commit a32fb4e; docs/BACKLOG.md B36]`

### 0036

**Ruling.**\
Four kinds of how-to-do-work content are distinct - procedures, practices, rules and units of work - and a skill is packaging, not a kind of content.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - layer structure of the product

**Source.**\
`[V, commits 4eb1588, 3ba835b; docs/surveys/b24-work-layers-survey.md Q1]`

### 0037

**Ruling.**\
A procedure is the single source of its content and reaches a cold agent by trigger, an installed agent and a coordinating system; a skill exists only where tooling makes packaging necessary; humans are not the primary consumer.

**Alternatives refuted.** the skill body as the content source

**Kind.** general - layer rule for methods and skills

**Source.**\
`[V, commits 4eb1588, 3ba835b; docs/surveys/b24-work-layers-survey.md Q2, Q5]`

### 0038

**Ruling.**\
The vision is amended before any layer change: mission-kit prescribes how work is done, and 'not a process framework' becomes 'not a ceremony framework'.

**Alternatives refuted.** leave the vision unchanged

**Kind.** project - mission-kit's own vision

**Lineage.**\
VISION.md 'Not a process framework'

**Source.**\
`[V, commits 4eb1588, 3ba835b, bac8b35; docs/surveys/b24-work-layers-survey.md Q3]`

### 0039

**Ruling.**\
Q6 ratified: a work-type cites the procedures that conduct it, and the reverse view is generated.

**Alternatives refuted.** a procedure names the work-types it serves

**Kind.** general - composition rule

**Source.**\
`[V, commit bac8b35; docs/surveys/b24-work-layers-survey.md Q6 (delegated, then ratified); docs/BACKLOG.md B24 history]`

### 0040

**Ruling.**\
Rename methodology/ to methods/ (category method).

**Alternatives refuted.** keep methodology/

**Kind.** project - a one-off rename of a mission-kit layer

**Source.**\
`[V, commit 8fba49b; docs/DELTAS/DELTA-1.md; docs/BACKLOG.md B24 history]`

### 0041

**Ruling.**\
Downstream breakage is not a reason to carry legacy.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - identity rule for any entry move

**Source.**\
`[V, commit 8fba49b; docs/DELTAS/DELTA-1.md lines 94, 109, 149]`

### 0042

**Ruling.**\
Q4: practices and rules are two layers, rules/ (RU) and practices/ (PC), to keep the separation simple, even with one practice.

**Alternatives refuted.** one layer with a declared kind

**Kind.** general - layer structure of the product

**Lineage.** resolves the B24 survey's contradictory Q4 pick

**Source.**\
`[V, commit 8bbafa8; docs/DELTAS/DELTA-1.md 'Q4 - two layers, ruled']`

### 0043

**Ruling.**\
Communication with a human is designed now, as a set spanning layers rather than a layer, for a human with limited context who may be cold.

**Alternatives refuted.** defer it; make it a layer (explain/)

**Kind.** project - decision to start mission-kit work (B38)

**Source.**\
`[V, commit 8bbafa8; docs/BACKLOG.md B38]`

### 0044

**Ruling.**\
Charters of populations spanning layers live in a sets/ layer (ST), whose charter declares its members.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - layer structure of the product

**Source.**\
`[V, commits 4f16698 ('two director decisions are open'), 80b4dbe ('as ruled'); docs/DELTAS/DELTA-2.md]`

### 0045

**Ruling.**\
A competent cold reader is assumed to know general engineering terms; only system-specific names must be explained.

**Alternatives refuted.** every term must be explained (the explain key)

**Kind.** general - rule for writing to a human

**Source.**\
`[V, commit 80b4dbe; docs/evals/README.md 'Suite edits' (explain)]`

### 0046

**Ruling.**\
Guide the human through any communication needing them to understand or decide: progressive disclosure, the point first, one question at a time, depth on request; the implementation is the agent's to design.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - rule for any agent addressing a human

**Source.**\
`[V, commits 540e64b, eee321c; docs/surveys/b38-director-communication-requirements.md (verbatim, reframed, Limit 1 confirmed)]`

### 0047

**Ruling.**\
End a message with two or three short follow-on picks, each prefixed with one word - Continue, Explore, Return - marking which continues the main work.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - rule for any agent addressing a human

**Source.**\
`[V, commits eee321c, fe58e32, 8e14b5c; docs/surveys/b38-director-communication-requirements.md 'Added by the director', 'Learned in the human evaluation']`

### 0048

**Ruling.**\
Communication changes are evaluated on the human, through a process the director can run, rather than by agents scoring agents.

**Alternatives refuted.** agent-scored rubric

**Kind.** project - how mission-kit measures its own changes

**Source.**\
`[V, commit eee321c; docs/surveys/b38-director-communication-requirements.md 'Added by the director']`

### 0049

**Ruling.**\
Delta-1 revision 4 is ratified, to run before the explain guidance lands (option C).

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** project - sequencing of mission-kit's own work

**Source.**\
`[V, commit 36263e0; docs/BACKLOG.md B24 history at 3305087 ('as ruled (option C)')]`

### 0050

**Ruling.**\
Delta-1's L5 drop is the change working as intended, so the rubric is corrected after the scores.

**Alternatives refuted.** treat it as a regression

**Kind.** project - scoring of mission-kit's own evaluation

**Source.**\
`[V, commit 69230da; docs/audits/delta-1/stage-4.md 'Director ruling, after the scores'; docs/DELTAS/DELTA-1.md]`

### 0051

**Ruling.** backlog/ does not survive as a layer: its ten MREQ entries become rows B45-B54, full text kept in docs/requests/.

**Alternatives refuted.** keep both backlog/ and AR5; split by concern

**Kind.** project - mission-kit's own records and structure

**Source.**\
`[V, commit ccfc8b9; docs/BACKLOG.md B14; docs/BOARD.md Q3, M3.3; docs/requests/README.md]`

### 0052

**Ruling.**\
Constraint 2/9 (A): same-agent review is never a valid degradation; with no second agent the gate waits or the director ratifies.

**Alternatives refuted.** downgrade the attestation to kind:review

**Kind.** general - canonical constraint set

**Source.**\
`[V, commit 0ad8f73; docs/BACKLOG.md B33; docs/audits/M5.5-06-W0.md]`

### 0053

**Ruling.**\
Composition (A): a unit of work stays role x work-type x domain; the work-type cites the method that conducts it and the artifact it produces; axioms come from the systems altered; W0 states the reading order once.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - composition rule

**Source.**\
`[V, commit 3305087; docs/BACKLOG.md B24; docs/audits/M5.5-06-W0.md]`

### 0054

**Ruling.**\
A territory claims scope, not holdings: the style set should cover commit messages, code names and code comments, and a missing member does not invalidate the claim - that is how gaps are found.

**Alternatives refuted.** drop the claim because no member holds it

**Kind.** general - scope of a product set

**Source.**\
`[V, commit dc30885; docs/audits/M5.5-07-S0.md 'Correction - territory claims scope, not holdings']`

### 0055

**Ruling.**\
A charter holds its set's vision and manages the set against it: a territory's partition comes from the population but its extent from purpose, so an unfilled claim is a gap, never a reason to cut the claim.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - rule for every charter

**Lineage.**\
E4's 'a territory must earn itself' (derived from the population and shows a gap), from be3c443

**Source.**\
`[V, commit da79bd8; docs/audits/M5.5-07a-vision-recheck.md]`

### 0056

**Ruling.**\
Ruling A: the organisation's coordination and governance machinery and its knowledge corpus are engineered products, each domain holding its source and live state; a part splits only where work on a portion is proved differently and the split has been found needed.

**Alternatives refuted.** the machinery's code is the product codebase, covered by W1 and W6

**Kind.** general - domain placement rule

**Source.**\
`[V, commit 6260d9d; docs/audits/M5.5-07b-machinery-domain.md; docs/audits/M5.5-07a-vision-recheck.md 'Parked'; docs/evals/README.md 'Suite edits']`

### 0057

**Ruling.**\
The corpus carries no legacy: a moved or retired entry leaves no stub, takes a new id, and non-reuse is held by check-id-reuse from git history.

**Alternatives refuted.** keep superseded stubs to occupy old ids

**Kind.** general - identity rule for every entry

**Lineage.**\
Delta-1's 'old ids stay as superseded pointers' and 8fba49b's 'superseded entries are still kept'

**Source.**\
`[V, commits 498c1c0, 9be5e8b; docs/audits/M5.5-08-P0.md 'The six earlier stubs removed'; docs/evals/README.md 'Suite edits' (charter-claims V8)]`

### 0058

**Ruling.**\
P1 Path A / Path B moves to style as S16, under a new identifier with no stub.

**Alternatives refuted.** keep P1 in patterns

**Kind.** project - a one-off member move

**Source.**\
`[V, commit 4c2d75f; docs/audits/M5.5-08-P0.md 'P1 moved to style as S16'; docs/evals/README.md 'Suite edits' (p0)]`

### 0059

**Ruling.**\
Gate, evidence and substrate are defined as entities before the K0 charter is converted.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** project - sequencing of mission-kit's own work

**Source.**\
`[V, docs/audits/M5.5-09a-gate.md trigger]`

### 0060

**Ruling.**\
A gate has one meaning, in three kinds by who judges.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - definition of gate

**Source.**\
`[V, commits 0a6c301, 04893f6; docs/audits/M5.5-09a-gate.md ruling (1)]`

### 0061

**Ruling.**\
A gate's verdict is binary: extra results map to pass or fail, no verdict is an absence, and an exception is the director's override.

**Alternatives refuted.** four-label verdicts (M7); FAIL/blocked

**Kind.** general - definition of gate verdict

**Source.**\
`[V, commits 0a6c301, 04893f6; docs/audits/M5.5-09a-gate.md ruling (2)]`

### 0062

**Ruling.**\
Director ratification in place of an absent independent agent is the gate decided by the director, a recorded change of kind; the director does not become a verifier.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - gate rule

**Lineage.** the constraint 2/9 ruling's 'the gate waits or the director ratifies'

**Source.**\
`[V, commits 0a6c301, 04893f6; docs/audits/M5.5-09a-gate.md ruling (3)]`

### 0063

**Ruling.**\
Evidence (A): a verdict is never evidence; evidence is what a judge receives.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - definition of evidence

**Source.**\
`[V, commits f225224, be2bea3; docs/audits/M5.5-09b-evidence.md]`

### 0064

**Ruling.**\
Substrate (A): substrate means the coordination substrate only; every other sense is replaced and the substrate-audit skill is renamed repo-audit.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - definition of substrate

**Source.**\
`[V, commits 8e43c70, a293b1c; docs/audits/M5.5-09c-substrate.md; docs/evals/README.md 'Suite edits' (work-layers)]`

### 0065

**Ruling.**\
A charter is an asymptote: it states end state, scope and growth policy; partitions and gaps belong to dated investigations, gaps become backlog rows weighed by the board, and a charter does not name its members.

**Alternatives refuted.** pre-declared partitions and gaps in the charter

**Kind.** general - rule for every charter

**Lineage.** the vision-recheck ruling's split territory obligation and E4's 'a territory must earn itself'

**Source.**\
`[V, commits 1a862fe, e81e9db; docs/audits/M5.5-13-charter-asymptote.md 'The rulings']`

### 0066

**Ruling.**\
Fork owners are not contacted before a history rewrite - contacting them is rude and not the safeguard; a fork holding no rewritten commit is untouched, one that does is a reason to defer.

**Alternatives refuted.** notify fork owners

**Kind.** general - rule for publishing rewritten history

**Lineage.**\
RU4's earlier owner-notification safeguard

**Source.**\
`[V, commit 99d59a4; docs/audits/history-purge-2026-10-04.md 'Harm test']`

### 0067

**Ruling.**\
Eval runs and their results polluted the published repo: runs are local working material, never published, and history is purged of them as a defect.

**Alternatives refuted.** keep runs under docs/evals/runs/ in git

**Kind.** project - mission-kit's own repository hygiene

**Source.**\
`[V, commit 4cd6a6b; docs/audits/history-purge-2026-10-04.md justification]`

### 0068

**Ruling.**\
A provenance record in another repository pinning a rewritten commit is external and out of scope for the purge.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** project - scope call about an external repo

**Source.**\
`[V, docs/audits/history-purge-2026-10-04.md 'Harm test', External references]`

### 0069

**Ruling.**\
A charter must not know it is being investigated: no link to or passage naming an investigation; the dependency runs one way.

**Alternatives refuted.** charters link their investigations (d20536d)

**Kind.** general - rule for every charter

**Lineage.** the asymptote application's charter-to-investigation links (07bf0ef, d20536d)

**Source.**\
`[V, commit b0c032b; docs/audits/M5.5-13-charter-asymptote.md 'Addendum - charters do not know their investigations']`

### 0070

**Ruling.**\
Probes that ask for a gap or partition charters no longer hold are retired, each kept with its question and reason; the class ruling later retires H7, k0 Q5, k0 Q6 and L5.

**Alternatives refuted.** re-key them and keep scoring

**Kind.** project - mission-kit's own eval suites

**Source.**\
`[V, commit 48c756f; docs/audits/M5.5-13-charter-asymptote.md 'Ruled'; docs/audits/M5.5-14-charter-frame.md; commits 6557ea6, 650684c; docs/evals/README.md 'Retired probes']`

### 0071

**Ruling.**\
A charter is a vision applied to its set (AR6's devices) plus operating instructions; Purpose becomes Vision and Operation joins the fixed headings; members need not know their set.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - rule for every charter

**Lineage.**\
E4's 'a charter holds the set's vision' paragraph (da79bd8)

**Source.**\
`[V, commit 0e65c98; docs/audits/M5.5-14-charter-frame.md 'The ruling']`

### 0072

**Ruling.**\
Operating a charter (changing its text, M11) is distinct from operating the set it governs (changing its population, M13).

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** general - rule for every set

**Lineage.** the frame's 'changed by M11' for the set

**Source.**\
`[V, commit 5568551; docs/audits/M5.5-14-charter-frame.md 'Addendum'; docs/evals/README.md 'Suite edits' (charter-frame)]`

### 0073

**Ruling.**\
Close M5: finish what an agent can do now, hold what needs the director (B42), close the milestone.

**Alternatives refuted.** none recorded - this backfilled record fails `AR4`'s first falsifier until one is supplied

**Kind.** project - milestone closure

**Source.**\
`[V, docs/audits/M5.5-14-charter-frame.md 'Closing M5'; commit 5b4ba53]`

### 0074

**Ruling.**\
Proposed by the drafting agent, not yet ruled: commit messages are not a conformant carrier for this corpus's rulings.

**Alternatives refuted.**\
Commit messages as the carrier, alone or alongside the register - refuted by the history purge of 2026-10-04, which gave 126 commits new ids, so rulings cited by commit id moved.

**Kind.** project - how mission-kit keeps its own record.

**Source.**\
`[V, docs/audits/history-purge-2026-10-04.md; docs/BACKLOG.md B15]`

### 0075

**Ruling.**\
The good-faith assumption covers collaborating agents only: a collaborator's malice is out of the axioms' scope, while a hostile outsider and untrusted input are inside it.

**Alternatives refuted.**\
`0008` read alone, with malice wholly out of scope and the hostile-actor gap removed - refuted because a system that accepts outside input can be subverted with no collaborator acting in bad faith.

**Kind.** general - it sets the axioms' scope for every adopter.

**Lineage.**\
Amends `0008`; resolves the conflict with the hostile-actor gap the vision recheck added.

**Source.**\
`[V, director ruling 2026-10-05 on the register review; docs/BACKLOG.md B56; docs/investigations/axioms-2026-10-04.md]`

### 0076

**Ruling.**\
Every structured document has one fixed name and location, in upper case, with no ambiguity.

**Alternatives refuted.**\
Leaving names to each project - refuted because an arriving agent then searches for each document, and two projects already named the same type the same way by convention only.

**Kind.** general - it fixes where any project's instances live.

**Lineage.**\
The director ruled fixed upper-case names; the target-architecture name, the per-ruling directory and the delta pattern are the drafting agent's application of it, and close `B7`'s delta naming question.

**Source.**\
`[V, director ruling 2026-10-05; docs/BACKLOG.md B2, B7]`

### 0077

**Ruling.**\
Each artifact type declares the fixed path of its instances; the charter keeps only the rule.

**Alternatives refuted.**\
A table of paths in the artifacts charter, as `0076` was first applied - refuted because the name is a fact about the type, so it belongs on the type (`0020`), and a charter names no member (`0065`).

**Kind.** general - it fixes where the instance name of any artifact type is declared.

**Lineage.**\
Amends `0076`'s application, not its rule.

**Source.**\
`[V, director ruling 2026-10-05; artifacts/AR1-AR6 frontmatter]`

### 0078

**Ruling.**\
Scores live on the record row and the board's ledger and held list are generated.

**Alternatives refuted.**\
Correcting the board by hand - refuted because the instance check found the board's typed copies of scores and holdings disagreeing with the record on fifteen rows, the drift rule `0020` predicts.

**Kind.** general - it fixes where any project's board reads its scores.

**Lineage.**\
Applies `0020` to the board.\
The common scale - a mandate breach ranks with the second-highest impact, a signal with the fourth - is the drafting agent's application.

**Source.**\
`[V, director ruling 2026-10-05; M3.2 instance check of AR3]`

### 0079

**Ruling.**\
The mapping of work-types to the artifact types they produce, drafted by the agent and confirmed by the director.

**Alternatives refuted.**\
Artifacts as a fourth composition axis, and the two layers kept independent - both refuted by `0053`, which chose the `produces` field.

**Kind.** general - it is how any project learns which work makes which document.

**Lineage.**\
Applies `0053`; closes `B13` and `B53`.

**Source.**\
`[V, director confirmation 2026-10-05]`

### 0080

**Ruling.**\
Derive the current architecture's structure by generating it from the system's own source.

**Alternatives refuted.**\
A baseline written once and changed only by deltas - not chosen, because it changes how all work runs; generating and routing every structural change through a delta - deferred to `B72`.

**Kind.** general - it widens how any project may derive its current projection.

**Source.**\
`[V, director ruling 2026-10-05; docs/BACKLOG.md B8]`

### 0081

**Ruling.**\
A delta marches a system across part of the gap between its current architecture and the ratified decisions not yet built; it is reviewed adversarially before ratification.

**Alternatives refuted.**\
Requiring a delta whenever a check sees the derived structure change - refuted because it triggers on change after the fact rather than on the target, inverting the delta's purpose; and an adversarial review found it both too broad and easy to bypass.\
A full target architecture authored ahead of the rulings - refuted as speculative.

**Kind.** general - it is how any project runs the loop.

**Source.**\
`[V, director rulings 2026-10-05; the review of the withdrawn DELTA-3 draft]`

### 0082

**Ruling.**\
The delta loop is for downstream projects, not mission-kit's own development.

**Alternatives refuted.**\
Running the loop on mission-kit to hold what it prescribes - refuted by the director: the loop was never intended for the corpus's own development.

**Kind.** project - how mission-kit itself is developed.

**Source.**\
`[V, director ruling 2026-10-05; docs/BACKLOG.md B72]`

### 0083

**Ruling.**\
Every axiom is to carry an adherence trap, beginning with the explain guidance and four axioms, then `A3` and `A14`.

**Alternatives refuted.**\
Deciding what is held always-on by argument alone - refuted because no suite measured adherence, only comprehension.\
All seven candidate traps in the first run - not chosen, to answer the two always-on candidates, explain and the axioms, first.

**Kind.** project - how mission-kit measures its own guidance.

**Source.**\
`[V, director ruling 2026-10-07; docs/BACKLOG.md B73; docs/evals/adherence/suite.json]`

### 0084

**Ruling.**\
Adherence runs cover three model families in every arm, scored cross-family.

**Alternatives refuted.**\
Three families on the no-guidance and always-on arms only - not chosen, because the on-trigger arm is what compares always-on with how sessions run today.\
Claude agents only with cross-family scorers - not chosen, because it says nothing about other models.

**Kind.** project - how mission-kit measures its own guidance.

**Source.**\
`[V, director ruling 2026-10-09; docs/evals/adherence/suite.json design]`

### 0085

**Ruling.**\
Explain is a surface of the standing suite, judged by agents, calibrated by the director.

**Alternatives refuted.**\
Explain measured only by the director's human-judged evaluation - not chosen, because its agent-judged results would stop being re-run.\
Explain judged by agents only - not chosen, because agent judges have rated messages good that the director found hard to use.

**Kind.** project - how mission-kit measures its own guidance.

**Source.**\
`[V, director ruling 2026-10-10; docs/surveys/standing-eval-suite-survey.md flag 1]`

### 0086

**Ruling.**\
The standing evaluation suite design is ratified as written.

**Alternatives refuted.**\
Ratifying with the author's choices amended, or walking through a part first - offered, not chosen.

**Kind.** project - how mission-kit measures its own guidance.

**Source.**\
`[V, director ruling 2026-10-10; docs/evals/standing/DESIGN.md v3]`

### 0087

**Ruling.**\
Agent evaluation's universal part lives in `apnex/agent-evals`; mission-kit is one project using it.

**Alternatives refuted.**\
A top-level folder inside mission-kit - refuted by `C0`, which holds a component's definition and reference but never its implementation.\
Keeping the runner as a mission-kit tool - refuted because it can then never be universal, and zorg's copy keeps drifting.

**Kind.** project - where mission-kit's evaluation machinery lives.

**Source.**\
`[V, director rulings 2026-10-10; components/README.md Vision and Territory; zorg evals/tools/run-agents.mjs header]`

### 0088

**Ruling.**\
The component of `0087` is `context-lab`, with its north star chosen.

**Alternatives refuted.**\
`agent-evals` - refuted because it reads as evaluating agents, which the component's vision rules out as a benchmark of models.\
`context-evals` - not chosen; the director preferred a name carrying the research purpose.\
North stars for guidance effects alone, any claim about agent behaviour, or the effect of a change alone - not chosen, being too narrow, too broad, and too narrow.

**Kind.** project - where and under what purpose mission-kit's evaluation machinery is built.

**Source.**\
`[V, director rulings 2026-10-10; https://github.com/apnex/context-lab VISION.md]`

### 0089

**Ruling.** context-lab's vision is ratified, and context-lab keeps its own decision register.

**Alternatives refuted.**\
Recording context-lab's rulings in mission-kit's register - refuted because the component must stand without mission-kit, and a register held by one of its users is a dependency the other users cannot see.

**Kind.** project - how mission-kit relates to the component it uses.

**Source.**\
`[V, director ruling 2026-10-10; https://github.com/apnex/context-lab docs/DECISIONS.md 0001]`

### 0090

**Ruling.**\
The registry is meant to be a well-defined set of orthogonal duties, and such a set numbers in the tens, never the thousands; what matters is that each member holds one duty no other holds, not how many there are.\
`C0` said "a few dozen", a figure the director had guessed, and called it a target.

**Alternatives refuted.**\
Keeping "a few dozen" - refuted because it was a guess, and read as a target.\
Stating another figure, such as 40 to 50 or 70 to 80 - refuted because a number taken as a target invites splitting mechanisms below a component's altitude, or stopping short of duties that are real.\
A cap - refuted by `C0`'s growth policy, which is uncapped, and by adoption outranking orthogonality.

**Kind.** general - how any project reads the size of the component registry.

**Change to `C0`, under `M11`.**

| Sentence | Change | Evidence |
|---|---|---|
| *Vision*: "A managed set of a few dozen orthogonal duties, ... so no duty is implemented twice." | reword: "a few dozen" removed | the figure was a guess and read as a target; the scale is now stated by the two sentences added below |
| *Vision*: "A duty is one box at architecture altitude, ..." | none | - |
| *Vision*, added: "Duties well defined at that altitude are expected to be orthogonal and to number in the tens, never the thousands; a count far beyond that ... calls for an investigation of the set, not a decision about any one member." | added | answers what size to expect and what a count far beyond it means, which the charter could not; stated as an expectation, because the key's audit found that orthogonality does not by itself prove a count |
| *Vision*, added: "That scale describes the registry we intend - a bound, not a target and not a cap - so the count alone never admits, splits, merges, removes or refuses a member." | added | answers whether the scale is a target or a cap, which the charter could not; agrees with the growth policy, uncapped |
| *Duty is singular at an altitude*: "This is what makes the registry's target reachable." | correct, to "This is what keeps the registry at the scale it intends." | "target" contradicts the ruling |

**Test, under `M2`.**\
Run `c0-size-bound`: the `c0` suite, its new probes `Q8` to `Q10` keyed and committed before any reader ran and their key audited by a fresh agent and corrected first; both versions blind to 3 readers each of two families, `gpt-6-astra` and `claude-opus-5-5`, scored blind by `gpt-6-astra`, which did not author the change.\
Totals of 18: the old charter 17 and 17, the new 18 and 18; the six control probes score 2 in every arm, so nothing regressed, and the one difference is `Q10`, the scale, where old readers called "a few dozen" a target.\
Most readers of both versions hedged on `Q10`, the new ones only that the charter names no count at which growth is "far beyond" the scale; that is deliberate, since a threshold would be a number taken as a target, and the hedge is recorded rather than answered.

**Source.**\
`[V, director ruling 2026-10-10, recorded as zorg docs/DECISIONS.md D36; the director's instruction of 2026-10-10 to update components/README.md]`
