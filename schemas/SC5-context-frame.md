---
id: SC5
category: contract
title: context-frame - a process-neutral semantic context definition with ordered scope and givens
status: active
hydrate-when: You are defining the bounded context a question or task is answered against
supersedes: []
related: []
---

# SC5 - context-frame

Canonical contract: [`context-frame/v1alpha1/context-frame.schema.json`](context-frame/v1alpha1/context-frame.schema.json).

a process-neutral semantic context definition with ordered scope and givens.\
This entry carries the catalogue placement only; the contract itself is the schema above, and it validates without importing this catalogue.

---

## The ContextFrame resource

Moved here from the schemas charter, `SC0`, when it was converted to `E4`; unchanged.

`ContextFrame` is a process-neutral semantic context definition.\
It carries an exact subject, purpose, included and excluded scope, classified givens, bounded authored synopsis, and term definitions.\
Its ordered arrays preserve authored order.

The synopsis is semantic content authored before projection; it is not generated or summarized by a renderer.\
Process placement, ancestry, execution authority, generation provenance, answers, and observed state remain outside the resource.
