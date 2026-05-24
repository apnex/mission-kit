# Feature taxonomy

Categories used to organise features within a substrate. They are **labels for
in-substrate organisation**, NOT abstractions across substrates. Two features
in the same category in two different substrates are NOT necessarily the same
feature — only crossprobe is allowed to assert equivalence.

## Memory-substrate domain taxonomy

Initial taxonomy for the memory-substrate domain (`kate/docs/memory/`):

| Category | Includes |
|---|---|
| **Storage** | Vector index, graph store, KV store, tiered (hot/warm/cold), hybrid (vec+graph) |
| **Derivation** | Background processing that creates new facts from observations: none, fact-extract, reflect, dialectic, consolidate |
| **Retrieval** | How information comes back out: semantic, lexical, temporal, hybrid, re-rank, personalized |
| **Lifecycle** | TTL, decay, merge, rewrite, archive, forget |
| **Surface** | REST API, language SDK, MCP server, library import, CLI |
| **Identity** | Per-user, per-session, per-peer, multi-tenant, anonymous |
| **Ops** | Deploy story, scale axis, backup, observability, migration |
| **Extensibility** | Plugins, hooks, custom embedders, model swap, custom retrievers |

## When to add a category

Add a new category when:

- You discover a feature that genuinely doesn't fit any existing category
  AND it's the kind of capability you expect to see in other substrates too
- A category is becoming a junk drawer (>5 features all called "Other") —
  split it

Don't add a category when:

- You're tempted to name it after the substrate ("HonchoCategory") — that's
  vocabulary contamination
- You only have one substrate's feature in it — wait until a second probe
  confirms the category is general

## Defining taxonomy for a new domain

The first nanoprobe in a new domain (e.g. inference engines, agent
frameworks) needs a taxonomy decision up front. Process:

1. **Survey the L1 landscape doc** for the domain. What axes do projects
   advertise? (e.g. for inference: model formats, quantization, batching,
   streaming, KV cache, attention impl).
2. **Draft 6-10 candidate categories.** Fewer than 6 = too coarse to be
   organisationally useful. More than 10 = you're predicting features
   before you have evidence.
3. **Record the taxonomy in the domain's index doc** (e.g.
   `kate/docs/inference/00-goals.md` or a sibling).
4. **Evolve as needed.** New categories added during subsequent probes get
   noted in the same index doc with a retrocompat note for the first probe.

## Anti-patterns

- **Naming a category after a feature** ("DialecticDerivation" instead of
  "Derivation"). Categories are buckets; features go in buckets.
- **Reusing the wrong domain's taxonomy.** Memory-substrate categories don't
  apply to inference engines. Don't copy-paste; design per-domain.
- **Sub-categories.** Keep it flat. If you want sub-classification, use the
  "Behaviour notes" section in the feature spec, not nested categories.
