# Index

**This is the mission-kit entry ledger.\
Read it before you act.**

Each row states a condition in the `Hydrate when` column.\
If a condition describes what you are about to do, read that entry before proceeding.

- Every entry that carries an ID appears here - this ledger is the complete list of them.
- Do not infer an entry's content from its title; open the file.
- Do not rely on recall of an entry read earlier in the session; read it again.
- More than one condition may match; read each that does.
- Scan every section. A condition can match from a layer you did not expect to be in, and the headings are an aid to reading rather than a filter to narrow by.

One section per layer, in the order the [charter](README.md#mechanics) lists them.\
Each section opens with that layer's charter at the `0` slot of its prefix - `A0`, `R0`, `D0` and so on.\
Read a charter when your work spans a whole layer rather than a single entry, or when you are deciding which layer a new entry belongs in.

A section states its layer once, in the heading, rather than in every row.\
`layer`, `category` and `prefix` are three names for related but distinct things, defined in [`E2`](entities/E2-layer.md).\
`Status` appears only in sections holding an entry that is not `active`.

Links below are relative to the repository root.\
Resolve them against a local mission-kit checkout when you have one, otherwise fetch from `https://raw.githubusercontent.com/apnex/mission-kit/main/`.

Layers that carry no ID prefix hold mechanism rather than knowledge, so they appear in no ledger.\
They are listed once, with the concern each owns, in the [charter](README.md#mechanics).\
This file described them a second time and the copy had already drifted, naming a tool that no longer exists.

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
## Axioms

| ID | Title | Hydrate when |
|---|---|---|
| [A0](axioms/README.md) | Axioms - standing commitments, what brings one into force, and how they compose | You are deciding whether a principle is a standing commitment or a situated move, or which axioms bind the system in front of you |
| [A1](axioms/A1-sovereign-state-transparency.md) | Sovereign State Transparency | You cannot see the current state of the system from one place and are about to infer it |
| [A2](axioms/A2-isomorphic-specification.md) | Isomorphic Specification | Declared intent and running reality have drifted, or you are about to change one without the other |
| [A3](axioms/A3-sovereign-composition.md) | Sovereign Composition | You are deciding whether a concern belongs behind a new boundary or an existing one |
| [A4](axioms/A4-zero-loss-knowledge.md) | Zero-Loss Knowledge | You are about to summarise an artifact rather than carry it forward whole |
| [A5](axioms/A5-perceptual-parity.md) | Perceptual Parity | An agent is about to act on state it derived rather than state it was given |
| [A6](axioms/A6-frictionless-agentic-collaboration.md) | Frictionless Agentic Collaboration | You are designing a seam between two agents that must collaborate without a human relay |
| [A7](axioms/A7-resilient-agentic-operations.md) | Resilient Agentic Operations | You are deciding how the system should behave when a unit of work fails or a thread stalls |
| [A8](axioms/A8-gated-recursive-integrity.md) | Gated Recursive Integrity | You are about to promote something past a gate, or deciding what the gate must prove |
| [A9](axioms/A9-chaos-validated-deployment.md) | Chaos-Validated Deployment | You are about to trust a deployment you have not seen survive failure |
| [A10](axioms/A10-autopoietic-evolution.md) | Autopoietic Evolution | Friction has surfaced during work and you are deciding whether to route around it or fix its cause |
| [A11](axioms/A11-cognitive-minimalism.md) | Cognitive Minimalism | You are about to have an agent do work that deterministic code could do instead |
| [A12](axioms/A12-precision-context-engineering.md) | Precision Context Engineering | You are assembling the context for an invocation and deciding what earns its place |
| [A13](axioms/A13-director-intent-amplification.md) | Director Intent Amplification | You are about to consume the director's attention, or to decide something in their absence |
| [A14](axioms/A14-compounding-learning.md) | Compounding Learning | You have learned something during work and are deciding whether to capture it |

---

## Roles

| ID | Title | Hydrate when |
|---|---|---|
| [R0](roles/README.md) | Roles - the M axis (pure essence + type-determined authority) | You need to know which role may attest, approve or decide on a piece of work |
| [R1](roles/R1-architect.md) | architect - authority over system shape | You are ruling on system shape and need to know what an architect may decide alone |
| [R2](roles/R2-engineer.md) | engineer - make it real | You are building, and need to know what an engineer may attest to about their own work |
| [R3](roles/R3-verifier.md) | verifier - independent adversarial assurance | You are sealing a gate and need to know what independence the verifier must hold |
| [R4](roles/R4-director.md) | director - intent source and ratification authority | You are about to claim authority that only the director holds |

---

## Domains

| ID | Title | Hydrate when |
|---|---|---|
| [D0](domains/README.md) | Domains - the N axis (subject-surfaces, bimodal freedom) | You are placing a piece of work on the domain axis and need the subject surfaces |
| [D1](domains/D1-delivery-code.md) | delivery-code - the product/service codebase | You are changing the product or service codebase itself |
| [D2](domains/D2-distribution.md) | distribution - release channels and the rollout plane | You are changing how a release reaches its consumers |
| [D3](domains/D3-tooling-harness.md) | tooling-harness - the launch/runtime harness | You are changing the harness that launches or hosts the runtime |
| [D4](domains/D4-authority-governance.md) | authority-governance - the governance/authority substrate | You are changing who holds authority or how governance is enforced |
| [D5](domains/D5-coordination-substrate.md) | coordination-substrate - the WorkGraph/lifecycle/messaging machinery | You are changing the machinery that coordinates work between agents |
| [D6](domains/D6-knowledge-methodology.md) | knowledge-methodology - the durable knowledge capital | You are changing the durable knowledge the organisation keeps |

---

## Work-types

| ID | Title | Hydrate when |
|---|---|---|
| [W0](work-types/README.md) | Work-types - the composition rule, the canonical closeability preflight, and the entry schema | You are classifying a unit of work and need the composition rule or the closeability preflight |
| [W1](work-types/W1-build-a-slice.md) | build-a-slice - implement a scoped increment | You are scoping the implementation of a bounded increment |
| [W2](work-types/W2-fix-a-bug-or-repair.md) | fix-a-bug-or-repair - resolve a filed defect | You are resolving a defect that has already been filed |
| [W3](work-types/W3-retire-or-hard-cut.md) | retire-or-hard-cut - delete a surface with disposition | You are deleting a surface and must say what happens to what depended on it |
| [W4](work-types/W4-validate-locally.md) | validate-locally - self-check a fresh artifact | You have a fresh artifact and are self-checking it before anyone else sees it |
| [W5](work-types/W5-author-guard-or-falsifier-tests.md) | author-guard-or-falsifier-tests - add a test that can fail | You are adding a test that is able to fail |
| [W6](work-types/W6-merge-and-land.md) | merge-and-land - land an approved change on canonical main | You are landing an approved change on the canonical branch |
| [W7](work-types/W7-publish-deploy-or-canonicalize.md) | publish-deploy-or-canonicalize - ship to the estate/channel | You are shipping something to the estate or a release channel |
| [W8](work-types/W8-verify-gate-reactive.md) | verify-gate-reactive - independently gate a build/change | You are gating a build or change that you did not author |
| [W9](work-types/W9-audit-a-surface.md) | audit-a-surface - bounded adversarial sweep of a surface | You are sweeping a bounded surface adversarially rather than reviewing a diff |
| [W10](work-types/W10-adversarial-design-review-upstream.md) | adversarial-design-review-upstream - critique a design before build/merge | You are critiquing a design before it is built or merged |
| [W11](work-types/W11-run-a-live-probe-or-smoke.md) | run-a-live-probe-or-smoke - observe live behavior at a revision | You need to observe live behaviour at a specific revision |
| [W12](work-types/W12-meta-validate-dogfood.md) | meta-validate-dogfood - use the deliverable as its own test | You are using a deliverable as its own test |
| [W13](work-types/W13-code-owner-approve.md) | code-owner-approve - non-author independence approval | You are approving as a code owner who did not write the change |
| [W14](work-types/W14-design-a-contract-or-invariant.md) | design-a-contract-or-invariant - author a design-of-record | You are authoring a design of record, a contract or an invariant |
| [W15](work-types/W15-convene-a-council.md) | convene-a-council - multi-lens deliberation + synthesis | You need several lenses deliberated and synthesised before deciding |
| [W16](work-types/W16-bank-idea-or-knowledge-capital.md) | bank-idea-or-knowledge-capital - capture reusable capital | You have reusable capital in hand and are capturing it |
| [W17](work-types/W17-author-closeout-packet.md) | author-closeout-packet - proof-level arc closeout | You are closing an arc and must assemble proof rather than narrative |
| [W18](work-types/W18-seed-a-blueprint-arc.md) | seed-a-blueprint-arc - instantiate a WorkGraph arc | You are instantiating a staged arc from a blueprint |
| [W19](work-types/W19-drive-an-arc.md) | drive-an-arc - operate an arc over its lifetime | You are operating an arc across its lifetime rather than a single node |
| [W20](work-types/W20-reconcile-ledger.md) | reconcile-ledger - reconcile entity/backlog state vs truth | Entity or backlog state has diverged from truth and you are reconciling it |
| [W21](work-types/W21-arc-repair.md) | arc-repair - repair a WorkGraph arc topology | An arc topology is wrong and you are repairing it in place |
| [W22](work-types/W22-axiom-alignment-gate.md) | axiom-alignment-gate - per-item axiom-alignment check | You are checking a single item against the axioms it claims to satisfy |
| [W23](work-types/W23-capture-decision-and-ratify.md) | capture-decision-and-ratify - record + ratify a decision | You are recording a decision and having it ratified |
| [W24](work-types/W24-director-walkthrough.md) | director-walkthrough - live Director sensemaking walkthrough | You are walking the director through something live for sensemaking |
| [W25](work-types/W25-backstop-a-prod-window.md) | backstop-a-prod-window - hold abort/rollback over a risk window | You are holding abort or rollback authority across a risk window |
| [W26](work-types/W26-reset-or-converge-the-fleet.md) | reset-or-converge-the-fleet - restore fleet to a healthy state | The fleet is unhealthy and you are restoring it to a known state |

---

## Methodology

| ID | Title | Hydrate when |
|---|---|---|
| [M0](methodology/README.md) | Methodology - how work is conducted, as against how artifacts are written | You are choosing how to run a review, audit or deferral, or you need to know whether a rule belongs here or in style |
| [M1](methodology/M1-triangulated-review.md) | Triangulated review - minimum 4 independent inputs | You are reviewing a patch or design that ships to production or upstream |
| [M2](methodology/M2-test-drive-docs-by-execution.md) | Test-drive docs by execution | You are about to ship an operator-facing workflow document to someone who will run it |
| [M3](methodology/M3-default-reject-honest-yield.md) | Default-reject discipline + honest yield reporting | You are running an improvement sweep, refactor programme or audit cycle |
| [M4](methodology/M4-frozen-history-rule.md) | Frozen-history rule | You are making a policy change that would rewrite artifacts recorded before it |
| [M5](methodology/M5-anti-amnesia-deferral.md) | Anti-amnesia deferral - every parked or cut item carries a revival trigger | You are parking, cutting or marking won't-do on a unit of tracked work |
| [M6](methodology/M6-author-from-exemplar.md) | Author from exemplar - read a peer instance before adding to a collection | You are about to add an entry to a curated collection |
| [M7](methodology/M7-axiom-alignment-audit.md) | Axiom alignment audit - required gate for extensive planning/design | You are judging whether a design decision is anchored to a first principle |

---

## Style

| ID | Title | Hydrate when |
|---|---|---|
| [S0](style/README.md) | Style - how artifacts are written, and which rules a script can hold | You are about to write or edit a document another agent will read, or you need to know whether a convention can be mechanically enforced |
| [S1](style/S1-prereqs-explicit-cluster-agnostic.md) | Prerequisites explicit + cluster-agnostic + assumes authenticated tooling | You are authoring a workflow document that drives shared infrastructure |
| [S2](style/S2-runnable-commands-in-code-blocks.md) | Runnable workflow steps belong in code blocks | You are writing a document that asks the reader to execute a step |
| [S3](style/S3-producer-consumer-doc-split.md) | Producer / consumer doc split | You are documenting a component that another repository consumes |
| [S4](style/S4-four-journey-readme.md) | Four-journey README | You are writing or restructuring the top-level README of an operator-facing project |
| [S5](style/S5-no-version-pins-in-prose.md) | No version pins in user-facing prose | You are about to name a version, date or other point-in-time identifier in prose |
| [S6](style/S6-one-sentence-per-line.md) | One sentence per line (semantic line breaks) | You are about to write or edit markdown prose that someone else will read |
| [S7](style/S7-alternative-paths-separate-blocks.md) | Alternative paths in separate code blocks under subsections | You are documenting two or more alternative paths the reader must choose between |
| [S8](style/S8-code-block-comments-not-prose.md) | Code-block comments are for what-the-line-does, not prose substitutes | You are about to put explanatory text inside a code block |
| [S9](style/S9-action-first-readme-structure.md) | Action-first README structure | You are deciding what a reader meets first at the top of a README |
| [S10](style/S10-horizontal-rule-between-h2-sections.md) | Horizontal rule between top-level sections in long-form docs | You are writing a document you expect to grow past five top-level sections |
| [S11](style/S11-technical-identifiers-use-backticks.md) | Technical identifiers in prose use backticks | You are about to mention a command, path, flag or other literal name in prose |
| [S12](style/S12-code-block-introducer-own-paragraph.md) | Code-block introducer is its own paragraph | You are about to introduce a code block with a sentence |
| [S13](style/S13-plain-ascii-in-markdown.md) | Plain ASCII in markdown - typeable characters only | You are about to type a character you could not produce on a standard keyboard |
| [S14](style/S14-hydration-triggers-state-a-condition.md) | Hydration triggers state a condition, not a topic | You are adding a catalogue entry, or reviewing one that has never routed anyone |

---

## Patterns

| ID | Title | Hydrate when |
|---|---|---|
| [P0](patterns/README.md) | Patterns - recurring solution shapes, and what separates one from a single good design | You are reaching for a known solution shape, or you are deciding whether a design you just built recurs widely enough to be one |
| [P1](patterns/P1-path-a-path-b-dual-substrate.md) | Path A / Path B labeling for dual-substrate workflows | You are authoring a workflow document that supports more than one execution path |
| [P2](patterns/P2-node-label-gate-cross-component-contracts.md) | Node-label gate for cross-component contracts | You have producer and consumer components co-scheduled onto the same nodes |
| [P3](patterns/P3-twin-parity-by-generation.md) | Twin-parity by generation - one master, generate the other, gate the round-trip | You have a spec and data, or a view and source, that must not disagree |
| [P4](patterns/P4-neutral-core-tenant-composition.md) | Neutral core + tenant composition - shared mechanism, injected semantics, promote down by evidence | A second domain is about to grow a mechanism the first already has |
| [P5](patterns/P5-verbs-as-data-surface.md) | Verbs-as-data surface - one manifest drives dispatch, docs, and validation | You are designing a tool surface where each operation needs its own contract |

---

## Skills

| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [K0](skills/README.md) | Skills - executable capability, the stub-and-body split, and composition by edge | active | You are adding or invoking an executable capability, or you need to know why a skill is two files rather than one |
| [K1](skills/K1-history-content-scrub.md) | History content scrub | active | You must remove content from history that is already committed |
| [K2](skills/K2-publishing-rewritten-history.md) | Publishing rewritten history | active | You are about to force-push rewritten history that others may have consumed |
| [K3](skills/K3-substrate-audit.md) | substrate-audit - code-grounded substrate audit | active | You are auditing a substrate and must ground every claim in its source |
| [K4](skills/K4-research-artefacts.md) | research-artefacts - discipline for producing persistent research outputs | active | You are producing a research output that must survive the session that made it |
| [K5](skills/K5-survey.md) | survey - stakeholder-intent capture before design commitment | active | Direction is still open and you are about to commit to a design |
| [K6](skills/K6-arc-lifecycle.md) | arc-lifecycle - operate staged work as a sovereign FSM-gated state engine | active | You are operating staged work whose gates must hold rather than be trusted |
| [K7](skills/K7-sysml-literacy.md) | sysml-literacy - read + understand SysML v2 (literacy base for SysML-anchored skills) | active | You are about to read a SysML v2 model and cannot yet parse it |
| [K8](skills/K8-model-a-state-machine.md) | model-a-state-machine - author an FSM/lifecycle in SysML v2 | active | You are modelling a lifecycle or state machine in SysML v2 |
| [K9](skills/K9-model-a-workflow.md) | model-a-workflow - author an ordered activity / workflow in SysML v2 | active | You are modelling an ordered activity or workflow in SysML v2 |
| [K10](skills/K10-model-a-component.md) | model-a-component - author a structural breakdown in SysML v2 | active | You are modelling a structural breakdown in SysML v2 |
| [K11](skills/K11-sysml-skill-builder.md) | sysml-skill-builder - build a SysML-anchored modelling skill (meta) | active | You are building a new SysML-anchored modelling skill |
| [K12](skills/K12-sysml-skill-tester.md) | sysml-skill-tester - verify a SysML-anchored modelling skill (meta) | active | You are verifying that a SysML-anchored modelling skill actually works |
| [K13](skills/K13-model-a-dependency-graph.md) | model-a-dependency-graph - author a DAG of typed nodes (ref edges) in SysML v2 | active | You are modelling a dependency graph of typed nodes in SysML v2 |
| [K14](skills/K14-model-a-constraint.md) | model-a-constraint - author a reusable boolean rule (constraint def) in SysML v2 | active | You are modelling a reusable boolean rule in SysML v2 |
| [K15](skills/K15-model-a-classification.md) | model-a-classification - author orthogonal enum classification axes in SysML v2 | active | You are modelling orthogonal classification axes in SysML v2 |
| [K16](skills/K16-model-an-arc.md) | model-an-arc - model an arc as a composed L2 system (composes the six primitives) | active | You are modelling a whole arc as a composed system rather than a single construct |
| [K17](skills/K17-sysml-skill-evaluator.md) | sysml-skill-evaluator - measure a SysML skill's leverage vs the base model (meta) | active | You need to know whether a SysML skill beats the base model, and by how much |
| [K18](skills/K18-workgraph-arc-operator.md) | workgraph-arc-operator - execute and manage a Hub WorkGraph arc | active | You are executing or managing an arc on the coordination substrate |
| [K19](skills/K19-workgraph-blueprint-author.md) | workgraph-blueprint-author - author valid Hub WorkGraph blueprints | draft | You are authoring a blueprint that the substrate must accept |
| [K20](skills/K20-workgraph-lease-discipline.md) | workgraph-lease-discipline - operate WorkGraph leases and liveness | draft | You are holding a lease and must keep liveness rather than assume it |
| [K21](skills/K21-workgraph-verification-gates.md) | workgraph-verification-gates - exact independent WorkGraph PASS/FAIL gates | active | You are gating a build and the pass or fail must be exact and independent |
| [K22](skills/K22-workgraph-pr-delivery.md) | workgraph-pr-delivery - exact source-to-live proof under WorkGraph control | active | You must prove a change reached live, not merely that it merged |
| [K23](skills/K23-workgraph-arc-closeout.md) | workgraph-arc-closeout - terminal proof reconciliation for WorkGraph arc closeout | active | You are closing an arc and must reconcile terminal proof |
| [K24](skills/K24-workgraph-recovery.md) | workgraph-recovery - immutable-lineage recovery for stopped/failed/revised arcs | active | An arc has stopped, failed or been revised and you are recovering it |
| [K25](skills/K25-workgraph-arc-participant.md) | workgraph-arc-participant - act inside a Hub WorkGraph arc | active | You are acting inside an arc someone else is driving |
| [K26](skills/K26-workgraph-arc-planning.md) | workgraph-arc-planning - bounded intent-to-design-seal planning arc | active | You are planning from intent to a sealed design under a bounded arc |
| [K27](skills/K27-write-discoverable-code.md) | write-discoverable-code - name and structure code so plain-text search resolves it in one hit (vendored, MIT) | active | You are naming anything another agent must find by plain-text search |
| [K28](skills/K28-asd-ste100-verifier.md) | asd-ste100-verifier - audit and enforce ASD-STE100 Simplified Technical English, with a runnable engine | active | You are writing documentation that must be readable by a non-native English speaker |

---

## Entities

| ID | Title | Hydrate when |
|---|---|---|
| [E0](entities/README.md) | Entities - precise definitions of load-bearing terms, and what earns one | You are about to define a term the corpus leans on, or two readers could act differently on the same sentence |
| [E1](entities/E1-sovereign-hierarchy.md) | sovereign-hierarchy - layered authority where each layer holds final say over one class of decision | You are deciding which layer owns a decision, or an actor is about to decide something at another layer's altitude |
| [E2](entities/E2-layer.md) | layer - a top-level directory owning one concern, and the three names a knowledge layer answers to | You are deciding which layer owns an entry, or you have met the words layer, category and prefix and cannot tell whether they name one thing or three |

---

## Components

| ID | Title | Hydrate when |
|---|---|---|
| [C0](components/README.md) | Components - sovereign shareable substrates to be used rather than rebuilt | You are about to build a capability that may already exist as a unit you could depend on instead |
| [C1](components/C1-agp.md) | AGP - name-addressed routing between application components | Parts of your application must reach each other and you are about to write the code that connects them |

---

## Artifacts

| ID | Title | Hydrate when |
|---|---|---|
| [AR0](artifacts/README.md) | Artifacts - the engineering lifecycle loop, and what earns a document type | You are deciding which engineering document a piece of work needs, or whether a shape deserves to be a type |
| [AR1](artifacts/AR1-system-architecture.md) | System architecture - one system, one altitude, one instant | You need to state where a system is or where it is going, and have the two be comparable |
| [AR2](artifacts/AR2-delta.md) | Delta - a declared, gated transition between two architecture states | You are about to change a system and need the change declared and its landing provable |
| [AR3](artifacts/AR3-board.md) | Board - the triaged graph of legal next moves, for director selection | You are deciding what to do next and want the choice reasoned rather than taken under local pressure |
| [AR4](artifacts/AR4-decision-record.md) | Decision record - one ruling, append-only, with what it affects | You are ruling on something that later work will be built on and must not be re-litigated |
| [AR5](artifacts/AR5-backlog.md) | Backlog - the durable record of what was not done, each row with a trigger | You are deferring, cutting or parking work and it must not become forgetting |
| [AR6](artifacts/AR6-vision.md) | Vision - the enduring purpose a programme is measured against | You need to say why a programme exists and what it must never become, and no document holds it |

---

## Backlog

| ID | Title | Hydrate when |
|---|---|---|
| [MREQ-0](backlog/README.md) | Backlog - deferred requests to run a future mission, each carrying a revival trigger | You are deferring or parking a unit of work and it must not quietly become forgetting |
| [MREQ-1](backlog/mreq-1-axiom-application-methodology.md) | Axiom-application methodology for non-code missions | You are applying axioms to a mission that produces no code |
| [MREQ-2](backlog/mreq-2-extend-the-corpus-work-type.md) | Work-type for extending the corpus itself | You are adding or retiring a layer and want the work claimable rather than hand-run |
| [MREQ-3](backlog/mreq-3-component-design-spec-altitude.md) | The component design and specification altitude | You need to specify one component's configuration and implementation and find no artifact type for it |
| [MREQ-4](backlog/mreq-4-derive-the-layer-set.md) | Deriving the layer set rather than declaring it in the generator | You are adding or renaming a layer and find the index generator must be edited before it will see it |
| [MREQ-5](backlog/mreq-5-retire-legacy-style-debt.md) | Retiring the legacy style debt that keeps the whole-corpus gate red | You need the whole-corpus style gate to be green rather than known-red before you can trust it |
| [MREQ-6](backlog/mreq-6-ledger-retrieval-strategy.md) | The retrieval strategy for a ledger that outgrows always-on context | You are deciding how the ledger reaches an agent once it no longer fits comfortably in always-on context |
| [MREQ-7](backlog/mreq-7-provenance-and-trust-vocabulary.md) | A provenance and trust vocabulary for an agent-maintained corpus | You need to know when an entry was last verified or who asserted it, and the corpus does not record either |
| [MREQ-8](backlog/mreq-8-delta-post-ratification-shape.md) | The post-ratification half of a delta, and whether its required sections are two shapes | You are recording what a delta produced after it was ratified and find the type specifies only its opening |
| [MREQ-9](backlog/mreq-9-artifact-work-axis-binding.md) | The binding between the work axes and the artifact layer | You are composing a unit of work and cannot tell from the corpus which document type it is supposed to produce |
| [MREQ-10](backlog/mreq-10-recurrence-tier-evidence.md) | The evidence a recurrence tier rests on, in a corpus that bars naming it | You need to know whether an artifact type's recurrence tier rests on wide evidence or on one instance, and the entry does not say |

---

## Schemas

| ID | Title | Hydrate when |
|---|---|---|
| [SC0](schemas/README.md) | Schemas - machine-verifiable entity contracts, validatable without a project runtime | You are defining or validating a structured entity and need its contract to hold without importing a runtime |
| [SC1](schemas/SC1-catalog-entry.md) | catalog-entry - the frontmatter every catalogue entry must satisfy | You are adding or changing a field in catalogue entry frontmatter |
| [SC2](schemas/SC2-standing-context.md) | standing-context - the frontmatter contract for an always-on standing-context document | You are authoring or validating the always-on document an agent loads at session start |
| [SC3](schemas/SC3-skill.md) | skill - the portable frontmatter contract for a skill body | You are authoring a portable skill body that a harness must route to |
| [SC4](schemas/SC4-question.md) | question - a process-neutral question definition with an ordered response variant | You are defining a question whose options and cardinality must validate deterministically |
| [SC5](schemas/SC5-context-frame.md) | context-frame - a process-neutral semantic context definition with ordered scope and givens | You are defining the bounded context a question or task is answered against |
| [SC6](schemas/SC6-entry-body.md) | entry-body - the body sections an entry of a given category must carry | You are defining or changing the body shape a category of catalogue entry must follow |
<!-- END GENERATED -->
