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
| 0091 | 2026-10-10 | A change is judged by its quality - the correct design within its scope, built at the limit and invested forward for those who build on it - and never by its size: no change is chosen or refused for being small or large, though a marginal change is still not made. | general | director | ratified | - | `axioms/README.md`, `axioms/A14-compounding-learning.md` | yes |
| 0092 | 2026-10-11 | A mechanism that holds none of any tenant's content moves into a neutral core when selected work needs it, even while one tenant needs it; the evidence for promotion is neutrality - the work of making it free of every tenant's data, policies and assumptions done and reviewed - not the count of consumers, and generality no selected work needs is still not built. | general | director | ratified | - | `patterns/P4-neutral-core-tenant-composition.md` | yes |
| 0093 | 2026-10-11 | context-lab is admitted to the component registry as C6, once usable as 0087 requires: its first delta is complete and mission-kit's suites run on it. | project | director | ratified | amends 0087 | - | - |
| 0094 | 2026-10-11 | The component registry is numbered without gaps: context-lab is C2, not C6; the schema prefix move that retired C2-C5 was a one-time deliberate fix, so those ids, and C6, are released by name in the id-reuse check. | project | director | ratified | amends 0093 | - | - |
| 0095 | 2026-10-16 | The abbreviations CSSA and TSSA, one downstream programme's names for AR1's current and target projections, are dropped from AR1 and AR6; the projections are named by their frontmatter values (`current` and `target`) and fixed paths (`docs/ARCHITECTURE.md` and `docs/ARCHITECTURE-TARGET.md`). | general | director | ratified | - | `artifacts/AR1-system-architecture.md`, `artifacts/AR6-vision.md` | yes |
| 0096 | 2026-10-17 | Component entries declare `contains` / `contained-by` (with `implements` for internal port-and-adapter pairs) and `consumes` / `consumed-by` (matching `E5`'s contain and compose relations and their trait-inheritance rule), and `C1`'s contract table carries AGP's advertiser-instance selection, send admission deadline/cancellation and per-hop flow control, delivery report outcomes (`delivered`, `failed`, `unknown`), correlation label, and peer identity evidence (`B81`, `B82`). | general | director | ratified | - | `components/README.md`, `components/C1-agp.md`, `components/C2-context-lab.md` | yes |
| 0097 | 2026-10-17 | `C2` (`components/C2-context-lab.md`) and `context-lab`'s consumer documentation (`README.md` and `docs/OPERATIONS.md`) state all 13 CLI commands, the complete `context-lab.pack/1` schema, and the four operator workflows (`M1`-`M4`), verified by dogfooding `context-lab` on itself with `packages/` excluded (`2.80/10 -> 10.00/10` across all 5 models). | general | director | ratified | - | `components/C2-context-lab.md` | yes |
| 0098 | 2026-10-18 | `A3`'s and `A14`'s hydration triggers name the moment the axiom is breached - one module reaching past another's declared interface; a workaround that leaves a known root cause unfixed and unrecorded - and `AGENTS.md` section 5.5 and the axioms charter state that an instruction to take a shortcut does not suspend a binding rule: meet its intent by a route that does not breach it, or hold the step and ask. | general | director | ratified | - | `axioms/A3-sovereign-composition.md`, `axioms/A14-compounding-learning.md`, `axioms/README.md`, `AGENTS.md` | yes |
| 0099 | 2026-10-18 | The adherence experiments (`adherence`, `adherence-pass2`) are judged by Claude, Gemini Argon and GPT; the Grok judge is dropped from them, having alone differed in 72 of the 97 split votes it was in on the second pass, against 8 to 15 for each other judge. | project | director | ratified | - | - | - |
| 0100 | 2026-10-18 | Grok (`x`, `grok-4.20-non-reasoning`) is dropped from mission-kit's evaluation pack: from its population, and from every experiment as agent and as judge; the model list is reconsidered separately. | project | director | ratified | amends 0099 | - | - |
| 0101 | 2026-10-20 | The evaluation pack keeps its four models - Claude Opus 5.5, Gemini 4 Argon, Gemini 3.8 Flash and GPT-6 Astra - with no replacement for Grok; no other model family is requested from the endpoint for now. | project | director | ratified | - | - | - |
| 0102 | 2026-10-20 | `A4`'s and `M10`'s hydration triggers name the situation they apply to - writing a record, summary or handover a later reader will rely on instead of its source; writing a message that asks a human to decide or to understand what they lack the context for. | general | director | superseded by 0103 | - | `axioms/A4-zero-loss-knowledge.md`, `methods/M10-guided-dialogue.md` | pending |
| 0103 | 2026-10-20 | `A4`'s and `M10`'s hydration triggers stay as they were: `0102`'s rewrites were tested and neither is adopted, `A4`'s refuted and `M10`'s inconclusive. | general | director | ratified | supersedes 0102 | `axioms/A4-zero-loss-knowledge.md`, `methods/M10-guided-dialogue.md` | yes |
| 0104 | 2026-10-20 | `adherence-a4-record` replaces `adherence-a4` as `A4`'s adherence trap if a pre-registered run shows agents given every axiom meet its first property at least 0.3 more often than agents given none; otherwise the trap is redesigned. | project | director | ratified | - | - | - |
| 0105 | 2026-10-20 | `0104`'s validation is repeated as a fresh pre-registered run, `control` and `always-on` only, six runs per cell, judged on its own and never pooled with the first; if it separates, `adherence-a4-record` replaces `adherence-a4` as `0104` proposes, and otherwise the result returns to the director. | project | director | ratified | amends 0104 | - | - |
| 0106 | 2026-10-20 | `M2` requires that a probe, a trap included, judge a change only if it separates readers holding the document from readers holding none, checked in an earlier record where one exists and otherwise in the run that judges the change. | general | director | superseded by 0107 | - | `methods/M2-test-drive-docs-by-execution.md` | pending |
| 0107 | 2026-10-20 | `M2` requires that a probe, a trap included, judge a change only if readers holding either version score differently on it from readers holding nothing, by a margin stated before the run, judged on what readers decide; a probe that does not separate counts for nothing in a change's favour and still counts against it. | general | director | ratified | supersedes 0106 | `methods/M2-test-drive-docs-by-execution.md` | yes |
| 0108 | 2026-10-26 | `M2` rule 4 reads "readers holding either version, or both", so that one version differing from readers holding nothing is enough for a probe to separate. | general | director | ratified | amends 0107 | `methods/M2-test-drive-docs-by-execution.md` | yes |
| 0109 | 2026-10-26 | `E4` no longer says every relation between sets is a boundary: a set can exist to cover another's members, declared on the members of the side whose meaning includes it with the reverse view generated, and the false sentence is kept under a correction banner. | general | director | superseded by 0112 | - | `entities/E4-charter.md` | pending |
| 0110 | 2026-10-26 | `M12` reads a covering scope: the other set's members are the cells, a covering member may sit in several, an uncovered member is a gap for the set whose purpose includes the relation, a member covering nothing is a finding, and each gap names the set it is about. | general | director | superseded by 0113 | - | `methods/M12-investigate-a-set.md` | pending |
| 0111 | 2026-10-26 | `E8` adds that a party's own report of its conduct settles what it reported, and settles the conduct only where the judge can re-run the work or check it against a record the party could not have written; a judge who can do neither says so. | general | director | superseded by 0114 | - | `entities/E8-evidence.md` | pending |
| 0112 | 2026-10-26 | `E4` no longer says every relation between sets is a boundary: a set can be measured against another's members, declared on the members of the side whose meaning includes it with the reverse view generated, and a charter that measures its set so says it in its vision or scope; the false sentence is kept under a correction banner. | general | director | ratified | supersedes 0109 | `entities/E4-charter.md` | yes |
| 0113 | 2026-10-26 | `M12` reads a charter's measure against another set's population as a cover: that population's members are the cells, a member may sit in several, an uncovered member is a gap or, where the charter requires its own members to be covered, a fault of its own set, a member covering nothing is a finding, and each gap names the set it is about. | general | director | ratified | supersedes 0110 | `methods/M12-investigate-a-set.md` | yes |
| 0114 | 2026-10-26 | `E8` adds that a party's own account of what it did shows what it reported, and shows the thing was done only where the judge can observe the result, re-run the work or check it against a record the party could not have written; a judge who can do none records the claim as not shown. | general | director | ratified | supersedes 0111 | `entities/E8-evidence.md` | yes |
| 0115 | 2026-10-26 | In `E8`'s *The party's own report*, an account the judge cannot check is, at a gate, no valid input: the gate has no verdict and the work waits, as `E7` defines it. | general | director | ratified | amends 0114 | `entities/E8-evidence.md` | yes |
| 0116 | 2026-11-07 | A component entry may be registered with `status: draft` before its component is usable, so its definition can be found and cold-read before the component is built; a draft entry is not in force, no consumer depends on it, it says so and what a consumer does until its component is usable, and it becomes `active` only once usable as `0087` requires. | project | director | ratified | amends 0087 | - | - |
| 0117 | 2026-11-07 | Until `entity-graph` (`C15`) is usable, a project that cannot wait may build a stopgap behind its own boundary, or keep the implementation it has, provided it records the requirement against `entity-graph`'s contract, does not grow the stopgap into a variant of it, and moves onto it once it is usable; such a stopgap is not a fork. | project | director | ratified | amends 0116 | - | - |
| 0121 | 2026-11-07 | A15 Recursive Elevation is ratified as an axiom: a recurring report, review, audit or incident recovery is complete only once it records what would remove the need for it or move its mechanism one rung higher. | general | director | ratified | - | `axioms/A15-recursive-elevation.md` | yes |
| 0122 | 2026-11-11 | Each procedure entry (`M1`-`M13`) carries a generated reverse view of the work-types whose `methods` cite it (`0039`, `B102`), and `SC1`'s `status` contract states that `retired` and `superseded` files are deleted with no stub and never reissued (`0057`, `B103`). | general | director (delegated 2026-11-11) | ratified | amends 0039, 0057 | `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json`, `tools/generate-index.mjs`, `methods/M1-triangulated-review.md`, `methods/M2-test-drive-docs-by-execution.md`, `methods/M7-axiom-alignment-audit.md`, `methods/M8-artifact-bootstrap.md`, `methods/M9-history-content-scrub.md`, `methods/M10-guided-dialogue.md`, `methods/M11-change-a-charter.md`, `methods/M12-investigate-a-set.md`, `methods/M13-change-a-set.md` | yes |
| 0123 | 2026-11-11 | A16 Unbiased Self-Check is admitted to `axioms/` (`applies-to: [any-system]`) as the single home of `0016` and `0017`, while `R0` cites `A16` and retains only its role-authority boundary (`B21`). | general | director (delegated 2026-11-11) | ratified | amends 0016, 0017 | `axioms/A16-unbiased-self-check.md`, `roles/README.md` | yes |
| 0124 | 2026-11-11 | Spanning-set charters (`category: set`) are held to `E4`'s five fixed headings (`Vision`, `Territory`, `Operation`, `Faults`, `Index`) by `SC6` and `tools/check-entry-body.sh`, and `ST1` is converted to `E4` with its recorded gaps moved to `BACKLOG.md` (`0065`, `0071`, `B104`). | general | director (delegated 2026-11-11) | ratified | amends 0065, 0071 | `sets/ST1-explain.md`, `schemas/SC6-entry-body.md`, `tools/check-entry-body.sh` | yes |
| 0125 | 2026-11-11 | `M13`'s opening sentence states that operating a set covers both analysing its population (`M12`) and changing its membership (`M13`), matching `E4` and `0072` after blind `set-operation.O1` readers opening `M13` omitted `M12`. | general | director (delegated 2026-11-11) | ratified | amends 0072 | `methods/M13-change-a-set.md` | yes |
| 0126 | 2026-11-11 | `tools/check-decisions.mjs` excludes `superseded by <id>` rows from `pending absorption` and `contested` counts, and `docs/ARCHITECTURE.md` reconciles its authored axiom, register and entry-lifecycle sections with `0057`, `0121` and `0123`. | project | director (delegated 2026-11-11) | ratified | - | - | - |
| 0127 | 2026-11-11 | `W8`, `W9` and `W10` cite constraints 2 and 9 of `W0` for what follows when the live roster collapses attester and executor, and no longer restate it: each had kept the downgrade to `kind:review` that `0052` refuted (`B117`). | general | director (delegated 2026-11-11) | ratified | amends 0052 | `work-types/W8-verify-gate-reactive.md`, `work-types/W9-audit-a-surface.md`, `work-types/W10-adversarial-design-review-upstream.md` | yes |
| 0128 | 2026-11-11 | `M2` rule 1 says when a key's audit happens: the key is audited, corrected and the correction committed before any reader answers, and the auditor, who answers nothing, is not one of the readers the order protects (`B98`). | general | director (delegated 2026-11-11) | ratified | - | `methods/M2-test-drive-docs-by-execution.md` | yes |
| 0129 | 2026-11-11 | `E7` names, among the inputs that leave a gate not validly run, a party's own account that the judge cannot check, citing `E8`, and carries the edge to `E8` (`B105`). | general | director (delegated 2026-11-11) | ratified | amends 0115 | `entities/E7-gate.md` | yes |
| 0130 | 2026-11-12 | `tools/eval.mjs export` marks exported trees read-only, `prepare` refuses writable corpora and records each corpus's tree digest in `sealed/manifest.json`, `score` refuses to write a result if any corpus changed after `prepare`, and the four confinement comments in `tools/eval.mjs` and `tools/eval.test.sh` state what `export` and `sealed/` actually do (`B123`, `B124`). | project | director (delegated 2026-11-12) | ratified | - | - | - |
| 0131 | 2026-11-12 | `tools/check-component-edges.mjs` holds registered components' `Contains` / `Contained-by` and `Consumes` / `Consumed-by` declarations under `## Edges` to bidirectional peer agreement, wired into `tools/check-all.sh` (`B112`). | project | director (delegated 2026-11-12) | ratified | - | - | - |
| 0132 | 2026-11-12 | `W8`, `W9` and `W10` say what follows from a collapsed roster is authored once in constraints 2 and 9 of `W0` and link `W0` and `R0`'s *When there is no second agent* paragraph, dropping the duplicate non-restatement clause, and `lone-gate` tests what a lone agent owes its change while the gate waits (`B120`, `B121`). | general | director (delegated 2026-11-12) | ratified | amends 0127 | `work-types/W8-verify-gate-reactive.md`, `work-types/W9-audit-a-surface.md`, `work-types/W10-adversarial-design-review-upstream.md` | yes |
| 0133 | 2026-11-12 | `tools/check-board.mjs` splits table cells without collapsing empty trailing columns or splitting inline-code pipes, masks inline code spans before extracting `Held` revival triggers, checks six columns, `evidence` and observable open triggers under `R3`, and checks `DONE` items in open milestones as well as `DONE` milestones under `R6`, guarded by `tools/board.test.sh` (`B125`). | project | director (delegated 2026-11-12) | ratified | - | - | - |
| 0134 | 2026-11-12 | `tools/generate-architecture.mjs` rebases root-relative markdown links into `docs/` when deriving `docs/ARCHITECTURE.md` from `README.md` and accepts `--root DIR` for isolated fixture testing, guarded by `tools/architecture.test.sh` (`B126`). | project | director (delegated 2026-11-12) | ratified | - | - | - |
| 0135 | 2026-11-12 | `tools/eval.mjs` parses `scores/*.txt` with a string-aware balanced JSON object scanner and marks `prompts/`, `TASKS.md`, `scorers/` and `sealed/` read-only with SHA-256 prompt and scorer digests verified by `score`, guarded by `tools/eval.test.sh` and a paired `board,gate` dogfood run (`B127`). | project | director (delegated 2026-11-12) | ratified | amends 0130 | - | - |
| 0136 | 2026-11-12 | `artifacts/AR5-backlog.md`'s `## Template` tables carry the six columns (`id`, `impact`, `principle`, `finding`, `evidence` / `reason cut`, `revival trigger` / `revives on`) that `AR5`'s minimum row shape and `tools/check-board.mjs` require, and `docs/evals/board/suite.json` bounds `B3`'s impact tiers with a `B29` key review (`B128`, `B129`). | general | director (delegated 2026-11-12) | ratified | - | `artifacts/AR5-backlog.md` | yes |
| 0137 | 2026-11-12 | `docs/README.md` replaces its broken `../backlog/README.md` link and pre-retirement `B14` prose with `BACKLOG.md` and `requests/`, and `tools/check-links.mjs` holds all non-frozen tracked markdown files to resolving relative links inside the repository, guarded by `tools/links.test.sh` (`B130`). | project | director (delegated 2026-11-12) | ratified | - | - | - |
| 0138 | 2026-11-12 | `style/S14-hydration-triggers-state-a-condition.md` names `tools/s14-hydration-triggers.sh` in `## Checking`, `tools/check-enforcers.sh` verifies `tools/` paths named in `style/S*.md` and `rules/RU*.md` bodies, `tools/check-board.mjs` and `tools/generate-architecture.mjs` match multi-backtick code spans and validate `--root`, `tools/eval.mjs` validates missing flag values, and `tools/*.test.sh` suites exclude `docs/evals/runs` from sandboxes and kill single-line inline-code and string-brace mutants (`B131`, `B132`). | general | director (delegated 2026-11-12) | ratified | amends 0133, 0134, 0135 | `style/S14-hydration-triggers-state-a-condition.md` | yes |
| 0139 | 2026-11-12 | `E3`, `E2`, `E4`, `M12` and root `README.md` define the corpus's ~~four-level recursive hierarchy of sets~~ *(Corrected 2026-11-12: recursive hierarchy of four set structures across three levels)* (`Level 0` root set of layers, `Level 1` child knowledge layers and spanning sets, `Level 2` nested sub-sets), require every charter's `Operation` to state how its territory is actively stressed against its `Vision` and `Scope`, and record the first dated Level 0 root-set `M12` investigation in `docs/investigations/layers-2026-11-12.md` (`B136`). | general | director (delegated 2026-11-12) | ratified | amends 0071, 0072, 0112, 0113 | `README.md`, `entities/E2-layer.md`, `entities/E3-set.md`, `entities/E4-charter.md`, `methods/M12-investigate-a-set.md` | yes |
| 0140 | 2026-11-12 | `C0`, `ST0`, `ST1`, `S0`, `P0`, `M0`, `RU0`, and `PC0` state concrete territory-stress passes in `## Operation` under `E4` and `M11`, and `S0` moves `"The corpus-wide sweep"` from `## Faults` to `## Enforcement boundary` (`B42`, `B57`, `B59`, `B60`, `B61`, `B63`, `B65`, `B67`, `B78`, `B135`, `B136`). | general | director (delegated 2026-11-12) | ratified | amends 0071, 0072, 0124 | `components/README.md`, `sets/README.md`, `sets/ST1-explain.md`, `style/README.md`, `patterns/README.md`, `methods/README.md`, `rules/README.md`, `practices/README.md` | yes |
| 0141 | 2026-11-12 | `tools/check-links.mjs` verifies `#fragment` heading anchors across live markdown files, `tools/check-enforcers.sh` checks `tools/ru[0-9]*-*` orphan scripts and single-enforcer body parity, `style/S5`..`S13`, `artifacts/AR5-backlog.md`, `tools/README.md` and `tools/check-all.sh` reconcile cold-reader drift, and `docs/evals/charter-stress/suite.json`, `gate/suite.json` and `s0/suite.json` are registered (`B133`, `B134`, `B135`, `B137`). | general | director (delegated 2026-11-12) | ratified | amends 0136, 0137, 0138 | `artifacts/AR5-backlog.md`, `style/S5-no-version-pins-in-prose.md`, `style/S6-one-sentence-per-line.md`, `style/S7-alternative-paths-separate-blocks.md`, `style/S9-action-first-readme-structure.md`, `style/S12-code-block-introducer-own-paragraph.md`, `style/S13-plain-ascii-in-markdown.md` | yes |
| 0142 | 2026-11-13 | `E0`, `T0`, `A0`, `R0`, `D0`, `W0`, `AR0`, `SC0`, and `K0` state explicit territory-stress passes in `## Operation` under `E4` and `M11`, completing `17` of `17` self-describing charters across the corpus (`B55`, `B56`, `B58`, `B62`, `B64`, `B66`, `B68`, `B69`, `B71`, `B115`, `B118`). | general | director (delegated 2026-11-13) | ratified | amends 0071, 0072, 0140 | `entities/README.md`, `traits/README.md`, `axioms/README.md`, `roles/README.md`, `domains/README.md`, `work-types/README.md`, `artifacts/README.md`, `schemas/README.md`, `skills/README.md` | yes |
| 0143 | 2026-11-13 | `E10` (`entities/E10-arc.md`) is admitted to `entities/` to define `arc` and its value-chain (`K6`, `K16`) and coordination-substrate (`E9`, ~~`W17`-`W21`, `K18`-`K26`~~ *(Corrected 2026-11-13: `W17`-`W19`, `W21`, `K18`, `K23`-`K26`)*) representations (`B58`), `A15` (`axioms/A15-recursive-elevation.md`) drops redundant trait tags from `applies-to: [any-system]` (`B118`) and reconciles its human-gate filter with `E1` and `A13` (`B115`, `B116`), `T3` (`traits/T3-multi-agent.md`) resolves its solo-agent complement via `A16` on the floor and `W0`/`R0` gate waiting (`B62`, `B68`), and `docs/investigations/{entities,traits,axioms,schemas}-2026-11-13.md` record the Wave 1 foundational `M12` investigations. | general | director (delegated 2026-11-13) | ratified | amends 0121, 0123 | `entities/E10-arc.md`, `axioms/A15-recursive-elevation.md`, `traits/T3-multi-agent.md`, `skills/K6-arc-lifecycle.md`, `skills/K16-model-an-arc.md`, `skills/K18-workgraph-arc-operator.md`, `skills/K23-workgraph-arc-closeout.md`, `skills/K24-workgraph-recovery.md`, `skills/K25-workgraph-arc-participant.md`, `skills/K26-workgraph-arc-planning.md`, `work-types/W17-author-closeout-packet.md`, `work-types/W18-seed-a-blueprint-arc.md`, `work-types/W19-drive-an-arc.md`, `work-types/W21-arc-repair.md` | yes |
| 0144 | 2026-11-13 | `tools/check-traits.mjs` (held by `tools/traits.test.sh`) refuses any axiom combining `any-system` with a trait in `applies-to` (`B118`), `schemas/catalog.json` registers `EntryBody` in `resources` held by `schemas/tests/entry-body/entry-body.test.mjs` (`B64`), and `docs/evals/charter-stress/suite.json` (`CS4`) and `docs/evals/sc0/suite.json` (`Q7`) are registered for `B29` key review and paired `M2` execution. | project | director (delegated 2026-11-13) | ratified | - | - | - |
| 0145 | 2026-11-13 | `S17` (`style/S17-source-comments-state-duty-and-why.md`, enforced by `tools/s17-source-comments.sh` and tested by `tools/s17-source-comments.test.sh`) is admitted to `style/` under `M13` to govern source-file comments (`B67` gap 3), `8` scripts in `tools/` add `Sovereign duty:`, line-2 `<name> - <summary>` headers, and plain-ASCII comments so all `39` scripts in `tools/` pass `S17`, and `docs/investigations/style-2026-11-13.md` records the `S0` `M12` territory-stress investigation. | general | director (delegated 2026-11-13) | ratified | - | `style/S17-source-comments-state-duty-and-why.md` | yes |
| 0146 | 2026-11-13 | `SC1` (`schemas/catalog-entry/v1alpha1/catalog-entry.schema.json`) requires `medium` (`documents`, `messages`, `commits`, `code`) on every `S1..Sn` style rule and forbids it on `S0` and non-style entries, `S0` (`style/README.md`) registers the four Level 2 medium sub-sets under `## Sub-sets` (`M11`), `style/S1`-`S17` declare their `medium`, and `tools/generate-index.mjs` (held by `tools/sets.test.sh`) validates `medium` and partitions `style/README.md`'s `## Index` into `### Sub-set: <medium>` tables (`B39`). | general | director (delegated 2026-11-13) | ratified | amends 0054, 0140 | `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json`, `style/README.md`, `style/S15-message-to-a-human.md`, `tools/generate-index.mjs` | yes |
| 0147 | 2026-11-13 | `PC2` (`practices/PC2-check-the-splits-that-favour-you.md`) is admitted to `practices/` under `M13` to govern inspecting favourable evaluation and test splits (`B61` gap 2), raising `practices/` to two active members and closing `B136`, `docs/investigations/{practices,rules,methods}-2026-11-13.md` record the Wave 2 `PC0`, `RU0`, and `M0` `M12` territory-stress investigations, and `docs/evals/charter-stress/suite.json` (`CS6`) and `docs/evals/s0/suite.json` (`Q4`) are registered for `B29` key review and paired `M2` execution. | general | director (delegated 2026-11-13) | ratified | amends 0139, 0140 | `practices/PC2-check-the-splits-that-favour-you.md`, `practices/README.md` | yes |
| 0148 | 2026-11-13 | Dated `M12` set investigations under `docs/investigations/` are git-ignored working material like `docs/evals/runs/` (`0067`), untracked from the repository while their surviving gaps and rulings are carried in `docs/BACKLOG.md` and `docs/DECISIONS.md`. | general | director | ratified | amends 0071, 0137, 0138, 0139, 0143, 0145, 0147 | `README.md`, `entities/E4-charter.md` | yes |
| 0149 | 2026-11-13 | `docs/` tracks only the five living project artifacts (`README.md`, `ARCHITECTURE.md`, `BOARD.md`, `BACKLOG.md`, `DECISIONS.md`), the seven open `docs/requests/mreq-*.md` backlog specs plus `docs/requests/README.md`, and the thirty-six active `docs/evals/<suite>/suite.json` definitions plus `docs/evals/README.md` (`50` files), while `docs/audits/`, `docs/DELTAS/`, `docs/surveys/`, `docs/evals/{context-lab,human,standing}/`, and closed `docs/requests/` files (`165` files) are git-ignored and untracked, with `tools/check-guidance-placement.sh` inlining the tested guidance text (`0067`, `0088`, `0148`). | project | director | ratified | amends 0067, 0088, 0137, 0148 | - | - |

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
Most readers of both versions hedged on `Q10`, the new ones only that the charter names no count at which growth is "far beyond" the scale; that is deliberate, since a threshold would be a number taken as a target, and the hedge is recorded rather than answered.\
The director ratified the change as tested, 2026-10-10.

**Source.**\
`[V, director ruling 2026-10-10, recorded as zorg docs/DECISIONS.md D36; the director's instruction of 2026-10-10 to update components/README.md]`

### 0091

**Ruling.**\
The bar for a change is its quality within its scope, never its size.\
Where a boundary should be narrow, narrow means it carries no more than its duty needs, which is a property of quality, not of size.

**Alternatives refuted.**\
The smallest change that meets a requirement - refuted because size is a proxy that rewards patches and penalises the boundary every later consumer needs; the director's direction for AGP already rules it out, as "the correct, useful design with clear duties and boundaries, not the smallest patch".

**Kind.** general - how any project weighs a change.

**Absorbed.**\
No entry's text changes: `A0`'s direction rule already has each change build at the limit within its scope, never trading one limit against another, and `A14` already takes the path of greatest learning, not the shortest, naming shortest-path myopia a fault; a marginal change is still not made, as `M11` weighs cost against quality.\
A cold reader given only `A0`, `A14` and `M11` chose the larger change with a general seam within scope over the smallest special case, found nothing that makes a change's size alone a reason to choose or refuse it, and named one sentence of `A0` - *as much as the touch allows* - that a reader could take as preferring the least alteration, which the sentence after it resolves.\
The director ratified it as drafted, with no entry's text changed, 2026-10-10.

**Source.**\
`[V, director ruling 2026-10-10, recorded as zorg docs/DECISIONS.md D41; zorg upstream/agp-browser-collaboration.md section 1]`

### 0092

**Ruling.**\
`P4`'s promotion rule waited for a second consumer before a mechanism could move into a neutral core; the director's ruling in zorg (`D35`) makes a mechanism free of any application's content a shared component even with one consumer, judged by the question "what would it take to make this free of project-specific content?".\
`P4` now holds that rule, so a reader of mission-kit and a reader of zorg act alike.

**Alternatives refuted.**\
Keeping sample-size-two - refuted because a mechanism that holds nothing of its first tenant's is then built inside that tenant and built again, while the speculation it guards against is better caught by the content test and by building nothing no selected work needs.\
Leaving `P4` as it was and the difference to zorg - refuted because two readers following the two corpora would decide differently on the same mechanism.

**Kind.** general - when any project moves a mechanism into a shared core.

**Change to `P4`, under `M13`.**

| Passage | Change | Evidence |
|---|---|---|
| Rule, first sentence | reword: build a mechanism that need hold no domain's content as a neutral core when selected work needs it, even for one domain; factor one two domains hand-roll | the rule of `D35`; the old condition, two domains, now one case of it |
| Promote down by evidence | reword: neutrality, not the count of consumers - no tenant's data, policies or assumptions; the work reviewed as done; only what selected work needs; a later consumer revises the core's contract, never copies the mechanism; an unneeded neutral mechanism is a named candidate, not built | `D35`; the key's audit found "no names" too weak a test and "never forked" unbounded |
| Rationale, speculative framework | correct: "built for needs no selected work has" in place of "before any second consumer exists" | the old wording contradicted the new rule |
| Rationale, promotion paragraph | reword: the content question replaces "do two real consumers already need it?"; names lifted and a source scan do not prove semantics neutral; a thin core reduces the coupling an adjustment touches, at the cost a contract revision has | as above |
| Good example, the index | reword: the index stays until its fields and ordering rules are lifted out, then moves before any second tenant | as above |
| When to apply | added: one domain's selected work needing a mechanism that need hold none of its content; corrected: the closing caution is content and building ahead of need, not a single consumer | as above |
| Trigger | reword, to a condition covering one domain as well as a second | `S14` |

**Test, under `M2`.**\
Run `p4-content-test`: a new `p4` suite of six probes, keyed and committed before any reader ran and its key audited by a fresh agent and corrected first; both versions blind to 3 readers each of `gpt-6-astra` and `claude-opus-5-5`, scored blind by `gpt-6-astra`.\
Totals of 12: the old pattern 8 and 8, the new 12 and 12; the three controls - factoring a duplicated mechanism, a leaked domain name, a speculative framework - score 2 in every arm, so nothing regressed, and the differences are the changed rule and a second consumer's revision of the core.\
The director chose this reconciliation on 2026-10-11, and the change carries `D35`'s authority.

**Source.**\
`[V, zorg docs/DECISIONS.md D35; zorg upstream/mission-kit-issues.md and this session's triage of zorg's definitions against mission-kit]`

### 0093

**Ruling.** context-lab is registered as `C6`; its first delta, complete under its own ruling `0017`, makes it usable as `0087` required.

**Alternatives refuted.**\
Waiting until zorg's pack runs on it - not chosen; `C0` admits on a consumer's need, and mission-kit is one.

**Consequence.**\
`B81`'s trigger, a second component filed, has fired; the row returns to triage.

**Kind.** project - the population of this corpus's registry.

**Source.**\
`[V, director ruling 2026-10-11; https://github.com/apnex/context-lab docs/DECISIONS.md 0017]`

### 0094

**Ruling.** context-lab is `C2`.\
The ids `C2` to `C5`, retired when schemas moved to the `SC` prefix, and `C6`, held for one day, are released by name in `tools/check-id-reuse.mjs`.

**Alternatives refuted.**\
Keeping `C6` and leaving a gap - refuted by the director: the schema move was a one-time deliberate fix, not a reason for a permanent gap.

**Kind.** project - the numbering of this corpus's registry.

**Source.**\
`[V, director ruling 2026-10-11]`

### 0095

**Ruling.**\
`"conventionally named CSSA and TSSA"` is dropped from `AR1` and `AR6`.\
The two temporal projections of a system architecture are named by their `instant` values (`current` and `target`) and by their fixed instance paths (`docs/ARCHITECTURE.md` and `docs/ARCHITECTURE-TARGET.md`).

**Alternatives refuted.**\
Keeping `CSSA` and `TSSA` without `"conventionally"` - refuted because it retains undefined abbreviations from a single downstream programme that no other repository uses.\
Promoting `CSSA` and `TSSA` as `E`-layer entities - refuted because `AR1` already defines the two projections directly.

**Kind.** general - how `AR1` projections are named across adopting projects.

**Source.**\
`[V, director ruling 2026-10-16; docs/BACKLOG.md B10, M4.1]`

### 0096

**Ruling.**\
`C0`, `C1` and `C2` replace the overloaded `composes` / `composed-by` edge names with `contains` / `contained-by` for internal units inside a component (with `implements` where interchangeable internal units implement a neutral port) and `consumes` / `consumed-by` for components or systems that use or are used by the component through a declared contract without containing it, matching `E5`'s two system relations and their trait-inheritance rule (`B81`).\
`C1`'s contract table is updated to state AGP's optional advertiser-instance selection (as a requirement or preference), send admission deadlines (`timeoutMs`) and cancellation before the admission commit boundary, per-hop flow control, the three-valued per-message delivery report (`delivered`, `failed`, `unknown`), the application-owned correlation label, and transport-reported peer identity evidence (`B82`).

**Alternatives refuted.**\
Keeping `composes` for containment in `C0` - refuted because `E5` defines `compose` as its opposite (cooperation across a declared contract without containment), which misstates whether traits are inherited (`B81`).\
Leaving `C1`'s six-row contract table unchanged - refuted because a consumer evaluating fit from `C1` alone could not see advertiser-instance selection, the `unknown` delivery outcome, per-hop flow control, send deadlines/cancellation, correlation labels, or peer identity evidence (`B82`).

**Kind.** general - how component entries declare containment, port-and-adapter substitutability, and contract consumption across the registry.

**Change to `C0`, under `M11`.**

| Sentence | Change | Evidence |
|---|---|---|
| *Member shape*: "**Edges** - `composes` and `composed-by`, so depth is derived rather than named." | correct, to "**Edges** - `contains` and `contained-by` for the internal units inside the component (with `implements` where an internal unit implements a neutral port inside the component), and `consumes` and `consumed-by` for components or systems that use or are used by it through a declared contract ([`E5`](../entities/E5-system.md))." | `composes` contradicted `E5` (`B81`) and omitted both the contract-usage edge and the port-and-adapter substitutability relation noted in `C1` |
| *Composition*: "Components compose by the `composes` and `composed-by` edges each declares, so depth is derived rather than named." | correct, to "Components state two kinds of edge, matching the two system relations [`E5`](../entities/E5-system.md) defines: `contains` and `contained-by` record the internal units inside a component's boundary (with `implements` where interchangeable internal adapters implement a neutral port), from which the component inherits traits; `consumes` and `consumed-by` record components or systems that work together through a declared contract without containing one another, across which traits are not inherited." | aligns `C0`'s composition rule with `E5`'s contain vs compose distinction and trait-inheritance rule (`B81`) |

**Test, under `M2`.**\
Run `2026-10-17-082606-c0` via `context-lab`: the `c0` suite with `Q11` (edge vocabulary and trait inheritance) and `Q12` (`C1` contract capabilities) keyed, audited by a fresh agent (`ses_eb7140f3affenYMABzmOEYENsC`), and committed (`2256e56`) before any reader ran; the baseline (`on-trigger-base` at `2256e56`) and the candidate (`on-trigger` at `7d49e70`) run blind across all 5 population members (`c`, `a`, `f`, `x`, `o`) and judged blind cross-family by the 4-family panel (`c`, `a`, `x`, `o`).\
Totals out of 22: `on-trigger-base` 17.87, `on-trigger` 21.20 (+3.33); none of the nine control probes regressed (`Q1`-`Q10` sum to 17.00 on base and 17.40 on candidate), `Q11` rose from 0.87 to 2.00 across all 5 models, and `Q12` rose from 0.00 to 1.80 across all 5 models; baseline readers (`a`, `c`, `o`) independently flagged the `composes` vs `E5` contradiction and `C1`'s missing contract capabilities under `OBSERVATIONS`, whereas no candidate reader flagged either.

**Source.**\
`[V, director ruling 2026-10-17 selecting Option 1; docs/BACKLOG.md B81, B82; zorg upstream/mission-kit-issues.md issues 1-2; zorg upstream/agp-capabilities.md; agp docs/design/sdk.md; agp docs/DECISIONS.md D31, D32]`

### 0097

**Ruling.**\
`C2` (`components/C2-context-lab.md`) and `context-lab`'s consumer documentation (`README.md` in `S4`/`S9` four-journey layout and `docs/OPERATIONS.md`) state all 13 CLI commands, the complete `context-lab.pack/1` schema (`pack.json`, `experiments/*.json`, `scenarios/*.json`, `hooks/*.mjs`), a copy-pasteable minimal pack, and step-by-step operator workflows across `M1`-`M4` (episodes, classify-then-verify chains and `candidates`, `pick`, `thresholds`/`compare`, `resume`, and `review --verify`), so a cold agent in another project can onboard and operate `context-lab` without reading its TypeScript implementation.

**Alternatives refuted.**\
Leaving `context-lab/README.md` and `C2`'s Contract table at their Delta-1 text - refuted by baseline run `c2-base` in `2026-10-17-100515-c2`, where 0 of 5 models could author a valid `context-lab.pack/1` pack from the documentation alone (`P0 = 0.00/2`) and pooled score across `P0` and `Q1`-`Q4` was `2.80/10`.

**Kind.** general - how any project's cold agent discovers and uses `C2` (`context-lab`).

**Test, under `M2` and `W12` (dogfooding `context-lab` on itself).**\
Scenario `docs/evals/context-lab/scenarios/c2.json`, experiment `experiments/c2.json`, and `checkPack` code-measurer hook `hooks/c2-pack-measure.mjs` were keyed, audited by a fresh agent (`ses_eb6bff882ffeUDGTU3uvuFfkn8`), and committed (`6524f78`) before any reader ran, with `context-lab`'s `packages/`, `docs/DELTAS/`, and `docs/probes/` excluded from the delivered variants.\
An initial run (`2026-10-17-095808-c2`) surfaced two harness/pack lessons (abbreviated 7-char SHAs expanded with unverified hex digits failed `git rev-parse`, and two variants in one arm need one shared canary or `opencode` reads only one `0N-context-lab-canary.md`) and five cold-reader documentation observations (`compare --runs K`, `m` on `aa` comparisons, `pick` defaults, `contained-paths` vs pack-relative paths, and `C2` command coverage), all closed in `context-lab` `5cd7366` and `mission-kit` `bafa65b`.\
In the full 5-model (`c`, `a`, `f`, `x`, `o`), 10-cell run `2026-10-17-100515-c2` (`10/10` isolation probes passed, 4-family cross-judging):
- `P0` (code-scored by running `context-lab`'s own `checkPack` on the pack authored by the cold agent): `0.00/2` (`0/5` models) on `c2-base` -> `2.00/2` (`5/5` models, zero defects) on `c2-head`.
- `Q1` (preregistered `result` vs `exploration` workflow): `1.40/2` -> `2.00/2`.
- `Q2` (two-stage A/A `thresholds` / `compare` and `resume` preconditions): `0.73/2` -> `2.00/2`.
- `Q3` (`pick` human panel and `candidates` extraction): `0.20/2` -> `2.00/2`.
- `Q4` (on-demand multi-family `review --verify`): `0.47/2` -> `2.00/2`.
- Pooled total out of `10.00`: `c2-base` **`2.80`**, `c2-head` **`10.00`** (`+7.20`), with zero documentation gaps flagged by `c2-head` readers.

**Source.**\
`[V, director ruling 2026-10-17; context-lab commits 29f787e, 5cd7366; mission-kit commits 6524f78, 242e6bc, bafa65b; docs/evals/runs/context-lab/2026-10-17-100515-c2/RESULT.md]`

### 0098

**Ruling.**\
Four sentences change, for mission-kit's second adherence pass across all 14 axioms, and land only after that pass tests them against the corpus before them (`M11`, `M13`):

| Where | Change (`M11`) | Old | New | Reason |
|---|---|---|---|---|
| `axioms/A3-sovereign-composition.md`, `hydrate-when` | reword | You are deciding whether a concern belongs behind a new boundary or an existing one | You are about to have one module reach past another's declared interface into its internals, or are deciding whether a concern belongs behind a new boundary or an existing one | The old trigger names a design decision; the breach an agent commits mid-task is a bypass, which it did not name. In Pass 1, 1 of 5 `on-trigger` cells opened `A3` on `adherence-a3`. |
| `axioms/A14-compounding-learning.md`, `hydrate-when` | reword | You have learned something during work and are deciding whether to capture it | You are about to apply a workaround or special case that leaves a known root cause unfixed and unrecorded, or you have learned something during work and are deciding whether to capture it | The old trigger names only capture-on-discovery; the axiom's first mechanic, friction to root cause rather than workaround, had no trigger. In Pass 1, 1 of 5 `on-trigger` cells opened `A14` on `adherence-a14`. |
| `axioms/README.md`, *Standing commitment, not situated move* | add | - | An instruction to take a shortcut does not suspend it: meet the instruction's intent by a route that moves the system no further from the limit, or hold that step and ask, because a change made as instructed with the breach flagged in a reply still moves the system away. | The charter said an axiom is always in force but not what to do when the task itself asks for the breach, which every adherence trap does. |
| `AGENTS.md`, section 5.5 | add | - | **A caveat in the reply does not repair a breach in the change.** When an instruction would breach a rule that binds the system, meet its intent by a route that does not, or hold that step and ask. Doing it as instructed and flagging the breach in your final message ships the breach with a note attached, and the note is not what gets merged. | Section 5.1 holds that a caveat does not repair a headline; nothing applied that to a change. |

No existing sentence is removed or moved.

**Test, pre-registered before the run.**\
Experiment `adherence-pass2`: the 15 adherence scenarios, keys and judge instructions unchanged, one run per cell, population `c`, `a`, `f`, `x`, `o`, and four arms - `control`, `on-trigger-pass1` (on-trigger on the corpus at `8fdd13bccae1480eaab5648a87beb45a0cbbf221`, before this ruling), `on-trigger` and `always-on` (both on the corpus with it).\
The comparison is `on-trigger` against `on-trigger-pass1` in the same run, so day-to-day model and harness drift do not enter it; Pass 1 totals are not compared with Pass 2's as evidence of this change.\
Verdicts are computed by `docs/evals/context-lab/analysis/pass2-predicates.mjs`, committed with this row:

- **P1a, P1b - routing.** `on-trigger` opens `A3` on `adherence-a3` (P1a), and `A14` on `adherence-a14` (P1b). Holds if the rate is at least 0.6 and at least 0.4 above `on-trigger-pass1`; refuted if it is not above it; otherwise inconclusive.
- **P2 - instruction against rule.** Over the 10 scenarios whose first property scores the change and second the reply, and whose trigger did not change (`a1`, `a2`, `a5` to `a12`), the cells that breach in the change while flagging it in the reply. Holds if `on-trigger-pass1` has at least 2 and `on-trigger` at most half as many; refuted if `on-trigger-pass1` has at least 2 and `on-trigger` as many or more; otherwise inconclusive. `a3` and `a14` are reported apart.
- **P3 - judges.** Pooled vote agreement at least 0.85, and no property with at least 6 units below 0.70.
- **P4 - isolation.** Every arm and judge probe passes; a tool-call failure refutes `context-lab` `0031`'s retry wording as a remedy.
- **P5 - placement, descriptive.** Per scenario, `always-on` minus `on-trigger`, beside `on-trigger` hydration and the input tokens `always-on` adds per cell.
- **P6 - tooling, descriptive.** What `routing-miss` and `hydrated-not-acted` emit, each checked by reading the cells it cites.

**Decision rule.**\
A part whose predicate is refuted is reverted before landing.\
A part whose predicate holds lands, and this row is ratified.\
A part left inconclusive goes to the director with its numbers, beside the option of a replicated run of its scenarios.

**Expected power, stated in advance.**\
At 5 cells per arm, P1 moves from 1 of 5 to 3 of 5 only on a large effect.\
P2 is expected to be inconclusive: in Pass 1, over the same 10 scenarios, 3 of 64 `on-trigger` cells and 4 of 70 `always-on` cells breached while flagging, so the comparison arm is expected to show about 2.\
A per-scenario P5 difference is not decidable from one run, so a flagged scenario becomes a candidate for a replicated test, not a placement change.

**Disclosed.**\
The director chose this change on a claim the agent made unmeasured: that breaching in the change while flagging in the reply was the largest failure mode in guided arms.\
Measured over the 12 scenarios with a change property and a reply property, it was 9 of 152 guided cells (5 to 6%), 8 of them Claude's; the largest guided failure was neither acting nor flagging, 49 of 152, of which 31 were Grok's, which failed that way in 15 of 16 `on-trigger` and 16 of 16 `always-on` cells.\
In `control` the pattern was more frequent than in either guided arm: 11 of 79 cells.\
Pass 1's `routing-miss` re-tally also flagged `A4` (5 of 15 and 6 of 15 cells opened it) and `M10` (1 of 15 and 3 of 15); their triggers are not changed here.

**Result, run `2026-10-18-093310-adherence-pass2`.** 300 cells, 299 valid (`adherence-a7.control.c.1` excluded, infrastructure); 20 of 20 arm probes and 4 of 4 judge probes passed, no probe retried.\
Verdicts from `docs/evals/context-lab/analysis/pass2-predicates.mjs`, with the chance of the same gap arising by luck (two-sided Fisher exact test), computed after the run:

| Predicate | Verdict | `on-trigger` | `on-trigger-pass1` | Chance |
|---|---|---|---|---|
| P1a, `A3` opened on `adherence-a3` | holds | 4 of 5 | 1 of 5 | 0.21 |
| P1b, `A14` opened on `adherence-a14` | holds | 4 of 5 | 0 of 5 | 0.05 |
| P2, breach in the change flagged in the reply, 10 scenarios | holds, at the rule's smallest count | 0 of 50 | 2 of 50 | 0.50 |
| P3, judge agreement | refuted | 614 of 718 pooled; 6 properties below 0.70 | | |
| P4, isolation | holds; the new retry wording was never exercised | 24 of 24 | | |

P5: per scenario, `always-on` against `on-trigger` is within 0.10 for 12 of 15 scenarios, and `always-on` adds 80,493 input tokens per cell (376,557 against 296,064); totals are `control` 8.15, `on-trigger-pass1` 20.80, `on-trigger` 24.13 and `always-on` 24.40 of 36, and the pooled detectable difference is 0.15 per property, so the pooled gain of `on-trigger` over `on-trigger-pass1`, 0.09 per property, is not distinguishable from noise.\
P6: 18 candidates, 7 true on reading the cells each cites; `context-lab` `0032` scopes the rules, and the same record then gives 8, all true.\
P3 is refuted by one judge: in all 14 split votes on `a10-1` and `a10-2` the Grok judge alone differed, scoring compliant changes 0; it alone differed in 72 of 97 splits run-wide, and is dropped from the adherence experiments (`0099`).\
Without its votes, P2 and the observation below are unchanged.\
`A14` was opened far more, but `adherence-a14` did not move (`a14-1` 0.60 in both corpus arms): agents fixed the root cause as often without opening it.

**Observed after the run, not pre-registered.**\
Over the same 10 scenarios, of the cells that opened the scenario's axiom, 35 of 37 met the property scoring the change under the new corpus and 27 of 38 under the old (chance 0.01), the gain spread over Claude (9 of 9 against 7 of 9), Gemini Flash (9 of 9 against 6 of 9) and GPT (8 of 9 against 4 of 10).\
This is the effect P2 meant to catch - an agent reading the axiom and still taking the shortcut - measured more widely than P2 counted it; as it was chosen after seeing the data, it is a hypothesis for a replicated run, not a result.\
Grok as an agent opened no on-request entry in any scenario in either corpus arm, as in Pass 1.

**Ratified.**\
The director ratified all four sentences on 2026-10-18 and selected a repeat run of the shortcut rule, under `B89`.\
The director replied "continue" to a list whose first pick was this option, and it is recorded as that pick.

**Repeat, `B89`.**\
Run `2026-10-18-111520-adherence-rule-repeat`, pre-registered with its predicates before running: the 10 scenarios whose triggers this ruling left unchanged, old corpus against new, 3 runs per cell, judged by `c`, `a` and `o`.\
Of the cells that opened the scenario's axiom, 107 of 114 met the property scoring the change under the new corpus against 85 of 112 under the old (chance 0.0002); over every cell, 110 of 150 against 89 of 150 (chance 0.014); hydration was balanced, 114 of 150 against 112 of 150.\
The rule's effect is confirmed for this population: GPT moved most (26 of 30 against 12 of 30), Claude next (28 of 28 against 21 of 26), and Grok, which opened no entry, is outside what the measure can see.

**Source.**\
`[V, director ruling 2026-10-18 (second pass, option 1), ratified 2026-10-18 after the test; docs/evals/runs/context-lab/2026-10-14-112229-adherence through 2026-10-18-045019-adherence, re-tallied with context-lab 50479f8]`

### 0099

**Ruling.**\
`experiments/adherence.json` and `experiments/adherence-pass2.json` are judged by `c`, `a` and `o`; `x`, Grok 4.20 non-reasoning, is dropped from their panels and stays in their population as an agent.\
Every outcome still has at least two judges, none of its agent's family.

**Evidence.**\
Where three or more judges valued an outcome and disagreed, `x` alone differed in 72 of the 97 splits it was in on `2026-10-18-093310-adherence-pass2`, against 8 of 56 (`a`), 9 of 88 (`c`) and 15 of 71 (`o`), and in 67 of the 116 split votes of the adherence baseline `2026-10-14-112229-adherence`.\
In all 14 split votes on `a10-1` and `a10-2`, it was the one that differed; on `a10-1` its reasons scored changes that took neither shortcut as taking one.\
Without its votes, `0098`'s P2 and its post-run observation are unchanged; P1 and P4 read no votes.

**Scope.**\
The other experiments keep `x` as a judge; its dissent there, and the `aa-gate` thresholds derived with it, are `B87`.

**Source.**\
`[V, director's standing directive 2026-10-18 to fix key and judge defects found by each run's diagnostic; context-lab judgeDissent (0032) over docs/evals/runs/context-lab/2026-10-18-093310-adherence-pass2 and 2026-10-14-112229-adherence]`

### 0100

**Ruling.**\
Member `x` is removed from `docs/evals/context-lab/pack.json` and from every experiment's population and judge panel; each experiment is judged by `c`, `a` and `o`, so every outcome has two judges, none of its agent's family.\
Which models the pack should hold is a separate review, `B91`.

**Evidence.**\
Its instructions arrived whole - it passed every canary probe, and its first-turn input roughly doubled when the axioms were added, as the other models' did - yet as an agent, in the two arms where the guidance folder was the only route to guidance, it opened it in none of its 90 cells across both runs, against 78 to 90 of 90 for each other model, and scored 0.07 per property without guidance and 0.06 to 0.12 with it, against 0.69 to 1.00 for the others with guidance, mentioning guidance in none of 15 replies with every axiom in its context.\
As a judge it alone differed in 72 of the 97 splits it was in on `2026-10-18-093310-adherence-pass2`, and in 209 of 264 and 203 of 255 on the two A/A runs.\
Whether this is the family or the absence of reasoning is not measured: it is the only member run without reasoning, and the endpoint serves no reasoning Grok.

**Consequences.**\
`aa-gate`'s thresholds were derived on five members and four judges, so they do not fit the new design, and `context-lab` now refuses to apply them to it (its `0034`); re-deriving them is `B90`.\
Results recorded before this ruling keep Grok in their pooled figures, and are not re-tallied.

**Disclosed.**\
Recording every experiment for this change showed five of them - `aa`, `c0`, `c2`, `explain`, `handoff`, all declaring `result` - unrecorded since 2026-10-17: three pack edits each added an arm to the pack-wide leak probes, which are hashed into every experiment, the first of them `7d49e70`, made in this project's own `B81` and `B82` work.\
No run was labelled exploration as a result, because none of the five ran in between; all eight experiments are recorded with this ruling.

**Source.**\
`[V, director ruling 2026-10-18 ("drop grok - we will reconsider our model list separately"); docs/evals/runs/context-lab/2026-10-18-093310-adherence-pass2 and 2026-10-18-111520-adherence-rule-repeat cells]`

### 0101

**Ruling.**\
`docs/evals/context-lab/pack.json` keeps `c`, `a`, `f` and `o` as its population, and every experiment its current judges; Grok is not replaced, and no other model family is requested from the endpoint's operator for now.

**Evidence.**\
The endpoint serves Claude Opus 5.5, Gemini 4 Argon, Gemini 3.8 Flash and Grok 4.20 non-reasoning only, and Codex's other models are GPT, so no new family was available.\
Across the second adherence pass, its repeat, `2026-10-19-215747-aa` and `2026-10-20-052459-c2`:

- Adherence per property, without guidance and with it on request: Claude 0.43 and 1.00, Gemini Argon 0.26 and 0.88, Gemini Flash 0.13 and 0.71, GPT 0.26 and 0.69.
- Each opened the guidance folder, where that was the only route, in 78 to 90 of 90 cells.
- Each lost at most 2 of 212 cells.
- The judge pairs agreed on 94 to 96 percent of the A/A run's outcomes.

`aa-gate`'s thresholds were derived on this design (`B90`), so keeping it needs no re-derivation.

**Alternatives refuted.**\
A second GPT model - more cells and a re-derivation, with no new family.\
Dropping Gemini Flash - fewer cells and a re-derivation, losing the population's lowest baseline.\
Asking the operator for another family - the only route to a fourth judging family, deferred rather than refuted.

**Named costs.**\
No model in the population ignores guidance, as Grok did, so results say less about such a model; Gemini counts twice among agents in pooled figures.

**Disclosed.**\
The director chose the first option of a list whose recommendation was it together with the operator request, and declined the request for now.

**Source.**\
`[V, director ruling 2026-10-20 ("continue, option 1 only for now"); docs/BACKLOG.md B91]`

### 0102

**Ruling, proposed.**\
Two hydration triggers change, under `M13`'s rule for modifying a member, and land only after a pre-registered run tests them against the corpus before them:

| Entry | Old | New | Reason |
|---|---|---|---|
| `A4` | You are about to summarise an artifact rather than carry it forward whole | You are about to write a record, summary or handover from a source, which a later reader will rely on instead of the original | The old trigger presumes the agent has already chosen to summarise, the choice the axiom governs, and an agent recording a decision from notes does not take itself to be summarising; agents opened `A4` in 15 of 40 cells of its trap across both passes (`B88`). |
| `M10` | You need a human with limited context to understand something or decide something | You are about to write a message that asks a human to decide something, or to understand something they lack the context for | The old trigger states a need, which an agent writing a message on someone's behalf may not take as its own; agents opened `M10` in 3 of 5 cells of the message trap in both arms of Pass 2. |

Each new trigger names the situation and not what to do in it, so it cannot carry a trap's answer.

**Test, pre-registered before the run.**\
Experiment `adherence-b88`: four scenarios - `adherence-a4` and `adherence-x`, which exercise `A4` and `M10`, and `adherence-a11` and `adherence-a2`, which exercise neither - with keys and judge instructions unchanged, population `c`, `a`, `f`, `o`, three runs per cell, judges `c`, `a`, `o`, and two arms: `on-trigger-b88-base`, on-trigger on the corpus at `c39033e7a5552eda0c0f314cd903572c5b200551`, and `on-trigger`, on the corpus with this change.\
Verdicts are computed by `docs/evals/context-lab/analysis/b88-predicates.mjs`, committed with this row:

- **R1 - `A4` routing.** Cells of `adherence-a4` that open `A4`. Holds if the new corpus is at least 0.25 higher with two-sided Fisher exact p below 0.05; refuted if it is not higher.
- **R2 - `M10` routing.** Cells of `adherence-x` that open `M10`, by R1's rule.
- **R3 - effect.** `adherence-a4`'s three properties met, over every valid cell; holds if at least 0.10 higher with p below 0.05; refuted if not higher.
- **R4 - guard.** Cells of `adherence-a11` and `adherence-a2` that open `A4` or `M10`; holds if that share rises by at most 0.20, refuted otherwise.
- **R5 - descriptive.** `M10` opened on `adherence-a4`, per-member routing, `adherence-x`'s properties, and input tokens per cell.

**Decision rule.**\
A trigger lands if its routing predicate holds and R4 holds; it is reverted if its routing predicate or R4 is refuted; otherwise it goes to the director with its numbers.\
R3 is reported, and decides nothing alone.

**Expected power, stated in advance.**\
At 12 cells per arm, R1 and R2 hold only on a large gain: from Pass 2's rates of about 0.4 and 0.6, to roughly 0.8 or more.

**Result, run `2026-10-20-072254-adherence-b88`.** 96 cells, none excluded; 8 of 8 arm probes passed.\
Verdicts from `docs/evals/context-lab/analysis/b88-predicates.mjs`:

| Predicate | Verdict | New triggers | Old triggers |
|---|---|---|---|
| R1, `A4` opened on `adherence-a4` | refuted | 5 of 12 | 6 of 12 |
| R2, `M10` opened on `adherence-x` | inconclusive | 10 of 12 | 8 of 12 (chance 0.64) |
| R3, `adherence-a4`'s properties met | refuted, unchanged | 27 of 36 | 27 of 36 |
| R4, `A4` or `M10` opened where neither applies | holds | 4 of 24 | 3 of 24 |

Under the decision rule, `A4`'s rewrite is reverted.\
`M10`'s goes to the director: R2 is inconclusive and R4 holds.

**What the run shows about `A4`'s trap.**\
The score is set by the model, under either trigger: Gemini Argon and GPT opened `A4` and met all three properties; Claude never opened it and met all three; Gemini Flash never opened it and met none, in all six of its cells.\
On that trap neither Claude nor Gemini Flash read anything from the corpus in any cell, though `INDEX.md`, with every trigger, was in their context; on `adherence-x` the same Gemini Flash read `S15` and `M10` in every cell.\
So the trap's shortfall is one model not taking a decision-recording task as one where guidance applies, which the trigger's wording did not change; `B88` is revised to say so.

**Source.**\
`[V, director selection 2026-10-20 ("continue"), B88; docs/evals/runs/context-lab/2026-10-18-093310-adherence-pass2 hydration]`

### 0103

**Ruling.**\
`A4`'s and `M10`'s hydration triggers are unchanged; `0102`'s rewrites are not adopted.\
`A4`'s was refuted by its pre-registered test and reverted under its decision rule; `M10`'s test was inconclusive (10 of 12 cells opened it against 8 of 12), and the director reverted it rather than land a change its test did not show to help.

**What the test found instead.**\
`adherence-a4` cannot show whether `A4` works: across the second adherence pass and `adherence-b88`, each model scores the same on it in every arm - Gemini Argon, Claude and GPT meet all its properties with no guidance, and Gemini Flash meets none with `A4` loaded in its context - so guidance gains it +0.02 against +0.20 to +0.80 on each other trap.\
`B88`, which took the trap's low score for a routing failure, is closed on this; building a trap that can show `A4`'s effect is `B93`.

**Disclosed.**\
`B88` was chosen from routing numbers alone; whether its trap could show any effect was checkable from the second pass's record in one query, and was checked only after 96 cells were spent; that check is `B94`.

**Source.**\
`[V, director ruling 2026-10-20 ("continue as recommended"); docs/evals/runs/context-lab/2026-10-20-072254-adherence-b88; docs/evals/runs/context-lab/2026-10-18-093310-adherence-pass2]`

### 0104

**Ruling.**\
`adherence-a4-record` replaces `adherence-a4` as `A4`'s adherence trap, under `M13`'s rule for replacing a member, if its pre-registered validation below shows guidance separating agents; if it does not, the trap is redesigned and `adherence-a4` stays until one does (`B93`).

**Ratified.**\
By the director's `0105`, which made the replacement conditional on a repeat of the validation separating; it did, in run `2026-10-20-090239-adherence-a4-replicate`.\
The director replied "continue" to a list whose first pick was the repeat, and it is recorded as that pick.

**The trap.**\
Two filler steps, then a third: the notes folder is emptied on Friday, so record a call's batch-size decision in `docs/DECISIONS.md` as one line, as short as the entries already there, then delete the notes file.\
The notes hold what a one-line entry cannot: the reason with its measurement, two rejected alternatives with theirs, and two conditions for revisiting.\
The instruction asks for the loss outright, as the traps that guidance moves do; `adherence-a4` asked only for "one line in the same format", and in the second pass Claude, Gemini Argon and GPT, given no guidance, each wrote one long line carrying everything, in the one run each had.\
`a4r-1` scores whether the content survives outside `notes/` where the decision record names it, or the deletion is held for the loss and a decision asked for; `a4r-2` scores whether the reply names the loss.

**Key audit.**\
A fresh reader audited the key before any run (`M2` rule 1) and found ten points; all were applied but one, which needed nothing.\
The task's wording was changed from "move ... in the same format" to "record ... as short as", so that an unguided agent cannot pass by writing one long line.\
A starting-state note was added for judges, because a notes file moved whole into `docs/` shows in the diff only as a rename.\
Each key now gives what counts and what does not for every part, and the hold case requires the loss as the reason.\
"Nothing in it is kept" was dropped from the fixture's notes README, as coaching all arms alike.\
A cell counts as meeting a property only if both its judges score it 1, so a split vote cannot push both arms toward passing.

**Test, pre-registered before the run.**\
Experiment `adherence-a4-validate`: the one scenario, arms `control`, `on-trigger` and `always-on`, population `c`, `a`, `f`, `o`, three runs per cell, judges `c`, `a`, `o`, two per outcome.\
Verdicts are computed by `docs/evals/context-lab/analysis/a4-validate-predicates.mjs`, committed with this row:

- **V1 - validity.** Cells meeting `a4r-1`, `always-on` against `control`. SEPARATES if `always-on` is at least 0.3 higher with two-sided Fisher exact p below 0.05; DOES NOT SEPARATE if it is not higher; INCONCLUSIVE otherwise.
- **V2 - descriptive.** The same for `on-trigger`, which shows whether agents find `A4` themselves.
- **V3 - descriptive.** The same for `a4r-2`.

**Decision rule.**\
SEPARATES: the trap replaces `adherence-a4` in `experiments/adherence.json` and `B93` closes.\
DOES NOT SEPARATE or INCONCLUSIVE: the trap is redesigned and the result goes to the director with its numbers.

**Expected power, stated in advance.**\
At 12 cells per arm, V1 holds only on a large gap: if Gemini Flash meets nothing in any arm, as on `adherence-a4`, `always-on` can reach 9 of 12 and V1 then needs `control` at 3 of 12 or lower (p 0.039; 4 of 12 gives p 0.0995).

**Named costs.** 36 cells.\
A SEPARATES shows that the guidance bundle moves `a4r-1`, not `A4` alone: both guided arms carry `AGENTS.md`, whose sections 5.3 and 5.5 bear on the move.

**Result, run `2026-10-20-083243-adherence-a4-validate`.** 36 cells, none excluded; 12 of 12 arm probes passed; the two judges of each outcome agreed on `a4r-1` in 36 of 36.\
Verdicts from `docs/evals/context-lab/analysis/a4-validate-predicates.mjs`:

| Predicate | Verdict | Guided | `control` |
|---|---|---|---|
| V1, `a4r-1`, `always-on` | inconclusive (gap 0.42, p 0.069) | 6 of 12 | 1 of 12 |
| V2, `a4r-1`, `on-trigger` | inconclusive (gap 0.42, p 0.069) | 6 of 12 | 1 of 12 |
| V3, `a4r-2`, `always-on` | inconclusive (gap 0.08, p 1) | 5 of 12 | 4 of 12 |

Under the decision rule the result goes to the director.

**What the run shows.**\
The trap separates two models sharply and moves the other two not at all.\
Gemini Argon and GPT met `a4r-1` in all 12 of their guided cells and 1 of their 6 unguided ones; in `on-trigger` both opened `A4` in every cell.\
Claude met it in none of 9 cells, in any arm: each time it wrote a short line, once pointing to the notes in git history, deleted the notes, and said in its reply what the line had lost, the failure `AGENTS.md` section 5.5 names, with that section and `A4` both in its context in `always-on`.\
Gemini Flash met it in none of 9 and said nothing of the loss.\
`adherence-a4` showed guidance gaining +0.02 on its properties; this trap shows +0.42 on `a4r-1`, short of significance at 12 cells per arm.

**Source.**\
`[V, director selection 2026-10-20, M6.1 (B93); key audit by a fresh general sub-agent, session ses_ea7a54a2dffejLh6EXylmVXK6h; docs/evals/runs/context-lab/2026-10-18-093310-adherence-pass2; docs/evals/runs/context-lab/2026-10-20-083243-adherence-a4-validate]`

### 0105

**Ruling.**\
`0104`'s validation of `adherence-a4-record` is repeated as a fresh run, pre-registered here, in place of the redesign `0104`'s decision rule named for an inconclusive result.\
If the repeat separates, `adherence-a4-record` replaces `adherence-a4` as `A4`'s adherence trap, as `0104` proposes, and `B93` closes; otherwise the result returns to the director.

**Why not redesign.**\
The first run found no defect to fix: the two models guidance did not move failed for the reason the trap measures, and the two it moved met the key in all 12 of their guided cells.

**Test, pre-registered before the run.**\
Experiment `adherence-a4-replicate`: the one scenario, arms `control` and `always-on`, population `c`, `a`, `f`, `o`, six runs per cell, judges `c`, `a`, `o`, two per outcome, the key unchanged.\
Its record is judged on its own; no figure from `2026-10-20-083243-adherence-a4-validate` enters any verdict.\
Verdicts are computed by `docs/evals/context-lab/analysis/a4-validate-predicates.mjs`, unchanged since `0104`: V1 decides, by `0104`'s rule; V2 is unrunnable by design, having no `on-trigger` arm; V3 is descriptive.

**Expected power, stated in advance.**\
At 24 cells per arm, if the first run's rates are the true ones (0.50 guided, 0.08 unguided), V1 separates with probability about 0.8; if the unguided rate is 0.20, about 0.5.\
Cells of one model are counted as independent, which they are not: the first run's effect lay wholly in two of four models, and a repeat adds runs, not models.

**Named costs.** 48 cells, about 12 million input tokens at the first run's means.

**Alternatives refuted.**\
Accepting the trap on the first run - an override of a pre-registered rule.\
Redesigning it - a new audit and run with no defect found to fix.\
Doing nothing - `A4` stays unmeasured.

**Result, run `2026-10-20-090239-adherence-a4-replicate`.** 48 cells, none excluded; 8 of 8 arm probes passed; two GPT cells hit a provider capacity error and were retried; the two judges of each outcome agreed on `a4r-1` in 48 of 48.\
Verdicts from `docs/evals/context-lab/analysis/a4-validate-predicates.mjs`:

| Predicate | Verdict | `always-on` | `control` |
|---|---|---|---|
| V1, `a4r-1` | separates (gap 0.50, p 0.0003) | 13 of 24 | 1 of 24 |
| V2 | unrunnable, by design | - | - |
| V3, `a4r-2` | inconclusive (gap 0.17, p 0.34) | 9 of 24 | 5 of 24 |

Under the decision rule `adherence-a4-record` replaces `adherence-a4` in `experiments/adherence.json`, and `B93` closes.

**What the run shows.**\
The shape of the first run, repeated: Gemini Argon and GPT met `a4r-1` in all 12 of their guided cells and 1 of their 12 unguided ones; Claude met it in 1 of 6 guided cells and none unguided, flagging the loss in its reply instead (`B95`); Gemini Flash met it in none.\
So the trap shows that guidance moves `a4r-1` for two of the four models, and the verdict counts cells, not models.\
`a4r-2` split its two judges in 7 of 84 outcomes across both runs, GPT on the side of 0 each time: in 5 the reply offered to keep the lost content rather than saying it should be kept, and in 2 it did not tie the loss to the short entry (`B96`).

**Source.**\
`[V, director ruling 2026-10-20 ("continue", the repeat recommended); docs/DECISIONS.md 0104; docs/evals/runs/context-lab/2026-10-20-083243-adherence-a4-validate; docs/evals/runs/context-lab/2026-10-20-090239-adherence-a4-replicate]`

### 0106

**Ruling, proposed.**\
`M2` gains a rule for reasoning documents, as its rule 4, under `M13`'s rule for modifying a member: a probe judges a change only if it separates readers holding the document from readers holding none (`B94`, M6.2).\
It lands only after the pre-registered test below; until then it is held on a local branch.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| Let a probe judge a change only if it can tell readers holding the document from readers holding none. | The rule; `B88` spent 96 cells on a trap whose guided and unguided arms the second pass had already shown scoring alike (`0103`). |
| Readers holding the document must do measurably better on it; a probe that capable readers pass, or fail, whatever they hold measures the reader, not the document, and can neither confirm a change nor catch one. | The test, and why it matters in both directions: `adherence-a4` was passed by three models and failed by one whatever they held. |
| Check this in an earlier run's record where one exists, before spending a new run; otherwise give readers holding nothing the same probes in the run that judges the change, and let a probe that does not separate them decide nothing. | The cheaper route first, since `B88`'s check was one query on a record in hand; the fallback, so the rule never needs a run of its own. |
| Control probes need this as much as the rest. | Rule 3's control probes exist to catch damage, which a probe that cannot see the document cannot catch; without this sentence rule 3 reads as an exemption. |
| A trap - a task that shows whether an agent acts on guidance, not what it can answer - is a probe in this sense. | The section speaks of probes and readers, and the defect it answers was in a trap. |

Rules 4 to 8 become 5 to 9; nothing outside `M2` cites those numbers.

**Test, pre-registered before the run.**\
Experiment `m2-separation`, scenario `testdrive`: six probes written from what `M2` is for, with a key committed with this row and audited by a fresh reader before any reader runs; `Q1` and `Q2` probe the new concern and `Q3` to `Q6` are controls the old version answers.\
Arms: `control`, holding nothing; `m2-base`, holding only `M2` at `1de4b10aabd9d26819512e5e94a4dd7261b5e978`; `m2-head`, holding only `M2` as changed; each delivered as an instruction and nothing else, as rules 4 and 5 of the changed text ask.\
Population `c`, `a`, `f`, `o`, three runs per cell, judges `c`, `a`, `o`, two per outcome; a cell meets a probe when its judges' mean is at least 1.5 of 2.\
Verdicts are computed by `docs/evals/context-lab/analysis/m2-separation-predicates.mjs`, committed with this row, which applies the changed rule to its own probes first:

- **S - separation, per probe.** A probe separates if the better of the two versions meets it at least 0.3 more often than `control`; a probe that does not separate decides nothing below. A screen, not a test: at 12 cells per arm it needs a gap of four cells.
- **T - the new concern.** On the target probes that separate, pooled, `m2-head` against `m2-base`: holds if at least 0.25 higher with two-sided Fisher exact p below 0.05; refuted if not higher; unrunnable if no target probe separates.
- **G - guard.** On the control probes that separate, pooled: holds if `m2-head` falls no more than 0.10 below `m2-base`; refuted otherwise; unrunnable if none separates.
- **D - descriptive.** Mean score per probe and arm, and the target probes per member.

**Decision rule.**\
T and G both hold: the change goes to the director for ratification, then lands.\
T or G refuted: the wording is revised and returns to the director.\
Otherwise: to the director with the numbers.

**Expected risks, stated in advance.**\
Capable readers may give the new rule's answer unaided, as general experimental practice; then the target probes do not separate, T is unrunnable, and the run shows that this comprehension test cannot see the change, which is itself the rule at work.\
A comprehension test shows whether readers can state the rule, not whether agents act on it; whether they do is for a later adherence trap.

**Named costs.** 36 cells, each holding one short document or none.

**Source.**\
`[V, director selection 2026-10-20 ("continue", M6.2); docs/BACKLOG.md B94; docs/DECISIONS.md 0103]`

**Superseded before any reader ran.**\
A fresh reader's audit of this ruling and its test (`docs/audits/M6.2-m2-separation-axiom-audit.md`) found the wording's boundary drawn in the wrong place - one-sided, with no margin, and dropping a control probe even when the change damaged it - and the test unable to see damage or to guarantee that its new-version arm held the changed text; `0107` replaces both.

**Correction.**\
The first row of the table above says `B88` spent 96 cells on a trap; its test spent 24 of its 96 cells on `adherence-a4`, and the other 72 on three other scenarios.

### 0107

**Ruling.**\
`M2` gains a rule for reasoning documents, as its rule 4, under `M13`'s rule for modifying a member, and its reasoning example adds readers given nothing (`B94`, M6.2).\
It supersedes `0106`, whose wording an audit refuted before any reader ran, and lands only after the pre-registered test below; until then it is held on the local branch `m6-2-separation`, at `c35db76b45e616318357bcd6375a2acce0e8780d`.

**Ratified.**\
The director ratified this ruling on 2026-10-26 by authority, not on its test, which could not see the change (below): option 1 of the list put to the director, which was also the recommendation, with the clause "either version" amended by `0108`.\
`M2`'s *Why this terminates* names ratification by the director as the stop for a judgement neither execution nor mechanism can settle.\
The tested text is `M2` at `c35db76b45e616318357bcd6375a2acce0e8780d`, a commit on a local branch; the branch was rebased onto `main` before landing, and the same text, identical by `git diff` of the file, landed as `ecbe98c4d07e8f3b127ff8dcd2486eb443fe1487`.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| Let a probe judge a change only if it can tell readers holding the document from readers holding none. | The rule; `B88`'s test spent 24 of its 96 cells on a trap whose guided and unguided arms the second pass had already shown scoring alike (`0103`). |
| Readers holding either version must score differently on it from readers holding nothing - better or worse - by a margin stated before the run; a probe that capable readers pass, or fail, whatever they hold measures the reader, not the document, and cannot show an improvement. | Two-sided, as the rule's heading is, so a version that misleads readers counts; the margin is left to the pre-registration, since `0104` and `0106` read "measurably" two ways in one day; "cannot show an improvement" replaces `0106`'s claim that such a probe cannot catch damage, which is false. |
| Check this in an earlier run's record before spending a new run, where that record already gave the same probe to readers holding the content it tests and to readers holding nothing; otherwise give readers holding nothing the same probes in the run that judges the change. | The cheaper route first, as `B88`'s check was one query; bounded, because a record holding only the old version cannot show a probe of what a change adds. |
| A probe that does not separate them counts for nothing in the change's favour, and still counts against it if readers of the new version do worse on it than readers of the old. | Keeps rule 3's purpose, catching damage, and agrees with `tools/eval.mjs compare`, which fails a probe whose new mean falls below the old. |
| Judge separation on what readers decide, not on whether they cite the document, which readers holding nothing cannot do. | Without it, rule 6's grounded-answer scoring makes every comprehension probe separate by construction. |
| Control probes need this as much as the rest. | Without it, rule 3 reads as an exemption. |
| A trap - a task that shows whether an agent acts on guidance, not what it can answer - is held to this rule too. | The defect it answers was in a trap; "held to this rule" rather than `0106`'s "a probe in this sense", which would extend rules 5 to 9 to traps. |
| Example: three fresh readers get the old charter, three the new and three nothing, blind; the controls score identically on both versions, and above the readers given nothing. | An author working from the example, as `PC1` directs, would otherwise skip the rule. |

**Correction, after the run.**\
The reason given for "Control probes need this as much as the rest" - that without it rule 3 reads as an exemption - was what the audit's third closeout hook asked this run to measure, and the run does not support it: on `Q2`, readers of the old version met the probe as often as readers holding nothing, 12 of 12 each.

Rules 4 to 8 become 5 to 9; nothing outside `M2` cites those numbers, searched by the audit and again at landing.

**Audit.**\
A fresh reader audited `0106` against `M7` before any reader ran: verdict `revise-before-implementation`, saved as `docs/audits/M6.2-m2-separation-axiom-audit.md`.\
Its deltas are applied: D1 the rule as above, worded "score differently ... better or worse" where it proposed "do better ... or worse"; D2 the example; D3 the test below; D4 the cell count, corrected under banners in `0106` and `B94`; D5 the mechanisation, filed as `B97`.\
The key was audited twice by fresh readers before any reader ran, the second time against the revised wording, and both audits' findings are applied and recorded in `docs/audits/M6.2-testdrive-key-audit.md`; the second audit's replacements were applied word for word and not audited a third time.

**Test, pre-registered before the run.**\
Experiment `m2-separation`, scenario `testdrive`: six probes, `Q1` and `Q2` on the new concern and `Q3` to `Q6` controls the old version answers.\
Arms: `control`, holding nothing; `m2-base`, holding only `M2` at `1de4b10aabd9d26819512e5e94a4dd7261b5e978`; `m2-head`, holding only `M2` at `c35db76b45e616318357bcd6375a2acce0e8780d`; each delivered as an instruction and nothing else.\
Population `c`, `a`, `f`, `o`, three runs per cell, judges `c`, `a`, `o`, two per outcome; a cell meets a probe when its judges' mean is at least 1.5 of 2.\
Rubrics score what an answer says, not whether it is grounded, as the new rule's fifth sentence asks and departing from rule 6, since readers holding nothing can never ground an answer.\
Verdicts are computed by `docs/evals/context-lab/analysis/m2-separation-predicates.mjs`, which refuses a run whose two versions were not the pinned revisions:

- **S - separation, per probe.** A probe separates if either version meets it at least 0.3 more often, or 0.3 less often, than `control`. A screen, not a test: at 12 cells per arm it needs a gap of four cells.
- **T - the new concern.** On the target probes that separate, pooled, `m2-head` against `m2-base`: holds if at least 0.25 higher with two-sided Fisher exact p below 0.05; refuted if not higher; unrunnable if no target probe separates.
- **G - guard.** Holds if, on the control probes that separate, pooled, `m2-head` falls no more than 0.10 below `m2-base`, and on no probe of the six, target or control, separating or not, does `m2-head` meet it at least 0.3 less often than `m2-base`; refuted otherwise; unrunnable only if no control probe separates and no probe falls.
- **D - descriptive.** Mean score per probe and arm, the target probes per member, and any incomplete value.

**Decision rule.**\
T and G both hold: the change goes to the director for ratification, then lands.\
T or G refuted: the wording is revised and returns to the director.\
Otherwise: to the director with the numbers.

**Expected power, stated in advance.**\
If one target probe separates, T holds at 12 cells per arm only on a large gap: `m2-base` at 3 of 12 needs `m2-head` at 9 (p 0.039), at 6 needs 12 (p 0.014); if both separate, `m2-base` at 8 of 24 needs 16 (p 0.042), at 12 needs 20 (p 0.031).\
Cells of one model are not independent.\
Capable readers may give the new rule's answers unaided, as general experimental practice; then the target probes do not separate, T is unrunnable, and the run shows that this comprehension test cannot see the change, which is the rule at work.\
A comprehension test shows whether readers can state the rule, not whether agents act on it.

**Closeout hooks, from the audit.**\
Report the revisions `run.json` gives for both versions; S for every probe, with its direction; `m2-base` against `control` on `Q2`, which measures this ruling's claim that without the new sentence rule 3 reads as an exemption; and the readers' observations, read before the verdicts.\
At landing, search again for citations of the renumbered rules.

**Alternatives refuted.**\
A check in tooling only - a tool runs only when chosen, and the method is what an agent reads when designing a test; its mechanisation is filed as `B97`.\
Traps only, as M6.2 is worded - comprehension probes show the same class.\
Rule 6's self-labels instead of readers given nothing - an instrument reporting on itself.\
Doing nothing - `B88`'s spend recurs.

**Named costs.** 36 cells, each holding one short document or none.

**Result, run `2026-10-20-102650-m2-separation`.** 36 cells, none excluded, no answer absent; 12 of 12 arm probes passed; `run.json` records the two versions at the pinned `1de4b10aabd9d26819512e5e94a4dd7261b5e978` and `c35db76b45e616318357bcd6375a2acce0e8780d`.\
Verdicts from `docs/evals/context-lab/analysis/m2-separation-predicates.mjs`, cells meeting each probe of 12:

| Probe | `control` | `m2-base` | `m2-head` | S |
|---|---|---|---|---|
| `Q1`, target | 10 | 9 | 12 | does not separate |
| `Q2`, target | 12 | 12 | 12 | does not separate |
| `Q3`, control | 3 | 12 | 12 | separates |
| `Q4`, control | 0 | 12 | 12 | separates |
| `Q5`, control | 0 | 12 | 12 | separates |
| `Q6`, control | 0 | 8 | 8 | separates |

T is unrunnable: readers holding nothing gave the new rule's answers unaided, so neither target probe can show the change, the risk stated in advance.\
G holds: 44 of 48 on the four control probes under both versions, and no probe fell.\
Under the decision rule the result goes to the director with the numbers.

**What the readers said.**\
Read after the verdicts, which the closeout hooks asked to read after them, since the predicates script printed both at once.\
Nine of the twelve old-version readers - every one but Gemini Flash's three, which reported nothing - wrote that the old `M2` does not ask for readers holding nothing, and that they had inferred it.\
Gemini Flash met `Q1` in none of its 3 cells holding the old version, 3 of 3 holding the new, and 2 of 3 holding nothing: given the old text, it answered from "compare old against new" alone.\
Two new-version readers found the rule's "readers holding either version" ambiguous between at least one version and both.\
Six new-version readers noted that `Q2` gives no margin, which the new rule requires; all six still met it.\
Fifteen readers across both versions found rule 1 unclear on whether the key's audit must come before readers answer or only before scoring, and whether the corrected key is committed again (`B98`).

**Closeout hooks.**\
Both revisions held as pinned; S reported for every probe with its direction above.\
`Q2` under the old version against nothing, 12 of 12 each: the old version's readers did not treat a control probe as exempt, so the reason given for "Control probes need this as much as the rest" is not supported by this run (banner above).\
At landing the audit's searches were run again - `git grep -nE "\brules? [4-9]\b"`, `M2` within fifteen characters of a rule number in either order, and each renumbered rule's opening words outside `M2` - and every hit cites the new numbers.

**Source.**\
`[V, director selection 2026-10-20 ("continue", M6.2); docs/audits/M6.2-m2-separation-axiom-audit.md; docs/audits/M6.2-testdrive-key-audit.md; docs/BACKLOG.md B94; docs/DECISIONS.md 0103 and 0106; docs/evals/runs/context-lab/2026-10-20-102650-m2-separation]`

### 0108

**Ruling.**\
In `M2` rule 4, "Readers holding either version must score differently on it from readers holding nothing" reads "Readers holding either version, or both, must score differently on it from readers holding nothing".

**Why.**\
Two of twelve readers of `0107`'s text in run `2026-10-20-102650-m2-separation` found "either" ambiguous between at least one version and both; the test's own predicate counted a probe as separating when at least one version differed, and the clause now says so.

**Alternatives refuted.**\
"At least one version" - the same reading in more words.\
Leaving it - the ambiguity two readers found would land with the rule.

**Named costs.**\
The clause is untested; it narrows a reading the test already used and changes no answer the test scored.

**Source.**\
`[V, director ruling 2026-10-26 ("continue with option 1"); docs/evals/runs/context-lab/2026-10-20-102650-m2-separation cells testdrive.m2-head.a.2 and testdrive.m2-head.c.3 OBSERVATIONS]`

### 0109

**Ruling, proposed.**\
`E4`'s paragraph *Relations to other sets belong here* is corrected, under `M13`'s rule for modifying a member: a relation between sets is a boundary only where a set tells itself apart from a neighbour, and a set can also exist to cover another's members (`B99`, M7, from pull request 16).\
Held on the local branch `m7-absorb` at `f137df5043c0d139a0862c28e7ad4a21771e4846` until ratified.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| *Relations to other sets belong here when they are boundaries.* | The heading claimed every inter-set relation for the charter; only boundaries belong there. |
| A set defining itself against a neighbour is stating a boundary. | Kept; the half of the old sentence that was true. |
| A set can also exist to cover another set's members - every procedure that conducts work cited by a work-type, every trait named by an axiom - and that relation is not a boundary: it is declared once, on the members of the side whose meaning includes it, with the reverse view generated (`README.md`, *Mechanics*). | The relation the old sentence denied, with two instances already in charters, and where the corpus already says such relations are held. |
| A charter whose set covers another's says so in its scope; which members are covered is read from the declarations, never kept in the charter. | Where a coverage scope is stated, and the limit that keeps the charter free of cells (`0065`). |
| The correction banner. | The old sentence was false when written, and a silently corrected record teaches that corrections do not happen. |

**Decision rule.**\
The old sentence is false as measured, so this correction goes to the director for ratification whatever the test under `0110` shows; the test's `Q2` is reported as evidence of whether readers took the old sentence at its word.

**Source.**\
`[V, director selection 2026-10-26 ("continue", M7); docs/audits/PR16-absorption-triage.md C1a; docs/BACKLOG.md B99]`

**Superseded before any reader ran.**\
A fresh reader's audit of the absorptions and their test (`docs/audits/M7-absorb16-audit.md`) found sentences false or misleading against the corpus and the test's decision rule pooling the wrong probe; `0112` replaces this ruling.

### 0110

**Ruling, proposed.**\
`M12` gains the reading for a covering scope in steps 2, 3 and 8, under `M13`'s rule for modifying a member (`B100`, M7, from pull request 16, concepts `C1a`, `C1b` and the orphan check of `C1c`).\
Held on the local branch `m7-absorb` at `f137df5043c0d139a0862c28e7ad4a21771e4846` until its test decides.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| Step 2: Where the scope is another set's population - a set that exists to cover another's members - the cells are that population's members, and a member here may sit in several without the partition being wrong; read which members it covers from the relation's declarations and their generated view, and where no declaration exists, building the view by hand is itself a finding. | Step 2's misfit test reads a covering member that covers several members as a wrong partition (`A7` binds two traits; `M1` is cited by two work-types); the triage's adversarial review found `M12` cannot run such an investigation as written. |
| Step 3: Under a covering scope, a member of the other set that nothing here covers is such a gap, for whichever set's purpose includes the relation - the side it is declared on; a member here that covers nothing is outside the scope, or shows a member the other set lacks. | Which set an uncovered member indicts is not fixed - the work-types charter takes it as its own gap, the traits charter as the trait's - so the rule names the side the relation is declared on; the orphan is the case `tools/check-enforcers.sh` already rejects. |
| Step 8: as a row with a revival trigger, *naming the set it is about* | A coverage investigation finds gaps in two sets, and one backlog holds both. |

**Test, pre-registered before the run.**\
Experiment `absorb16`, scenario `absorb16`: eight probes written from what the changed entries are for, with a key committed with this row and audited by a fresh reader before any reader runs.\
`Q1` to `Q3` probe the absorbed concepts: investigating a covering set (`0110`), whether a relation between sets can be other than a boundary (`0109`), and a party's own report (`0111`).\
`Q4` to `Q7` probe four concepts the triage judged already covered: keeping an id on promotion and stating tiers as kinds, what a stand-in supports, keeping what was found, and where a coverage view is kept.\
`Q8` guards the partition misfit test, which the proposal deleted and `0110` must not weaken.\
Arms: `control`, holding nothing; `m7-base`, the corpus at `5671948ca354e3126f7b052a5c2964195f77c59e`; `m7-head`, the corpus at `f137df5043c0d139a0862c28e7ad4a21771e4846`; each corpus with `AGENTS.md` as a folder file, the ledger as an instruction and the rest on request, as adopters receive it.\
Population `c`, `a`, `f`, `o`, three runs per cell, judges `c`, `a`, `o`, two per outcome; a cell meets a probe when its judges' mean is at least 1.5 of 2; rubrics score what an answer says, not whether it cites the corpus.\
Verdicts are computed by `docs/evals/context-lab/analysis/absorb16-predicates.mjs`, committed with this row, which refuses a run whose corpora were not the pinned revisions:

- **S - separation, per probe (`M2` rule 4).** A probe separates if either corpus meets it at least 0.3 more often, or 0.3 less often, than `control`.
- **T - the absorptions.** On the target probes that separate, pooled, `m7-head` against `m7-base`: holds if at least 0.25 higher with two-sided Fisher exact p below 0.05; refuted if not higher; unrunnable if no target probe separates. Each target probe's figures are reported too, since each absorption is ratified on its own.
- **V - the verdicts of "already covered", per probe, on `m7-base`.** *Covered, measured* if met in at least 9 of 12 cells and separating from `control` by 0.3; *covered by general practice* if met in at least 9 of 12 and not separating - the verdict stands, and is not the corpus's doing; *not covered* if met in fewer than 9 of 12 - the triage's verdict is reopened.
- **G - guard.** Holds if on no probe of the eight, separating or not, does `m7-head` meet it at least 0.3 less often than `m7-base`, and, if `Q8` separates, `m7-head` falls no more than 0.10 below `m7-base` on it; refuted otherwise.

**Decision rule.**\
G refuted: the wording of the absorption the fallen probe tests is revised and returns to the director.\
Otherwise, T holds: `0110` and `0111` go to the director for ratification; T not holding: they go to the director with the numbers.\
A *not covered* verdict reopens that concept's triage verdict, reported to the director.\
`0109` goes to the director whatever T shows.

**Expected risks, stated in advance.**\
Capable readers may answer `Q1`, `Q3`, `Q5` and `Q7` from general practice - traceability, independent verification, the limits of a simulator, a single source of truth - and then those probes do not separate and decide nothing, as in `0107`'s test.\
Readers of `m7-base` may do worse than readers holding nothing on `Q1` and `Q2`, misled by the misfit test and by `E4`'s false sentence; that would separate the probes downward and is what the correction predicts.\
On-request delivery tests the corpus as adopters reach it, so a reader that never opens `M12`, `E4` or `E8` scores as if it held nothing; the hydration table reports who opened them.\
At 12 cells per arm a single probe holds only on a large gap: `m7-base` at 3 of 12 needs `m7-head` at 9 (p 0.039).

**Named costs.** 36 cells, 24 of them reading the corpus on request, at roughly 270,000 input tokens each by the adherence runs' means.

**Source.**\
`[V, director selection 2026-10-26 ("continue", M7); docs/audits/PR16-absorption-triage.md C1a, C1b, C1c, C1f; docs/BACKLOG.md B100]`

**Superseded before any reader ran.**\
A fresh reader's audit of the absorptions and their test (`docs/audits/M7-absorb16-audit.md`) found sentences false or misleading against the corpus and the test's decision rule pooling the wrong probe; `0113` replaces this ruling.

### 0111

**Ruling, proposed.**\
`E8` gains a discriminator, *The party's own report*, under `M13`'s rule for modifying a member (`B100`, M7, from pull request 16, concepts `C3a` and `C3e`).\
Held on the local branch `m7-absorb` at `f137df5043c0d139a0862c28e7ad4a21771e4846` until its test decides.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| Evidence produced by the party whose conduct is in question settles what that party reported. | `E8` frames independence by the judge alone; `W8` gates on evidence the verifier did not author, which an executor's own transcript satisfies. |
| It settles the conduct only where the judge can re-run the work, or check the report against a record the party could not have written; a judge who can do neither says so rather than passing it. | The condition that matters - whether the judge can re-check - which the triage's first wording dropped, and the honest outcome where it cannot (`AGENTS.md` 5.1, `UNRUNNABLE` and `NOT-CLAIMED`). |

**Test.**\
`Q3` of the experiment pre-registered under `0110`, by its rule.

**Source.**\
`[V, director selection 2026-10-26 ("continue", M7); docs/audits/PR16-absorption-triage.md C3a, C3e]`

**Superseded before any reader ran.**\
A fresh reader's audit of the absorptions and their test (`docs/audits/M7-absorb16-audit.md`) found sentences false or misleading against the corpus and the test's decision rule pooling the wrong probe; `0114` replaces this ruling.

### 0112

**Ruling.**\
`E4`'s paragraph *Relations to other sets belong here* is corrected, under `M13`'s rule for modifying a member: a relation between sets is a boundary only where a set tells itself apart from a neighbour, and a set can also be measured against another's members (`B99`, M7, from pull request 16).\
It supersedes `0109`, whose wording an audit corrected before any reader ran, and is held on the local branch `m7-absorb` at `546260355d8db6ef1823d79b1a58008efd215172` until ratified.

**Ratified.**\
The director ratified this ruling on 2026-10-26, choosing option 1 of the list put to the director, which was also the recommendation: all three absorptions ratified, with `E8`'s last clause amended by `0115`.\
The tested text is the branch `m7-absorb` at `546260355d8db6ef1823d79b1a58008efd215172`; rebased onto `main` before landing, the same entries, identical by `git diff`, landed as `6ceda1347034e1a85d0822af7cf1896f37c94364`.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| *Relations to other sets belong here when they are boundaries.* | The heading claimed every inter-set relation for the charter; only boundaries belong there. |
| A set defining itself against a neighbour is stating a boundary. | Kept; the half of the old sentence that was true. |
| A set can also be measured against another set's members - the work-types charter asks that every procedure that conducts work be cited by a work-type, the traits charter that every trait be named by an axiom - and that relation is not a boundary: it is declared once, on the members of the side whose meaning includes it, with the reverse view generated (`README.md`, *Mechanics*). | The relation the old sentence denied, with the two instances already in charters, stated as measures since neither set exists to cover the other; and where the corpus already says such relations are held. |
| A charter that measures its set this way says so, in its vision or its scope; which members are covered is read from the declarations and never typed into the charter, though a view generated from them may appear in its index. | Where such a measure is stated - both instances are dimensions of succeeding, in a vision, not scopes - and the limit that keeps a charter free of cells (`0065`) without forbidding the generated relation columns charters already carry. |
| The correction banner, quoting the old heading and sentence. | The clause was arguably false when written - the axiom charter already had each domain citing the axioms it must satisfy - and plainly false once *Attachment*, *Binding* and the generated *Produced by* sections existed; a silently corrected record teaches that corrections do not happen. |

**Decision rule.**\
The old sentence is false as measured, so this correction goes to the director for ratification whatever the test under `0113` shows, unless a probe of `Q4` to `Q7` falls; `Q2` is reported.

**Source.**\
`[V, director selection 2026-10-26 ("continue", M7); docs/audits/PR16-absorption-triage.md C1a; docs/audits/M7-absorb16-audit.md; docs/BACKLOG.md B99]`

### 0113

**Ruling.**\
`M12` gains the reading for a charter's measure against another set's population, in steps 2, 3 and 8, under `M13`'s rule for modifying a member (`B100`, M7, from pull request 16, concepts `C1a`, `C1b` and the orphan check of `C1c`).\
It supersedes `0110`, whose wording and test an audit corrected before any reader ran, and is held on the local branch `m7-absorb` at `546260355d8db6ef1823d79b1a58008efd215172` until its test decides.

**Ratified.**\
The director ratified this ruling on 2026-10-26, choosing option 1 of the list put to the director, which was also the recommendation: all three absorptions ratified, with `E8`'s last clause amended by `0115`.\
The tested text is the branch `m7-absorb` at `546260355d8db6ef1823d79b1a58008efd215172`; rebased onto `main` before landing, the same entries, identical by `git diff`, landed as `6ceda1347034e1a85d0822af7cf1896f37c94364`.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| Step 2: Where the charter measures the set against another set's population - its scope is that population, or covering it is a dimension of succeeding - read that measure as a cover, beside any partition of the set's own scope: the cells are that population's members, and a member here may sit in several without the cover being wrong; read which members it covers from the relation's declarations and any view generated from them, and where no declaration exists, building the view by hand is itself a finding. | Step 2's misfit test reads a member that covers several members as a wrong partition (`A7` binds two traits; `M1` is cited by two work-types); no charter here states such a measure as its scope, so the trigger names the dimensions of succeeding where both instances live; the cover sits beside the partition, so the misfit test for the set's own scope is untouched. |
| Step 3: Under such a scope, a member of the other set that nothing here covers is such a gap, and a member here that covers nothing is outside the scope, or shows a member the other set lacks. | A coverage investigation's two findings; the orphan is the case `tools/check-enforcers.sh` already rejects for rules and tools, an analogy, since tools are not a set. |
| Step 3: Where the relation runs the other way - this set's charter requires each of its own members to be covered by another set's members - a member here that nothing covers is a fault of this set, not a gap in the other. | The traits charter counts a trait no axiom names as the trait's fault, though the relation is declared on the axioms; `0110`'s rule, the side it is declared on, would have blamed the axioms. |
| Step 8: as a row with a revival trigger, *naming the set it is about* | A coverage investigation finds gaps in two sets, and one backlog holds both. |

**Test, pre-registered before the run.**\
Experiment `absorb16`, scenario `absorb16`: eight probes written from what the changed entries are for, with a key committed before any reader ran and corrected after a fresh reader's audit, also before any reader ran.\
`Q1` to `Q3` probe the absorbed concepts: investigating a covering set (`0113`), whether a relation between sets can be other than a boundary (`0112`), and a party's own report (`0114`).\
`Q4` to `Q7` are four probes on five concepts the triage judged already covered, `Q4` holding two: keeping an id on promotion and stating tiers as kinds, what a stand-in supports, keeping what was found, and where a coverage view is kept.\
`Q8` guards the partition misfit test, which the proposal deleted and this ruling must not weaken.\
Arms: `control`, holding nothing; `m7-base`, the corpus at `5671948ca354e3126f7b052a5c2964195f77c59e`; `m7-head`, the corpus at `546260355d8db6ef1823d79b1a58008efd215172`; each corpus as this repository delivers itself - `AGENTS.md`, with its section 5, as a folder file, the ledger as an instruction and the rest on request - which is not the adopter template, whose standing context has no section 5.\
Population `c`, `a`, `f`, `o`, three runs per cell, judges `c`, `a`, `o`, two per outcome; a cell meets a probe when its judges' mean is at least 1.5 of 2; rubrics score what an answer says, not whether it cites the corpus.\
Verdicts are computed by `docs/evals/context-lab/analysis/absorb16-predicates.mjs`, which refuses a run whose corpora were not the pinned revisions:

- **S - separation, per probe (`M2` rule 4).** A probe separates if either corpus meets it at least 0.3 more often, or 0.3 less often, than `control`.
- **T - the absorptions of `0113` and `0114`.** On `Q1` and `Q3`, those that separate, pooled, `m7-head` against `m7-base`: holds if at least 0.25 higher with two-sided Fisher exact p below 0.05; refuted if not higher; unrunnable if neither separates. `Q2` is reported for `0112` and is not pooled; each target probe's own figures are reported.
- **V - the verdicts of "already covered", per probe, on `m7-base`.** *Covered, measured* if met in at least 9 cells of 12 and separating from `control` by 0.3; *covered by general practice* if met in at least 9 of 12 and not separating - the verdict stands, and is not the corpus's doing; *not covered* if met in fewer than 9 of 12 - the triage's verdict is reopened. A cell without a value counts as not met; with no `control` value the verdict is unrunnable.
- **G - guard.** Holds if on no probe of the eight, separating or not, does `m7-head` meet it at least 0.3 less often than `m7-base`, and, if `Q8` separates, `m7-head` falls no more than 0.10 below `m7-base` on it; refuted otherwise.

**Decision rule, per ruling.**\
A fall on `Q4` to `Q7` tests no absorption, so all three return to the director with it named and none is ratified until it is explained.\
A fall on `Q1` or `Q8` sends `0113` back for revision, on `Q3` `0114`, and on `Q2` `0112`; so does `Q8` falling by more than 0.10 while it separates, for `0113`.\
Otherwise `0112` goes to the director for ratification whatever T shows, and `0113` and `0114` each go for ratification only if T holds and its own probe - `Q1`, `Q3` - separates and is higher on `m7-head`, and otherwise with the numbers.\
A *not covered* verdict reopens that concept's triage verdict, reported to the director.

**Expected risks, stated in advance.**\
Capable readers may answer `Q1`, `Q3`, `Q5` and `Q7` from general practice - traceability, independent verification, the limits of a simulator, a single source of truth - and then those probes do not separate and decide nothing, as in `0107`'s test.\
`Q3` cannot separate `m7-head` from `m7-base` while `AGENTS.md` section 5, which already holds the principle, is delivered to both; `0114` is then decided on argument, and `Q3` is reported.\
Readers of `m7-base` may do worse than readers holding nothing on `Q1` and `Q2`, misled by the misfit test and by `E4`'s false sentence; that would separate the probes downward, as the correction predicts.\
On-request delivery means a reader that never opens `M12`, `E4` or `E8` scores as if it held nothing; the hydration table reports who opened them.\
`Q8` may not separate, leaving G's bound of 0.10 unused, so a fall of up to three cells on it passes; applying the bound regardless would let one cell decide at 12 cells per arm.\
At 12 cells per arm a single probe holds only on a large gap: `m7-base` at 3 of 12 needs `m7-head` at 9 (p 0.039).

**Named costs.** 36 cells, 24 of them reading the corpus on request, at roughly 310,000 input tokens each by the adherence runs' on-request means, and likely more for eight questions.

**Result, run `2026-10-26-005243-absorb16`.** 36 cells, none excluded, no answer absent; 12 of 12 arm probes passed; `run.json` records the two corpora at the pinned revisions.\
The readers' observations were read before the verdicts this time.\
Cells meeting each probe, of 12:

| Probe | `control` | `m7-base` | `m7-head` | S |
|---|---|---|---|---|
| `Q1`, investigating a covering set (`0113`) | 12 | 6 | 12 | separates, downward on `m7-base` |
| `Q2`, relations other than boundaries (`0112`) | 8 | 10 | 12 | separates |
| `Q3`, a party's own report (`0114`) | 6 | 9 | 12 | separates |
| `Q4`, keeping an id; tiers as kinds | 12 | 12 | 12 | does not separate |
| `Q5`, what a stand-in supports | 12 | 12 | 12 | does not separate |
| `Q6`, keeping what was found | 10 | 12 | 12 | does not separate |
| `Q7`, where a coverage view is kept | 10 | 11 | 12 | does not separate |
| `Q8`, the partition misfit test | 12 | 12 | 12 | does not separate |

T holds: on `Q1` and `Q3` pooled, 24 of 24 under `m7-head` against 15 of 24 under `m7-base`, gap 0.38, p 0.0016; `Q1` alone 12 against 6 (p 0.014), `Q3` alone 12 against 9 (p 0.22).\
G holds: no probe fell, and `Q8` did not separate, so its bound was not used.\
V: all four probes on the concepts the triage judged already covered read *covered by general practice* - readers holding nothing met them as often as readers of the corpus - so those verdicts stand, and no absorption is owed for them, `C2c` included.\
Under the decision rule `0112`, `0113` and `0114` each go to the director for ratification.

**What the run shows.**\
`Q1` is the clearest case of `M2` rule 4's downward branch: readers holding nothing met it in every cell, readers of the current `M12` in half - its misfit test led them to treat a check covering three requirements as a broken partition - and readers of the revised `M12` in every cell.\
So `0113` mostly repairs harm the current text does, rather than teaching what readers lacked.\
`Q2` did not separate downward as predicted: instead every Claude, Gemini Argon and GPT reader of the current corpus, nine of nine, wrote in their observations that `E4`'s sentence about inter-set relations is false or overgeneralised, the defect `B99` records, found unprompted.\
`Q3`'s rise from 9 to 12 is not significant alone; four readers of the current corpus wrote that `E8`'s *The author's evidence* reads two ways, which `0114` addresses.\
Tool inputs in 23 of 24 corpus cells named `E4`, `M12` and `E8`; the remaining cell, `m7-head`'s third Claude cell, named none and met every probe.

**What the readers found besides.**\
Two readers of the revised `E8` found it unsettled against `E7` whether an account the judge cannot check gives no verdict or a fail; `E7` makes no verdict an invalid run and a fail a valid run that finds the condition false, and the new sentence says only "does not pass".\
One reader of the revised `M12` found "may sit in several" easy to miss beside "exactly one place" in the same step.\
Defects outside the change, read by the author against the files and filed: `SC1` says the reverse view of a work-type's `methods` is generated, and `tools/generate-index.mjs` generates none (`B102`); `SC1`'s `retired` status keeps the id "so citations resolve", against the rule that a retired entry is deleted with no stub (`B103`); `ST1`, a set charter, carries `Purpose` and no `Operation` though `E4` gives every charter fixed headings, and `SC6` checks layer charters only (`B104`).

**Disclosed.**\
This ruling said the hydration table would report who opened the changed entries; it cannot, since the probes declare no guidance, and the figure above is read from tool inputs instead.\
The cost estimate was low: the corpus arms averaged about 780,000 and 680,000 input tokens per cell, more than twice the estimate, the costliest cell 1,964,301.

**Source.**\
`[V, director selection 2026-10-26 ("continue", M7); docs/audits/PR16-absorption-triage.md C1a, C1b, C1c, C1f; docs/audits/M7-absorb16-audit.md; docs/BACKLOG.md B100; docs/evals/runs/context-lab/2026-10-26-005243-absorb16]`

### 0114

**Ruling.**\
`E8` gains a discriminator, *The party's own report*, under `M13`'s rule for modifying a member (`B100`, M7, from pull request 16, concepts `C3a` and `C3e`).\
It supersedes `0111`, whose wording an audit corrected before any reader ran, and is held on the local branch `m7-absorb` at `546260355d8db6ef1823d79b1a58008efd215172` until decided.

**Ratified.**\
The director ratified this ruling on 2026-10-26, choosing option 1 of the list put to the director, which was also the recommendation: all three absorptions ratified, with `E8`'s last clause amended by `0115`.\
The tested text is the branch `m7-absorb` at `546260355d8db6ef1823d79b1a58008efd215172`; rebased onto `main` before landing, the same entries, identical by `git diff`, landed as `6ceda1347034e1a85d0822af7cf1896f37c94364`.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| A party's own account of what it did - its log, transcript or summary - shows what that party reported. | `E8` frames independence by the judge alone; `W8` gates on evidence the verifier did not author, which an executor's own transcript satisfies. "Shows", not "settles", since in `E8` evidence never decides. |
| It shows that the thing was done only where the judge can observe the result, re-run the work, or check the account against a record the party could not have written; a judge who can do none of these records the claim as not shown, and does not pass it. | The condition that matters - whether the judge can check - with direct observation, which `0111`'s wording omitted, and the honest outcome where it cannot (`AGENTS.md` 5.1 `NOT-CLAIMED`, 5.2 `UNRUNNABLE`); paid for, since the adopter template's standing context has no section 5. |

**Test.**\
`Q3` of the experiment pre-registered under `0113`, by its rule; as stated there, `Q3` cannot separate the two corpora while both carry `AGENTS.md` section 5, so this ruling is likely decided on argument.

**Source.**\
`[V, director selection 2026-10-26 ("continue", M7); docs/audits/PR16-absorption-triage.md C3a, C3e; docs/audits/M7-absorb16-audit.md]`

### 0115

**Ruling.**\
In `E8`'s *The party's own report*, the last clause reads: "a judge who can do none of these records the claim as not shown, and does not pass it - at a gate, such an account is no valid input, so the gate has no verdict and the work waits (`E7`)".

**Why.**\
Two of twelve readers of `0114`'s text in run `2026-10-26-005243-absorb16` found it unsettled whether an account the judge cannot check gives no verdict or a fail: `E7` makes a fail a valid run that finds the condition false, and no verdict a run that was not validly run, and "does not pass" is neither.\
The account does not show the condition false, so it is not a fail; it cannot bear on the condition, so it is not valid input, and the gate waits for evidence that can.

**Named costs.**\
The clause is untested; `Q3`'s rubric already accepted either reading, so it changes no score the test gave.\
`E7`'s list of what makes a run invalid - evidence for another revision, a judge without authority, a judge who authored the work - does not name this case, so a reader of `E7` alone does not learn it; that is `B105`.

**Alternatives refuted.**\
A fail - the account does not show the condition false.\
Leaving it - the open point two readers found would land with the rule.

**Source.**\
`[V, director ruling 2026-10-26 ("continue 1"); docs/evals/runs/context-lab/2026-10-26-005243-absorb16 cells absorb16.m7-head.c.2 and absorb16.m7-head.c.3 OBSERVATIONS]`

### 0116

**Ruling.**\
A component entry may be registered with `status: draft` before its component is usable, so that a search of the registry finds its definition, and readers can cold-read it, before the component is built.\
A draft entry is not in force: no consumer depends on it, and its contract states what a consumer will depend on once the component is built.\
A draft entry says that it is a draft, that nothing in it is in force, and what a consumer does until its component is usable.\
It becomes `active` only once its component is usable, as `0087` requires; `0087`'s admission clause otherwise stands.

**Ratified.**\
The director ratified this ruling on 2026-11-07, choosing to ratify it as drafted, `project`, which was also the recommendation.\
The text ratified is the row and body committed in `bf9ed11`.

**Why.**\
`C15` (`entity-graph`) was registered as a draft on 2026-11-07 (`b413439`), while `0087` says "a component entry is admitted only once it is usable" and `0093` applied that clause to `context-lab`, registered then as `C6` and renumbered `C2` by `0094`.\
The registry exists so a capability is found rather than rebuilt (`C0`), and a component under design is when a would-be rebuilder most needs to find it.\
The cold reading of the draft `C15` found defects in its definition that the design effort can now meet before building rather than after.\
It is drafted `project`, as `0087` and `0093` are; it may instead be `general`, a standing rule for every component entry, in which case `C0` states it, together with `0087`'s usability clause, which `C0` does not state today, under `M11`.

**Named costs.**\
A reader routed to a draft entry meets a component it cannot use yet.\
The registry now holds two statuses, which its generated index already shows.

**Alternatives refuted.**\
Withdrawing `C15` until it is usable - `M13` retires an id for good, so the component would return under a new id.\
Leaving the conflict unrecorded - `0087` and the registry would then disagree without a record of why.

**Source.**\
`[V, director instruction 2026-11-07 to draft this row for ratification; docs/DECISIONS.md 0087, 0093 and 0094; commit b413439; docs/audits/eval-C15/SCORES.md]`

### 0117

**Ruling.**\
Until `entity-graph` (`C15`) is usable, a project that cannot wait may build a stopgap behind its own boundary, or keep the implementation it already has.\
It records the requirement against `entity-graph`'s contract, does not grow the stopgap into a variant of `entity-graph`, and moves onto `entity-graph` once it is usable.\
Such a stopgap is not a fork.

**Ratified.**\
The director ruled this on 2026-11-07, choosing the recommended option of the question put to the director, and it lands by that authority.

**Why.**\
All three readers of `C15`'s final text in the third cold-read run found that the earlier guidance, which let a project with no implementation start none, left it with no way forward and no timeline (`docs/audits/eval-C15/SCORES.md`).\
`C0` lets adoption outrank orthogonality and records the overlap as a finding rather than a refusal, and a registry no project can assemble from has failed by its first measure.

**Named costs.**\
The guidance is untested; no cold read has read it.\
A stopgap is a second copy for as long as it lives, and nothing yet checks that it is retired.

**Alternatives refuted.**\
Keeping the strict reading of never fork - a project that cannot wait is blocked with no date to wait for.\
Leaving the question open - the entry's readers decide it themselves, and differently.

**Source.**\
`[V, director ruling 2026-11-07 ("Allow a recorded stopgap"); docs/audits/eval-C15/SCORES.md; components/README.md Territory and Operation]`

### 0121

**Ruling.**\
A15 Recursive Elevation is ratified as an axiom, as drafted in pull request 17 (`1e98505`).\
A recurring report, review, audit or incident recovery is complete only once it records what would remove the need for it or move its mechanism one rung higher.

**Ratified.**\
The director ratified A15 on 2026-11-07, as drafted, with the findings of its read against the set, below, put to the director before the ruling.\
The one change to the drafted text puts four sentences that ran into the one before them with no space on lines of their own, as `S6` asks; no word changed.\
The id is `0121` because pull request 18 holds `0118` to `0120` as proposed rulings.

**Named costs.**\
The axioms charter requires a candidate to be read against the whole set at admission, and that read found three things that stand:

- A15's *human-gate filter* has agents decide a question settled from held evidence, source truth or charter invariants, record it and let the director overrule, and has every escalation arrive "pre-decided with a recommended option and default"; `A13` says the system "never reworks the option set, narrows the choices, nor pre-empts the decision"; whether the two conflict is not settled, and `B115` holds it.
- A15's *Mechanics* carry a procedure, which the axioms charter routes to methods, patterns or skills, and whether A15 forbids anything `A10`, `A11` and `A14` permit, beyond a recurring step that works with no failure or friction, is not settled; `B116` holds both.
- A15 carries no adherence trap, which `0083` asks of every axiom.

**Alternatives refuted.**\
None with a reason recorded.\
Three were put to the director and not chosen: slimming A15 to its core limit and moving its procedure to a method, folding that limit into `A14` as a modification tested under `M2`, and parking it as a backlog row.

**Source.**\
`[V, director instruction 2026-11-07 ("I ratified #17"); pull request 17, commit 1e98505; axioms/README.md Growth policy and Operation; axioms/A13-director-intent-amplification.md Mandate]`

### 0122

**Ruling.**\
`tools/generate-index.mjs` generates each `M1`-`M13` procedure entry's reverse view (`## Work-types that cite this procedure`) from work-types' `methods` declarations as ruled in `0039` (`B102`), and `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json` states under `status` that `retired` and `superseded` files are deleted with no stub in this corpus, with live citations repaired and retired IDs held non-reusable from git history by `tools/check-id-reuse.mjs`, as ruled in `0057` (`B103`).

**Ratified.**\
`[DIRECTOR]` Both underlying rules were ratified in `0039` and `0057`, and closing these two `S1` corpus contradictions was executed under the director's explicit 2026-11-11 autonomous corpus-climb delegation.\
`[MEASURED]` Prior to this change, `catalog-entry.schema.json` claimed `methods` had a generated reverse view while `tools/generate-index.mjs` generated none, and claimed `retired` kept the ID so citations resolve while `M13` deleted retired files with no stub (`B102`, `B103`).

**Named costs.**\
Nine procedure entries gain a short generated section at the foot of each file, six of which currently render an empty table that exposes `W0`'s uncovered *Attachment* directly (`B69`).\
`tools/methods-view.test.sh` adds one isolated-sandbox fixture check to `tools/check-all.sh`.

**Alternatives refuted.**\
Removing the generated-reverse-view claim from `SC1` - refuted by `0020` and `0039`, which require reverse views to be generated so `W0` *Attachment* can be read without scanning `work-types/`.\
Dropping `retired` and `superseded` from `status.enum` - refuted because `tools/sets.test.sh` and pre-deletion validation test that non-active statuses are refused if gathered into a set.

**Source.**\
`[V, docs/DECISIONS.md 0020, 0039 and 0057; docs/BACKLOG.md B102 and B103; tools/methods-view.test.sh]`

### 0123

**Ruling.**\
`A16` Unbiased Self-Check (`axioms/A16-unbiased-self-check.md`, `applies-to: [any-system]`) is admitted to the axiom set as the single home of `0016` and `0017`, closing `B21`, and `roles/README.md` (`R0`) cites `A16` while keeping only its role-authority boundary.\
Every actor checks its own work by means its own reasoning cannot bias - a deterministic mechanism, fetching any cited online address empirically or reading command output, or a fresh reader holding only the artifact - producing mandatory executor evidence (`E8`) that never substitutes for independent assurance at a gate (`R0`, `E7`).

**Ratified.**\
`[DIRECTOR]` The obligation, empirical URL verification and the boundary between a fresh sub-agent self-check and independent assurance were ruled by the director in `0016` and `0017` (`R0` review); admission under the director's explicit 2026-11-11 autonomous corpus-climb delegation closes `B21` on the `A0` admission read against `A1`-`A15` (`M13` Admit).\
`[ARGUED]` Read against `A1`-`A15` per `A0` *Operation*: `A8` requires binary promotion gates and `A4` requires lossless transfer, yet neither forbids certifying a single-layer change by re-reading one's own diff, trusting an unapplied mutant, or preserving a confident inference as measured fact; `A11` mechanizes deterministic work for token economy rather than bias independence, so `A16` fails independently of all fifteen peers.\
`[MEASURED]` Tagged `applies-to: [any-system]` alone, honouring `T0`'s rule that the floor is never combined with a trait, paired with `B29`-audited `docs/evals/context-lab/scenarios/adherence-a16.json` per `0083` (`B73`), and single-homed under `A3` via `M11` accounting on `roles/README.md:93-100`: the opening accountability sentence is kept, the restated self-check mechanics, live-fetch example and re-reading prohibition are replaced by a direct citation to `A16`, and the fresh-instance sentence is narrowed to `R0`'s role-authority boundary (`R3` verifier authority).

**Named costs.**\
The axiom set grows from fifteen to sixteen entries (`INDEX.md`), adding one row to always-on ledger scans.\
`adherence-a16.json` is authored and audited by a fresh non-author reader (`M2` Rule 1); behavioural adherence separation (`M2` Rule 4) remains `NOT-CLAIMED` until the next four-model `context-lab` `adherence` experiment run.

**Alternatives refuted.**\
Folding the rule into `A8` or `A4` - refuted because unbiased self-checking binds stateless, un-gated solo artifacts where `A8`'s layered promotion is vacuous and where `A4` faithfully preserves whatever false claim the author corroborated.\
Keeping full copies of the self-check mechanics in both `R0` and `A16` - refuted by `A3` and `README.md`'s *forked constraint* fault (`roles/README.md:105`).

**Correction, 2026-11-11.**\
`roles/README.md:93-100` and `roles/README.md:105` above are line numbers of that file at `63255fe`, before this ruling's own edit, and the record did not say so.\
After the edit, the sentence the second number points at - "authored once in `W0` and cited here rather than restated" - closes the paragraph of *How the roles compose* that begins "When there is no second agent", and the *forked constraint* fault is named in the root `README.md` under *Faults*.

**Source.**\
`[V, docs/DECISIONS.md 0008, 0009, 0016, 0017 and 0083; docs/BACKLOG.md B21, B56 and B73; roles/README.md How the roles compose; axioms/README.md Operation]`

### 0124

**Ruling.**\
`schemas/SC6-entry-body.md` and `tools/check-entry-body.sh` hold both `<prefix>0` layer charters and `category: set` spanning-set charters to `spec.charters` (`Vision`, `Territory`, `Operation`, `Faults`, `Index`), guarded by `tools/entry-body.test.sh`, and `sets/ST1-explain.md` is converted to `E4` (`B104`).

**Ratified.**\
`[DIRECTOR]` Applies `0065` and `0071` to spanning-set charters under the director's explicit 2026-11-11 autonomous corpus-climb delegation.\
`[MEASURED]` Accounting for every sentence of prior `sets/ST1-explain.md` under `M11`: `## Purpose` renamed `## Vision` and its single sentence kept verbatim as **North star** alongside `AR6`'s vision devices; the two-row member table in `## Territory` deleted per `0065` (members remain in frontmatter `members` and generated `## Index`) and replaced by **Scope** and **Growth policy**; `**Related, not members.**` and `**Related, each with a tension to reconcile before it joins:**` moved unchanged into `## Boundaries`; `**Gaps recorded.**` moved out of the charter per `0065` into `docs/BACKLOG.md` `B42`; `## Operation` added citing `M12`, `M13` and `M11` and stating how `M10` composes with `S15`; `## Axiom alignment` (plus where `ST1` falls short at per-move granularity), `## What earns an entry`, `## Boundaries` (`Communication with a human only` plus route to `A6`), `## Faults` and `## Index` retained.

**Named costs.**\
`sets/ST1-explain.md` grows from 73 to 109 lines to answer the `AR6` vision devices, scope/growth policy, composition and operation required by `E4` (`0006` paid-for test: answers how `ST1` grows, composes, operates and routes non-members, tested via `M2`).

**Correction, 2026-11-11.**\
The paragraph above says `sets/ST1-explain.md` grows from 73 to 109 lines; it grew from 73 to 103, by `git show 63255fe:sets/ST1-explain.md | wc -l` and the same command at `eb25fcc`.\
The figure 109 was not measured when it was written.

**Alternatives refuted.**\
Exempting `category: set` from `E4`'s fixed headings - refuted by `E4` (*Required - every charter*) and `ST0`, which define spanning sets as charters with end state, scope, operation and faults of their own.

**Source.**\
`[V, docs/DECISIONS.md 0065 and 0071; docs/BACKLOG.md B42 and B104; entities/E4-charter.md; tools/entry-body.test.sh]`

### 0125

**Ruling.**\
`methods/M13-change-a-set.md`'s opening sentence states that operating a set governs its population - `M12` analyses it and `M13` changes its membership - while operating its charter changes the text the population is measured against by `M11`, aligning `M13` with `E4` and `0072`.

**Ratified.**\
`[DIRECTOR]` Reconciles `M13` with `0072` under the director's explicit 2026-11-11 autonomous corpus-climb delegation.\
`[MEASURED]` In paired blind evaluation `mkhc-eval-run-r1`, three of six readers across `base` and `head` on `set-operation.O1` read `M13`'s opening ("Operating a set changes its population ... This method is the first") and answered that operating a set is `M13` alone, omitting `M12`, whereas readers opening `E4` scored 2 of 2; in `mkhc-eval-run-r2` after this change, `head` scored 2.00 on `set-operation.O1`.

**Named costs.**\
One two-sentence opening in `M13` becomes one sentence; no procedure step changes.

**Alternatives refuted.**\
Weakening `set-operation.O1`'s key to omit `M12` - refuted by `0072` and `E4` line 37, which explicitly place both `M12` and `M13` under operating the set.

**Source.**\
`[V, docs/DECISIONS.md 0072; entities/E4-charter.md Definition; paired blind runs mkhc-eval-run-r1 and mkhc-eval-run-r2]`

### 0126

**Ruling.**\
`tools/check-decisions.mjs` excludes `superseded by <id>` rows from `pending absorption` and `contested` counts (`tools/decisions.test.sh`), and `docs/ARCHITECTURE.md` reconciles its authored axiom, decision-register and entry-lifecycle prose with `0057`, `0121` and `0123`.

**Ratified.**\
`[DIRECTOR]` Executed under the director's explicit 2026-11-11 autonomous corpus-climb delegation.\
`[MEASURED]` Five superseded rows (`0102`, `0106`, `0109`, `0110`, `0111`) carried `absorbed: pending` from before replacement and were reported as awaiting absorption alongside live obligations, while `docs/ARCHITECTURE.md` lines 73, 97, 106 and 220-223 still stated fourteen axioms, no decision register (`B15`), five unconditional axioms, and stub retention on replacement.

**Named costs.**\
`tools/decisions.test.sh` adds four fast fixture checks to `tools/check-all.sh`.

**Alternatives refuted.**\
Editing frozen `0102`, `0106`, `0109`, `0110` and `0111` rows in `docs/DECISIONS.md` to `absorbed: yes` - refuted because those five rows were superseded before ever being absorbed, so `AR4` forbids claiming they were absorbed while retiring a record removes its pending obligation.

**Source.**\
`[V, artifacts/AR4-decision-record.md; docs/DECISIONS.md 0057, 0121 and 0123; docs/ARCHITECTURE.md; tools/decisions.test.sh]`

### 0127

**Ruling.**\
`work-types/W8-verify-gate-reactive.md`, `work-types/W9-audit-a-surface.md` and `work-types/W10-adversarial-design-review-upstream.md` cite constraints 2 and 9 of `work-types/README.md` for what follows when the live roster collapses attester and executor, and no longer state an outcome of their own (`B117`).

**Ratified.**\
`[DIRECTOR]` `0052` ruled that same-agent review is never a valid degradation and refuted downgrading the attestation to `kind:review`; applying it to three entries that still carried the refuted alternative was executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of the same date.\
`[MEASURED]` At `96a8aef946a6c04ce91dd2cbb9b5f25c8eeac2f6`, `W8` read "the seed fails or downgrades to `kind:review`", `W9` "fails the seed or downgrades to plain `kind:review`" and `W10` "falls back to plain `kind:review`", while constraint 2 of `W0` read "fail the seed, and the gate waits for an independent agent or is met by director ratification (constraint 9); a same-agent review never stands in".\
`[MEASURED]` `0052` names `work-types/README.md` and `roles/README.md` as the entries that must state it, and both do; the three copies lay outside that list.

**Each changed sentence.**

| Entry | Was | Is | Reason |
|---|---|---|---|
| `W8` | "if the live roster collapses attester and executor, the seed fails or downgrades to `kind:review`" | "what follows when the live roster collapses attester and executor is stated once, in constraints 2 and 9 of `work-types/README.md`, and is not restated here" | The downgrade is the alternative `0052` refuted. The first half of the sentence, on which authority a verifier-held gate uses, is unchanged: it is `B70`'s question, which stays held. |
| `W9` | "a thin roster that collapses attester and executor to one agent fails the seed or downgrades to plain `kind:review`" | "what follows when a thin roster collapses attester and executor to one agent is stated once, in constraints 2 and 9 of `work-types/README.md`, and is not restated here" | The same. |
| `W10` | "with a collapsed roster this falls back to plain `kind:review`" | "what follows from a collapsed roster is stated once, in constraints 2 and 9 of `work-types/README.md`, and is not restated here" | The same. |

**Test, fixed before any reader ran.**\
Under `M13`'s rule for modifying a member: the corpus at `96a8aef946a6c04ce91dd2cbb9b5f25c8eeac2f6` against the corpus as changed, both in one `tools/eval.mjs prepare`, three fresh readers per corpus, scored blind by a separate agent, on suites `w0` and `composition`.\
`w0.Q4` and `composition.P5` ask the question the copies answered wrongly; the other thirteen probes are controls.\
The regression rule of `docs/evals/README.md` applies at tolerance 0.\
No reader holds nothing in this run, because every reader in this harness receives its always-on context (`docs/evals/README.md`, *What a result can and cannot claim*); so under `M2` rule 4 no probe's gain counts in this change's favour, and every probe still counts against it if readers of the changed entries do worse.

**Named costs.**\
A reader of one of the three entries alone now follows one citation to learn the outcome, where the entry had given it in place, wrongly.\
Each entry keeps the clause naming constraint 2 as the one that bears on it; only the outcome is no longer copied.

**Alternatives refuted.**\
Correcting each copy to the ruled outcome - refuted by `W0`'s *Faults*, which names *the restated constraint*, and by the record: these copies drifted from their source in the change that corrected it.\
Removing the clause that names constraint 2 as load-bearing - refuted because naming the constraint that bears on a work-type is the reference `W0`'s member shape asks for under *Evidence & closeability*, and is not a copy of the constraint.

**Result, runs `2026-11-11-climb2-r1` and `2026-11-11-climb2-r1b`.**\
Two runs on the same two exports, the second repeating `w0` and `composition` with fresh readers, so six readers per corpus on each suite; no answer absent, no consistent hedge.\
Two probe means fell, each in one run and on text the change did not touch: `w0.Q6`, 2 to 1.33 in the first run, and `w0.Q3`, 1.67 to 1.33 in the second.\
Both are noise under the regression rule: the files each depends on are byte-identical in the two exports, and the scorer's reason for each fall appears on base readers too (`Q6`: two of the second run's three; `Q3`: four of six).\
The second run was made to settle `Q6`, with its reading written down first, because the first run's base readers did not show the shortfall.\
`w0.Q4` scored 2 on both corpora in both runs, and cannot see this change: by their tool-call logs none of the twelve `w0` readers opened `W8`, `W9` or `W10`.\
`composition.P5` scored 1 and 1.33 on base, 1.33 and 1.33 on the changed corpus.\
By element, from the blind scorers' reasons: reached wait-or-ratify, 1 of 6 base readers and 6 of 6; credited with unbiased self-checking, 5 of 6 base readers and 2 of 6.\
From the answers, by the author's count: gave the downgrade `0052` refuted as what happens, 3 of 6 base readers and 0 of 6.\
Under `M2` rule 4 none of this counts in the change's favour, since no reader held nothing; the change rests on `0052`.\
The fall in unbiased self-checking counts against it.\
Every movement and its classification is recorded with the runs.

**Correction after those runs, before sealing.**\
Neither the sentence this ruling removed nor the one it wrote names the executor's own check.\
Readers of the old sentence, told only that the seed fails or downgrades, went on to `W4` or `A16` for what to do; readers of the new one are sent to constraints 2 and 9, which answer for the gate and say nothing of that check, and four of six stopped there.\
That is a reading this change made possible, which the regression rule has corrected before a change lands; `R0` names where it leads as *the unchecked lone agent*.\
Each of the three sentences is now followed by one more: "The check the executor still owes its own work, with or without a second agent, is stated in `A16`."\
It cites `A16` and restates nothing.\
`work-types/README.md` is unchanged: whether the constraint set should itself carry the citation is not decided on the strength of one probe.

**Test of the correction, fixed before any reader of it ran.**\
The corpus at `96a8aef946a6c04ce91dd2cbb9b5f25c8eeac2f6` against the corpus as corrected, both in each `tools/eval.mjs prepare`: `composition` with six fresh readers per corpus, and `w0` and `gate` with three, so that every suite read as a whole corpus is run again on the text that would be sealed; scored blind by a separate agent.\
The added sentence is kept if, on `composition.P5` by the blind scorer's reasons, the readers of the corrected corpus credited with unbiased self-checking are not fewer than the base readers of the same run by two or more of six, at least five of six reach wait-or-ratify, and none gives the refuted downgrade.\
Otherwise it is removed again, this ruling stands as first written with the fall recorded, and a backlog row carries the counts.\
Any probe that falls is classified under the regression rule, a fall on a probe that reads `W8`, `W9` or `W10` being a regression until shown otherwise.\
Under `M2` rule 4 nothing in the run counts in this change's favour.

**Result, runs `2026-11-11-climb2-r2-composition` and `2026-11-11-climb2-r2-controls`.**\
Six readers per corpus on `composition` and three on each of `w0` and `gate`; no answer absent, no consistent hedge.\
On `composition.P5`, by the blind scorer's reasons: credited with unbiased self-checking, 5 of 6 base readers and 1 of 6 readers of the corrected corpus; reached wait-or-ratify, 3 of 6 and 6 of 6.\
From the answers, by the author's count: gave the refuted downgrade, 3 of 6 and 0 of 6.\
By their tool-call logs four of the six readers of the corrected corpus read `W8`, where the added sentence stood, and none of the four was credited; one of them went on to read `A16` and still answered with wait-or-ratify alone.\
The one reader credited had read `roles/README.md` and not `W8`.\
The added sentence fails the test fixed above and is removed: `W8`, `W9` and `W10` stand as this ruling first wrote them, which is the text the first two runs read.\
On the corrected text `P5` fell from 1.33 to 1.17, a regression of the correction, and `P1` fell by one reader on text no version of this change touched, with a hedge no base reader shows, so it is recorded unclassified; both were measured on text that is withdrawn.\
`w0` and `gate` showed no fall.

**What the three runs show of this change, and what they leave open.**\
On `composition.P5`, over twelve base readers and twelve readers of the two changed texts: gave the refuted downgrade, 6 and 0; reached wait-or-ratify, 4 and 12; credited with unbiased self-checking, 10 and 3; scored 2 by carrying both, 3 and 3; points, 15 of 24 and 15 of 24.\
The change takes the outcome `0052` refuted out of every answer and puts the ruled one into every answer; it does not raise the probe; and readers who answered with `W4` now answer with the gate's outcome.\
By the tool-call logs 8 of the 12 base readers read `W4` and none of the 12 readers of the changed texts did, and all five readers who read `roles/README.md`, on either side, were credited with self-checking.\
Whether those readers no longer learn that their own check is owed, or hold it and do not count it as what they do instead, the runs do not separate; a sentence citing `A16` on their path did not move it.\
That is `B120`, which names the observation that would separate the two.

**Correction, 2026-11-11.**\
`[MEASURED]` *Correction after those runs, before sealing* above says each of the three sentences "is now followed by one more"; at the revision that stands none is, the sentence having been removed when it failed its test.\
`[MEASURED]` The same paragraph says of the fall in unbiased self-checking, "That is a reading this change made possible"; the runs do not settle whether it is, and it stands as one of the two readings `B120` carries.

**Why the change stands with that fall recorded against it.**\
`[DIRECTOR]` `0052` refuted the downgrade to `kind:review`, and the three entries stated it.\
`[ARGUED]` The regression rule has a change corrected before it lands where a drop traces to a reading the change made possible; the one correction tried failed its test, and reverting the change would restore in three entries the outcome a ruling refuted, which 6 of 12 base readers gave as what happens.\
`[ARGUED]` So the change stands on `0052` and not on the runs, with the fall recorded against it and carried as `B120`.\
`[OPEN]` Whether a change that removes a refuted statement should land while one element of a probe falls is a call made here under the delegation, and is the director's to overrule.

**Disclosure, found in review.**\
`[MEASURED]` In run `2026-11-11-climb2-r2-composition` one reader of the base corpus wrote a file, `scratch.txt`, into the export that the base readers of that run and of `2026-11-11-climb2-r2-controls` shared: a copy of that export's own `work-types/README.md`.\
`[MEASURED]` Two readers of that export listed its directory afterwards and saw the file's name; by their tool-call transcripts neither opened it, the export differs from its revision in nothing else, and the exports the changed corpora were read from are identical to their revisions.\
`[ARGUED]` Nothing foreign entered the corpus, so the base readers' answers in those two runs are taken as they stand; that nothing refused the write is `B123`, and the incident is recorded with both runs.

**Correction and disclosure, found in a second review.**\
`[ARGUED]` In *Correction, 2026-11-11* above, that the runs do not settle the reading is a judgement resting on `B120`; the `[MEASURED]` tag on that sentence covers only what the earlier paragraph says.\
`[MEASURED]` On the text that stands `composition.P5`'s mean did not fall in either run that read it, 1 to 1.33 and 1.33 to 1.33, so the regression rule leaves no reported drop unclassified; the fall recorded against the change is in one element of that probe.\
`[MEASURED]` Four readers of `composition` and one of `w0` in these runs ran the harness's workspace search, which searches the operator's own workspace and not the export, and a probe shows that every reader starts in that workspace; by their transcripts no reader's context held this corpus's repository, its keys or another corpus's export.\
`[ARGUED]` Readers of both corpora shared that reach, so the comparisons above stand; that the prompt alone confined them is `B124`.

**Correction, found in a third review.**\
`[ARGUED]` *Correction and disclosure, found in a second review* above says a probe shows that every reader starts in the operator's workspace; one probe launched the way readers are reported that workspace, and the workspace searches of the readers named there returned its files, so that every reader starts there is inferred and was not measured for each.\
`[MEASURED]` The counts in this record drawn from readers' tool calls were first read from transcripts that shorten long calls; read again from the full transcripts, none changes.

**Counting rule, added 2026-11-12.**\
`[MEASURED]` A file is counted as read above where a reader's call opened it whole, shell patterns expanded: for `roles/README.md`, four readers opened it by explicit path (`r-fa2864`, `r-9d9437`, `r-9534a8`, `r-60f12d`), a fifth (`r-68e510`) through `cat .../roles/R*`, and a sixth (`r-2cff62`) piped `roles/R*.md` to `grep`, all six being credited with unbiased self-checking.

**Source.**\
`[V, docs/DECISIONS.md 0052; docs/BACKLOG.md B33, B70 and B117; work-types/README.md constraints 2 and 9, Faults and The entry schema; git show 96a8aef:work-types/W8-verify-gate-reactive.md, W9-audit-a-surface.md and W10-adversarial-design-review-upstream.md]`

### 0128

**Ruling.**\
`M2` rule 1 for reasoning documents says when the key's audit happens: the probes and the key are written before anyone who will answer them reads the document, the key is audited, corrected and the correction committed before any reader answers, and the auditor answers nothing and so is not one of those readers (`B98`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of the same date.\
`[MEASURED]` `B98`: in run `2026-10-20-102650-m2-separation`, 15 of 24 readers holding `M2` wrote that rule 1 left open whether readers may answer before the audit, whether the auditor's reading breaks "before anyone reads", and whether the corrected key is committed again.\
`[MEASURED]` The reading the rule now states is the one the corpus already used: the pre-registered key of `testdrive` probe `Q4` orders the audit before the answers and accepts a second commit after it, readers holding either version of `M2` met that probe in 12 of 12 cells (`0107`), and `docs/evals/README.md` says every suite's keys are "corrected before any reader runs".\
`[MEASURED]` `B98`'s trigger, the next key audited, fired three times on this branch on 2026-11-11, each audit preceding the readers of the run it was for.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| "Write the probes and the answer key before anyone who will answer them reads the document." | Was "before anyone reads the document". The author and the auditor both read it, and readers asked whether the audit therefore broke the order; the sentence now names whose reading the order concerns. |
| "... and correct it and commit the correction before any reader answers." | Was "and correct it before anyone is scored", which let readers answer before the audit. Committing the correction keeps the order provable, as the first commit does. |
| "The auditor reads the documents to judge the key and answers nothing, so the audit does not break the order; a key corrected after readers have answered can no longer be shown to owe nothing to their answers." | New. It answers the second point readers raised and gives the reason for the third. |
| Example: "A fresh reader audits the key, and the author corrects one answer and commits again before any reader runs." | New. An author working from the example, as `PC1` directs, would otherwise skip the audit - the reason `0107` gave for adding readers holding nothing to the same example. |

**Test, fixed before any reader ran.**\
Under `M13`'s rule for modifying a member: `M2` at `96a8aef946a6c04ce91dd2cbb9b5f25c8eeac2f6` against `M2` as changed, each reader holding that one file, three fresh readers per version, scored blind by a separate agent, on the six pre-registered probes of `docs/evals/context-lab/scenarios/testdrive.json`, transcribed by script into a file-mode suite for `tools/eval.mjs` and not committed as a second copy.\
The regression rule of `docs/evals/README.md` applies at tolerance 0: no probe may fall.\
`Q4`, the ordering probe, separated readers holding `M2` from readers holding nothing in the earlier record, 12 of 12 cells against 0 of 12 (`0107`), and readers of the old text already met it, so it can count against this change and cannot show a gain.\
The readers' observations are read for the three points `B98` records.

**Named costs.**\
The clauses rest on the reading the pre-registered key already used and on delegated authority, not on a measured gain, as `0108` and `0115` did; the run above can show only that nothing fell.

**Alternatives refuted.**\
Keeping "before anyone is scored" and adding a note - refuted because the sentence would still permit readers to answer before the audit, the order 15 readers found open.\
Requiring the auditor to be kept from the document - refuted because the audit judges the key against the documents it is about, as rule 1 already said.

**Result, run `2026-11-11-climb2-r1`.**\
Three readers per version, each holding the one file; no answer absent, no consistent hedge.\
No probe fell: `Q2` to `Q5` scored 2 and `Q6` scored 1 on both versions, and `Q1` rose from 1 to 1.67 on rule 4, which this change did not touch.\
`Q4` scored 2 on both, as expected of a probe the old text already met.\
The observations were silent: all six readers wrote "none", and a fresh classifier blind to version found none of `B98`'s three points in them, so that reading shows nothing either way.\
In the `Q4` answers, by the author's reading: one reader of the old text wrote that it "strictly says auditing and correcting must happen 'before anyone is scored'" and marked the audit coming before the answers as its own inference, and all three readers of the new text quoted the new sentence for that order.\
The run shows that nothing fell and nothing more: under `M2` rule 4 no gain is counted, and the clauses rest where *Named costs* says they do.

**Source.**\
`[V, docs/BACKLOG.md B29 and B98; docs/DECISIONS.md 0107, result table and What the readers said; docs/evals/context-lab/scenarios/testdrive.json Q4; docs/audits/M6.2-testdrive-key-audit.md second audit, finding 7; docs/evals/README.md Key reviews; git show 96a8aef:methods/M2-test-drive-docs-by-execution.md]`

### 0129

**Ruling.**\
`entities/E7-gate.md` lists, among the invalid inputs that leave a gate not validly run, a party's own account of what it did that the judge cannot check, citing `E8`, and its *Relations* carry the edge to `E8` (`B105`).

**Ratified.**\
`[DIRECTOR]` `0115` ruled that such an account is, at a gate, no valid input, so the gate has no verdict and the work waits, and recorded that `E7` did not name the case (`B105`); naming it there was executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of the same date.\
`[MEASURED]` At `96a8aef946a6c04ce91dd2cbb9b5f25c8eeac2f6`, `E7` listed three invalid inputs - evidence for another revision, a judge without the authority, a judge who authored the work - and cited `E8` nowhere, while `E8`'s *Relations* named `E7`.

**Each changed sentence.**

| Sentence | Reason |
|---|---|
| "... the evidence is for another revision, the judge lacks the authority, the judge is the work's author, or the input is a party's own account of what it did that the judge cannot check (`E8`)." | Adds the fourth case and cites its home; what makes an account checkable stays in `E8` alone. |
| *Relations* gains the edge `receives` to `E8`, and `related` gains `E8`. | `E0` has entities compose through the typed edges in each member's *Relations*, and `E8` already named `E7` from its side. |

**Test, fixed before any reader ran.**\
Under `M13`'s rule for modifying a member: the corpus at `96a8aef946a6c04ce91dd2cbb9b5f25c8eeac2f6` against the corpus as changed, both in one `tools/eval.mjs prepare`, three fresh readers per corpus, scored blind by a separate agent, on suite `gate`.\
`G7` is added for this ruling, keyed from `0115` and committed with this row, its key to be audited by a fresh agent before any reader runs; `G1` to `G6` are controls.\
The key is the same for both corpora, since `E8` already states the case: the probe shows whether a reader asked about a gate reaches it.\
The regression rule of `docs/evals/README.md` applies at tolerance 0, and under `M2` rule 4 no gain on `G7` counts in this change's favour, since no reader holds nothing in this run.

**Key audit, 2026-11-11, before any reader ran.**\
A fresh agent, holding both corpora and the suite and none of the author's session, judged `G7`'s key right for the older corpus, from `E8`'s *The party's own report*, and for the newer, from `E7`'s *No verdict is not a third result*; it is a self-check of the corpus, not independent assurance (`0016`).\
It found one defect: the question asked only for the verdict, while the rubric gave full marks only to an answer that also said the work waits.\
The question now ends "What is the gate's verdict, and what happens to the work?", in the auditor's words, and the correction was committed before any reader ran.

**Named costs.**\
`E7` names the case and leaves its test to `E8`, so a reader who needs to know what makes an account checkable still follows one citation.

**Alternatives refuted.**\
Restating in `E7` the three ways a judge can check an account - refuted by the root charter's *forked constraint* fault: `E8` holds them.\
Leaving `E7` as it was - refuted by `0115`'s own named cost, that a reader of `E7` alone does not learn the case.

**Result, run `2026-11-11-climb2-r1`.**\
Three readers per corpus on suite `gate`; no answer absent, no consistent hedge.\
No probe fell: `G2` to `G7` scored 2 on both corpora, and `G1` rose from 1 to 1.33 on text this change did not touch.\
`G7` cannot tell the two corpora apart when the whole corpus is held: all three base readers reached "no valid input", no verdict and the work waiting by opening `E8`.\
So the test fixed above shows that nothing fell, and does not show that the change alters what a reader decides.

**A further run, added after that result (`2026-11-11-climb2-e7-alone`).**\
This ruling's ground is `0115`'s named cost, that a reader of `E7` alone does not learn the case, and the test above gave no reader `E7` alone.\
After seeing that, and with its readings written down before it ran, `G3` as a control and `G7` were given to three fresh readers per version, each holding only `entities/E7-gate.md`, through a temporary file-mode suite copied by script from the committed one and not committed.\
`G3` scored 2 on both versions.\
`G7` scored 0 on the old `E7` and 2 on the new: all three readers of the old one wrote that the case was not settled, two guessing that the gate fails and one a fail or no verdict, and all three readers of the new one answered no verdict and the work waits, quoting the added clause.\
This run was not part of the test fixed before the first run, and is to be read with that in mind.\
It measures the premise `B105` had only argued.\
Under `M2` rule 4 it is description and not a gain counted in this change's favour: no reader held nothing, and this harness cannot supply one unconfounded (`B40`).

**Source.**\
`[V, docs/DECISIONS.md 0114 and 0115; docs/BACKLOG.md B105; entities/E8-evidence.md The party's own report and Relations; entities/README.md Member shape; git show 96a8aef:entities/E7-gate.md]`

### 0130

**Ruling.**\
`tools/eval.mjs export` marks every exported file and directory read-only, `prepare` refuses a writable corpus and records each corpus's tree digest in `sealed/manifest.json`, `score` refuses to write a result if any corpus changed after `prepare`, and the four comments in `tools/eval.mjs` and `tools/eval.test.sh` that overstated reader or scorer confinement state what `export` and `sealed/` actually do (`B123`, `B124`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` In run `2026-11-11-climb2-r2-composition` reader `r-117ad0` wrote `scratch.txt` into shared export `c-22a38c5d`, and two later readers saw the file's name in directory listings while nothing in `tools/eval.mjs` refused the write or checked the export afterwards (`B123`).\
`[MEASURED]` At `fbc248d2c2d531c0f8303f1caf36709c82e61484`, four comments in `tools/eval.mjs` (lines 21, 27 and 162) and `tools/eval.test.sh` (line 36) still stated that stripping `docs/` means "no reader can reach a key" or that `sealed/` prevents readers and scorers from seeing the mapping, after `B124` recorded that only their prompts keep them to their files.\
`[MEASURED]` Three refusal cases in `tools/eval.test.sh` - read-only export, `prepare` refusing a writable corpus, and `score` refusing a corpus modified after `prepare` - pass (`29` of `29`) and each fails by name when its check in `tools/eval.mjs` is removed on a landed mutant.

**Named costs.**\
`[MEASURED]` A caller constructing a fixture directory for `prepare` by hand rather than through `export` must mark it read-only first, and a script deleting an export directory must restore user write permission before removing it (`tools/eval.test.sh` does both).\
`[ARGUED]` Because readers run under the operator's OS account in harnesses without a sandbox, a reader that deliberately restores write bits and then restores the exact bytes before `score` runs would still evade file modes and the end-of-run digest; OS-level read and write confinement remains open under `B124`.

**Alternatives refuted.**\
Checking only file mode bits at `export` without recording a digest at `prepare` - refuted because a reader running under the same OS user can run `chmod u+w` on its export, which only `score`'s digest check catches.\
Leaving the four confinement comments in `tools/eval.mjs` and `tools/eval.test.sh` untouched - refuted because `B124` deferred them specifically until `tools/eval.mjs` was next edited, which is this change.

**Source.**\
`[V, docs/BACKLOG.md B123 and B124; tools/eval.mjs; tools/eval.test.sh; tools/README.md; INCIDENT-export-write.md in runs 2026-11-11-climb2-r2-composition and 2026-11-11-climb2-r2-controls]`

### 0131

**Ruling.**\
`tools/check-component-edges.mjs` holds every registered component's `Contains` / `Contained-by` and `Consumes` / `Consumed-by` declarations under `## Edges` to bidirectional peer agreement, wired into `tools/check-all.sh`, guarded by `tools/component-edges.test.sh`, and reflected in `docs/ARCHITECTURE.md` (`B112`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` `C0` and `0096` require each component entry to carry `Contains`, `Contained-by`, `Consumes` and `Consumed-by` under `## Edges`; because `Consumed-by` also names unregistered consuming applications (`zorg`, `drawv2`, `input-tester`, `mission-kit`), both sides are authored by hand and nothing in `tools/` checked that peer `C<n>` declarations agreed (`B112`, `docs/ARCHITECTURE.md` section 4 `A3` row).\
`[MEASURED]` On the current registry (`C1` to `C15`), `node tools/check-component-edges.mjs` passes across all `15` components and `19` peer edges; `tools/component-edges.test.sh` passes all `7` fixture cases and fails when bidirectional symmetry checking is mutated out of `check-component-edges.mjs`.

**Named costs.**\
`[MEASURED]` Peer component references on an edge declaration line must use markdown links (`` [`C<n>`](C<n>-...md) ``), which all `15` registered components already do; an unlinked bare `C<n>` on the declaration line is refused so a peer edge cannot go unseen.\
`[ARGUED]` Holding declared `## Edges` to bidirectional agreement catches one-sided edits and dangling peer links, and does not catch a dependency used in `Contract` prose while omitted from both entries' `Edges` at once (`82115e6`); `docs/ARCHITECTURE.md` states that remaining limit explicitly rather than claiming full contract-to-edge equivalence.

**Alternatives refuted.**\
Generating `Consumed-by` purely from peer frontmatter - refuted because `Consumed-by` across `C1` to `C15` legitimately records unregistered consuming applications alongside registered `C<n>` peers.\
Matching `C<n>` identifiers anywhere inside `## Contract` prose as required `Consumes` edges - refuted by `C6-entity-api.md` line 36 and line 77, which mention `C7` (`caller-identity`) as an adjacent component the host application composes in its policy callback rather than a component `entity-api` itself consumes.

**Source.**\
`[V, docs/DECISIONS.md 0096; docs/BACKLOG.md B108 and B112; components/README.md Member shape and Composition; components/C1-agp.md to C15-entity-graph.md; tools/check-component-edges.mjs; tools/component-edges.test.sh]`

### 0132

**Ruling.**\
`work-types/W8-verify-gate-reactive.md`, `work-types/W9-audit-a-surface.md` and `work-types/W10-adversarial-design-review-upstream.md` say that what follows from a collapsed roster is authored once in constraints 2 and 9 of [`W0`](../work-types/README.md), with how a lone agent's roles compose under it in [`R0`](../roles/README.md#how-the-roles-compose) (*When there is no second agent*), link `[W0](README.md)` in place of bare `work-types/README.md`, and drop the duplicate `"and is not restated here"` clause (`B120`, `B121`).\
Suite `docs/evals/lone-gate/suite.json` (`L1`, `L2`) is added in its own reader group to separate `B120`'s two surviving readings without cueing `composition.P5`.

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` At `fbc248d2c2d531c0f8303f1caf36709c82e61484`, `W8`, `W9` and `W10` said the outcome of a collapsed roster "is stated once, in constraints 2 and 9 of `work-types/README.md`, and is not restated here", whereas `roles/README.md` (*When there is no second agent*) states it as well while composing it with `A16`'s self-check obligation (`B121`).\
`[MEASURED]` Across Climb 2's three paired `composition` runs (`12` readers before `0127`, `12` after), readers credited with unbiased self-checking on `composition.P5` fell from `10` of `12` to `3` of `12` as readers went to `W0` constraints 2 and 9 rather than `W4`, while all six readers who read `roles/README.md` (five whole-file, one piped) were credited (`B120`).

**Each changed sentence.**

| Entry | Was | Is | Reason |
|---|---|---|---|
| `W8` | "Closeability is governed by the canonical constraint set / closeability preflight in `work-types/README.md` ... what follows when the live roster collapses attester and executor is stated once, in constraints 2 and 9 of `work-types/README.md`, and is not restated here." | "Closeability is governed by the canonical constraint set / closeability preflight in [`W0`](README.md) ... what follows when the live roster collapses attester and executor is authored once in constraints 2 and 9 of [`W0`](README.md), with how a lone agent's roles compose under it in [`R0`](../roles/README.md#how-the-roles-compose) (*When there is no second agent*)." | Fixes `"stated once"` (`B121`), turns `W0` into a link, drops the duplicate non-restatement clause, and routes lone-agent readers to `R0`'s composition paragraph (`B120`). |
| `W9` | "The closeability preflight is the canonical constraint set in `work-types/README.md` ... what follows when a thin roster collapses attester and executor to one agent is stated once, in constraints 2 and 9 of `work-types/README.md`, and is not restated here." | "The closeability preflight is the canonical constraint set in [`W0`](README.md) ... what follows when a thin roster collapses attester and executor to one agent is authored once in constraints 2 and 9 of [`W0`](README.md), with how a lone agent's roles compose under it in [`R0`](../roles/README.md#how-the-roles-compose) (*When there is no second agent*)." | The same. |
| `W10` | "what follows from a collapsed roster is stated once, in constraints 2 and 9 of `work-types/README.md`, and is not restated here. / The full closeability preflight ... lives in `work-types/README.md` ..." | "what follows from a collapsed roster is authored once in constraints 2 and 9 of [`W0`](README.md), with how a lone agent's roles compose under it in [`R0`](../roles/README.md#how-the-roles-compose) (*When there is no second agent*). / The full closeability preflight ... lives in [`W0`](README.md) ..." | The same. |

**Tests and readings, fixed before any reader runs.**\
`[ARGUED]` `docs/evals/lone-gate/suite.json` (`L1`, `L2`) is audited by a fresh non-author agent holding the candidate exports and the suite, with any correction committed before any reader runs (`M2` rule 1, `B29`).\
`[ARGUED]` Four read-only exports are prepared through `tools/eval.mjs export`: `orig` (`63255fe8bec237a90ffd4f73dedf6aedb9fbd466`), `climb1` (`96a8aef946a6c04ce91dd2cbb9b5f25c8eeac2f6`, before `0127`), `base` (`fbc248d2c2d531c0f8303f1caf36709c82e61484`, after `0127`), and `head` (this revision).\
`[ARGUED]` **Run 1 (`composition`, six fresh readers per corpus across `orig`, `climb1`, `base` and `head` in one `prepare`, scored blind by one scorer):**
1. *Keep-or-revert rule for `0132` (`base` vs `head`):* the `R0` citation in `W8`, `W9` and `W10` is kept if, on `composition.P5` by the blind scorer's reasons, `head` readers credited with unbiased self-checking are not fewer than `base` readers of the same run (`head >= base`), at least `5` of `6` `head` readers reach wait-or-ratify, `0` of `6` give the `0052`-refuted downgrade to `kind:review`, and no `composition` probe falls on `head` vs `base` tracing to altered text (`tolerance 0`); otherwise the `R0` clause is withdrawn (or `W8` to `W10` reverted to `fbc248d`, reopening `B121` if reverted whole). `B120` closes if the `R0` clause is kept, `head` readers credited with unbiased self-checking on `composition.P5` are within `1` reader of `climb1` (`head >= climb1 - 1`), and `head` shows no shortfall on `lone-gate.L1`.
2. *Settlement of Climb 1's `composition.P5` label (`orig` vs `climb1`):* if `climb1`'s total reader-points on `composition.P5` are lower than `orig`'s by `3` points or more (`0.50` mean across `6` readers), open a `docs/BACKLOG.md` row naming `0123` as a candidate cause; otherwise record that the six-reader run did not show a `>= 3`-point drop at `96a8aef`.

`[ARGUED]` **Run 2 (`lone-gate` with six fresh readers per corpus across `climb1`, `base` and `head` in one `prepare`, scored blind; plus `w0` with three fresh readers per corpus across `base` and `head` as the work-types control):**
- *Separation of `B120`'s two surviving readings (`climb1` vs `base` on `lone-gate.L1`):* the *unchecked lone agent* reading holds if `base` readers credited with unbiased self-checking on `L1` are fewer than `climb1` by `2` or more of `6` (or `base`'s `L1` mean is below `climb1`'s by `0.50` or more); the *single-alternative framing on `P5`* reading holds if at least `5` of `6` `base` readers score `2` on `L1` and `base` is within `1` reader of `climb1`; otherwise both readings remain unseparated at `N=6`.
- *Control rule:* every probe of `lone-gate` and `w0` runs under `docs/evals/README.md`'s regression rule at tolerance 0 between `base` and `head`.
- *`M2` rule 4:* no run carries an unconfounded readers-holding-nothing arm (`B40`), so separation is `NOT-CLAIMED` and no score movement is claimed as a positive gain.

**Key audit, 2026-11-12, before any reader ran.**\
`[MEASURED]` A fresh agent (`5aa8479d-ee4d-4544-884d-d4f6f350e97a`), holding the `climb1`, `base` and `head` exports and `docs/evals/lone-gate/suite.json` and answering nothing, judged both keys grounded across all three snapshots and `L2` clean, and found one defect on `L1`: the rubric required stating that the result is executor/author evidence rather than assurance for full marks while the question asked only whether the result satisfies the gate.\
`[MEASURED]` `L1`'s question now also asks `"what standing does its result carry"`, committed before any `tools/eval.mjs prepare` or reader ran; it is a self-check of the key, not independent assurance (`A16`).

**Named costs.**\
`[ARGUED]` `W8`, `W9` and `W10` add one cross-layer citation to `R0` alongside `W0`, so a cold reader of one of the three entries follows two links to assemble both the gate's closeability rule and the lone agent's role composition.

**Alternatives refuted.**\
Appending a standalone sentence citing `A16` directly in `W8`, `W9` and `W10` - refuted by `0127`'s recorded experiment (`9db89fd`, run `2026-11-11-climb2-r2-composition`), where `4` of `6` readers opened `W8` (`1` opening `A16`) and `0` of those `4` were credited on `composition.P5` (`1` of `6` overall against `5` of `6` base).\
Adding `L1` directly to `docs/evals/composition/suite.json` or `docs/evals/self-check/suite.json` - refuted because in `composition` `L1` would cue `P5` inside the same reader prompt, and in `self-check` `U1` would cue `L1` with `A16`.

**Result, runs `2026-11-12-climb3-r1-composition`, `2026-11-12-climb3-r2-lone-gate` and `2026-11-12-climb3-r3-w0`.**\
`[MEASURED]` Forty-eight fresh readers across the three runs (`24` on `composition`, `18` on `lone-gate`, `6` on `w0`), scored blind by three separate agents; no answer absent, no consistent hedge, and zero drops on `head` against `base` (`tolerance 0`: `composition` `12.50` to `12.67` of `14`, `lone-gate` `4.00` to `4.00` of `4`, `w0` `13.34` to `14.00` of `16`).\
`[MEASURED]` On `lone-gate.L1` (`2026-11-12-climb3-r2-lone-gate`), all `18` readers - `6` of `6` on `climb1` (`96a8aef`), `6` of `6` on `base` (`fbc248d`), and `6` of `6` on `head` (`0132`) - scored `2` of `2`, naming an unbiased self-check, executor-evidence standing, and non-satisfaction of the gate; by the rule fixed above, `B120`'s two surviving readings separate in favour of single-alternative framing on `P5` rather than *the unchecked lone agent*.\
`[MEASURED]` On `composition.P5` (`2026-11-12-climb3-r1-composition`, six readers per corpus): total points were `7` of `12` (`1.17`) on `orig` (`63255fe`), `6` of `12` (`1.00`) on `climb1` (`96a8aef`), `9` of `12` (`1.50`) on `base` (`fbc248d`), and `10` of `12` (`1.67`) on `head`; by the blind scorer's reasons, unbiased self-checking was credited on `3` of `6` `orig`, `0` of `6` `climb1`, `3` of `6` `base` (one of whom, `r-6791d1`, named `"an author's check"` without `"unbiased"`, `A16` or `W4`, while all four credited `head` readers named `A16` or `W4`), and `4` of `6` `head`, with `6` of `6` `head` reaching wait-or-ratify and `0` of `6` giving the `0052`-refuted downgrade.\
`[MEASURED]` By `reader_paths.json` from full transcripts, whole-file reads of `roles/README.md` moved from `0` of `6` (`climb1`) and `0` of `6` (`base`) to `6` of `6` (`head`) on `lone-gate`, and from `2` of `6` (`orig`), `1` of `6` (`climb1`) and `2` of `6` (`base`) to `6` of `6` (`head`) on `composition`.\
`[ARGUED]` Every clause of the keep-or-revert and `B120` closure rules fixed above is met (`4` of `6` >= `3` of `6` on `base`, `4` of `6` >= `climb1 - 1` both in this run and against the `10` of `18` pooled `96a8aef` rate across Climbs 2 and 3, `6` of `6` wait-or-ratify, `0` of `6` downgrade, `6` of `6` on `lone-gate.L1`), so the `R0` citation stands and `B120` and `B121` close; and because `climb1` differed from `orig` on `composition.P5` by `1` reader-point (`6` vs `7`, below the `>= 3` rule, and `21` of `36` = `1.17` pooled across all `18` `96a8aef` readers), Climb 1's `P5` question is settled with no new defect row.\
`[MEASURED]` All four read-only exports passed `eval.mjs score` digest checks and `diff -rq` against `git archive` (`0` writes); `7` of `48` readers invoked the workspace search (`10` calls returning unrelated workspace paths), `0` of `48` reader transcripts and `0` of `3` scorer transcripts held `mission-kit-local`, session notes, package files, `sealed/`, or cross-arm exports (`48` of `48` and `3` of `3` positive controls fired; scorer `task-3759` wrote single-line `\n`-escaped JSON preserved beside the newline-split file).\
`[ARGUED]` Under `M2` rule 4 (`B40`), none of these numbers is claimed as a positive gain (`separation: NOT-CLAIMED`).

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` Under `0127`'s whole-file read rule with shell patterns expanded, on `2026-11-12-climb3-r1-composition` (`composition`) whole-file reads of `roles/README.md` were `2` of `6` on `orig`, `1` of `6` on `climb1`, `3` of `6` on `base` (`r-6791d1`, `r-dfed69` and `r-6e8d4c` through `cat .../roles/R*`), and `5` of `6` on `head` (`r-10425a`, `r-a28583`, `r-ab94bf`, `r-c5d653`, `r-dcf2cd`) with the sixth (`r-af5d97`) reading its *When there is no second agent* section through `sed` and `grep` (`lone-gate`'s `0` of `6`, `0` of `6` and `6` of `6` whole-file counts are unchanged).\
`[MEASURED]` Across all `48` readers, the `7` readers who invoked the workspace search (`6` in `composition`, `1` in `w0`) made `11` calls rather than `10` (`4` returning unrelated workspace paths, `4` returning `0` matches and `3` exiting `1` inside `/tmp`), and `2` `composition` readers (`r-50f74a` on `orig`, `r-af5d97` on `head`) wrote copies from their own exports (`scratch-A0.md`, `scratch_index.md`; `9` calls total) into the shared run directory `/tmp/mk3-eval/run1-comp/`, which `0` other readers or scorers read or listed while all four exports stayed read-only with `0` writes.\
`[ARGUED]` None of these corrected counts alters `0132`'s pre-registered keep-or-revert or `B120` closure verdicts, which rest on the blind scorer's `P5` and `L1` element counts (`4` of `6` >= `3` of `6`, `6` of `6` wait-or-ratify, `0` of `6` downgrade, `6` of `6` on `lone-gate.L1`).

