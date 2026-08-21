---
id: SC0
category: contract
title: Schemas - machine-verifiable entity contracts, validatable without a project runtime
status: active
hydrate-when: You are defining or validating a structured entity and need its contract to hold without importing a runtime
supersedes: []
related: [SC1, SC6, A2, A8]
---

# Mission Kit schemas

This directory owns cross-project, machine-verifiable entity contracts.\
Each entity is a sovereign resource that can be understood and validated without importing a skill or project runtime.

## Contracts

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
| [SC0](README.md) | Schemas - machine-verifiable entity contracts, validatable without a project runtime | active | You are defining or validating a structured entity and need its contract to hold without importing a runtime |
| [SC1](SC1-catalog-entry.md) | catalog-entry - the frontmatter every catalogue entry must satisfy | active | You are adding or changing a field in catalogue entry frontmatter |
| [SC2](SC2-standing-context.md) | standing-context - the frontmatter contract for an always-on standing-context document | active | You are authoring or validating the always-on document an agent loads at session start |
| [SC3](SC3-skill.md) | skill - the portable frontmatter contract for a skill body | active | You are authoring a portable skill body that a harness must route to |
| [SC4](SC4-question.md) | question - a process-neutral question definition with an ordered response variant | active | You are defining a question whose options and cardinality must validate deterministically |
| [SC5](SC5-context-frame.md) | context-frame - a process-neutral semantic context definition with ordered scope and givens | active | You are defining the bounded context a question or task is answered against |
| [SC6](SC6-entry-body.md) | entry-body - the body sections an entry of a given category must carry | active | You are defining or changing the body shape a category of catalogue entry must follow |
<!-- END GENERATED -->

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

## Question

`Question` is a process-neutral question definition.\
It contains no Survey, round, Director, interpretation, or outcome-axis semantics.

The initial `v1alpha1` response variant is `Choice`.\
Further response variants can be added as separately testable schemas and admitted through a later Question API contract.\
`Choice` is bounded to sixteen ordered alternatives so its complete constraint system can be checked deterministically.\
Larger searchable or paginated answer sets require a different response variant.

Question identity and presentation order are separate concerns.\
`metadata.name` identifies a Question, while a composing process owns placement such as round and ordinal.

Respondent-visible information belongs in `spec`.\
Labels and annotations must not carry text that a respondent needs in order to answer correctly.\
Selection wording must be generated from `spec.response.cardinality`.\
`spec.prompt.instruction` is reserved for non-derivable guidance and must not paraphrase cardinality.

Context fields are intentionally absent from `Question/v1alpha1`.\
A composing process associates a complete, separate `ContextFrame` resource without injecting context into the Question resource.

---

## ContextFrame

`ContextFrame` is a process-neutral semantic context definition.\
It carries an exact subject, purpose, included and excluded scope, classified givens, bounded authored synopsis, and term definitions.\
Its ordered arrays preserve authored order.

The synopsis is semantic content authored before projection; it is not generated or summarized by a renderer.\
Process placement, ancestry, execution authority, generation provenance, answers, and observed state remain outside the resource.

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

A consumer must run structural validation before semantic validation.\
Consumers can preload every schema listed in `catalog.json` to resolve absolute URN references without importing Survey.\
JSON Schema `default` annotations do not mutate resource instances, so this contract does not use them as implicit configuration.

---

## Layout

```text
schemas/
├── catalog.json
├── common/
│   └── v1alpha1/
│       └── resource-metadata.schema.json
├── context-frame/
│   └── v1alpha1/
│       ├── context-frame.schema.json
│       ├── context-frame.validator.mjs
│       └── examples/
├── question/
│   └── v1alpha1/
│       ├── choice-response.schema.json
│       ├── question.schema.json
│       ├── question.validator.mjs
│       └── examples/
└── tests/
    ├── context-frame/
    ├── question/
    └── support/
```
