---
id: SC4
category: contract
title: question - a process-neutral question definition with an ordered response variant
status: active
hydrate-when: You are defining a question whose options and cardinality must validate deterministically
supersedes: []
related: []
---

# SC4 - question

Canonical contract: [`question/v1alpha1/question.schema.json`](question/v1alpha1/question.schema.json).

a process-neutral question definition with an ordered response variant.\
This entry carries the catalogue placement only; the contract itself is the schema above, and it validates without importing this catalogue.

---

## The Question resource

Moved here from the schemas charter, `SC0`, when it was converted to `E4`; unchanged.

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