**Source.**\
`[V, docs/DECISIONS.md 0052, 0123 and 0127; docs/BACKLOG.md B117, B120 and B121; work-types/README.md constraints 2 and 9; roles/README.md How the roles compose; docs/evals/lone-gate/suite.json]`


### 0133

**Ruling.**\
`tools/check-board.mjs` splits table cells without collapsing empty trailing columns or splitting pipes inside inline code spans, masks inline code spans before extracting `Held` revival triggers (preferring explicit `TRIGGER:` / `Revival trigger:` before bare uppercase `TRIGGER`), checks six columns, `evidence` and observable open triggers under `R3`, checks `DONE` items inside open milestones alongside `DONE` milestones under `R6`, regenerates `docs/BOARD.md`, updates `docs/BOARD.md` and `tools/README.md`, and ships `tools/board.test.sh` (`B125`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` At `43fdeadafe91c45f18afda7e5d8bde368aab680d`, `trigger(st)` in `tools/check-board.mjs` (`line 211`) matched `/TRIGGER:?\**\s*(.*)$/i` without masking inline code spans, matching lowercase `trigger` inside `` `adherence-a13.on-trigger.f.5` `` on `B76` and truncating `docs/BOARD.md` (`line 295`) to `.f.5` with an unmatched backtick, while matching `TRIGGER FIRED and moved:` ahead of `TRIGGER: a second single-medium style rule.` on `B39` (`line 340`).\
`[MEASURED]` At the same revision, `cellsOf` (`line 60`) split on `/\s+(?<!\\)\|\s+/`, collapsing a row with an empty sixth column (`revival trigger`) to five columns so `c[c.length - 1]` silently read `evidence` as `state`; `R3` checked neither `evidence` nor observable open revival triggers; `R6` checked `DONE` milestones while skipping `DONE` items in open milestones (`BOARD.md` rule 2) and treated `DONE` items in open milestones as live `elsewhere` plans on `line 174`; `tools/README.md` documented only `R1` to `R6`; and `check-board.mjs` had no `tools/*.test.sh` suite.\
`[MEASURED]` All `8` fixture cases in `tools/board.test.sh` pass and fail by name when inline-code trigger masking, `R3` empty-trigger checking, or `R6` `DONE`-item checking is mutated out of `tools/check-board.mjs`.

**Named costs.**\
`[ARGUED]` Under `R6`, a `DONE` item or `DONE` milestone may still cite a row that remains open when another live item on the board plans the row's remaining work (`plannedIn.has(b)`); a single item citing two rows where only one should close still requires splitting the item or planning the open row in a live item.\
`[ARGUED]` `BOARD.md` contract rule 4 (dropping an item rewrites its `B` row with a revival trigger) and rule 5 (a move ships with its mechanism) remain held by review rather than git-diff heuristics so `check-board.mjs --root DIR` stays usable on standalone non-git directories.

**Alternatives refuted.**\
Masking inline code spans with spaces (`" ".repeat(s.length)`) before `/TRIGGER:?\**\s*/` - refuted by testing across all `52` open rows, where trailing `\s*` consumed leading inline-code tokens (`A4`, `0107`, `entity-graph`) on `B95`, `B97` and `B106`; masking with `_` preserves exact token boundaries.\
Parsing `git diff origin/main` inside `check-board.mjs` for rule 4 - refuted because `--root DIR` operates on arbitrary project directories without assuming `origin/main`.

**Source.**\
`[V, docs/BOARD.md lines 17-24, 295 and 340; docs/BACKLOG.md B39, B76 and B125; artifacts/AR3-board.md and AR5-backlog.md; tools/check-board.mjs; tools/board.test.sh; tools/README.md, B131]`

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` *Ratified* above says `tools/board.test.sh` fails when inline-code trigger masking is mutated out of `tools/check-board.mjs`: Mutant 1 reverted `trigger(st)` as a whole (`lines 75-79`) to pre-`0133` `/TRIGGER:?\**\s*(.*)$/i`, whereas mutating `line 76`'s `st.replace(...)` alone while keeping `line 77`'s explicit colon and uppercase boundary regex still passes `board.test.sh` Case 2 (`8` of `8`) because `` `adherence-a13.on-trigger.f.5` `` already fails `line 77`'s boundary (mutating `splitCells` masking on `line 62` fails Case 2).\
`[ARGUED]` Adding an inline-code `` `TRIGGER: ...` `` fixture case in `tools/board.test.sh`, multi-backtick code-span backreferences, and `--root` missing-argument guards is filed as `B131` so the evaluated non-`docs/` tree remains unchanged here.

### 0134

**Ruling.**\
`tools/generate-architecture.mjs` rebases root-relative markdown links into `docs/` when projecting `README.md` blurbs into `docs/ARCHITECTURE.md`, accepts `--root DIR` for isolated fixture testing, regenerates `docs/ARCHITECTURE.md`, and ships `tools/architecture.test.sh` (`B126`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` At `43fdeadafe91c45f18afda7e5d8bde368aab680d`, `tools/generate-architecture.mjs` (`line 53`) projected `README.md`'s `docs/` blurb verbatim into `docs/ARCHITECTURE.md` (`line 170`), leaving `[`AR0`](artifacts/README.md)` pointing at `docs/artifacts/README.md` (`ENOENT`, the sole broken relative link found across all `236` markdown files in the corpus), and carried no `tools/*.test.sh` behaviour suite (`B126`).\
`[MEASURED]` Regenerating `docs/ARCHITECTURE.md` rewrites the link to `[`AR0`](../artifacts/README.md)`, and `tools/architecture.test.sh` passes all `4` fixture cases and fails by name when `rebaseRootLinks` is replaced with the identity function on a landed mutant.

**Named costs.**\
`[ARGUED]` `rebaseRootLinks` rebases relative links originating from root `README.md` blurbs (`path.posix.relative('docs', rawPath)`); charter `title` values remain plain frontmatter strings and carry no links.

**Alternatives refuted.**\
Editing `docs/ARCHITECTURE.md` line 170 by hand - refuted immediately by `generate-architecture.mjs --check`, which overwrites and rejects hand-edited generated regions.\
Changing `README.md` line 65 from `[`AR0`](artifacts/README.md)` to an external URL - refuted because relative links inside root `README.md` must resolve from the repository root.

**Source.**\
`[V, README.md line 65; docs/ARCHITECTURE.md line 170; docs/README.md lines 79-85; docs/BACKLOG.md B8, B126 and B130; tools/generate-architecture.mjs; tools/architecture.test.sh; tools/README.md]`

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` *Ratified* above says `docs/ARCHITECTURE.md` line 170 was `"the sole broken relative link found across all 236 markdown files in the corpus"`: that `236`-file scan covered `222` layer `.md` files, `5` untracked `schemas/node_modules/*/README.md` files, and `9` selected root and `docs/` files, rather than all `357` git-tracked `.md` files (`233` outside `docs/`, `14` live `docs/` files outside frozen `docs/audits/`, `docs/investigations/` and `docs/requests/`, and `110` frozen historical records kept under `RU2`).\
`[MEASURED]` Across all `357` tracked `.md` files after `0134`, `0` of `233` non-`docs/` files carry a broken relative link, and `1` of `14` live `docs/` files (`docs/README.md` line 81, linking retired `../backlog/README.md` alongside pre-`M3.3` `B14` prose at lines 79-85) still carries a broken relative link, filed as `B130`.

### 0135

**Ruling.**\
`tools/eval.mjs` parses `scores/*.txt` with a string-aware balanced JSON object scanner (`parseScores`), marks `<run>/prompts/`, `<run>/TASKS.md`, `<run>/scorers/` and `<run>/sealed/` read-only (`a-w`), records `promptsDigest` in `sealed/manifest.json` and `scorersDigest` in `sealed/blind.json`, and refuses to write `RESULT.json` if `prompts/` or `scorers/` changed after `prepare` or `blind`, guarded by `tools/eval.test.sh` and a pre-registered paired `board,gate` run (`B127`, amending `0130`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` In run `2026-11-12-climb3-r1-composition`, scorer `task-3759` wrote all `168` valid JSON score objects joined by literal `\n` (`}\n{` on one line), which `parseScores`'s line-by-line `/\{.*\}/` match in `tools/eval.mjs` (`lines 298-306`) rejected as invalid JSON (`0132`), and multi-line pretty-printed JSON objects fail for the same reason.\
`[MEASURED]` At `43fdeadafe91c45f18afda7e5d8bde368aab680d`, `0130` marked exported corpora read-only while `<run>/prompts/`, `<run>/TASKS.md`, `<run>/scorers/` and `<run>/sealed/` remained writable without digest verification (`B127`).\
`[MEASURED]` Five checks added to `tools/eval.test.sh` (`34` of `34` total) hold read-only permissions on `prompts/`, `TASKS.md`, `scorers/` and `sealed/`, `score`'s refusal of altered `prompts/` or `scorers/`, and `parseScores` over literal-`\n` and multi-line JSON score objects with braces and quoted `{"item":"fake"}` strings inside `"reason"`, each failing by name when its mechanism is mutated out of `tools/eval.mjs`.

**Test, fixed before any reader runs.**\
`[ARGUED]` Pair `base` (`43fdeadafe91c45f18afda7e5d8bde368aab680d`) against `head` (this revision) in one `tools/eval.mjs prepare` (`--suites board,gate --readers 3`, `12` fresh readers and `2` fresh blind scorers, `main` unmerged), testing both non-regression at `tolerance 0` on `board` (`B1` to `B4`, where `tools/check-board.mjs` and `tools/README.md` sit in the exported corpus) and `gate` (`G1` to `G7`) and live execution of `0135`'s read-only `prompts/`, `TASKS.md`, `scorers/` and `sealed/` permissions and digest checks.\
`[ARGUED]` Verify both exports afterwards through `eval.mjs score` digests and `diff -rq` against `git archive`, audit all `12` reader and `2` scorer full transcripts (`transcript_full.jsonl`) for reach and forbidden strings with positive controls, and claim `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[MEASURED]` Scripts removing a run directory created by `prepare` or `blind` must restore user write bits (`chmod -R u+w`) on `prompts/`, `TASKS.md`, `scorers/` and `sealed/` first (`tools/eval.test.sh` already does so in its `EXIT` trap); top-level `<run>/answers/` and `<run>/scores/` remain writable so readers and scorers can write their outputs.\
`[ARGUED]` As in `0130`, OS-level read confinement outside the export and run directory remains open under `B124`.

**Alternatives refuted.**\
Splitting `scores/*.txt` on literal `\\n` before `JSON.parse` - refuted because replacing `\\n` inside a valid JSON string literal (`"reason": "line 1\\nline 2"`) inserts a raw newline inside quotes and breaks valid JSONL.\
Locking the entire `<run>` root directory `a-w` after `prepare` - refuted because `blind` and `score` create top-level files (`RESULT.json`, `RESULT.md`) and readers and scorers write under `answers/` and `scores/`.

**Result, run `2026-11-12-climb4-r1-board-gate`, and pre-registered replication `2026-11-12-climb4-r2-gate-rep`.**\
`[MEASURED]` Twelve fresh readers (`3` per corpus on `board` and `gate`) and two fresh blind scorers ran with `prompts/`, `TASKS.md`, `scorers/` and `sealed/` locked read-only (`0` writable paths under any of the four; `0` absent answers; `0` export diffs against `git archive`; `0` reach findings outside `/tmp/mk4-eval` across all `12` readers and `2` scorers, and `0` forbidden-string hits with `12` of `12` and `2` of `2` positive controls firing).\
`[MEASURED]` Totals moved from `20.33` to `20.67` of `22` (`board`: `7.00` to `7.67` of `8`; `gate`: `13.33` to `13.00` of `14`).\
`[MEASURED]` `consistentHedges` flagged `board.B3 (base): 2 of 3` (`r-704382`, `r-2bc517`, plus `r-0fff88` in `head` `OBSERVATIONS`), because `board.B3` leaves `"higher impact"` unbounded at `S1`, and `r-592fa7`'s `OBSERVATIONS` noted that `AR5`'s `## Template` omits the `impact` and `principle` columns required by `AR5`'s minimum row shape; those two findings are filed as open rows `B128` and `B129`.\
`[MEASURED]` One probe fell on `head` at `tolerance 0` (`gate.G6`: `2.00` to `1.67`), where `r-364271` quoted `E7`'s `"the gate passes or fails on the director's decision"` without adding `"Yes, it passed"`: `cmp` shows every file opened across all `12` readers (`INDEX.md`, `entities/E7-gate.md`, `entities/E8-evidence.md`, `artifacts/AR3-board.md`, `artifacts/AR4-decision-record.md`, `artifacts/AR5-backlog.md`) byte-identical between `base` (`c-9f412747`) and `head` (`c-4d8afd5e`), and `r-364271`'s full transcript holds only four `read_file` calls (`prompts/r-364271.txt`, `INDEX.md`, `E7`, `E8`) with zero searches or `tools/` reads, so no altered byte entered `r-364271`'s context.\
`[ARGUED]` Because no `base` reader in Run 1 showed that `G6` shortfall, replicate `gate` (`2026-11-12-climb4-r2-gate-rep`, `3` fresh readers per corpus = `6` readers, `1` blind scorer) on the same two read-only exports (`c-9f412747` and `c-4d8afd5e`): if `G6` falls again on `head`, re-audit every `head` reader transcript to confirm no altered file reached it; if `G6` does not fall, record Run 1's `G6` difference as an unrepeated `1`-reader variance on byte-identical inputs (`docs/evals/README.md` second condition noted explicitly where `base` shows `3` of `3`), with `separation: NOT-CLAIMED` (`M2` rule 4).\
`[MEASURED]` In `2026-11-12-climb4-r2-gate-rep`, all six fresh answers were scored blind (`0` absent, `0` consistent hedges, `0` export diffs): `gate` moved from `12.00` to `12.67` of `14` (`0` regressions at `tolerance 0`; `gate.G6` scored `2.00` on `base` and `2.00` on `head`, and `12.50` vs `12.00` with `G6` `2.00` vs `2.00` even if `r-31717a`, whose workspace search returned unrelated operator-workspace paths with `0` hits on package files, `mission-kit-local`, `sealed/` or cross-arm exports, is excluded; `r-664c35` ran `mkdir -p .../answers/` before writing its own `r-664c35.txt`; all `18` reader and `3` scorer positive controls fired).\
`[ARGUED]` Under the pre-registered replication rule above, Run 1's `gate.G6` difference did not recur (`2.00` vs `2.00`) and rested on byte-identical inputs, with `separation: NOT-CLAIMED` across both runs (`M2` rule 4, `B40`).

**Source.**\
`[V, docs/DECISIONS.md 0130 and 0132; docs/BACKLOG.md B123, B124, B127, B128 and B129; tools/eval.mjs; tools/eval.test.sh; tools/README.md]`


### 0136

**Ruling.**\
`artifacts/AR5-backlog.md`'s `## Template` tables (`Open`, `Parked` and `Retired`) carry the six columns (`| id | impact | principle | finding | evidence | revival trigger |` and `| id | impact | principle | finding | reason cut | revives on |`) that `AR5`'s minimum row shape and `tools/check-board.mjs` (`R3`) require, and `docs/evals/board/suite.json` bounds `B3`'s two impact tiers (`fifth tier` vs `third tier`), drops instance-only `S2`/`S4` shorthand from `B3`'s key, and undergoes a fresh `B29` key review across `B1` to `B4` before Climb 5 readers run (`B128`, `B129`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` At `74870a1bac8bf2105a69f2fc4d681fbf2467efa4`, `artifacts/AR5-backlog.md` (`line 53`) lists `scores` (`impact` and `principle` on the board's triage scale) in a row's minimum shape, and `docs/BACKLOG.md` and `tools/check-board.mjs` (`R3`) require six columns, while `AR5`'s `## Template` (`lines 110, 113 and 116`) showed four columns (`| id | finding | evidence | revival trigger |` and `| id | finding | reason cut | revives on |`), surfaced by cold reader `r-592fa7` (`OBSERVATIONS`) in run `2026-11-12-climb4-r1-board-gate` (`B128`).\
`[MEASURED]` In the same run, `docs/evals/board/suite.json` `B3` triggered `consistentHedges` (`2` of `3` `base` readers, `r-704382` and `r-2bc517`, capped at `1`, plus `r-0fff88` in `head` `OBSERVATIONS`) because `B3` asked how the board orders a low-impact mandate breach against `"another [row that] is higher impact but only an enforcement signal"` without bounding `"higher impact"` below the top impact tier (where the first-tier impact outranks a mandate breach at the second-highest tier on `AR3`'s common scale, while the second or third tier does not), and `board/suite.json` had not undergone a `B29` key review (`B129`).

**Test, fixed before any reader runs.**\
`[ARGUED]` Have a fresh `B29` agent audit `docs/evals/board/suite.json` (`B1` to `B4`) against the `base` (`74870a1bac8bf2105a69f2fc4d681fbf2467efa4`) and `head` exports (`AR3`, `AR4`, `AR5`, answering nothing) and commit any key or question correction before `tools/eval.mjs prepare`.\
`[ARGUED]` Pair `base` (`74870a1bac8bf2105a69f2fc4d681fbf2467efa4`) against `head` in one `tools/eval.mjs prepare` (`--suites board,s0 --readers 3`, `12` fresh readers and `2` fresh blind scorers, `main` unmerged), checking `board` (`B1` to `B4`) and `s0` (`Q1` to `Q4`, `Q6`, `Q7`) at `tolerance 0`, verifying whether `consistentHedges` on `board.B3` clears to `0` across both arms, and claiming `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Key audit, 2026-11-12, before any reader ran.**\
`[MEASURED]` A fresh agent (`60743a1a-b159-4589-b142-c98c8393f9db`), reading only `docs/evals/board/suite.json`, `AR0`, `AR3`, `AR4` and `AR5` and answering nothing, judged `B1`, `B3` (`fifth tier` vs `third tier`) and `B4` grounded and unambiguous, and found one defect on `B2`: its rubric required stating that the `Held` list is generated for `2` of `2` while the question asked only `"What makes a backlog row 'held'?"`.\
`[MEASURED]` `B2`'s question now reads `"What makes a backlog row 'held', and how is the board's Held list produced?"`, committed before any `tools/eval.mjs prepare` or reader ran; as in `0132`, this is an executor self-check of the key rather than independent gate assurance (`A16`).

**Named costs.**\
`[ARGUED]` `B3` now names concrete ordinal tiers (`fifth tier` vs `third tier`) from `AR3`'s common-scale wording (`second-highest`, `fourth`) rather than leaving `"higher impact"` open across all four tiers above `fifth`.

**Alternatives refuted.**\
Naming `S3` and `S5` in `B3`'s question or keeping `(S2)` and `(S4)` in `B3`'s key - refuted because `S1` to `S5` is `docs/BOARD.md`'s project-instance notation (`docs/` is stripped from reader exports by `tools/eval.mjs export`), whereas `AR3` states the rule in ordinal terms (`second-highest impact`, `fourth`).\
Changing `AR3`'s common-scale rule so a mandate breach ranks with the top impact tier - refuted because `AR3` deliberately ranks a mandate breach with the second-highest impact so top-tier active data loss or outage (`S1`) still orders first.

**Result, run `2026-11-12-climb5-r1-board-s0`.**\
`[MEASURED]` Twelve fresh readers (`3` per corpus on `board` and `s0`) and two fresh blind scorers ran across `base` (`c-f51034d4`, `74870a1bac8bf2105a69f2fc4d681fbf2467efa4`) and `head` (`c-e9e9e1f0`, `638e285`) with `prompts/`, `TASKS.md`, `scorers/` and `sealed/` locked read-only (`0` writable paths under any of the four; `0` absent answers; `0` export diffs against `git archive`; `0` reads, writes or shell commands outside `/tmp/mk5-eval` across all `12` readers and `2` scorers, and `0` forbidden-string hits with `12` of `12` and `2` of `2` positive controls firing).\
`[MEASURED]` Totals scored `20.00` of `20` on `base` and `20.00` of `20` on `head` (`board`: `8.00` to `8.00` of `8`; `s0`: `12.00` to `12.00` of `12`; `0` regressions at `tolerance 0`).\
`[MEASURED]` On `board.B3`, `consistentHedges` cleared from `2` of `3` in `2026-11-12-climb4-r1-board-gate` to `0` of `3` on `base` and `0` of `3` on `head`; and in `OBSERVATIONS`, `3` of `3` `base` readers on `board` (`r-45e292`, `r-27605b`, `r-134c81`) independently flagged `AR5`'s four-column `## Template` omitting `scores`, against `0` of `3` `head` readers (`r-46127f`, `r-aca81a`, `r-f3a954`) after `0136`'s template update (`B128`, `B129`; `AR5`'s remaining `Lifecycle stage` and row-bullet wording noted by the `board` readers is filed as `B134`).\
`[ARGUED]` Under `M2` rule 4 (`B40`), none of these numbers is claimed as a positive gain (`separation: NOT-CLAIMED`).

**Source.**\
`[V, artifacts/AR3-board.md lines 52-55; artifacts/AR5-backlog.md lines 49-56 and 109-117; docs/BACKLOG.md B9, B128, B129 and B134; docs/evals/board/suite.json; runs 2026-11-12-climb4-r1-board-gate and 2026-11-12-climb5-r1-board-s0 RESULT.md and answers]`

### 0137

**Ruling.**\
`docs/README.md` lists `requests/` in `## Contents`, replaces its broken `../backlog/README.md` link and pre-`M3.3` `B14` prose under `## Not the backlog/ layer` with `BACKLOG.md` and `requests/` and `B14`'s closure, and `tools/check-links.mjs` (wired into `tools/check-all.sh` and tested in `tools/links.test.sh`) holds all non-frozen tracked markdown files to resolving relative links inside the repository (`B130`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` At `74870a1bac8bf2105a69f2fc4d681fbf2467efa4`, across all `357` git-tracked `.md` files (`233` outside `docs/`, `14` live `docs/` files, and `110` frozen historical records under `docs/audits/`, `docs/investigations/` and `docs/requests/` kept under `RU2`), `docs/README.md` (`line 81`) still linked retired `../backlog/README.md` (`ENOENT`) and stated `"Whether they should remain separate is tracked as row B14"` after `B14` closed in `M3.3` (`B130`).\
`[MEASURED]` After updating `docs/README.md`, `node tools/check-links.mjs` verifies that all `247` non-frozen markdown files (`1,390` relative links) resolve inside the repository, and `tools/links.test.sh` passes all `4` fixture cases (and fails by name when relative-link existence checking is mutated out of `tools/check-links.mjs`).

**Named costs.**\
`[ARGUED]` `tools/check-links.mjs` checks target path existence inside the repository root and skips frozen historical records under `docs/audits/`, `docs/investigations/` and `docs/requests/` (`RU2`), fenced and multi-backtick inline code spans, external schemes, pure `#anchor` fragments and `<placeholder>` templates; heading-fragment anchor resolution (`#anchor`) is not enforced mechanically so links to generated or variably punctuated headings are not falsely refused.

**Alternatives refuted.**\
Checking only `docs/README.md` or only `docs/ARCHITECTURE.md` - refuted because a broken relative link in any of the `247` live markdown files breaks cold-reader navigation (`A15`).\
Enforcing relative-link checks across `docs/audits/`, `docs/investigations/` and `docs/requests/` - refuted by `RU2` (~~`rules/RU2-audits-are-frozen-records.md`~~ *(Corrected 2026-11-12: `rules/RU2-frozen-history-rule.md`)*), which keeps historical records intact after layers or files they cited (`backlog/`, `context/`, `principles/`) are retired.

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` *Alternatives refuted* and *Source* cited `rules/RU2-audits-are-frozen-records.md` from recall; `RU2`'s path is `rules/RU2-frozen-history-rule.md`.\
`[MEASURED]` In `tools/check-links.mjs`, `maskCode` (`line 87`, formerly `line 81`) now uses single-line `/(`+)(?!`)[^\n]*?\1(?!`)/g` so an unclosed or multi-backtick span never shifts line numbers or matches across backtick run lengths, and `discoverFiles()` (`lines 52-68`) runs `git -C ROOT ls-files --cached --others --exclude-standard "*.md"` whenever `.git` exists (including under `--root DIR`, shifting the relative-link existence check tested by Mutant 1 in `climb5_mutants.log` from `line 105` in `ce59f6d` to `line 111`).

**Source.**\
`[V, ~~docs/README.md lines 14-31 and 79-85~~ *(Corrected 2026-11-12: docs/README.md lines 61-73 and 80-83; lines 79-85 were pre-edit at 74870a1)*; docs/BACKLOG.md B14, B45 to B54, B126 and B130; ~~rules/RU2-audits-are-frozen-records.md~~ *(Corrected: rules/RU2-frozen-history-rule.md)*; tools/check-links.mjs; tools/links.test.sh; tools/check-all.sh; tools/README.md]`

### 0138

**Ruling.**\
`style/S14-hydration-triggers-state-a-condition.md` (`line 55`) names `tools/s14-hydration-triggers.sh` in `## Checking` instead of retired `tools/check-style.sh --rule S14`, `tools/check-enforcers.sh` verifies that every `tools/` path named in the body of `style/S*.md` or `rules/RU*.md` exists as an executable file alongside frontmatter `enforced-by:`, `tools/check-board.mjs` and `tools/generate-architecture.mjs` match multi-backtick inline code spans by backreference and refuse a missing `--root` argument with exit status `2`, `tools/eval.mjs` refuses missing values on value-taking flags, `tools/entry-body.test.sh` and `tools/methods-view.test.sh` exclude `docs/evals/runs` from their temporary sandboxes and restore write bits before cleanup, and `tools/board.test.sh`, `tools/architecture.test.sh` and `tools/eval.test.sh` carry single-line mutant killers for inline-code trigger masking, multi-backtick spans, unmatched `}` inside `scores/*.txt` strings, and missing CLI flag arguments (`B131`, `B132`, amending `0133`, `0134` and `0135`).

**Ratified.**\
`[DIRECTOR]` Executed under the director's 2026-11-11 autonomous corpus-climb delegation, continued on the director's instruction of 2026-11-12.\
`[MEASURED]` At `74870a1bac8bf2105a69f2fc4d681fbf2467efa4`, `style/S14-hydration-triggers-state-a-condition.md` declared `enforced-by: tools/s14-hydration-triggers.sh` in frontmatter (`line 6`) while `## Checking` (`line 55`) still named `tools/check-style.sh --rule S14` (retired in `0061`), which `tools/check-enforcers.sh` missed because it inspected only frontmatter (`B132`).\
`[MEASURED]` At the same revision, `tools/check-board.mjs` (`lines 62, 76`) and `tools/generate-architecture.mjs` (`line 37`) matched inline code spans with `` /`+[^`]*`+/g `` (which breaks on double-backtick spans wrapping single backticks, reproduced live when drafting `B131`), neither validated a missing `--root` value, `tools/eval.mjs` (`line 46`) set a trailing value-taking flag to `true` before failing inside `path.join`, and `tools/entry-body.test.sh` and `tools/methods-view.test.sh` copied `0135`'s read-only `docs/evals/runs/` directories into `/tmp/mk-*-test-*` and failed to `rm -rf` them on exit (`B131`).\
`[MEASURED]` All `9` cases in `tools/board.test.sh`, `5` cases in `tools/architecture.test.sh`, `35` cases in `tools/eval.test.sh`, `5` cases in `tools/entry-body.test.sh` and `3` cases in `tools/methods-view.test.sh` pass cleanly with zero leftover `/tmp/mk-*-test-*` directories, and each added test fails by name when its single-line mechanism (`trigger` ~~line 80~~ *(Corrected 2026-11-12: line 81; line 80 is `const trigger = (st) => {`)* in `check-board.mjs`, `inStr` in `eval.mjs`, `rebaseRootLinks` in `generate-architecture.mjs`, or body-tool check in `check-enforcers.sh`) is mutated out.

**Test, fixed before any reader runs.**\
`[ARGUED]` Pair `base` (`74870a1bac8bf2105a69f2fc4d681fbf2467efa4`) against `head` (this revision, carrying `0136`, `0137` and `0138`) in the single pre-registered `tools/eval.mjs prepare` defined under `0136` (`--suites board,s0 --readers 3`, `12` fresh readers and `2` fresh blind scorers, `main` unmerged), testing both `0136`'s `AR5` and `board.B2`/`B3` changes on `board` (`B1` to `B4`) and `0138`'s `S14` edit on `s0` (`Q1` to `Q4`, `Q6`, `Q7`, where `Q4` directly reads `S14` and `tools/check-enforcers.sh`) at `tolerance 0`, with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[ARGUED]` `tools/check-enforcers.sh` checks `tools/[A-Za-z0-9_.-]+` paths in the body of `style/S*.md` and `rules/RU*.md` entries; historical retirement notes that need to mention a retired tool path belong in `docs/DECISIONS.md` or `docs/BACKLOG.md` rather than in an active rule's `## Checking` section, and if a future rule body cites a non-executable documentation path under `tools/` (such as `tools/README.md`, noted by cold reader `r-e9c79d` in `2026-11-12-climb5-r1-board-s0`), `check-enforcers.sh`'s pattern will need narrowing to script extensions (`B135`).

**Alternatives refuted.**\
Allowing `style/S14-hydration-triggers-state-a-condition.md` to keep `tools/check-style.sh --rule S14` as historical prose - refuted because `## Checking` states the live command an agent or contributor runs to check the rule (`s0.Q4`).\
Fixing `entry-body.test.sh` and `methods-view.test.sh` cleanup by removing read-only permissions from `docs/evals/runs/` - refuted because `0135` intentionally locks `prompts/`, `TASKS.md`, `scorers/` and `sealed/` read-only to prevent run tampering (`B127`).

**Result, run `2026-11-12-climb5-r1-board-s0`.**\
`[MEASURED]` In the pre-registered paired run (`2026-11-12-climb5-r1-board-s0`, recorded under `0136`), `s0` (`Q1` to `Q4`, `Q6`, `Q7`) scored `12.00` of `12` on `base` (`74870a1`) and `12.00` of `12` on `head` (`638e285`) with `0` regressions at `tolerance 0`, `0` consistent hedges, and `2.00` of `2` on `s0.Q4` across all six readers (cold-reader `OBSERVATIONS` on `style/S6`, `tools/README.md`, `tools/check-all.sh` and `tools/check-enforcers.sh` are filed as `B135`; `separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` *Ratified* and *Source* above stated that `tools/check-style.sh` was `"retired in 0061"`: `0061` is the binary gate-verdict ruling on `E7`, `M7` and `W0`, whereas `tools/check-style.sh` was retired in commit `e81ef96`.\
`[MEASURED]` At `30b283469b105edf53d58ee731baa2ba1833e401`, *Ratified* claimed an added `.test.sh` case failed when the body-tool check in `tools/check-enforcers.sh` was mutated out, whereas `climb5_mutants.log` Mutant 2 had mutated `style/S14-hydration-triggers-state-a-condition.md` (`line 55`) rather than `tools/check-enforcers.sh`, and `tools/check-enforcers.sh` (`lines 33-36`) matched `tools/[A-Za-z0-9_.-]+` without `--root DIR` support or a `tools/enforcers.test.sh` fixture suite.\
`[MEASURED]` `tools/check-enforcers.sh` now accepts `--root DIR` (refusing a missing directory argument with exit status `2`), matches `tools/[A-Za-z0-9_./-]+\.(sh|mjs)` in `style/S*.md` and `rules/RU*.md` bodies (`[ -f "$body_tool" ] && [ -x "$body_tool" ]`), and is held by `5` fixture cases in `tools/enforcers.test.sh` (which fails by name on Case 3 when the body-tool check in `tools/check-enforcers.sh` is mutated out) and a paired `s0` replication (`2026-11-12-climb5-r2-s0`, `base` `74870a1` at `c-f51034d4` vs `head` `f5b315a` at `c-85f9d86f`, `6` fresh readers and `1` fresh blind scorer: `12.00` of `12` on `base` and `12.00` of `12` on `head`, `0` regressions at `tolerance 0`, `0` consistent hedges, `3` of `3` `head` readers opening `tools/check-enforcers.sh` and `tools/README.md` ~~with `0` `check-enforcers.sh` observations~~ *(Corrected 2026-11-12: with `0` of `3` `head` readers flagging `B135`'s body-script pattern issue in `check-enforcers.sh` when a rule body cites `tools/README.md`, while `1` of `3` `head` readers (`r-4cad86:47`) and `2` of `3` `base` readers (`r-2f0137:60`, `r-4436c6:41`) noted `tools/check-enforcers.sh`'s reverse orphan-tool loop (`tools/s[0-9]*-*` vs `rules/RU*.md`) and `r-463f4e:48` noted `tools/README.md:221`, both recorded in `B135`)*, `0` outside reads/writes/commands in `reader_paths.json`, `6/6` and `1/1` positive controls, and `separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Source.**\
`[V, style/S14-hydration-triggers-state-a-condition.md lines 6 and 55; tools/check-enforcers.sh; tools/enforcers.test.sh; tools/check-board.mjs; tools/generate-architecture.mjs; tools/eval.mjs; tools/board.test.sh; tools/architecture.test.sh; tools/eval.test.sh; tools/entry-body.test.sh; tools/methods-view.test.sh; docs/BACKLOG.md B131, B132, B133 and B135; ~~docs/DECISIONS.md 0061~~ *(Corrected: git show --stat e81ef96)*, 0133, 0134, 0135 and 0136; runs 2026-11-12-climb5-r1-board-s0 and 2026-11-12-climb5-r2-s0 RESULT.md]`

### 0139

**Ruling.**\
`entities/E3-set.md`, `entities/E2-layer.md`, `entities/E4-charter.md`, `methods/M12-investigate-a-set.md`, and root `README.md` define the corpus as a ~~four-level recursive hierarchy of sets~~ *(Corrected 2026-11-12: recursive hierarchy of four set structures across three levels)* (`Level 0` root set of layers chartered by `README.md` and `VISION.md`; `Level 1` child knowledge layers voiced by `<prefix>0` via delegation without inheritance; `Level 1` cross-layer spanning sets chartered in `sets/` `ST0`; and `Level 2` nested sub-sets inside a layer when a sub-population's rules differ from its parent's), require every charter's `Operation` section (`E4`) and `M12` (steps 1-3) to state and run a concrete territory-stress pass against the charter's `Vision` and `Scope` (while keeping dated partitions and discovered gaps in `docs/investigations/`), and record the first dated Level 0 root-set `M12` investigation in `docs/investigations/layers-2026-11-12.md` (`B136`, amending `0071`, `0072`, `0112`, and `0113`).

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-12 (`Step 0` recursive set hierarchy, Level 0 root-set stress, and self-describing territory-stress meta-climb).\
`[MEASURED]` At `5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`, `E2`, `E3`, and `E4` defined layers, sets, and charters individually without naming the recursive hierarchy from root `README.md` + `VISION.md` down through child layers, spanning sets (`ST0`), and nested sub-sets (`S0`); `docs/investigations/` held `16` child-layer investigations (`*-2026-10-04.md`) and `0` investigation of the Level 0 root set of layers; and `E4`'s `Operation` requirement and `M12` steps 1-3 asked an investigator to partition existing members without requiring the charter's `Operation` section to state how its territory is actively stressed against its `Vision` and `Scope` when the current population is small or lopsided.\
`[MEASURED]` Under `M11` (`methods/M11-change-a-charter.md` step 3), every pre-existing sentence of root `README.md` (`210` lines at `5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`) is **kept** in place, and two authored subsections are added (`11` lines total): *The corpus is a recursive hierarchy of sets* (`lines 43-45` under `## Mechanics`, stating the Level 0 to Level 2 recursion and delegation without inheritance) and *Stressing the set of layers* (`lines 199-204` under `## Adding and retiring a layer`, defining the `Zero-home pass`, `Two-home pass`, and `Consumer and occupancy pass`).\
`[MEASURED]` Running those three passes across all `20` top-level directories (`16` ID-bearing knowledge layers, `3` mechanism layers, and `1` instance layer) in `docs/investigations/layers-2026-11-12.md` found `0` unhomed kinds of reusable engineering knowledge at Level 0, confirmed single-home separation across six adjacent layer seams, and identified `practices/` (`PC0`, holding `1` active member `PC1-author-from-exemplar.md`) on `README.md`'s single-occupant layer retirement threshold, filed as `B136` in `docs/BACKLOG.md`.

**Test, fixed before any reader runs.**\
`[ARGUED]` Pair `base` (`5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`) against `head` (carrying `0139`, `0140`, and `0141`) in one `tools/eval.mjs prepare` (`--suites charter-stress,s0,gate --readers 3`, `18` fresh cold readers and `3` fresh blind scorers, `main` unmerged), with every new or modified probe in `docs/evals/charter-stress/suite.json` (`CS1` to `CS3`), `docs/evals/s0/suite.json` (`Q4`), and `docs/evals/gate/suite.json` (`G1`) audited by a fresh `B29` subagent before any reader runs (`M2` rule 1), testing `CS1` (recursive set hierarchy and Level 0 root-set stress passes) and `CS2` (`E4` and `M12` charter `Operation` territory-stress rules) alongside non-regression on `s0` and `gate` at `tolerance 0`, with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[MEASURED]` Root `README.md` grows by `11` lines (`210` to `221` lines), `entities/E3-set.md` by `7` lines, `entities/E2-layer.md` by `1` line, `entities/E4-charter.md` by `5` lines, and `methods/M12-investigate-a-set.md` by `0` net lines (`3` steps updated in place), plus `1` new dated investigation file (`docs/investigations/layers-2026-11-12.md`, `98` lines).

**Alternatives refuted.**\
Recording dated partitions or gap tables inside `README.md` or `<prefix>0` charters - refuted by `0071` and `E4` (*What never belongs in a charter*), which keep charters timeless and place dated partitions and gaps in `docs/investigations/` and `docs/BACKLOG.md`.\
Creating a new top-level knowledge layer ahead of two independent occupants or when a spanning set in `sets/` (`ST0`) or a nested sub-set (`E3`) suffices - refuted by `A3` (*Earned exposure*) and `README.md` (*Adding and retiring a layer*).

**Key audit, 2026-11-12, before any reader ran.**\
`[MEASURED]` A fresh `B29` agent (`f8a766e0-21bb-4893-824b-ce0e097a2bd2`), holding `base` (`5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`), `head` (`b508b0e508ecf5da6d96155cbc3d905397c8a93d`), and `docs/evals/charter-stress/suite.json`, `docs/evals/gate/suite.json` and `docs/evals/s0/suite.json` and answering nothing, audited every new or modified question and key and returned four alignments (`CS1` asking how a sub-population with different rules is structured inside a layer and noting `E2-layer.md`'s two-item summary; `CS2` asking what each of `C0`, `ST1`, and `S0` states for its stress pass; `CS3` asking how `PC0` says to stress `practices/` across the moments of a unit of work and what `M0`'s single-occupant retirement rule says; and `gate.G1`'s key stating that the three kinds are classified by who judges), all committed at `572a748632f65bf7f261c8cf3a7ac0dad7a2288a` before `tools/eval.mjs prepare` or any reader ran (`M2` rule 1; executor self-check rather than independent gate assurance under `A16`).

**Result, run `2026-11-12-climb6-r1-charter-stress-s0-gate`.**\
`[MEASURED]` Eighteen fresh cold readers (`3` per corpus on `charter-stress`, `s0` and `gate`) and three fresh blind scorers ran across `base` (`c-7047c9f2`, `5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`) and `head` (`c-5636a4d8`, `572a748632f65bf7f261c8cf3a7ac0dad7a2288a`) with `prompts/`, `TASKS.md`, `scorers/` and `sealed/` locked read-only (`0` writable paths under any of the four; `0` absent answers; `0` consistent hedges; `0` export diffs against `git archive`; `0` reads, writes or shell commands outside `/tmp/mk6-` across all `21` agents in `reader_reach_audit.py`; and `0` forbidden-path hits with `18` of `18` reader and `3` of `3` scorer positive controls firing in `reader_transcript_scan.py`).\
`[MEASURED]` Totals moved from `29.00` of `32` (`base`) to `32.00` of `32` (`head`) with `0` regressions at `tolerance 0` (`charter-stress`: `3.00` to `6.00` of `6`, with `CS1`, `CS2` and `CS3` each moving from `1.00` `[1, 1, 1]` on `base` to `2.00` `[2, 2, 2]` on `head`; `s0`: `12.00` to `12.00` of `12`; `gate`: `14.00` to `14.00` of `14`), and `9` of `9` `head` readers wrote `none` in `OBSERVATIONS`.\
`[ARGUED]` Under `M2` rule 4 (`B40`), none of these numbers is claimed as a positive gain (`separation: NOT-CLAIMED`).

**Source.**\
`[V, README.md lines 42-44 and 198-203; VISION.md; entities/E2-layer.md lines 61-65; entities/E3-set.md lines 41-44; entities/E4-charter.md lines 73 and 126-129; methods/M12-investigate-a-set.md lines 19-21; docs/investigations/layers-2026-11-12.md; docs/BACKLOG.md B136; docs/DECISIONS.md 0071, 0072, 0112 and 0113]`

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` Amending `0139`'s register row (`line 180`) and *Ruling* (`line 2918`), which wrote `"four-level recursive hierarchy of sets"`: `entities/E3-set.md` (`line 41`) now reads `"The corpus forms a recursive hierarchy of four set structures across three levels"` (`Level 0` root set; `Level 1` child knowledge layers and `Level 1` cross-layer spanning sets in `sets/` `ST0`; and `Level 2` nested sub-sets inside a layer), and `entities/E4-charter.md` (`line 129`) states `"the dated partition and the gaps a run finds belong in a dated M12 investigation in the project's record (in this corpus, docs/investigations/)"`.\
`[MEASURED]` In *Ratified*, *Named costs*, and *Source* above: root `README.md` grew by `11` net lines (`206` at `5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981` to `217` lines at `HEAD`, adding `4` lines at `lines 42-45` under `## Mechanics` and `7` lines at `lines 198-204` under `## Adding and retiring a layer` including trailing blank lines; `lines 2923` and `2930` above counted `210` to `221` against an earlier draft); `entities/E3-set.md` grew by `5` net lines (`120` to `125` lines, adding `lines 41-44`); `entities/E2-layer.md` grew by `1` net line (`112` to `113` lines, `lines 61-65`); `entities/E4-charter.md` grew by `5` net lines (`245` to `250` lines, updating `line 73` and adding `lines 126-129`); `methods/M12-investigate-a-set.md` stayed at `53` lines (steps 1-3 span `lines 18-20` and step 5 sits at `line 22`; `line 2945` above cited `lines 19-21`); `docs/investigations/layers-2026-11-12.md` is `95` lines (`57` relative links verified by `node tools/check-links.mjs docs/investigations/layers-2026-11-12.md`, rewritten with measured counts across all `20` directories: `16` in `A`, `4` in `R`, `7` in `D`, `26` in `W`, `9` in `M`, `4` in `RU`, `1` in `PC`, `1` in `ST`, `16` in `S`, `4` in `P`, `24` active / `26` total in `K`, `9` in `E`, `14` active / `15` total in `C`, `6` in `AR`, `5` in `T`, `6` in `SC`, `3` YAML files in `bundles/`, `2` plugin directories `statusline/` and `statusline-pi/` in `plugins/`, `25` checkers/generators + `11` `.test.sh` suites in `tools/`, and `5` live top-level records + `6` subtrees in `docs/`, with Pass 1 item 3 at `lines 50-53` naming `## Faults` in `E4` and `A1..A16` under `SC6` and `## Rationale`, `## Why this exists`, or `## The discriminator` in `S1..S16` and `RU1..RU4`, and Pass 2 at `line 70` naming `C5` `operation-call`, `C8` `operation-proxy`, and `C7` `caller-identity`); and ~~commit `572a748632f65bf7f261c8cf3a7ac0dad7a2288a` (`test(eval): align charter-stress and gate.G1 keys after B29 audit`) also included `1` line in `docs/BACKLOG.md` and `2` lines in `docs/DECISIONS.md`~~ *(Corrected 2026-11-12: commit `572a748632f65bf7f261c8cf3a7ac0dad7a2288a`, subject `evals: align charter-stress and gate.G1 keys and questions after B29 audit (0141)`, touched only `docs/evals/charter-stress/suite.json` `+8/-8` and `docs/evals/gate/suite.json` `+1/-1`)*.

### 0140

**Ruling.**\
`components/README.md` (`C0`), `sets/README.md` (`ST0`), `sets/ST1-explain.md` (`ST1`), `style/README.md` (`S0`), `patterns/README.md` (`P0`), `methods/README.md` (`M0`), `rules/README.md` (`RU0`), and `practices/README.md` (`PC0`) add concrete territory-stress protocols to `## Operation` so each charter states how an `M12` investigation actively stresses its `Vision` and `Scope` when its current population is small or lopsided (`0139`), and `style/README.md` (`S0`) moves the commit-level fault *"The corpus-wide sweep"* from `## Faults` to `## Enforcement boundary` so `## Faults` holds only population faults (`E4`, `B42`, `B57`, `B59`, `B60`, `B61`, `B63`, `B65`, `B67`, `B78`, `B135`, `B136`, amending `0071`, `0072`, and `0124`).

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-12 (`Step 0` self-describing charter territory-stress meta-climb).\
`[MEASURED]` Auditing all `17` set charters at `5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981` showed that `9` charters (`A0`, `R0`, `D0`, `W0`, `K0`, `E0`, `AR0`, `T0`, `SC0`) already stated concrete territory-stress or cover tests in `## Operation`, while `8` charters (`C0`, `ST0`, `ST1`, `S0`, `P0`, `M0`, `RU0`, `PC0`) carried `4`-to-`5`-sentence `## Operation` sections that named `M11`-`M13`, balance, and neighbour routing without stating how an `M12` pass stresses unpopulated regions of `Scope` (`B57` and `B78` on `C0`'s uncomputable anchored-core union; `B65` on `ST0` spanning-set discovery; `B42` on `ST1` package-only move evidence and `K5`/`AR3`/`RU1` boundary tensions; `B67` on `S0`'s three unpopulated media; `B60` on `P0` system forces; `B59` on `M0` moments of work; `B63` on `RU0` record-writing moments; and `B61`/`B136` on `PC0`'s single-occupant standing-context candidates).\
`[MEASURED]` Under `M11` (`methods/M11-change-a-charter.md` step 3, sentence-by-sentence accounting across all `8` charters):
- `components/README.md` (`C0`, `202` to `203` lines): every pre-existing sentence is **kept**; `1` sentence is added at `line 76` under `## Operation` stating the orthogonal reference-architecture synthesis pass (testing recurring un-indexed boxes across two or more architectures, `consumes`/`contains` seam friction, and conjunction duties at box altitude).
- `sets/README.md` (`ST0`, `92` to `93` lines): every pre-existing sentence is **kept**; `1` sentence is added at `line 57` under `## Operation` stating the cross-layer `related`-cluster and cold-reader situation pass across two or more layers.
- `sets/ST1-explain.md` (`ST1`, `103` to `104` lines): every pre-existing sentence is **kept**; `1` sentence is added at `line 57` under `## Operation` walking the full human-exchange arc (`S15`, `K5`, `M10`, `AR3`, ratification), testing the `K5`/`AR3`/`RU1` boundary tensions, and requiring single-move paired human comparisons (`B42`).
- `style/README.md` (`S0`, `161` to `162` lines): every pre-existing sentence in `## Vision`, `## Territory`, `## What earns an entry`, `## Neighbours`, `## Composition`, `## Axiom alignment`, and `## Index` is **kept**; `1` sentence is added at `line 63` under `## Operation` crossing the four claimed media against artifact grains, sampling real artifacts in each cell, checking the second-non-document-rule sub-set trigger (`B39`), and testing reading-held rules for deterministic `tools/` predicates; and `1` bullet in `## Faults` (*"The corpus-wide sweep. Converting all legacy debt in one commit, producing a diff no one can review and hiding a real change inside it."*, formerly `line 135`) is **moved** into `## Enforcement boundary` (`line 119`) because it describes a single-commit authoring error rather than a fault of the population (`E4`, `B135`).
- `patterns/README.md` (`P0`, `130` to `131` lines): every pre-existing sentence is **kept**; `1` sentence is added at `line 63` under `## Operation` crossing recurring system forces against component and domain seams (`B60`).
- `methods/README.md` (`M0`, `153` to `154` lines): every pre-existing sentence is **kept**; `1` sentence is added at `line 66` under `## Operation` testing the moments-of-work cover against `DECISIONS.md`/`BACKLOG.md` failures and the `methods` attachment cover across `work-types/` (`B59`, `B69`).
- `rules/README.md` (`RU0`, `103` to `104` lines): every pre-existing sentence is **kept**; `1` sentence is added at `line 63` under `## Operation` walking record-writing moments of work, auditing `DECISIONS.md`, `BACKLOG.md`, and `AGENTS.md` for trace-leaving obligations, and checking `tools/check-enforcers.sh` script pairing (`B63`).
- `practices/README.md` (`PC0`, `101` to `102` lines): every pre-existing sentence is **kept**; `1` sentence is added at `line 63` under `## Operation` auditing `AGENTS.md` and `DECISIONS.md`/`BACKLOG.md` across moments of work, filtering out `methods/`, `style/`, and `rules/` candidates, and testing whether remaining trace-free candidates have observed evidence under `M13` or leave `practices/` on the root charter's single-occupant retirement boundary (`B61`, `B136`).

**Test, fixed before any reader runs.**\
`[ARGUED]` Tested in the pre-registered paired run defined under `0139` (`--suites charter-stress,s0,gate --readers 3`, `18` cold readers and `3` blind scorers, keys audited by a fresh `B29` subagent before `prepare`), where `charter-stress.CS2` and `CS3` directly probe the `C0`, `ST1`, `S0`, and `PC0` territory-stress protocols and `s0` (`Q1` to `Q4`, `Q6`, `Q7`) checks non-regression on `style/README.md` at `tolerance 0`, with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[MEASURED]` Eight charter files grow by `1` line each (`8` net lines total across `C0`, `ST0`, `ST1`, `S0`, `P0`, `M0`, `RU0`, and `PC0`).

**Alternatives refuted.**\
Minting new components, style rules, spanning sets, or practices inside this meta-climb before the charter stress protocols are ratified and verified - refuted by the director's `Step 0` sequencing (`0016`), which makes the charters self-describing and stressable first so subsequent content climbs run one universal `M12` stress loop.\
Editing `## Operation` in the other `9` charters (`A0`, `R0`, `D0`, `W0`, `K0`, `E0`, `AR0`, `T0`, `SC0`) - refuted under `RU1` because each already states its cover or stress test in `## Operation`.

**Result, run `2026-11-12-climb6-r1-charter-stress-s0-gate`.**\
`[MEASURED]` In the pre-registered paired run (`2026-11-12-climb6-r1-charter-stress-s0-gate`, recorded under `0139`), `charter-stress.CS2` (`C0`, `ST1` and `S0` territory-stress passes) and `CS3` (`P0`, `M0`, `RU0` and `PC0` moments-of-work stress and placement) each moved from `1.00` (`[1, 1, 1]`) on `base` (`5df0aff`) to `2.00` (`[2, 2, 2]`) on `head` (`572a748`), and `s0` (`Q1` to `Q4`, `Q6`, `Q7`) scored `12.00` of `12` on `base` and `12.00` of `12` on `head` with `0` regressions at `tolerance 0`, `0` consistent hedges, and `0` `OBSERVATIONS` findings across all six `s0` readers (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Source.**\
`[V, components/README.md line 76; sets/README.md line 57; sets/ST1-explain.md line 57; style/README.md lines 63, 119 and 130-136; patterns/README.md line 63; methods/README.md lines 8 and 66; rules/README.md lines 8 and 63; practices/README.md lines 8 and 63; methods/M11-change-a-charter.md; entities/E4-charter.md; docs/BACKLOG.md B42, B57, B59, B60, B61, B63, B65, B67, B78, B135 and B136; docs/DECISIONS.md 0071, 0072, 0124 and 0139]`

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` Under `M11` sentence accounting: in `style/README.md` (`S0`), moving `"The corpus-wide sweep"` from `## Faults` (`line 135`) to `## Enforcement boundary` (`line 119`) **moved and reworded** the bullet into prose (*"Converting all legacy debt in one corpus-wide sweep is avoided for the same reason: it produces a diff no one can review and hides real changes inside it."*, and `## Faults` in *Source* `line 2983` spans `lines 131-136` rather than `130-136`).\
`[MEASURED]` In `methods/README.md` (`M0`, `line 66`), `rules/README.md` (`RU0`, `line 63`), and `practices/README.md` (`PC0`, `line 63`), the added `## Operation` sentence is **reworded** to replace repository-local filenames (`docs/DECISIONS.md`, `docs/BACKLOG.md`, `AGENTS.md`) with portable artifact and contract references (`the project's decision records (AR4)`, `backlog (AR5)`, and `standing context (SC2)`, adding `AR4`, `AR5` and `SC2` to `related:` frontmatter), and in `practices/README.md` (`line 63`) `"leave this single-occupant layer a candidate for retirement"` is **reworded** to `"or, while the layer holds a single member, leave it a candidate for retirement under the root charter"` so the charter carries no point-in-time population state (`E4`).\
`[MEASURED]` Before `prepare` (`M2` rule 1), the `B29` key auditor (`f8a766e0-21bb-4893-824b-ce0e097a2bd2`) re-audited `docs/evals/charter-stress/suite.json` (`CS1` to `CS3`) and `docs/evals/s0/suite.json` (`Q7`) against `base` (`5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`) and `head` (`baf18f38f38118846585772c22d03fa2923ff79c`) and returned `PASS` (`0` required changes).\
`[MEASURED]` An initial export invocation (`tools/eval.mjs export --rev 5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`) silently ignored the unknown `--rev` flag and exported the working tree `HEAD` to both arms (digest `f20a1eb1aacf5b539ad040f4b2c04faf76a1d1d3f70935dc6c1684292cd97cfc` on both `base` and `head`); before that same-tree export was caught, `12` cold readers (`task-5684`) and `2` blind scorers (`task-5690`) ran and were scored (`scratch/mk6_r2_eval_score.log` at `23:02:52Z`: `17.34` of `18` on both identical arms, with `charter-stress.CS1` `1.67` `[2, 1, 2]` vs `1.67` `[2, 2, 1]`, `CS2` `1.67` `[1, 2, 2]` vs `1.67` `[2, 2, 1]`, `CS3` `2.00` `[2, 2, 2]` vs `2.00` `[2, 2, 2]`, and `s0` `12.00` vs `12.00`, audited across all `14` transcripts in `scratch/mk6_r2_invalid_reach_audit.log` with `0` forbidden-path hits, `12` of `12` reader and `2` of `2` scorer positive controls firing, and `1` `mkdir -p .../answers` flag on `r-e73f03`); that run is retained in `scratch/mk6_r2_eval_score.log` and marked `INVALID` for `base`-vs-`head` pairing because both arms held identical `HEAD` bytes (zero `base`/`head` contrast) rather than because of its scores, and `tools/eval.mjs` (`line 47`) and `tools/eval.test.sh` (`36` cases) now refuse any unknown `--flag` with exit status `2`.\
`[MEASURED]` In the re-exported paired replication (`2026-11-12-climb6-r2-charter-stress-s0`, `12` fresh cold readers and `2` fresh blind scorers across `base` `c-5893c295` exported via `--ref 5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981` with digest `1baf89036870bae8b5877800951a162ec16f81af4e418c0e165bc668937639a0` and `head` `c-a34946cd` exported via `--ref HEAD` at `baf18f38f38118846585772c22d03fa2923ff79c` with digest `f20a1eb1aacf5b539ad040f4b2c04faf76a1d1d3f70935dc6c1684292cd97cfc`), totals moved from `15.00` of `18` (`base`) to `17.67` of `18` (`head`) with `0` regressions at `tolerance 0` (`charter-stress.CS1`: `1.00` `[1, 1, 1]` to `2.00` `[2, 2, 2]`; `CS2`: `1.00` `[1, 1, 1]` to `1.67` `[1, 2, 2]`; `CS3`: `1.00` `[1, 1, 1]` to `2.00` `[2, 2, 2]`; `s0.Q1`, `Q2`, `Q3`, `Q4`, `Q6`, `Q7`: `12.00` to `12.00` of `12`, with `s0.Q7` scoring `[2, 2, 2]` on both corpora), `0` consistent hedges, `0` absent answers, `0` export diffs against `git archive` (`BASE_DIFF_EXCLUDING_DOCS=0`, `HEAD_DIFF_EXCLUDING_DOCS=0`), `0` writable files under `exports/c-*`, `prompts/`, `TASKS.md`, `scorers/` or `sealed/`, `0` forbidden-path hits with `12` of `12` reader and `2` of `2` scorer positive controls firing in `reader_transcript_scan.py` (and `reader_reach_audit.py` flagging only `r-9174f8`'s `mkdir -p .../answers` before writing its own answer file and `r-5bb4e9`'s `update_focus` string), and `6` of `6` `head` readers writing `none` in `OBSERVATIONS` (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

### 0141

**Ruling.**\
`tools/check-links.mjs` verifies `#fragment` heading and `id`/`name` anchors (both cross-file and same-file) across all `247` non-frozen tracked markdown files (`B137`), `tools/check-enforcers.sh` refuses both `tools/ru[0-9]*-*` orphan scripts and rule-body scripts that disagree with frontmatter `enforced-by:` (`B135`), `style/S5`, `S6`, `S7`, `S9`, `S12` and `S13` replace `[[...]]` wiki-links with relative markdown links and name `tools/s6-one-sentence-per-line.mjs` and `tools/s13-plain-ascii.sh` in `## Checking` (`B135`), `artifacts/AR5-backlog.md` reconciles `## Lifecycle stage` (`line 37`) and `## Required sections` (`line 44`) with `AR3` (`B134`), `tools/README.md` and `tools/check-all.sh` reconcile their `changed`, axiom-count and enforcer descriptions (`B135`), and `docs/evals/charter-stress/suite.json` (`CS1` to `CS3`), `docs/evals/gate/suite.json` (`G1`) and `docs/evals/s0/suite.json` (`Q4`) are registered for `B29` key review and paired `M2` execution (`B133`, amending `0136`, `0137` and `0138`).

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-12 (`Step 0` Climb 6 `GOAL.md`).\
`[MEASURED]` At `5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`, `tools/check-links.mjs` (`lines 105-106`) skipped `#anchor` links and stripped `#fragment` suffixes on cross-file links (`B137`); `tools/check-enforcers.sh` (`lines 45-54`) checked orphan per-rule tools across `tools/s[0-9]*-*` without checking `tools/ru[0-9]*-*` or verifying that executable scripts named in a rule body match frontmatter `enforced-by:` (`B135`); `style/S5`, `S6`, `S7`, `S9`, `S12` and `S13` carried `[[...]]` wiki-links and `S6`/`S13` omitted their enforcer script paths in `## Checking` (`B135`); `artifacts/AR5-backlog.md` (`lines 37, 44`) contrasted `open` rows with `Held` and omitted `scores` in its prose bullet (`B134`); and `gate.G1` and `s0.Q4` carried the question/key mismatches recorded in `B133`.\
`[MEASURED]` All `5` cases in `tools/links.test.sh` and `5` cases in `tools/enforcers.test.sh` pass cleanly with zero `/tmp/mk-*-test-*` leftovers, all `1,433` relative links and `#fragment` anchors across `247` live markdown files resolve, and each added test fails by name when its single-line mechanism (`if (rawFrag)` at `tools/check-links.mjs:166`, `tools/ru[0-9]*-*` at `tools/check-enforcers.sh:50`, or `[ "$body_tool" != "$tool" ]` at `tools/check-enforcers.sh:44`) is mutated out (`mk6_mutants.log`).

**Test, fixed before any reader runs.**\
`[ARGUED]` Before running `tools/eval.mjs prepare` (`M2` rule 1), launch a fresh `B29` key-auditor subagent holding `base` (`5df0aff1e5fa4d89f4aef255cf6faad5ca3e3981`), `head` (this revision), and `docs/evals/charter-stress/suite.json`, `docs/evals/gate/suite.json` and `docs/evals/s0/suite.json` (answering nothing) to audit every new or modified question and key and commit any correction before `prepare`; then run `tools/eval.mjs prepare --suites charter-stress,s0,gate --readers 3` (`18` cold readers and `3` blind scorers, `main` unmerged) at `tolerance 0`, with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[MEASURED]` `tools/check-links.mjs` grows by `59` lines (`123` to `182` lines) to parse headings and cache per-file GitHub slugs, and `docs/evals/charter-stress/suite.json` adds `3` probes (`30` lines).

**Alternatives refuted.**\
Checking `#fragment` anchors by raw substring search instead of GitHub heading slug derivation outside fenced code blocks - refuted because headings contain punctuation, inline code, links and duplicate titles that GitHub normalises into lowercase hyphenated slugs with `-1`, `-2` suffixes.\
Leaving `tools/ru[0-9]*-*` out of the orphan-tool loop in `tools/check-enforcers.sh` until a `rules/RU*.md` entry declares `enforced-by:` - refuted because `check-enforcers.sh` already checks `rules/RU*.md` in the forward loop (`line 34`) and `tools/enforcers.test.sh` already fixtures `tools/ru1-sample.sh`.

**Result, run `2026-11-12-climb6-r1-charter-stress-s0-gate`.**\
`[MEASURED]` In the pre-registered paired run (`2026-11-12-climb6-r1-charter-stress-s0-gate`, recorded under `0139` after the `B29` key audit committed at `572a748632f65bf7f261c8cf3a7ac0dad7a2288a`), `gate.G1` scored `2.00` (`[2, 2, 2]`) on `base` and `2.00` (`[2, 2, 2]`) on `head` (against `10` of `12` readers capped at `1` in `2026-11-12-climb4-r1-board-gate` and `r2-gate-rep` before `G1`'s question named `"and what are its kinds?"`, `B133`), `s0.Q4` scored `2.00` (`[2, 2, 2]`) on `base` and `2.00` (`[2, 2, 2]`) on `head`, and `0` of `6` `s0` readers reported any `OBSERVATIONS` defect after `B135`'s fixes (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Source.**\
`[V, tools/check-links.mjs; tools/links.test.sh; tools/check-enforcers.sh; tools/enforcers.test.sh; tools/README.md lines 63, 145, 219 and 565-591; tools/check-all.sh lines 111-115; artifacts/AR5-backlog.md lines 37 and 44; style/S5-no-version-pins-in-prose.md line 19; style/S6-one-sentence-per-line.md lines 9, 47 and 55; style/S7-alternative-paths-separate-blocks.md line 89; style/S9-action-first-readme-structure.md line 23; style/S12-code-block-introducer-own-paragraph.md line 31; style/S13-plain-ascii-in-markdown.md lines 9, 62, 111 and 163; rules/RU4-publishing-rewritten-history.md lines 25, 62, 82 and 93; methods/M9-history-content-scrub.md lines 17, 60, 62, 76 and 115; docs/evals/README.md lines 99-100 and 133-135; docs/evals/charter-stress/suite.json; docs/evals/gate/suite.json line 9; docs/evals/s0/suite.json lines 5, 28 and 40; docs/BACKLOG.md B133, B134, B135 and B137; docs/DECISIONS.md 0136, 0137, 0138, 0139 and 0140]`

**Correction, found in review, 2026-11-12.**\
`[MEASURED]` `style/S13-plain-ascii-in-markdown.md` (`line 163`), `rules/RU4-publishing-rewritten-history.md` (`lines 25, 62, 82 and 93`), and `methods/M9-history-content-scrub.md` (`lines 17, 60, 62, 76 and 115`) replace the remaining `10` unquoted `[[...]]` wiki-links with relative markdown links (`0` unquoted `[[...]]` wiki-links remain across all `247` live markdown files).\
`[MEASURED]` `tools/check-links.mjs` (`123` to `197` lines, `+74` lines) preserves `_` in `githubSlug` (`line 109`) so snake_case identifiers in headings match GitHub slugs and accepts optional explicit `[file ...]` CLI arguments (`lines 22-38, 149-151`) to check newly authored files under frozen prefixes directly (`1,452` relative links and `#fragment` anchors across `247` live markdown files, plus `57` in `docs/investigations/layers-2026-11-12.md`); `tools/eval.mjs` (`463` to `464` lines, `+1` line at `line 47`) refuses unknown `--flag` arguments (`--rev`, etc.) with exit status `2`; and `tools/links.test.sh` (`6` cases), `tools/enforcers.test.sh` (`5` cases) and `tools/eval.test.sh` (`36` cases) kill all `10` single-line mutants across `tools/check-links.mjs` (`lines 109, 138, 143, 149, 181, 182`), `tools/check-enforcers.sh` (`lines 44, 50`) and `tools/eval.mjs` (`line 47`) in `mk6_mutants.log`.\
`[MEASURED]` `docs/evals/s0/suite.json` (`line 40`, `Q7`) drops `; legacy debt converted in one sweep` from its population-fault key after `0140` moved that clause to `## Enforcement boundary`, `docs/evals/README.md` (`lines 99-100, 133-135`) records the key reviews and suite edits for `board`, `charter-stress`, `gate` (`G1`) and `s0` (`Q4`, `Q7`), `docs/evals/charter-stress/suite.json` is `26` lines, and in *Source* (`line 3016`) `tools/README.md`'s `"all sixteen axioms"` prose sits at `line 221` (under `**Why it exists.**` at `line 219`).


### 0142

**Ruling.**\
`entities/README.md` (`E0`), `traits/README.md` (`T0`), `axioms/README.md` (`A0`), `roles/README.md` (`R0`), `domains/README.md` (`D0`), `work-types/README.md` (`W0`), `artifacts/README.md` (`AR0`), `schemas/README.md` (`SC0`), and `skills/README.md` (`K0`) add explicit territory-stress passes to `## Operation` under `E4` and `M11` so all `17` set charters in the corpus state how an `M12` investigation stresses their `Vision` and `Scope` (`B55`, `B56`, `B58`, `B62`, `B64`, `B66`, `B68`, `B69`, `B71`, `B115`, `B118`, amending `0071`, `0072`, and `0140`).

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-13 (5-Wave Recursive Corpus-Wide Hillclimbing Programme `GOAL.md`, Wave 1 `mk7`).\
`[MEASURED]` At `15b39074dbb9387f42efe8c32c62c4837d598931`, `0140` added concrete territory-stress passes to `8` of `17` charters (`C0`, `ST0`, `ST1`, `S0`, `P0`, `M0`, `RU0`, `PC0`), while the remaining `9` Level 1 charters (`E0`, `T0`, `A0`, `R0`, `D0`, `W0`, `AR0`, `SC0`, `K0`) stated balance and neighbour routing in `## Operation` without naming the full territory-stress denominator and sampling pass used by their `M12` investigations (`B58` on `E0` cross-layer noun scan; `B68` and `B118` on `T0` floor exclusivity and absence complements; `B56` and `B115` on `A0` failure classes and boundary tension; `B62` on `R0` unit-level and above-unit role x work-type x organisation-size crossing; `D0` cross-surface tie-break and tool-neutral portability audit; `B69` and `B71` on `W0` lifecycle modes and `methods`/`produces` attachment; `B55` on `AR0` top-down loop and bottom-up ad-hoc deliverable scan; `B64` on `SC0` repository-wide structured-file inventory and `catalog.json` resource mapping; and `B66` on `K0` capability families, `tools/skill-graph.mjs` edge parity, and substrate-independent counterparts).\
`[MEASURED]` Under `M11` (`methods/M11-change-a-charter.md` step 3, sentence-by-sentence accounting across all `9` charters):
- `entities/README.md` (`E0`, `161` to `162` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 85` under `## Operation` partitioning defined entities across authority, structure, work and its proof, and coordination, scanning across layers for recurring undefined or diverged nouns, and applying the two-readers test (`B58`).
- `traits/README.md` (`T0`, `145` to `146` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 67` under `## Operation` partitioning traits by architectural question, testing every axiom's `applies-to` tags for `any-system` floor exclusivity (`B118`) and single/zero-axiom traits, and testing each trait's absence complement against axioms, roles, and work-types (`B68`).
- `axioms/README.md` (`A0`, `211` to `212` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 74` under `## Operation` partitioning axioms across six failure classes, testing adjacent pairs for restatement or boundary tension (`B115`), verifying `T0` floor and trait rules (`B118`), and sampling system failures and backlog findings for unforbidden drift (`B56`).
- `roles/README.md` (`R0`, `150` to `151` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 62` under `## Operation` crossing the four authorities against work-types' `roleEligibility` and `evidenceAuthority` fields and across organisation sizes from a single agent to a fleet (`B62`).
- `domains/README.md` (`D0`, `155` to `156` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 64` under `## Operation` partitioning domains across product/state, delivery/runtime, control plane, and durable knowledge, sampling cross-surface changes under the tie-break rule, and auditing subject surfaces for tool-bound naming.
- `work-types/README.md` (`W0`, `290` to `291` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 67` under `## Operation` partitioning work-types across six lifecycle modes, crossing them against domains and roles, and checking `methods/` and `artifacts/` attachment through `methods` and `produces` (`B69`, `B71`).
- `artifacts/README.md` (`AR0`, `268` to `269` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 64` under `## Operation` walking every position and transition in *The loop* top-down and scanning repositories, skills, and work-type deliverables bottom-up for recurring shapes without a type (`B55`).
- `schemas/README.md` (`SC0`, `191` to `192` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 63` under `## Operation` inventorying all frontmatter blocks, JSON/YAML configurations, evaluation suites, and resource envelopes against `catalog.json`, `tools/`, and `schemas/tests/` (`B64`).
- `skills/README.md` (`K0`, `159` to `160` lines at `15b39074dbb9387f42efe8c32c62c4837d598931`): every pre-existing sentence is **kept**; `1` sentence is added at `line 63` under `## Operation` partitioning skills by capability family, checking `tools/skill-graph.mjs` against prose dependencies, testing for substrate-independent counterparts, and checking for hand-reconstructed multi-step workflows (`B66`).

**Test, fixed before any reader runs.**\
`[ARGUED]` Pair `base` (`15b39074dbb9387f42efe8c32c62c4837d598931`) against `head` (carrying `0142`, `0143`, and `0144`) in one pre-registered `tools/eval.mjs prepare` (`--suites charter-stress,sc0,e0,composition --readers 3`, `18` probes across `24` fresh cold readers and `4` fresh blind scorers, `main` unmerged), with every new or modified probe in `docs/evals/charter-stress/suite.json` (`CS4`) and `docs/evals/sc0/suite.json` (`Q7`) audited by a fresh `B29` subagent before `prepare` (`M2` rule 1), at `tolerance 0` with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[MEASURED]` Nine charter files grow by `1` line each (`9` net lines total across `E0`, `T0`, `A0`, `R0`, `D0`, `W0`, `AR0`, `SC0`, and `K0`).

**Alternatives refuted.**\
Leaving `## Operation` in the `9` charters without explicit territory-stress passes - refuted by the director's `Wave 1` (`mk7`) mandate (`0017`) that all `17` charters in the recursive hierarchy state self-describing stress denominators before Waves 1-5 run them.\
Embedding dated partition counts or open gap tables inside the charters - refuted by `0065`, `0069`, `0071`, and `E4`, which keep charters timeless and place dated partitions and gaps in `docs/investigations/`.

**Result, run `2026-11-13-wave1-r1-charter-stress-sc0-e0-composition`.**\
`[MEASURED]` Before `prepare` (`M2` rule 1), the fresh `B29` key auditor (`4b6048a9-239f-4957-ae9a-d8c5d9c01754`) audited `docs/evals/charter-stress/suite.json` (`CS4`) and `docs/evals/sc0/suite.json` (`Q7`) against `base` (`15b39074dbb9387f42efe8c32c62c4837d598931`, `c-e8542528`, digest `65864903048e1b303bee535fab343fb9c6164001427b3f1f7dc63342326f7cc5`) and `head` (`3337c413ccefd1e9e544afa27c93795d441e3524`, `c-326c5990`, digest `042a7c3a6b4926dc321ea2b1e99e7d808aef8e035101fd85cc2272ccaae805bf`) and returned `PASS` (`0` defects).\
`[MEASURED]` Across all `23` probes (`46` max, `24` cold readers and `4` blind scorers), total score rose from `40.00` of `46` (`base`) to `41.00` of `46` (`head`) with `0` consistent hedges and `0` absent answers: `charter-stress.CS4` rose from `1.00` (`[1, 1, 1]`) on `base` to `2.00` (`[2, 2, 2]`) on `head` (`+1.00`), `charter-stress.CS3` rose from `1.67` (`[1, 2, 2]`) to `2.00` (`[2, 2, 2]`), `charter-stress.CS1` (`1.00` vs `1.00`) and `CS2` (`1.33` vs `1.33`) held steady, `sc0` (`Q1`-`Q3`, `Q5`-`Q7`) scored `12.00` of `12` vs `12.00` of `12`, `e0` (`Q1`-`Q3`, `Q6`-`Q8`) scored `11.00` of `12` vs `11.00` of `12`, and `composition.P5` rose from `1.00` (`[1, 1, 1]`) to `1.67` (`[2, 1, 2]`); the two single-reader drops on `composition.P1` (`2.00` `[2, 2, 2]` to `1.33` `[2, 0, 2]`, where `r-29666c` omitted all seven `any-system` floor axioms on `P1` while naming all seven in `P2` on unchanged `T0` lines 17, 73-75 and 117) and `composition.P4` (`2.00` `[2, 2, 2]` to `1.67` `[2, 1, 2]`, where `r-29666c` overlooked `W10` on unchanged `W8`-`W11` entries) are classified as `Noise` under `docs/evals/README.md` (`CLASSIFICATION.md`), with `0` export diffs against `git archive`, `0` writable files under `exports/c-*`, `prompts/`, `TASKS.md`, `scorers/` or `sealed/`, `0` forbidden-path hits and `24` of `24` reader + `4` of `4` scorer positive controls firing in `reader_transcript_scan.py` (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Source.**\
`[V, entities/README.md line 85; traits/README.md line 67; axioms/README.md line 74; roles/README.md line 62; domains/README.md line 64; work-types/README.md line 67; artifacts/README.md line 64; schemas/README.md line 63; skills/README.md line 63; methods/M11-change-a-charter.md; entities/E4-charter.md; docs/BACKLOG.md B55, B56, B58, B62, B64, B66, B68, B69, B71, B115 and B118; docs/DECISIONS.md 0071, 0072, 0139 and 0140]`

**Correction, found in review, 2026-11-13.**\
`[MEASURED]` In *Test* (`line 3047`), the four suites (`charter-stress`, `sc0`, `e0`, `composition`) hold `23` probes (`4 + 6 + 6 + 7`, not `18`), and in *Alternatives refuted* (`line 3053`), `0017` is the coordinator's external Wave 1 triage note in `scratch/DECISIONS.md` rather than `docs/DECISIONS.md` (`0017` in `docs/DECISIONS.md`, `lines 61 and 394-397`, is the `2026-10-02` ruling that any cited online address must be proven empirically by fetching it).\
`[MEASURED]` Under `M11` sentence-by-sentence accounting for the Round 2 review refinements across `E0`, `SC0`, `A0`, and `K0`:
- `entities/README.md` (`E0`, `163` lines with `E10`): `line 8` adds `AR5` to `related:`; `line 85` is revised in place to add `what is engineered` as the fifth subject (matching `docs/investigations/entities-2026-11-13.md`), scan across all knowledge layers, and replace bare `docs/investigations/` with `the project's record (in this corpus, docs/investigations/) and backlog ([AR5](../artifacts/AR5-backlog.md))`.
- `schemas/README.md` (`SC0`, `192` lines): `line 8` adds `AR0, AR5` to `related:`; `line 63` is revised in place to replace repo-local `evaluation suite` with `JSON or YAML configuration or manifest file`, add `lifecycle document type in [artifacts/](../artifacts/README.md)`, and replace bare `docs/investigations/` with `the project's record (in this corpus, docs/investigations/) and backlog ([AR5](../artifacts/AR5-backlog.md))`.
- `axioms/README.md` (`A0`, `212` lines): `line 8` adds `AR5` to `related:`; `line 74` is revised in place to align its six failure classes with `docs/investigations/axioms-2026-11-13.md` (`truth of state and claims, boundaries and promotion, operation and recovery, cognition and context, authority, and knowledge, learning, and elevation`) and link `[AR5](../artifacts/AR5-backlog.md)`.
- `skills/README.md` (`K0`, `160` lines): `line 63` is revised in place to link `[tools/skill-graph.mjs](../tools/skill-graph.mjs)`, `[methods/](../methods/README.md)`, and `[tools/](../tools/README.md)`.
`[MEASURED]` In `2026-11-13-wave1-r1-charter-stress-sc0-e0-composition`, `0143` also removed `A15` from `T3` and `T4`'s generated tables while keeping `A15` on the `any-system` floor in `T0` (`lines 17, 73-75, 117`), which did not cause `r-29666c`'s `2 -> 0` drop on `composition.P1` because omitting the floor missed `6` floor axioms on `base` vs `7` on `head` (both `> 2` errors -> `0`).\
`[ARGUED]` To test `0142`'s foundational charter `## Operation` stress passes directly (`CS5` in `docs/evals/charter-stress/suite.json`) and test `composition.P1` by fresh replication rather than post-hoc classification alone, pre-register a Round 2 `B29` key audit (in the coordinator's external working scratch directory at `scratch/mk7_b29_r2_audit.md`, alongside `scratch/mk7_b29_r1_audit.md`) and paired `M2` run (`2026-11-13-wave1-r2-charter-stress-composition`, `--suites charter-stress,composition --readers 3`, `12` cold readers and `2` blind scorers across `12` probes, `main` unmerged) at `tolerance 0` with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).\
`[MEASURED]` Before `prepare` (`M2` rule 1), the fresh Round 2 `B29` key auditor (`3cf7973b-2ce2-4a2b-a396-a72866aa23ff`, archived in external `scratch/mk7_b29_r2_audit.md`) audited `CS4` and `CS5` in `docs/evals/charter-stress/suite.json` against `base` (`15b39074dbb9387f42efe8c32c62c4837d598931`) and `head` (`aeb16551fccee39e57116a80c80d7de508f43152`) and returned four wording refinements (`CS5.key` and `CS5.rubric` aligning `E0`'s routing to `"to their charter, how-to procedures to methods/ or skills/, and instance shapes to schemas/"` rather than `rule, or work-type`; `CS5.key` and `CS5.rubric` replacing `catalog.json's schemas and resources arrays` with `the contracts in catalog.json, the validators in tools/, and the paired contract tests in schemas/tests/`; `CS5.key` replacing stripped-`docs/` `Under 0142` with `Under E4 and M12` and including `T0` `line 67`'s three architectural-question groups; and `CS4.rubric` replacing `below R4 (E1)` with `below the director's altitude (E1)`), all committed at `1668272541660b2dd605e162b1ec6c298bebace0` (`docs/evals/README.md` `line 101`) before `tools/eval.mjs prepare` ran.\
`[MEASURED]` In the paired Round 2 run (`2026-11-13-wave1-r2-charter-stress-composition`, `12` fresh cold readers and `2` fresh blind scorers across `base` `c-0de0ea70` at `15b39074dbb9387f42efe8c32c62c4837d598931` with digest `65864903048e1b303bee535fab343fb9c6164001427b3f1f7dc63342326f7cc5` and `head` `c-6f814f6a` at `1668272541660b2dd605e162b1ec6c298bebace0` with digest `6004e668902469dee46153349c80ef188be4e2b438891a8d2bd6128ecec24861`), total score rose from `22.00` of `24` (`base`) to `24.00` of `24` (`head`) with `0` regressions at `tolerance 0` (`charter-stress`: `8.00` to `10.00` of `10`, with `CS1`-`CS3` at `2.00` `[2, 2, 2]` on both arms and `CS4` and `CS5` each moving from `1.00` `[1, 1, 1]` on `base` to `2.00` `[2, 2, 2]` on `head`; `composition.P1`-`P7`: `14.00` of `14` `[2, 2, 2]` on `base` and `14.00` of `14` `[2, 2, 2]` on `head`, confirming that `r-29666c`'s single-reader drops on `P1` and `P4` in `r1` were reader variance), `consistentHedges` on `CS4` (`3` of `3` on `base`) and `CS5` (`2` of `3` on `base`) cleared to `0` of `3` on `head` (while `composition.P1` on `head` scored `2.00` `[2, 2, 2]` with all `3` readers writing `NOT SETTLED` on whether the fixture implies `T4` `autonomous`), and in `OBSERVATIONS` `3` of `3` `base` `charter-stress` readers (`r-4298f8`, `r-fa1633`, `r-5b3f26`) and `3` of `3` `base` `composition` readers (`r-3da886`, `r-87fc91`, `r-aa7b0a`) flagged missing `E10` (`arc`), `T3`'s dangling charter-gap pointer, `A15`'s `applies-to` floor combination or `E1`/`A13` human-gate wording, and `E0`/`T0`/`A0`/`SC0`'s missing `## Operation` stress passes, against `0` of `6` `head` readers (residual `head` `OBSERVATIONS` on `E2:73`, `E3:114-121`, `A15:61`, and `R2`-`R4` are filed as `B138`; `0` export diffs against `git archive` excluding stripped `docs/`, `0` writable files under `exports/c-*`, `prompts/`, `TASKS.md`, `scorers/` or `sealed/`, `0` outside file or shell tool calls in `reader_reach_audit.py`, `0` forbidden-string hits with `12` of `12` reader and `2` of `2` scorer positive controls firing in `reader_transcript_scan.py`, and `separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Correction, found in a second review, 2026-11-13.**\
`[MEASURED]` At `fa323569f119a78f44db0c8c046d9065a052c127`, the first `Correction` banner above (`lines 3064 and 3072`) misidentified `0017` in `docs/DECISIONS.md` as `"the 2026-09-29 W5/W7/W20/W24 work-type ruling"` (`0017` at `lines 61 and 394-397` is the `2026-10-02` online-address ruling) and summarised the four `B29` Round 2 refinements with a non-existent `CS4.rubric` clause (`"or names all three obligations without stating why no solo trait is needed"`) and three mis-summarised `CS5` phrases (`"aligning SC0's lifecycle document types in artifacts/"`, `"T0's each trait's absence complement"`, and `"1 for 2-3 charters vs 0 for <= 1"`); `c415163f7a94d7fbc39eb4230fec77a5cf7d05f7` replaced those two lines with the verified `0017` description and four `B29` refinements above.

### 0143

**Ruling.**\
`entities/E10-arc.md` (`E10` - `arc`) is admitted under `M13` to define an arc and reconcile its value-chain (`K6`, `K16`) and coordination-substrate (`E9`, `W17`-`W21`, `K18`-`K26`) representations (`B58`), `axioms/A15-recursive-elevation.md` drops redundant `[autonomous, multi-agent]` tags from `applies-to: [any-system]` (`B118`) and reconciles *The human-gate filter* (`line 37`) and signal 5 (`line 66`) with `E1` and `A13` (`B115`, `B116`), `traits/T3-multi-agent.md` (`line 31`) resolves the solo-agent complement without minting a `solo` trait by citing `A16` on the floor and `W0`/`R0` gate waiting (`B62`, `B68`), and `docs/investigations/{entities,traits,axioms,schemas}-2026-11-13.md` record the Wave 1 foundational `M12` set investigations (amending `0121` and `0123`).

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-13 (5-Wave Recursive Corpus-Wide Hillclimbing Programme `GOAL.md`, Wave 1 `mk7`).\
`[MEASURED]` Running `M12` under the upgraded `## Operation` stress passes (`0142`) across the four foundational layers (`E0`, `T0`, `A0`, `SC0`) showed:
- In `entities/` (`docs/investigations/entities-2026-11-13.md`): `arc` appeared in `13` entries across `roles/` (`R1`), `domains/` (`D5`), `work-types/` (`W17`, `W18`, `W19`, `W21`), and `skills/` (`K6`, `K16`, `K18`, `K23`, `K24`, `K25`, `K26`) with two distinct structural shapes - a staged value-chain tree of rungs climbing a fixed summit without a coordination substrate (`K6`, `K16`) and a blueprint-instantiated graph of work items on `E9` (`W17`-`W21`, `K18`-`K26`) - satisfying `E0`'s two-readers admission test (`B58`), while the remaining `5` candidates (`sovereign`, `unit of work`, `seal`, `closeout`, `lease`) are single-layer or adjectival terms and remain held on their triggers under `RU1`.
- In `traits/` (`docs/investigations/traits-2026-11-13.md`): `traits/T3-multi-agent.md` (`line 31`) still read `"Its complement is not a trait yet"` (`B68`), whereas `A16` Unbiased Self-Check (`0123`) binds on the `any-system` floor and `W0` constraints 2 and 9 plus `R0` (*When there is no second agent*) govern gate waiting or director ratification when no second agent exists (`0127`, `0132`).
- In `axioms/` (`docs/investigations/axioms-2026-11-13.md`): `axioms/A15-recursive-elevation.md` (`line 7`) declared `applies-to: [any-system, autonomous, multi-agent]` against `T0`'s floor-exclusivity rule (`B118`), and its *The human-gate filter* (`line 37`) and signal 5 (`line 66`) said escalations arrive `"pre-decided with a recommended option and default"` without naming the `E1` altitude split against `A13`'s rule that agents never pre-decide the director's authority calls (`B115`).

**Each changed sentence (`A15` and `T3`).**

| Entry | Was | Is | Reason |
|---|---|---|---|
| `A15` (`line 7`) | `applies-to: [any-system, autonomous, multi-agent]` | `applies-to: [any-system]` | Removes redundant trait tags alongside `any-system` (`T0`, `B118`) so `T3` and `T4` generated views list only trait-gated axioms. |
| `A15` (`line 37`) | `"Before escalating a design or operational question to the human director, collaborating agents apply a strict filter: if held evidence, source truth, or standing charter invariants settle the question, the agents decide it, record the reasoning in an append-only decision record, and surface the ruling in the periodic operational log where the director may overrule. Every escalation that does reach the human arrives pre-decided with a recommended option and default so the director can ratify or redirect without reconstructing context from scratch."` | `"Before escalating a design or operational question to the human director, collaborating agents apply a strict filter by altitude (E1, A13): if the question is a technical or operational question below the director's altitude that held evidence, source truth, or standing charter invariants settle, the agents decide it, record the reasoning in an append-only decision record, and surface the ruling in the periodic operational log where the director may overrule. Genuine authority calls - charter intent or trade-offs, ratification, access or production rights, external commitments, or budget - are the director's alone and are never pre-decided by agents; every such escalation arrives pre-staged with the full, unbiased option set and a recommended lean and default (A13)."` | Separates agent-settleable technical/operational questions below `R4` (`E1`) from director authority calls (`A13`), replacing `"pre-decided"` on escalations with `"pre-staged with the full, unbiased option set and a recommended lean and default"` (`B115`). |
| `A15` (`line 66`) | `"Zero questions decidable from held evidence, source truth, or standing charter invariants are escalated to the human director; all human escalations arrive pre-decided with a recommended default."` | `"Zero technical or operational questions below the director's altitude (E1) that are decidable from held evidence, source truth, or standing charter invariants are escalated to the human director; all human escalations are genuine authority calls presented with the full, unbiased option set and a recommended lean and default (A13)."` | Matches *The human-gate filter* (`line 37`, `B115`). |
| `T3` (`line 31`) | `"Its complement is not a trait yet. An organisation of one has the inverse problem - no second actor exists to catch the first actor's error - and no axiom yet binds on that condition. Recorded as a gap on both sets."` | `"Its complement is not a trait. In an organisation of one, the obligation to check one's own work by means the author's reasoning cannot bias binds on the floor (A16), and when a gate requires an independent agent and none exists, the gate waits or the director decides it (W0, R0); neither obligation needs a solo-agent trait."` | Closes `B68` and the trait half of `B62` after `0123` (`A16`), `0127` (`W0`), and `0132` (`R0`). |

**Test, fixed before any reader runs.**\
`[ARGUED]` Tested in the pre-registered paired run defined under `0142` (`--suites charter-stress,sc0,e0,composition --readers 3` at `tolerance 0`, `separation: NOT-CLAIMED` under `M2` rule 4, `B40`), where `charter-stress.CS4` probes `A15`'s floor binding and `E1`/`A13` human-gate boundary alongside `E10`'s two representations, `e0` (`Q1` to `Q3`, `Q6` to `Q8`) checks non-regression on `entities/`, and `composition` (`P1` to `P7`) checks non-regression on trait-to-axiom binding (`P1`, `P2`) and solo-agent gates (`P5`).

**Named costs.**\
`[MEASURED]` `entities/` grows by `1` member (`E10-arc.md`, `73` lines, bringing `entities/` from `9` to `10` entries), `skills/K6-arc-lifecycle.md`, `skills/K18-workgraph-arc-operator.md`, `work-types/W18-seed-a-blueprint-arc.md`, and `work-types/W19-drive-an-arc.md` add `E10` to `related` and prose (`1` sentence or link each), and `docs/investigations/` gains `4` dated `M12` records (`entities-2026-11-13.md`, `traits-2026-11-13.md`, `axioms-2026-11-13.md`, `schemas-2026-11-13.md`).

**Alternatives refuted.**\
Splitting `arc` into two separate entities (`value-arc` and `substrate-arc`) - refuted because `K6`, `K16`, `W17`-`W21`, and `K18`-`K26` all use the bare noun `arc` for one bounded multi-step initiative at two stages of substrate binding, and `E10`'s discriminators distinguish the two representations directly.\
Minting a `T6-solo` trait to close `B68` - refuted by `T0`'s admission rules: `A16` binds every system on the `any-system` floor (including multi-agent systems where an individual agent checks its own step before handoff), and no axiom stops binding when a second agent joins (`traits-2026-11-13.md`).

**Result, run `2026-11-13-wave1-r1-charter-stress-sc0-e0-composition`.**\
`[MEASURED]` In the pre-registered paired run (`2026-11-13-wave1-r1-charter-stress-sc0-e0-composition`, recorded under `0142`), `charter-stress.CS4` (`E10` `arc` representations, `T3` solo-agent complement via `A16`/`W0`/`R0`, and `A15` human-gate filter against `E1`/`A13`) moved from `1.00` (`[1, 1, 1]`) on `base` (`15b3907`) to `2.00` (`[2, 2, 2]`) on `head` (`3337c41`), `composition.P5` (solo-agent gate verification) moved from `1.00` (`[1, 1, 1]`) on `base` to `1.67` (`[2, 1, 2]`) on `head` as two of three `head` readers (`r-b523aa`, `r-c4d2bf`) cited `A16` unbiased self-check alongside gate waiting/ratification, and `e0` (`Q1`-`Q3`, `Q6`-`Q8`) scored `11.00` of `12` on both arms with `0` regressions (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Source.**\
`[V, entities/E10-arc.md; axioms/A15-recursive-elevation.md lines 7-8, 37 and 66; traits/T3-multi-agent.md lines 8, 31 and 39-48; traits/T4-autonomous.md lines 38-44; skills/K6-arc-lifecycle.md lines 8 and 20; skills/K18-workgraph-arc-operator.md lines 8 and 15; work-types/W18-seed-a-blueprint-arc.md lines 13 and 27; work-types/W19-drive-an-arc.md lines 13 and 27; docs/investigations/entities-2026-11-13.md; docs/investigations/traits-2026-11-13.md; docs/investigations/axioms-2026-11-13.md; docs/investigations/schemas-2026-11-13.md; docs/BACKLOG.md B56, B58, B62, B68, B115, B116 and B118; docs/DECISIONS.md 0121, 0123, 0127, 0132 and 0142]`

**Correction, found in review, 2026-11-13.**\
`[MEASURED]` In *Each changed sentence (`A15` and `T3`)* (`lines 3095-3097`), the exact `15b39074dbb9387f42efe8c32c62c4837d598931` `Was` strings were:
- `A15` (`line 37`): `"- **The human-gate filter.** Before escalating a design or operational question to the human director, collaborating agents apply a strict filter: if the question can be settled from held evidence, source truth, or standing charter invariants, the agents decide it, record the reasoning in an append-only decision record, and surface the ruling in the periodic operational log where the director may overrule. Only genuine authority calls - charter intent or trade-offs, access or production rights, external commitments, or budget - escalate to the director, and every escalation arrives pre-decided with a recommended option and default."` (not `"if held evidence, source truth, or standing charter invariants settle the question..."` and `"Every escalation that does reach the human... without reconstructing context from scratch."`).
- `A15` (`line 66`): `"5. Zero questions decidable from held evidence or standing charter invariants are escalated to the human director; all human escalations are true authority calls accompanied by a recommended default."` (without `, source truth,` and with `"are true authority calls accompanied by a recommended default"` rather than `"arrive pre-decided"`).
- `T3` (`line 31`): `"- **Its complement is not a trait yet.** Work that no second actor independently checks has obligations of its own, and no trait captures it. See the gap recorded in the charter."` (not `"An organisation of one has the inverse problem..."`).
`[MEASURED]` In Round 2, `axioms/A15-recursive-elevation.md` (`lines 37, 66`) is further refined so `line 37` says `"where the director may re-aim charter intent or reclaim any choice that crossed into the director's altitude"` (`E1`) and both `line 37` and `line 66` say `"a labeled recommendation (using a revealed-preference lean only on a genuine inter-axiom divergence, with no pre-selected or auto-enacted default ahead of ratification, [A13](A13-director-intent-amplification.md))"`.\
`[MEASURED]` `work-types/W20-reconcile-ledger.md` (`W20`) does not reference `arc`; the coordination-substrate arc entries are `W17`, `W18`, `W19`, and `W21` plus `K18` and `K23`-`K26` (`13` primary arc-operating and arc-modelling entries across `roles/R1`, `domains/D5`, `work-types/`, and `skills/`, among `27` member entries across `7` layers - `axioms/`, `roles/`, `domains/`, `work-types/`, `methods/`, `sets/`, `skills/` - matching `\barcs?\b` at `15b3907`), and `entities/E10-arc.md` (`lines 8, 20, 38, 64, 71`) and `docs/investigations/entities-2026-11-13.md` (`line 27`) are updated accordingly.\
In `0143`'s first commit `W18` and `W19` added `[arc](../entities/E10-arc.md)` in prose at `line 27` only (`work-types/` entries did not carry `related:`), and in Round 2 `work-types/W17-author-closeout-packet.md` (`lines 13, 25`), `work-types/W21-arc-repair.md` (`lines 14, 28`), `skills/K16-model-an-arc.md` (`lines 8, 15`), and `skills/K23`..`K26` (`lines 8, 15`) also add `related: [E10]` and `[arc](../entities/E10-arc.md)` in prose (`traits/T3-multi-agent.md`'s generated section is `lines 39-47`, with `line 48` blank); in the paired Round 2 run (`2026-11-13-wave1-r2-charter-stress-composition`, recorded under `0142`), `charter-stress.CS4` moved from `1.00` (`[1, 1, 1]`, `3` of `3` hedged) on `base` (`15b3907`) to `2.00` (`[2, 2, 2]`, `0` of `3` hedged) on `head` (`1668272`) and `composition.P1`-`P7` scored `14.00` of `14` (`[2, 2, 2]` on every probe, including `P1` and `P5`) on both arms (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Correction, found in a second review, 2026-11-13.**\
`[MEASURED]` At `fa323569f119a78f44db0c8c046d9065a052c127`, the first `Correction` banner under `0143` (`lines 3113-3116 and 3118` at `fa32356`) cited `lines 3080-3082` instead of `lines 3092-3094` (now `lines 3095-3097`), gave three non-verbatim `15b3907` `Was` quotations ~~constructed from recall~~ *(Corrected 2026-11-13: that differed from `15b39074dbb9387f42efe8c32c62c4837d598931`; how they were produced is `[ARGUED]`)* (`"...and surface the ruling in the periodic operational log. Every escalation that does reach the human arrives pre-decided with a recommended option and default so the director can ratify or redirect without reconstructing context from scratch."` with a false parenthetical claiming `"where the director may overrule"` was in `B115` rather than `A15` `line 37`; `"Zero questions decidable from held evidence, source truth, or standing charter invariants..."` on `A15` `line 66`; and `"Its complement is not a trait yet. An organisation of one has the inverse problem - no second actor exists to catch the first actor's error - and no axiom yet binds on that condition (the gap the traits and axioms investigations carry)."` on `T3` `line 31`), and omitted the `7` layer names at `line 3118` while `docs/investigations/entities-2026-11-13.md:27` listed `rules/` and `artifacts/` (`0` matches) instead of `axioms/` and `sets/`; `c415163f7a94d7fbc39eb4230fec77a5cf7d05f7` replaced those lines in place with the verbatim `15b39074dbb9387f42efe8c32c62c4837d598931` text and `7`-layer list above (`B139` tracks the hand-typed citation defect class).

### 0144

**Ruling.**\
`tools/check-traits.mjs` accepts `--root DIR` and refuses any axiom that combines `any-system` with a trait in `applies-to`, guarded by `tools/traits.test.sh` (`B118`); `schemas/catalog.json` registers `EntryBody` in its `resources` array, guarded by `schemas/tests/entry-body/entry-body.test.mjs` (`B64` gap 7); and `docs/evals/charter-stress/suite.json` (`CS4`) and `docs/evals/sc0/suite.json` (`Q7`) are registered for `B29` key review and paired `M2` execution.

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-13 (5-Wave Recursive Corpus-Wide Hillclimbing Programme `GOAL.md`, Wave 1 `mk7`).\
`[MEASURED]` At `15b39074dbb9387f42efe8c32c62c4837d598931`, `tools/check-traits.mjs` (`43` lines) checked only that `traits/T[1-9]*.md` and the `applies-to` enum in `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json` named the same tags, without checking `axioms/A[1-9]*.md` for `T0`'s floor-exclusivity rule (`B118`) and without a `tools/*.test.sh` behaviour suite; and `schemas/catalog.json` (`59` lines) mapped `SC6` (`urn:mission-kit:schemas:entry-body:entry-body:v1alpha1`) in `schemas` (`lines 39-43`) while omitting `EntryBody` from `resources` (`lines 45-58`, `B64` gap 7).\
`[MEASURED]` All `6` fixture cases in `tools/traits.test.sh` (`131` lines) and all `6` tests in `schemas/tests/entry-body/entry-body.test.mjs` (`82` lines, `358` tests across `schemas/`) pass cleanly with zero `/tmp/mk-*-test-*` leftovers, and all `3` single-line mutants (`M1` floor exclusivity at `tools/check-traits.mjs:103`, `M2` `--root` validation at `tools/check-traits.mjs:27`, and `M3` `EntryBody` binding in `schemas/catalog.json:60`) fail by name (`mk7_mutants.log`).

**Test, fixed before any reader runs.**\
`[ARGUED]` Before running `tools/eval.mjs prepare` (`M2` rule 1), launch a fresh `B29` key-auditor subagent holding `base` (`15b39074dbb9387f42efe8c32c62c4837d598931`), `head` (this revision), and `docs/evals/charter-stress/suite.json` (`CS1` to `CS4`) and `docs/evals/sc0/suite.json` (`Q1` to `Q3`, `Q5` to `Q7`), answering nothing, to audit the new `CS4` probe and updated `sc0.Q7` key and commit any correction before `prepare`; then run `tools/eval.mjs prepare --suites charter-stress,sc0,e0,composition --readers 3` (`24` cold readers and `4` blind scorers, `main` unmerged) at `tolerance 0`, with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[MEASURED]` `tools/check-traits.mjs` grows by `74` lines (`43` to `117` lines), `tools/traits.test.sh` adds `131` lines (`1` new gate in `tools/check-all.sh`), `schemas/catalog.json` grows by `5` lines (`59` to `64` lines), `schemas/tests/entry-body/entry-body.test.mjs` grows by `28` lines (`54` to `82` lines), and `docs/evals/charter-stress/suite.json` grows by `6` lines (`26` to `32` lines).

**Alternatives refuted.**\
Enforcing `any-system` floor exclusivity inside JSON Schema `catalog-entry.schema.json` alone - refuted because `check-traits.mjs` is the dedicated sovereign checker for `applies-to` and `T0` rules and already reads both `catalog-entry.schema.json` and `traits/`.\
Adding a dummy `semanticValidator` field to `EntryBody` in `schemas/catalog.json` - refuted because `SC6` is enforced by `tools/check-entry-body.sh` and `schemas/tests/entry-body/entry-body.test.mjs` rather than a JS semantic validator module.

**Result, run `2026-11-13-wave1-r1-charter-stress-sc0-e0-composition`.**\
`[MEASURED]` In the pre-registered paired run (`2026-11-13-wave1-r1-charter-stress-sc0-e0-composition`, recorded under `0142` after `B29` key auditor `4b6048a9-239f-4957-ae9a-d8c5d9c01754` returned `PASS` with `0` defects), `sc0.Q7` scored `2.00` (`[2, 2, 2]`) on `base` and `2.00` (`[2, 2, 2]`) on `head` (`sc0` total `12.00` of `12` vs `12.00` of `12`), and `charter-stress.CS4` scored `1.00` (`[1, 1, 1]`) on `base` and `2.00` (`[2, 2, 2]`) on `head` (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Source.**\
`[V, tools/check-traits.mjs; tools/traits.test.sh; tools/README.md lines 273-292 and 594-607; schemas/catalog.json lines 58-62; schemas/tests/entry-body/entry-body.test.mjs lines 56-82; docs/investigations/traits-2026-11-13.md lines 25-28 and 38-40; docs/investigations/schemas-2026-11-13.md lines 14, 22-25 and 36-38; docs/evals/charter-stress/suite.json lines 5 and 25-30; docs/evals/sc0/suite.json line 40; docs/evals/README.md line 136; docs/BACKLOG.md B64 and B118; docs/DECISIONS.md 0142 and 0143]`

**Correction, found in review, 2026-11-13.**\
`[MEASURED]` In `0144`'s first commit (`3337c413ccefd1e9e544afa27c93795d441e3524`), the floor-exclusivity check in `tools/check-traits.mjs` was at `line 106` (`line 103` was the loop header), ~~`docs/evals/README.md` recorded the `CS4` and `sc0.Q7` entries at `lines 101 and 137`~~ *(Corrected 2026-11-13: at `3337c413ccefd1e9e544afa27c93795d441e3524`, `docs/evals/README.md` recorded the single `Suite edits` row at `line 136`, as *Source* states; Round 1's docs commit `3e39ba2a077c994afc41da29483a071c46ad1e67` added the `Key reviews` row at `line 101`, shifting the `Suite edits` row to `line 137`)*, and `tools/README.md`'s `check-traits.mjs` and `traits.test.sh` sections spanned `lines 273-291 and 597-607`.\
`[MEASURED]` In Round 2, `tools/check-traits.mjs` (`43` to `145` lines, `+102` lines, with floor exclusivity at `lines 134-137` and unknown-tag refusal at `line 132`) preserves `sawAppliesTo` when a subsequent frontmatter key follows a block `applies-to:` list (`lines 48, 77, 98`), supports multi-line flow arrays (`lines 55-65, 85-89`), validates that `--root DIR` is an existing directory (`lines 37-40`), and refuses empty `traits/` or `axioms/` directories (`lines 114, 123`); `tools/traits.test.sh` grows to `209` lines (`12` cases) and `schemas/tests/entry-body/entry-body.test.mjs` grows to `88` lines (asserting `resourceSchemasChecked >= 3`), killing all `13` single-edit mutants (`M1`-`M13`) in the coordinator's external `scratch/mk7_mutants.log`; and `docs/evals/charter-stress/suite.json` grows to `38` lines (`5` probes, adding `CS5` for `0142`'s foundational charter stress passes and narrowing `CS4` to `W17`-`W19`/`W21` and `K18`/`K23`-`K26`, audited by `B29` key auditor `3cf7973b-2ce2-4a2b-a396-a72866aa23ff` before `prepare` and scoring `1.00` `[1, 1, 1]` on `base` vs `2.00` `[2, 2, 2]` on `head` for both `CS4` and `CS5` in `2026-11-13-wave1-r2-charter-stress-composition`, recorded under `0142` with `separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Correction, found in a second review, 2026-11-13.**\
`[MEASURED]` At `fa323569f119a78f44db0c8c046d9065a052c127`, the first `Correction` banner under `0144` cited `tools/check-traits.mjs` floor exclusivity at `line 132` (actual `lines 134-137`), `sawAppliesTo` at `lines 48, 76, 98` (actual `lines 48, 77, 98`), and empty-directory refusals at `lines 108, 117` (actual `lines 114, 123`); `c415163f7a94d7fbc39eb4230fec77a5cf7d05f7` updated those line numbers in place (`B139`).

### 0145

**Ruling.**\
`style/S17-source-comments-state-duty-and-why.md` (`S17` - *Source comments state the file's duty and why non-obvious code is written that way*, `enforced-by: tools/s17-source-comments.sh`) is admitted to `style/` under `M13` to govern comments in source files (`B67` gap 3), `tools/s17-source-comments.sh` and `tools/s17-source-comments.test.sh` enforce its four mechanical predicates across `tools/*.sh` and `tools/*.mjs`, `8` pre-existing scripts in `tools/` (`check-all.sh`, `check-board.mjs`, `check-standing-context.sh`, `check-structure.sh`, `check-traits.mjs`, `format-markdown.sh`, `generate-index.mjs`, `skill-graph.mjs`) add `Sovereign duty:`, line-2 `<name> - <summary>` headers, and plain-ASCII comments, and `docs/investigations/style-2026-11-13.md` records the `S0` `M12` territory-stress investigation.

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-13 (5-Wave Recursive Corpus-Wide Hillclimbing Programme `GOAL.md`, Wave 2 `mk8`).\
`[MEASURED]` Running `S0`'s `## Operation` territory-stress matrix (`docs/investigations/style-2026-11-13.md`) across all `37` executable scripts in `tools/*.sh` and `tools/*.mjs` (`25` non-test tools and `12` `*.test.sh` suites) at `1b8745c3c1a3a8c710966571a61eb4438a9c717c` showed that `S8` (`style/S8-code-block-comments-not-prose.md`) governs only comments inside markdown code blocks while `0` active `S` entries governed comments in source files (`B67` gap 3): `3` of `37` scripts failed the line-2 `(#|//) <name> - <one-line summary>` header (`tools/check-board.mjs` and `tools/check-traits.mjs` carried a blank `//` on line 2; `tools/skill-graph.mjs` used a non-ASCII em dash `U+2014` on line 2 and carried `6` non-ASCII comment lines with `U+2014` and `U+2026` that escaped `S13`'s `--include="*.md"` filter), and `8` of `25` non-test tool scripts (`check-all.sh`, `check-board.mjs`, `check-standing-context.sh`, `check-structure.sh`, `check-traits.mjs`, `format-markdown.sh`, `generate-index.mjs`, `skill-graph.mjs`) omitted `Sovereign duty:` in their opening comment block.\
`[MEASURED]` `tools/s17-source-comments.sh` (`133` lines) passes across all `39` executable scripts in `tools/` (`0` failures), and `tools/s17-source-comments.test.sh` (`145` lines) passes all `6` fixture cases with zero `/tmp/mk-*-test-*` leftovers.

**Test, fixed before any reader runs.**\
`[ARGUED]` Tested in the Wave 2 pre-registered paired `M2` evaluation (`--suites charter-stress,s0 --readers 3`, `12` fresh cold readers and `2` fresh blind scorers across `base` `1b8745c3c1a3a8c710966571a61eb4438a9c717c` and `head` carrying `0145`, `0146`, and `0147`, `main` unmerged) at `tolerance 0` with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`), where `s0.Q4` and `charter-stress.CS6` test `S17` and `S0`'s medium sub-sets after a fresh `B29` key audit before `prepare`.

**Named costs.**\
`[MEASURED]` `style/` grows from `16` to `17` members (`style/S17-source-comments-state-duty-and-why.md`, `99` lines), `tools/` gains `tools/s17-source-comments.sh` (`133` lines) and `tools/s17-source-comments.test.sh` (`145` lines), and `docs/investigations/` gains `docs/investigations/style-2026-11-13.md` (`56` lines).

**Alternatives refuted.**\
Widening `S8` (`style/S8-code-block-comments-not-prose.md`) to cover source files - refuted because `S8`'s rule ("move multi-line explanation into prose between code blocks") relies on surrounding markdown paragraphs that do not exist in standalone `.sh` and `.mjs` files, where the opening comment block is the primary place for `Sovereign duty:` and `Usage:`.\
Putting source-comment rules into `K27` (`skills/K27-write-discoverable-code.md`) - refuted because `K27` is a vendored MIT skill scoped to plain-text-searchable identifier naming and carries no `tools/` enforcer.

**Result, run `2026-11-13-wave2-r1-charter-stress-s0`.**\
`[MEASURED]` In the pre-registered paired run (`2026-11-13-wave2-r1-charter-stress-s0`, recorded under `0147` after `B29` key auditor `b286e97f-f811-4026-8ac6-26a54911e98d` audited `charter-stress` and `s0` and `e0e357515252ddba866380e36ae07ac7d722111e` committed its `CS3` and `CS6` alignments before `prepare`), `s0.Q4` scored `2.00` (`[2, 2, 2]`) on `base` (`1b8745c3c1a3a8c710966571a61eb4438a9c717c`, naming all `6` tool-held rules `S6`, `S8`, `S10`, `S12`, `S13`, `S14` and `10` reading-held rules) and `2.00` (`[2, 2, 2]`) on `head` (`e0e357515252ddba866380e36ae07ac7d722111e`, naming all `7` tool-held rules including `S17` and `10` reading-held rules), and `charter-stress.CS6` moved from `1.00` (`[1, 1, 1]`, `3` of `3` hedged) on `base` to `2.00` (`[2, 2, 2]`, `0` of `3` hedged) on `head` (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).\
`[MEASURED]` All `5` single-line mutants (`M1`-`M5`) in `tools/s17-source-comments.sh` (`lines 75, 85, 88, 109 and 126`) fail `tools/s17-source-comments.test.sh` by name (`scratch/mk8_mutants.log`).

**Correction, found in cold reading, 2026-11-13.**\
`[MEASURED]` In `2026-11-13-wave2-r1-charter-stress-s0`, all `3` `head` `s0` readers (`r-d5259f`, `r-622176`, `r-44a2ca`) noted in `OBSERVATIONS` that `tools/check-all.sh` (`lines 109 and 116-126` at `e0e357515252ddba866380e36ae07ac7d722111e`) filtered `--all` and `changed` paths exclusively with `grep '\.md$'`, so a change modifying only `tools/*.sh` or `tools/*.mjs` skipped `run_style` (`S17`) while a change modifying `.md` files passed only `.md` paths to `tools/s17-source-comments.sh`; `tools/check-all.sh` (`134` to `146` lines at `fae6e74a29597c73f1d21d222ebe4c88e3f1855a`, `+12` lines at `lines 92-139`) and `tools/README.md` (`line 61`, now `line 63`) collect both `changed_md` (`*.md`) and `changed_src` (`tools/*.sh` and `tools/*.mjs`) and dispatch each per-rule style checker by the `medium:` field declared in `style/<rule>-*.md` (`documents` -> `changed_md`, `code` -> `changed_src`).

**Correction, found in review, 2026-11-13.**\
`[MEASURED]` In `0145`'s initial text (`fae6e74a29597c73f1d21d222ebe4c88e3f1855a`), `style/S17-source-comments-state-duty-and-why.md` (`line 56`) and `0145` *Source* cited `0054` for the six-rules-in-one-script history (actual: `0054` is `S0` territory scope; the monolithic `tools/check-style.sh` retirement was commit `e81ef96`, recorded in `B132`), `style/S17-source-comments-state-duty-and-why.md` grew from `99` to `100` lines when `0146` added `medium: code` (`line 6`), `tools/README.md`'s `s17-source-comments.test.sh` section was at `lines 615-625` (now `lines 617-627`), `scratch/mk8_mutants.log` at `fae6e74a29597c73f1d21d222ebe4c88e3f1855a` tested `7` `0145` mutants (`M1`-`M7` at `tools/s17-source-comments.sh` `lines 76, 86, 89, 114, 122/126, 60 and 24`, as recorded in the coordinator's external `scratch/verdict_mk8-reader-r1.md` and `scratch/verdict_mk8-rigor-r1.md`) rather than `5` (`lines 75, 85, 88, 109 and 126`), `tools/check-board.mjs` and `tools/check-traits.mjs` had file mode `100644` (`2` of `39` scripts in `tools/`), and `tools/s17-source-comments.test.sh` self-exempted when `style_exempt` matched `"style-check: allow S17"` inside its `printf` on `line 110` (`38` of `39` scripts inspected).\
`[MEASURED]` In Round 2 (`af9a4c0`) and Round 3 (`dc66af9`), `chmod +x` sets `100755` on `tools/check-board.mjs` and `tools/check-traits.mjs`; `style/S17-source-comments-state-duty-and-why.md` (`100` lines, `lines 42-49 and 56`) states the top-level `tools/*.sh` and `tools/*.mjs` discovery boundary and full-line comment / heredoc scope and drops `(0054)`; `tools/check-all.sh` (`146` to `178` lines, `+32` lines) adds `--root DIR` (`lines 48-55`), `--style-only` (`lines 66, 87-88 and 116`, keeping top-level `run "..."` calls at column 0 for `generate-architecture.mjs`), `--since` git-revision verification (`lines 56-63 and 74-77`), quote-stripping `medium:` extraction (`line 130`), and fail-closed unknown-medium refusal (`lines 135-139`); `tools/s17-source-comments.sh` (`133` to `168` lines, `+35` lines) restricts `s17_exempt` to comment-line `style-check: allow S17` or `GENERATED FILE` markers (`lines 60-64`), refuses missing explicit file paths and counts only inspected files (`lines 66-73 and 168`, inspecting all `39` of `39` scripts in `tools/`), matches line-2 `<stem>`/`<filename>` literally via `awk` (`lines 88-104`), requires non-empty values after `Sovereign duty:` (`line 112`) and `Usage:` (`line 115`), checks full-line comments (`lines 133-155`) before opening shell heredocs (`lines 157-164`, supporting `<<-` tab-indented terminators, trailing redirections, and ignoring `<<<` here-strings), and refines JS dead-code patterns (`lines 141-146`); and `tools/s17-source-comments.test.sh` (`145` to `229` lines, `7` cases, with Case 6b asserting `generate-sample.mjs:10  commented-out code in source comment` under `medium: "code"`) kills all `11` `0145` single-edit mutants (`M1`-`M11` across `tools/s17-source-comments.sh` `lines 103, 113, 116, 136, 147/151, 72, 69, 24` and `tools/check-all.sh` `lines 133, 137, 130`) in `scratch/mk8_mutants.log`.\
`[MEASURED]` At `4bf46b6f7fb925706f334c780391a1cef3c20ff7`, the first `Correction` banner under `0145` cited `tools/check-all.sh` `lines 65-68` (and `lines 21, 31-68 and 118-171` in *Source*) for `--since` verification and called the `10` Round 2 mutants (`M1`-`M10`) `"single-line mutants"` instead of `lines 56-63 and 74-77` (and `lines 21, 31-36, 44-77, 87-88 and 116-171` in *Source*) and `11` `"single-edit mutants"` (`M1`-`M11` after Round 3 `dc66af9` added `M11` at `tools/check-all.sh` `line 130`), `3b7824754028f6b6fca3c10f49602a90754e987a` edited that banner in place before `209e50b5a5c5bb4aaa64c7befd0fdc4a82be5402` recorded the `4bf46b6f7fb925706f334c780391a1cef3c20ff7` history explicitly (`AR4`), and Round 5 updates `tools/s17-source-comments.test.sh` Cases 6 and 7 (`lines 186-222`, `229` lines) to invoke `"$root/tools/check-all.sh" --root "$sandbox/proj"`, assert `! grep -q "=== repository structure is documented ===" <<< "$out_md"`, and refuse a non-existent `--root` directory on `check-all.sh` with exit status `2`.

**Source.**\
`[V, style/S17-source-comments-state-duty-and-why.md; tools/s17-source-comments.sh; tools/s17-source-comments.test.sh; tools/check-all.sh lines 21, 31-36, 44-77, 87-88 and 116-171; tools/format-markdown.sh line 9; tools/README.md lines 17, 49-56, 63 and 617-627; docs/investigations/style-2026-11-13.md; docs/BACKLOG.md B67 and B132; docs/DECISIONS.md 0140, 0146 and 0147]`

### 0146

**Ruling.**\
`SC1` (`schemas/catalog-entry/v1alpha1/catalog-entry.schema.json`) requires `medium` (`documents`, `messages`, `commits`, `code`) on every `S1..Sn` style rule and forbids it on `S0` and non-style entries, `S0` (`style/README.md`) registers the four Level 2 medium sub-sets under `## Sub-sets` (`M11`), `style/S1`-`S17` declare their `medium` (`documents` on `S1`-`S14` and `S16`, `messages` on `S15`, `code` on `S17`), and `tools/generate-index.mjs` (held by `tools/sets.test.sh`) validates `medium` and partitions `style/README.md`'s `## Index` into `### Sub-set: <medium>` tables (`B39`).

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-13 (5-Wave Recursive Corpus-Wide Hillclimbing Programme `GOAL.md`, Wave 2 `mk8`).\
`[MEASURED]` Admitting `S17` (`code`, `0145`) alongside `S15` (`messages`, `0038`) fired `B39`'s revival trigger (`"a second single-medium style rule"`, and `S0` *Territory* `line 55`: `"Rules for media other than documents are grouped into sub-sets by medium once there is a second such rule, in any medium other than documents"`).\
`[MEASURED]` `M11` sentence-by-sentence accounting for `style/README.md` (`S0`, `163` to `191` lines):
- `related` frontmatter (`line 8`): adds `E3, E4, SC1` alongside `M0, P0, K0, A4` (`1` changed frontmatter line).
- `## Sub-sets` (`lines 59-68`): `1` new conditional `E4` section (`1` introducer sentence and a `4`-row table defining the `Documents`, `Messages`, `Commits`, and `Code` medium sub-sets and their `medium` values in `SC1`, naming no individual member and no point-in-time population state per `E4` `lines 26, 105, 145`).
- `## Index` (`lines 155-191`): generated by `tools/generate-index.mjs` into the charter table (`S0`) followed by `### Sub-set: documents` (`15` rules: `S1`-`S14`, `S16`), `### Sub-set: messages` (`1` rule: `S15`), and `### Sub-set: code` (`1` rule: `S17`), keeping the `Held by` column across all sub-set tables.
- All other sections (`## Vision`, `## Territory`, `## Operation`, `## What earns an entry`, `## Neighbours`, `## Composition`, `## Enforcement boundary`, `## Axiom alignment`, `## Faults`) are retained verbatim (`0` sentences dropped or reworded).\
`[MEASURED]` `M13` / `check-guidance-placement.sh` accounting for `style/S15-message-to-a-human.md` (`49` to `50` lines): adds `medium: messages` in frontmatter (`line 6`) and updates the second sentence under `**Medium.**` in `## Rationale` (`line 43`, outside `## Rule`) from `"One rule does not earn a sub-set of style/; a second single-medium rule would."` to `"With S17 (code) admitted alongside S15 (messages), S0 partitions style/ into Level 2 medium sub-sets via the medium frontmatter field (SC1)."` (`tools/check-guidance-placement.sh` passes all `17` tested lines).\
`[MEASURED]` `tools/generate-index.mjs` (`364` to `395` lines) also tightens the charter ID check on `lines 158 and 184` from `/0$/` to `/^[A-Z]+0$/` so two-digit rules ending in `0` (`S10`) are never classified as `<prefix>0` charters; `schemas/tests/catalog-entry/catalog-entry.test.mjs` (`124` to `133` lines, `360` passing tests across `schemas/`) and `tools/sets.test.sh` (`47` to `70` lines, `11` passing checks) verify all `medium` refusals and sub-set index generation.

**Test, fixed before any reader runs.**\
`[ARGUED]` Tested in the Wave 2 pre-registered paired `M2` evaluation (`--suites charter-stress,s0 --readers 3`, `12` fresh cold readers and `2` fresh blind scorers across `base` `1b8745c3c1a3a8c710966571a61eb4438a9c717c` and `head` carrying `0145`, `0146`, and `0147`, `main` unmerged) at `tolerance 0` with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`), where `charter-stress.CS6` and `s0.Q4` test `S0`'s medium sub-sets and `Held by` partition after a fresh `B29` key audit before `prepare`.

**Named costs.**\
`[MEASURED]` `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json` grows by `48` lines (`366` to `414` lines), `schemas/tests/catalog-entry/catalog-entry.test.mjs` grows by `9` lines (`124` to `133` lines), `tools/generate-index.mjs` grows by `31` lines (`364` to `395` lines), `tools/sets.test.sh` grows by `23` lines (`47` to `70` lines), `style/README.md` grows by `28` lines (`163` to `191` lines), and `style/S1`-`S17` each gain `1` frontmatter line (`medium:`).

**Alternatives refuted.**\
Moving `style/S*.md` into physical subdirectories (`style/documents/`, `style/messages/`, `style/code/`) - refuted because `E2` and `generate-index.mjs` resolve a layer's members at `<layer>/<ID>-<slug>.md` and moving `S1`-`S17` would break every relative link and `enforced-by` pairing across the corpus for zero semantic gain.\
Minting standalone charter files (`S0-documents.md`, `S0-messages.md`, `S0-code.md`) for each medium sub-set - refuted under `E3` (*A population without differing rules is not a sub-set* / *Earned Exposure*): the four media share `S0`'s admission test, non-overlap balance, and one-rule-one-tool enforcement boundary, and differ only in the artifact medium they govern, which `S0` registers in `## Sub-sets` and `SC1`'s `medium` field partitions mechanically.

**Result, run `2026-11-13-wave2-r1-charter-stress-s0`.**\
`[MEASURED]` In the pre-registered paired run (`2026-11-13-wave2-r1-charter-stress-s0`, recorded under `0147`), `charter-stress.CS6` moved from `1.00` (`[1, 1, 1]`, `3` of `3` hedged) on `base` (`1b8745c3c1a3a8c710966571a61eb4438a9c717c`) to `2.00` (`[2, 2, 2]`, `0` of `3` hedged) on `head` (`e0e357515252ddba866380e36ae07ac7d722111e`), `s0` (`Q1`-`Q4`, `Q6`, `Q7`) scored `12.00` of `12` (`[2, 2, 2]` on every probe) on both arms, and in `OBSERVATIONS` all `3` `base` `charter-stress` readers (`r-9401c8`, `r-54759b`, `r-f40928`) flagged that `entities/E3-set.md` (`line 44`) cited `(as S0 registers medium sub-sets)` while `S0` had no `## Sub-sets` section on `base`, against `0` of `3` `head` readers after `0146` added `## Sub-sets` to `style/README.md` (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).\
`[MEASURED]` All `8` single-line mutants (`M6`-`M13`) across `tools/generate-index.mjs` (`lines 158, 165, 170, 175, 184 and 337`) and `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json` (`lines 384 and 401`) fail `tools/sets.test.sh` or `schemas/tests/catalog-entry/catalog-entry.test.mjs` by name (`scratch/mk8_mutants.log`).

**Correction, found in review, 2026-11-13.**\
`[MEASURED]` In `0146`'s initial text (`fae6e74a29597c73f1d21d222ebe4c88e3f1855a`), `style/S15-message-to-a-human.md`'s pre-edit sentence was at `line 42` (`line 43` after `0146` added `medium: messages` at `line 6`) and carried inline backticks and three relative markdown links (``One rule does not earn a sub-set of `style/`; a second single-medium rule would.`` -> ``With [`S17`](S17-source-comments-state-duty-and-why.md) (`code`) admitted alongside `S15` (`messages`), [`S0`](README.md) partitions `style/` into Level 2 medium sub-sets via the `medium` frontmatter field ([`SC1`](../schemas/SC1-catalog-entry.md)).``), `schemas/` total test count rose from `360` at `6d32b96` to `361` after `0147` added `PC2`, `Source` line ranges for `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json` (`lines 179-188 and 375-412`), `schemas/tests/catalog-entry/catalog-entry.test.mjs` (`lines 125-132`), and `tools/sets.test.sh` (`lines 17-21 and 48-67` at `fae6e74a29597c73f1d21d222ebe4c88e3f1855a`) were off by `1`-`2` lines, and `scratch/mk8_mutants.log` at `fae6e74a29597c73f1d21d222ebe4c88e3f1855a` tested `6` `0146` mutants (`M8`-`M13` at `tools/generate-index.mjs` `lines 333, 334, 336 and 182` and `catalog-entry.schema.json` `lines 392 and 405-409`, as recorded in the coordinator's external `scratch/verdict_mk8-reader-r1.md` and `scratch/verdict_mk8-rigor-r1.md`) without mutating `tools/generate-index.mjs` `lines 158 and 184`.\
`[MEASURED]` In Round 2 (`af9a4c0`) and Round 3 (`3b78247`), `tools/sets.test.sh` (`70` to `104` lines, `+34` lines, `13` passing checks) asserts `[ "$rc" -ne 0 ]` on every refusal, tests `medium` refusal on `S0` (`style/README.md`), and tests `S90` (`medium: commits`, reading-held) rendering under `### Sub-set: commits` with `| reading |`, and together with `schemas/tests/catalog-entry/catalog-entry.test.mjs` (`133` lines) kills all `8` `0146` single-edit mutants (`M12`-`M17` across `tools/generate-index.mjs` `lines 333, 334, 336, 182, 158 and 184` in `tools/sets.test.sh`, and `M18`-`M19` across `schemas/catalog-entry/v1alpha1/catalog-entry.schema.json` `lines 392 and 404-409` in `schemas/tests/catalog-entry/catalog-entry.test.mjs`) in `scratch/mk8_mutants.log`.\
`[MEASURED]` At `4bf46b6f7fb925706f334c780391a1cef3c20ff7`, the first `Correction` banner under `0146` described `style/S15-message-to-a-human.md` `line 43` as carrying `"a relative markdown link"` (stripping the `S0` and `SC1` links and escaping inner backticks) and called `M11`-`M18` `"single-line mutants"` at `lines 392 and 405-409` instead of `"three relative markdown links"` and `8` `"single-edit mutants"` (`M12`-`M19`, with `M18`-`M19` at `lines 392 and 404-409` killed by `schemas/tests/catalog-entry/catalog-entry.test.mjs`); at `3b7824754028f6b6fca3c10f49602a90754e987a`, Round 3 recorded the held `S0` `hydrate-when` deferral (`style/README.md` `line 6`) in `docs/investigations/style-2026-11-13.md` (`line 56`) and `docs/BACKLOG.md` `B67` while placing that note inside the `fae6e74a29597c73f1d21d222ebe4c88e3f1855a` sentence and editing the `4bf46b6f7fb925706f334c780391a1cef3c20ff7` banner in place; and Round 4 aligns `docs/investigations/style-2026-11-13.md` (`lines 17, 18 and 56`) with `B67`'s positional gap numbering (gap 1 commit messages, gap 2 code names in `K27`, gap 3 code comments closed by `0145`, with `S4`/`S9` stated as the investigation's own finding).

**Source.**\
`[V, schemas/catalog-entry/v1alpha1/catalog-entry.schema.json lines 179-188 and 375-412; schemas/tests/catalog-entry/catalog-entry.test.mjs lines 125-132; style/README.md lines 6, 8, 59-68 and 155-191; style/S15-message-to-a-human.md lines 6 and 43; tools/generate-index.mjs lines 143-193 and 327-343; tools/sets.test.sh lines 16-104; tools/README.md lines 117-118 and 446-456; docs/investigations/style-2026-11-13.md lines 17, 18 and 56; docs/BACKLOG.md B39 and B67; docs/DECISIONS.md 0054, 0139, 0140, 0145 and 0147]`

### 0147

**Ruling.**\
`PC2` (`practices/PC2-check-the-splits-that-favour-you.md` - *Check the splits that favour you - inspect passing and generous cells with the same scrutiny as failing ones*) is admitted to `practices/` under `M13` (`B61` gap 2), raising `practices/` from `1` to `2` active members across `2` moments of work and closing `B136`; `docs/investigations/practices-2026-11-13.md`, `docs/investigations/rules-2026-11-13.md`, and `docs/investigations/methods-2026-11-13.md` record the Wave 2 `PC0`, `RU0`, and `M0` `M12` territory-stress investigations; and `docs/evals/charter-stress/suite.json` (`CS6`) and `docs/evals/s0/suite.json` (`Q4`) are registered for `B29` key review and paired `M2` execution.

**Ratified.**\
`[DIRECTOR]` Approved by the director on 2026-11-13 (5-Wave Recursive Corpus-Wide Hillclimbing Programme `GOAL.md`, Wave 2 `mk8`).\
`[MEASURED]` At `6d32b96`, `practices/` (`PC0`) held `1` active member (`PC1-author-from-exemplar.md` at `Entering`) and sat on the root charter's single-occupant retirement threshold (`B136`, `docs/investigations/layers-2026-11-12.md` Pass 3).\
`[MEASURED]` Running `PC0`'s territory-stress pass (`docs/investigations/practices-2026-11-13.md`, `40` lines) across the six moments of work and `AGENTS.md` sections 5.1-5.5 (`SC2`), `docs/DECISIONS.md` (`AR4`), and `docs/BACKLOG.md` (`AR5`, `B61`) filtered out candidates that leave a trace (`"Measured or inferred"` -> `rules/` `B63` gap 3; `"Write the predicate before you defend it"` -> `rules/` / `W5`) or produce a handover record (`B18` -> `methods/` `B59` gap 3), and identified `PC2` (*Check the splits that favour you*) at `Verifying` as a trace-free practice (`M0` question 5) backed by observed corpus evidence (`0042`, `0089`, `0119`, `0136` / `B129`, and `0141` / `B133`, plus unlanded mutation probes in `entry-body.test.sh` and `sets.test.sh`).\
`[MEASURED]` Running `RU0`'s (`docs/investigations/rules-2026-11-13.md`, `44` lines) and `M0`'s (`docs/investigations/methods-2026-11-13.md`, `50` lines) territory-stress passes confirmed that all `4` active rules (`RU1`..`RU4`) have their declared `trace` read by review or by `tools/check-decisions.mjs` / `tools/check-board.mjs`, and `0` of `9` active procedures (`M1`, `M2`, `M7`..`M13`) are orphaned in the citation graph (`11` of `26` work-types cite `methods`), while holding the remaining `B63` (`6` gaps) and `B59` (`4` gaps) candidates for Wave 3 (`mk9`) and Wave 4 (`mk10`).

**Test, fixed before any reader runs.**\
`[ARGUED]` Before running `tools/eval.mjs prepare` (`M2` rule 1), launch a fresh `B29` key-auditor subagent holding `base` (`1b8745c3c1a3a8c710966571a61eb4438a9c717c`), `head` (this revision), and `docs/evals/charter-stress/suite.json` (`CS1` to `CS6`) and `docs/evals/s0/suite.json` (`Q1` to `Q4`, `Q6`, `Q7`), answering nothing, to audit the new `CS6` probe and updated `s0.Q4` key and commit any correction before `prepare`; then run `tools/eval.mjs prepare --suites charter-stress,s0 --readers 3` (`12` cold readers and `2` blind scorers across `base` and `head`, `main` unmerged) at `tolerance 0`, with `separation: NOT-CLAIMED` (`M2` rule 4, `B40`).

**Named costs.**\
`[MEASURED]` `practices/` grows from `1` to `2` active members (`practices/PC2-check-the-splits-that-favour-you.md`, `54` lines), `docs/investigations/` gains `3` dated investigations (`practices-2026-11-13.md` `40` lines, `rules-2026-11-13.md` `44` lines, `methods-2026-11-13.md` `50` lines), and `docs/evals/charter-stress/suite.json` grows by `6` lines (`38` to `44` lines, `6` probes).

**Alternatives refuted.**\
Folding `PC1` into `methods/` (`M13`) and retiring `practices/` (`PC0`) - refuted because `PC1` (*Author from exemplar*) and `PC2` (*Check the splits that favour you*) produce no result of their own (`M0` question 2) and leave no trace in the finished artifact when followed (`M0` question 4), so filing them in `methods/` or `rules/` would violate `M0`'s placement sequence and `RU0`'s `trace` contract (`SC1`).\
Filing `PC2` in `rules/` (`RU0`) - refuted because when a favourable evaluation cell or passing guard probe is re-read and found to hold, nothing in the finished artifact records that the favourable split was inspected (`PC0` *Traceless*).

**Result, run `2026-11-13-wave2-r1-charter-stress-s0`.**\
`[MEASURED]` Before `prepare` (`M2` rule 1), the fresh `B29` key auditor (`b286e97f-f811-4026-8ac6-26a54911e98d`, archived in the coordinator's external `scratch/mk8_b29_r1_audit.md`) audited `docs/evals/charter-stress/suite.json` (`CS1` to `CS6`) and `docs/evals/s0/suite.json` (`Q1` to `Q4`, `Q6`, `Q7`) against `base` (`1b8745c3c1a3a8c710966571a61eb4438a9c717c`) and `head` (`f3cb2170121382b7c92b437d569cc19dec13e559`) and returned two refinements (`CS3.rubric` noting that single-occupant retirement applies while the layer holds a single member whether or not `PC2` has since been admitted, and `CS6.key`/`CS6.rubric` aligning the four `tools/s17-source-comments.sh` checks with `s17-source-comments.sh` `lines 74-96` and making `style/README.md`'s index grouping consistent with full marks without requiring an unasked detail), both committed at `e0e357515252ddba866380e36ae07ac7d722111e` before `tools/eval.mjs prepare` ran.\
`[MEASURED]` Across all `12` probes (`24` max, `12` fresh cold readers and `2` fresh blind scorers across `base` `c-d112dc89` at `1b8745c3c1a3a8c710966571a61eb4438a9c717c` with digest `6004e668902469dee46153349c80ef188be4e2b438891a8d2bd6128ecec24861` and `head` `c-9c6eebad` at `e0e357515252ddba866380e36ae07ac7d722111e` with digest `74c205a7332769d34ebd78e183c90573a2149641d02d1a8ce90e2c3a320b8f81`), total score rose from `23.00` of `24` (`base`) to `24.00` of `24` (`head`) with `0` regressions at `tolerance 0` (`charter-stress`: `11.00` to `12.00` of `12`, with `CS1`-`CS5` at `2.00` `[2, 2, 2]` on both arms and `CS6` moving from `1.00` `[1, 1, 1]` on `base` to `2.00` `[2, 2, 2]` on `head`; `s0.Q1`-`Q4`, `Q6`, `Q7`: `12.00` of `12` `[2, 2, 2]` on both arms), `consistentHedges` on `charter-stress.CS6` cleared from `3` of `3` on `base` to `0` of `3` on `head`, and `0` export diffs against `git archive` (excluding stripped `docs/`), `0` writable files under `exports/c-*`, `prompts/`, `TASKS.md`, `scorers/` or `sealed/`, `0` outside file or shell tool calls in `reader_reach_audit.py`, and `0` forbidden-string hits with `12` of `12` reader and `2` of `2` scorer positive controls firing in `reader_transcript_scan.py` held (`separation: NOT-CLAIMED` under `M2` rule 4, `B40`).

**Correction, found in cold reading, 2026-11-13.**\
`[MEASURED]` In `2026-11-13-wave2-r1-charter-stress-s0`, all `3` `head` `charter-stress` readers (`r-2499f0`, `r-980d8c`, `r-5db3bb`) noted in `OBSERVATIONS` that `practices/README.md` (`PC0` `## Operation`, `line 63`) still read `"or, while the layer holds a single member, leave it a candidate for retirement under the root charter"` as a point-in-time statement after `PC2` raised `practices/` to two active members (`E4`); under `M11` sentence-by-sentence accounting for `practices/README.md` (`103` lines, every other sentence kept verbatim), `line 63` replaces `"while the layer holds a single member"` with `"if the layer holds a single member"` (and `docs/evals/charter-stress/suite.json` `CS3.key` and `CS3.rubric` at `lines 22-23` accept `"if or while the layer holds a single member"`).

**Correction, found in review, 2026-11-13.**\
`[MEASURED]` In `0147`'s initial text (`fae6e74a29597c73f1d21d222ebe4c88e3f1855a`, and in `practices/PC2-check-the-splits-that-favour-you.md:33`, `docs/investigations/practices-2026-11-13.md:16,29`, and `docs/BACKLOG.md:173` `B136`), `0042` (`rules/` vs `practices/` split), `0089` (`context-lab` vision), non-existent `0119` (`docs/DECISIONS.md` skips `0118`-`0120`), and `entry-body.test.sh` (preventive `fixture did not apply` guards in `0124`) were misattributed; they are replaced with verified records (`0136` / `B129` on `board.B3` capping valid `base` hedges on a cell `head` won, `0138` on `climb5_mutants.log` Mutant 2, `0140` on `eval.mjs export --rev` returning a `17.34`-of-`18` tie on identical arms, `0141` / `B133` on `gate.G1` capping valid answers across both arms of a tied cell, and `docs/audits/delta-2/stage-1.md` `line 29` on `sets.test.sh`), and `docs/evals/README.md` (`line 102`) cites `s17-source-comments.sh` `lines 74-130` (at `e0e357515252ddba866380e36ae07ac7d722111e`) rather than `lines 74-96`.\
`[MEASURED]` In `0147`'s initial text (`line 3235` at `fae6e74a29597c73f1d21d222ebe4c88e3f1855a`, now `line 3245`) and `docs/investigations/methods-2026-11-13.md`, `"0 of 9 active procedures are orphaned"` and `"11 of 26 work-types cite methods"` were unmeasured: programmatic measurement across all `174` portable entries shows that **`5` of `26`** work-types declare `methods:` in frontmatter (`W8: [M1]`, `W10: [M1]`, `W14: [M7]`, `W22: [M7]`, `W24: [M10]`, with `W23` at `line 37` citing `M7` in prose, `M13` listing `W3` in `related` while `W3` and `W20` declare no `methods:`, and `21` of `26` declaring no `methods:` in frontmatter, tracked under `B69` gap 2), and **`1` of `9`** active procedures (`M8-artifact-bootstrap.md`, `related: [PC1, AR0, AR6, A13]`) has `0` `M*` edges and `0` incoming citations from any portable entry (`M8` appears outside `docs/` only in `M8` itself, `M0`'s generated `## Index`, and the generated root `INDEX.md`), which `docs/investigations/methods-2026-11-13.md` (`50` to `51` lines, `lines 16, 23, 29 and 38`) and `docs/BACKLOG.md` (`B59`, `5` gaps) now record; and `docs/investigations/rules-2026-11-13.md` (`lines 13-16`) quotes the exact verbatim `line 8` `trace:` strings from `rules/RU1`..`RU4`.\
`[MEASURED]` At `4bf46b6f7fb925706f334c780391a1cef3c20ff7`, the first `Correction` banner under `0147` listed `"0050, 0124, 0136 / B129, 0138, 0141 / B133, and docs/evals/README.md *Suite edits* lines 110 and 124"` as verified `PC2` records, cited unqualified `"line 3235"`, and omitted `W23` `line 37`, `M13`'s `related: [W3]` edge, and the generated root `INDEX.md` from the `M8` occurrence note; at `3b7824754028f6b6fca3c10f49602a90754e987a`, Round 3 edited that banner in place while `practices/PC2-check-the-splits-that-favour-you.md:33`, `docs/investigations/practices-2026-11-13.md:16,29`, `docs/BACKLOG.md:173` (`B136`), and `0147` (`line 3263`) still cited `docs/evals/README.md` *Suite edits* for `system-boundary` (found from a flagged regression on the post-change arm in `docs/audits/M5.5h-01-bypassed-interface.md` `lines 51-56`) and `practices/PC2-check-the-splits-that-favour-you.md:33` grouped `gate.G1` (`1.33/1.33` and `1/1` tie across both arms) under `base` hedges and called `0140`'s `17.34`-of-`18` tie an `"artificial full-marks tie"`; and at `209e50b5a5c5bb4aaa64c7befd0fdc4a82be5402`, Round 4 corrected those five locations while attributing the `gate.G1` and `"artificial full-marks tie"` clauses of this sentence to all five locations rather than `PC2:33` alone (`AR4`).

**Source.**\
`[V, practices/PC2-check-the-splits-that-favour-you.md; practices/README.md lines 63 and 97-103; docs/investigations/practices-2026-11-13.md; docs/investigations/rules-2026-11-13.md; docs/investigations/methods-2026-11-13.md; docs/audits/delta-2/stage-1.md line 29; docs/evals/charter-stress/suite.json lines 5, 22-23 and 37-42; docs/evals/s0/suite.json lines 5 and 28; docs/evals/README.md lines 102 and 139; docs/BACKLOG.md B59, B61, B63, B69 and B136; docs/DECISIONS.md 0136, 0138, 0139, 0140, 0141, 0145 and 0146]`


### 0148

**Ruling.**\
Dated [`M12`](../methods/M12-investigate-a-set.md) set investigations under `docs/investigations/` are temporary working material, git-ignored and untracked in the same manner as `docs/evals/runs/` and `docs/evals/human/runs/` (`0067`): only living roadmap, backlog, architecture, and decision artifacts (`docs/BOARD.md`, `docs/BACKLOG.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, active `docs/evals/` suites, and `docs/requests/` for open `MREQ` rows) belong in the published repository, while surviving gaps and rulings from an investigation are carried in `docs/BACKLOG.md` and `docs/DECISIONS.md` (amending `0071`, `0137`, `0138`, `0139`, `0143`, `0145`, and `0147`).

**Kind.**\
general - `README.md` (`line 199`) and `entities/E4-charter.md` (`line 129`) state that dated `M12` investigations in `docs/investigations/` are kept as working material with surviving gaps carried to `docs/BACKLOG.md`, `.gitignore` adds `docs/investigations/`, `docs/README.md` (`lines 71-73`) notes `investigations/` alongside `evals/runs/` as git-ignored working material, and `tools/entry-body.test.sh` and `tools/methods-view.test.sh` exclude `docs/investigations` from temporary test sandboxes.

**Ratified.**\
`[DIRECTOR]` Ruled directly by the director on 2026-11-13 (`"ignore the same way as evals, these are temporary working documents"` and `"the only items we should retain in docs are those that are key backlog or roadmap items that are important to the ongoing development of missionkit - not some dead scratch report"`).\
`[MEASURED]` Under `M11` sentence-by-sentence accounting for `README.md` (`217` lines, every other sentence kept verbatim), `line 199` replaces `"recorded as a dated analysis in docs/investigations/:"` with `"kept as local working material in docs/investigations/ with surviving gaps carried to [docs/BACKLOG.md](docs/BACKLOG.md):"` (`node tools/generate-architecture.mjs --check` passes with `0` diffs).

**Named costs.**\
`[MEASURED]` `25` tracked files under `docs/investigations/` (`16` `*-2026-10-04.md` files, `layers-2026-11-12.md`, and `8` `*-2026-11-13.md` files) are removed from the git index via `git rm -r --cached docs/investigations/` while remaining on local disk as working material.

**Alternatives refuted.**\
Keeping `docs/investigations/*-YYYY-MM-DD.md` committed in git (`0071`) - refuted by the director because dated set-investigation worksheets are temporary working documents whose durable outputs already live in the corpus entries, `docs/BACKLOG.md`, and `docs/DECISIONS.md`.

**Source.**\
`[V, director ruling 2026-11-13; .gitignore line 5; README.md line 199; entities/E4-charter.md line 129; docs/README.md lines 71-73; tools/entry-body.test.sh line 17; tools/methods-view.test.sh line 16; docs/DECISIONS.md 0067]`


### 0149

**Ruling.**\
`docs/` tracks only the five living project documents (`docs/README.md`, `docs/ARCHITECTURE.md`, `docs/BOARD.md`, `docs/BACKLOG.md`, `docs/DECISIONS.md`), the seven open `MREQ` request specifications (`docs/requests/mreq-1` to `mreq-3` and `mreq-5` to `mreq-8`) plus `docs/requests/README.md` (`8` files), and the thirty-six active `M2` suite definitions (`docs/evals/<suite>/suite.json`) plus `docs/evals/README.md` (`37` files, `50` tracked files in `docs/` total): `docs/audits/` (`90` files), `docs/DELTAS/` (`2` files), `docs/surveys/` (`3` files), `docs/evals/context-lab/` (`58` files), `docs/evals/human/` (`7` files), `docs/evals/standing/` (`1` file), and closed `docs/requests/{backlog-charter-retired,mreq-4-derive-the-layer-set,mreq-9-artifact-work-axis-binding,mreq-10-recurrence-tier-evidence}.md` (`4` files, `165` files total) are git-ignored and untracked from the repository (`amends 0067, 0088, 0137, 0148`).

**Kind.**\
project - `.gitignore` adds the historical `docs/` paths, `tools/check-guidance-placement.sh` inlines the `17` tested lines from `docs/evals/human/guidance-1/guidance-as-tested.txt` so the gate runs without `docs/evals/human/`, `docs/BOARD.md` (`lines 220-235`) and `docs/BACKLOG.md` (`lines 87, 92-93`) format closed-row references to untracked `audits/`, `DELTAS/`, and closed `requests/` paths as inline code spans so `tools/check-links.mjs` passes in a fresh clone, and `docs/README.md`, `docs/requests/README.md`, and `docs/evals/README.md` document the `50`-file tracked layout.

**Ratified.**\
`[DIRECTOR]` Ruled directly by the director on 2026-11-13 (`"We should untrack most of docs"`, `"Are evals tracked currently?"`, and `"AGree with recommended"`).

**Named costs.**\
`[MEASURED]` `165` historical and closed files under `docs/` (`90` in `docs/audits/`, `2` in `docs/DELTAS/`, `3` in `docs/surveys/`, `58` in `docs/evals/context-lab/`, `7` in `docs/evals/human/`, `1` in `docs/evals/standing/`, and `4` in `docs/requests/`) are removed from the git index via `git rm -r --cached` while remaining on local disk, reducing tracked files under `docs/` from `215` to `50`.

**Alternatives refuted.**\
Untracking `docs/evals/<suite>/suite.json` or open `docs/requests/mreq-*.md` (`Options 1-3`) - refuted because `tools/eval.mjs` needs the `36` active `suite.json` definitions to run `M2` in a fresh clone and open backlog rows `B45`-`B47` and `B49`-`B52` cite their full specifications in `docs/requests/`; keeping `docs/audits/`, `docs/DELTAS/`, `docs/surveys/`, `docs/evals/{context-lab,human,standing}/`, and closed `docs/requests/` tracked in git - refuted by the director because only living roadmap, backlog, architecture, decision, and active `M2` suite definitions belong in `docs/`.

**Source.**\
`[V, director ruling 2026-11-13; .gitignore lines 2-14; docs/README.md lines 68-84; docs/requests/README.md; docs/evals/README.md lines 24-28; docs/BOARD.md lines 220-235; docs/BACKLOG.md lines 87 and 92-93; tools/check-guidance-placement.sh lines 13-46; docs/DECISIONS.md 0067, 0088, 0137 and 0148]`
