---
id: SC6
category: contract
title: entry-body - the body sections an entry of a given category must carry
status: active
hydrate-when: You are defining or changing the body shape a category of catalogue entry must follow
supersedes: []
related: []
---

# SC6 - entry-body

Canonical contract: [`entry-body/v1alpha1/entry-body.schema.json`](entry-body/v1alpha1/entry-body.schema.json).\
Declaration it governs: [`entry-body/v1alpha1/entry-body.json`](entry-body/v1alpha1/entry-body.json).

The body sections an entry of a given category must carry, in the order they must appear.\
[`SC1`](SC1-catalog-entry.md) governs frontmatter and stops at the closing marker; this governs everything below it.

One resource covers every governed category rather than one per category, because the concern is section conformance and splitting it would fork the mechanism into copies free to drift.\
A category absent from the declaration is ungoverned by design, which is a stated gap rather than a silent one.

The shape is data and the enforcement is `tools/check-entry-body.sh`, so adding a category is an edit to a JSON file rather than a change to a script.
