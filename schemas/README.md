# Mission Kit schemas

This directory owns cross-project, machine-verifiable entity contracts.
Each entity is a sovereign resource that can be understood and validated without importing a skill or project runtime.

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

`apiVersion` and `kind` select the domain contract.
The JSON Schema document's `$id` selects the validator contract.
`metadata` holds portable identity and machine-oriented labels or annotations.
`spec` holds all configuration that affects entity meaning or behaviour.
[`catalog.json`](catalog.json) maps resource identity to schema identity and its semantic validator.

Runtime observations do not belong in `spec`.
A kind only gains `status` when a real reconciler needs observed state.

## Question

`Question` is a process-neutral question definition.
It contains no Survey, round, Director, interpretation, or outcome-axis semantics.

The initial `v1alpha1` response variant is `Choice`.
Further response variants can be added as separately testable schemas and admitted through a later Question API contract.
`Choice` is bounded to sixteen ordered alternatives so its complete constraint system can be checked deterministically.
Larger searchable or paginated answer sets require a different response variant.

Question identity and presentation order are separate concerns.
`metadata.name` identifies a Question, while a composing process owns placement such as round and ordinal.

Respondent-visible information belongs in `spec`.
Labels and annotations must not carry text that a respondent needs in order to answer correctly.
Selection wording must be generated from `spec.response.cardinality`.
`spec.prompt.instruction` is reserved for non-derivable guidance and must not paraphrase cardinality.

Context fields are intentionally absent from `v1alpha1`.
Question-level, round-level, and survey-level context frames require a separate design decision.

## Composition

A process composes or snapshots a complete `Question` resource and owns its process-specific fields beside it.
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

## Validation

Install the local validation dependency and run the complete schema suite:

```bash
npm install
npm test
```

JSON Schema validates structure.
The versioned semantic validator checks ordered-array invariants that JSON Schema Draft 2020-12 cannot express:

- option IDs are unique;
- minimum selections do not exceed maximum selections;
- maximum selections do not exceed available options;
- constraints reference existing option IDs; and
- equivalent constraint sets are not duplicated; and
- at least one selection satisfies cardinality and every constraint.

A consumer must run structural validation before semantic validation.
Consumers can preload every schema listed in `catalog.json` to resolve absolute URN references without importing Survey.
JSON Schema `default` annotations do not mutate resource instances, so this contract does not use them as implicit configuration.

## Layout

```text
schemas/
├── catalog.json
├── common/
│   └── v1alpha1/
│       └── resource-metadata.schema.json
├── question/
│   └── v1alpha1/
│       ├── choice-response.schema.json
│       ├── question.schema.json
│       ├── question.validator.mjs
│       └── examples/
└── tests/
    ├── support/
    └── question/
```
