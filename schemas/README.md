---
id: SC0
category: contract
title: Schemas - machine-verifiable entity contracts, validatable without a project runtime
status: active
hydrate-when: You are defining or validating a structured entity and need its contract to hold without importing a runtime
supersedes: []
related: [SC1, SC6, A2, A8, E4]
---

# Schemas - the machine-checkable layer

## Purpose

This set holds **cross-project contracts a machine can check**: each a schema that says what a valid instance of one kind of document looks like, validatable without importing a skill or a project's runtime.\
Prose states intent; a contract holds the part of it a machine can hold, so a malformed document is refused rather than read and believed.

---

## Territory

The contracts divide by **whose instances they govern**, and that is the denominator.

| Kind | Instances | Checked by | Members |
|---|---|---|---|
| **The corpus's own files** | documents this corpus is made of, held to their shape on every change | the gate, `tools/check-all.sh` | `SC1` catalogue frontmatter, `SC2` standing context, `SC3` skill bodies, `SC6` entry bodies |
| **Process resources** | documents a process writes - a question, the context it is answered against - neutral of any one process | their semantic validators, and the schema suite | `SC4` Question, `SC5` ContextFrame |
| **Lifecycle documents** | documents a project writes using a type this corpus defines - a board, a backlog, a decision record, a delta, a system architecture | none | **none - gap** |

Every contract sits in one row, and one row holds none.\
`SC2` and `SC3` are portable too - a standing context or a skill body can live anywhere - but their instances are documents of the kind this corpus is made of.

**Gaps the territory exposes.**\
Structured files this corpus relies on that no contract governs, each checked only by hand-written code in a tool or not at all: the evaluation suites and their results, the human-evaluation suites, `catalog.json` itself, and `bundles/*.yaml`.\
Lifecycle documents have no contract at all: the artifact types carry prose templates, and this corpus's own board and backlog are checked only by code in `tools/check-board.mjs`, so neither here nor in a consuming project can a machine refuse a malformed instance.\
`SC4` and `SC5` have no consumer yet; they are contracts ahead of their process.

---

## Resource convention

Resources follow a deliberately small Kubernetes-like envelope:
```yaml
apiVersion: schemas.mission-kit/v1alpha1
kind: Question
metadata:
  name: release-strategy
  labels: {}
  annotations: {}
spec: {}
```

`apiVersion` and `kind` select the domain contract.\
The JSON Schema document's `$id` selects the validator contract.\
`metadata` holds portable identity and machine-oriented labels or annotations.\
`spec` holds all configuration that affects entity meaning or behaviour.\
[`catalog.json`](catalog.json) maps resource identity to schema identity and its semantic validator.

Runtime observations do not belong in `spec`.\
A kind only gains `status` when a real reconciler needs observed state.

---

## Composition

A process composes or snapshots a complete `Question` resource and owns its process-specific fields beside it.\
It must not inject process fields into the Question resource.

For example, a future `SurveyQuestion` can contain:
```yaml
spec:
  question:
    apiVersion: schemas.mission-kit/v1alpha1
    kind: Question
    metadata: {}
    spec: {}
  survey:
    round: 1
    ordinal: 1
    intentDimension: deployment-geometry
```

This wrapper boundary keeps the neutral resource closed and prevents Survey evolution from changing the Question contract.

---

## Validation

Install the local validation dependency and run the complete schema suite:
```bash
npm install
npm test
```

JSON Schema validates structure.\
The Question semantic validator checks ordered-array invariants that JSON Schema Draft 2020-12 cannot express:

- option IDs are unique;
- minimum selections do not exceed maximum selections;
- maximum selections do not exceed available options;
- constraints reference existing option IDs;
- equivalent constraint sets are not duplicated; and
- at least one selection satisfies cardinality and every constraint.

The ContextFrame semantic validator rejects:

- duplicate included or excluded boundaries;
- a statement present in both included and excluded scope;
- duplicate given text, including text assigned different classifications; and
- duplicate terms, including terms assigned different meanings.

Duplicate comparison preserves exact authored string values; it does not case-fold, trim, or otherwise normalize semantic content.

A consumer must run structural validation before semantic validation, because each semantic validator assumes the shape the schema guarantees - it reads fields without first checking they exist.\
Consumers can preload every schema listed in `catalog.json` to resolve absolute URN references without importing Survey.\
JSON Schema `default` annotations do not mutate resource instances, so this contract does not use them as implicit configuration.

---

## Boundaries and composition

- **Against `entities/`:** an entity defines a term in prose; a contract makes a shape machine-checkable. A contract may enforce an entity's definition, and never replaces it.
- **Against `tools/`:** a tool runs a check; a contract is what the check holds a document to. Where a tool re-implements a contract by hand - `check-standing-context.sh` against `SC2` - the two can drift, and the contract is authoritative.
- **With entries:** a member entry carries the contract's catalogue placement only; the canonical contract is the schema file it names.
- **Between contracts:** one concern, one contract - catalogue frontmatter is one schema with per-category conditions, not a schema per layer. Contracts that must agree, such as `SC6`'s categories and `SC1`'s category list, are held together by a test.

---

## Faults

- **The unchecked contract.** A schema no check validates against; it reads as enforced and holds nothing.
- **Two contracts for one concern.** Two schemas for one kind of document, each authoritative, free to drift.
- **The drifting pair.** Two contracts that must agree, with nothing holding them together.
- **The unmapped resource.** A resource kind missing from `catalog.json`, so a consumer preloading the catalogue cannot resolve it. `EntryBody` is one today.
- **The contract ahead of its consumer.** A resource contract no process uses, maintained on speculation (`A3`'s earned exposure). `SC4` and `SC5` today.
- **The ungoverned file.** A structured file the corpus relies on that no contract governs, so its shape is whatever the last writer chose.

---

## Layout

```text
schemas/
├── catalog.json
├── catalog-entry/v1alpha1/     SC1 - catalogue frontmatter
├── standing-context/v1alpha1/  SC2 - standing context
├── skill/v1alpha1/             SC3 - skill bodies
├── question/v1alpha1/          SC4 - Question, its Choice response, validator, examples
├── context-frame/v1alpha1/     SC5 - ContextFrame, validator, examples
├── entry-body/v1alpha1/        SC6 - entry body shapes, and the declaration it governs
├── common/v1alpha1/            shared resource metadata
└── tests/                      one directory per contract, and shared support
```

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Hydrate when |
|---|---|---|
| [SC0](README.md) | Schemas - machine-verifiable entity contracts, validatable without a project runtime | You are defining or validating a structured entity and need its contract to hold without importing a runtime |
| [SC1](SC1-catalog-entry.md) | catalog-entry - the frontmatter every catalogue entry must satisfy | You are adding or changing a field in catalogue entry frontmatter |
| [SC2](SC2-standing-context.md) | standing-context - the frontmatter contract for an always-on standing-context document | You are authoring or validating the always-on document an agent loads at session start |
| [SC3](SC3-skill.md) | skill - the portable frontmatter contract for a skill body | You are authoring a portable skill body that a harness must route to |
| [SC4](SC4-question.md) | question - a process-neutral question definition with an ordered response variant | You are defining a question whose options and cardinality must validate deterministically |
| [SC5](SC5-context-frame.md) | context-frame - a process-neutral semantic context definition with ordered scope and givens | You are defining the bounded context a question or task is answered against |
| [SC6](SC6-entry-body.md) | entry-body - the body sections an entry of a given category must carry | You are defining or changing the body shape a category of catalogue entry must follow |
<!-- END GENERATED -->
