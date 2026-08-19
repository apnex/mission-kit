# Artifacts

The document types an engineering lifecycle produces, each with a schema, so a document is instantiated rather than reinvented.

An artifact entry defines a **type** of document: what it is for, what it must contain, who authors it, who accepts it, and what makes it unacceptable.\
It is `components/` for project-specific knowledge - the same anti-reinvention purpose, applied to what a project writes rather than what it builds.

## Why the layer exists

Document shapes were already being reused; they simply had no owner.\
At the time this layer was created they were scattered across six locations, each reachable only by someone who already knew it existed:
```text
_template.md                                              root
_template-standing-context.md                             root
skills/survey/round-1-template.md                         inside a skill
skills/survey/round-2-template.md                         inside a skill
skills/workgraph-arc-closeout/assets/closeout-packet-template.md
skills/workgraph-arc-planning/assets/dependency-matrix.md
```

A template living inside one skill is available to that skill.\
The second skill needing the same shape does not find it, and writes its own.

There is a second symptom in [`style/`](../style/README.md).\
`S3`, `S4` and `S9` specify document architecture while filed as conventions for how text is written.\
A four-journey README is an artifact type, not a style rule, and filing it as one makes it invisible to anyone deciding what document to produce.

---

## Type, not instance

This layer holds the type.\
Instances live in the project that produced them, and no completed document belongs here.

The distinction is the corpus admission test doing its work: a closeout packet's required shape is cross-project, while any particular closeout packet is the most point-in-time artifact a project owns.

---

## Coverage is the ambition

The layer is complete when every stage of the engineering lifecycle has a named document type - intake, survey, design, decision, build, verification, delivery, closeout, post-mortem - and no stage requires an author to invent a shape.

Coverage is a stated goal rather than a claim.\
Gaps are expected and should be visible as gaps rather than filled with speculative types nobody has needed, which would be Speculative Surface at document scale.

---

## Body shape

The shape is declared in [`SC6`](../schemas/SC6-entry-body.md) and enforced by `tools/check-entry-body.sh`, so this list is a reading of the contract rather than a second copy of it.

- **Purpose** - the decision or handover the document serves.
- **Lifecycle stage** - where it sits in the arc of work.
- **Required sections** - the schema, stated so conformance can be checked.
- **Authority** - who authors it and who accepts it, in the vocabulary of [`roles/`](../roles/README.md).
- **Acceptance falsifier** - the observation that makes an instance unacceptable, rather than prose about quality.
- **Template** - the reference an author instantiates.

---

## Faults

- **The template in the toolbox.** A deliverable shape buried inside one capability, so the next consumer forks a copy instead of finding it.
- **The style rule wearing an architecture.** Document structure enforced as a writing convention, invisible to anyone choosing what to produce.
- **The reinvented deliverable.** The same document authored from nothing each time, so no two instances can be compared and no reviewer knows what is missing.
- **The instance in the type layer.** A completed project document admitted as though it were a shape. It fails the admission test and dates immediately.
- **The unacceptable acceptance.** A type whose acceptance criterion is prose about quality rather than an observation, so nothing can fail it.

---

## Index

<!-- BEGIN GENERATED: entries. Run tools/generate-index.mjs; do not edit by hand. -->
| ID | Title | Status | Hydrate when |
|---|---|---|---|
<!-- END GENERATED -->
