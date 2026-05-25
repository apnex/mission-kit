# Substrate analysis lenses

A catalogue of reusable analytical questions that surface load-bearing
findings during a nanoprobe. Each lens is a question shape proven to
generate Tier 3 assessment entries during real probes. Apply them at the
end of each batch and at the closing pass — they catch things the
descriptive pass misses.

These are Tier 3 lenses — they produce interpretation, not description.
Use them in `04-assessment.md` reasoning, not in feature specs.

## Lens 1 — The writer-cadence model

**Question:** How many distinct producers write to the substrate's
primary store, and on what cadence?

For any system that accumulates state (memory substrates, event stores,
caches, aggregations), enumerate every code path that *writes* and
classify each by cadence:

| Cadence | Trigger | Cost shape | Typical examples |
|---|---|---|---|
| **Per-event** | Every input event | Cheap, predictable per-event | Message ingestion, log writes |
| **Triggered** | Background condition (threshold, schedule, surprisal) | Expensive but bounded, asynchronous | Periodic compaction, dreamer cycles, ML re-training |
| **Per-query** | Query-time opportunistic | LLM-discretion-bounded, unbounded worst case | Agent tool calls that mutate state |

**Why this matters:**
- Reveals whether read and write are separable concerns (per-query writers
  mean queries mutate — auditability and cost analysis must account for
  this)
- Surfaces evaluation hazards (a benchmark that queries immediately after
  writes misses triggered writers entirely)
- Maps cost: per-event writers dominate steady-state cost; triggered
  writers dominate peak cost; per-query writers introduce variance

**Worked example (Honcho probe):** three writers (deriver: per-event;
dreamer: triggered; dialectic: per-query). The per-query writers (dialectic
write tools) were the load-bearing finding — they make Honcho's dialectic
chat fundamentally different from "retrieve, then synthesise" agent
patterns. Without this lens, the architectural commitment would have stayed
buried in `agent_tools.py`.

## Lens 2 — The provenance chain

**Question:** Can a higher-order artefact be traced back to its source
inputs through the data model alone?

For any system that produces derived artefacts (summaries, observations,
inferences, embeddings), check whether each derived artefact carries a
schema-level link to its premises:

- **Provenance-by-construction** — derived artefact stores
  `source_ids: list[ID]` (or equivalent) as a database column. Trace is
  mechanical, no log-scraping required.
- **Provenance-by-log** — derivation is logged but not modelled. Trace
  requires reconstructing the log timeline.
- **No provenance** — derived artefact stands alone. Auditability is
  whatever the original prompts captured in their output.

**Why this matters:**
- Determines whether "auditable memory" / "explainable inference" claims
  are structurally supported or aspirational
- Reveals the maximum depth of "why did the system believe X?" queries

**Worked example (Honcho probe):** `Document.source_ids` is a real column
populated by deriver and dreamer specialists. Higher-order observation →
source_ids → explicit observation → `message_ids` metadata → source
messages. Three-hop chain, schema-supported. Resolved an open assessment
(A17) and made G3 (auditable memory) verifiable rather than promised.

## Lens 3 — The abstraction-completeness check

**Question:** When the codebase claims a pluggable abstraction, how many
implementations exist and how broad is the contract?

- **Genuinely pluggable** — ≥2 substantial implementations of the ABC
  (each non-trivial LOC), contract is broad, application code never
  branches on backend type
- **Theoretically pluggable** — ABC exists but only one implementation,
  or contract is narrow, or application code has backend-specific paths
- **Pluggable plus escape hatch** — ABC for some backends, special
  code path for an embedded/native backend (often the most pragmatic
  shape)

**Why this matters:**
- "Pluggable" in docs ≠ pluggable in practice
- Special-case backends (e.g. pgvector inside the primary database) often
  exist outside the ABC and need separate characterisation
- The strictest backend's constraints typically shape the abstraction
  uniformly — worth naming when it happens

**Worked example (Honcho probe):** VectorStore ABC with two external
implementations (LanceDB 405 LOC, Turbopuffer 367 LOC) — genuinely
pluggable. Plus a third "escape hatch" — pgvector inside Postgres,
not through the ABC. Namespace strategy uniformly hashed because
Turbopuffer (the stricter backend) enforces `[A-Za-z0-9-_.]{1,128}`.

## Lens 4 — The classification smell

**Question:** Does the directory layout match the conceptual layout?

When a large, substantial file lives in `utils/`, `helpers/`, `lib/`,
or any generic-named directory while smaller peer subsystems have their
own top-level directories, that's a classification smell. The file's
behaviour is at-odds with its filing.

**Why this matters:**
- Surfaces internal architecture drift — the project's mental model
  hasn't caught up with its implementation
- Prevents the prober from under-counting subsystems (a 957-LOC file in
  `utils/` is functionally a subsystem; naming it as such gives accurate
  totals)

**Worked example (Honcho probe):** `src/utils/summarizer.py` at 957 LOC
is the third-largest file in the codebase but lives under `utils/` rather
than as a top-level `summarizer/` directory. By complexity, public API
surface, and operational footprint, it's a peer subsystem. Captured as
A31 with the "when discussing architecture, mention summarizer as a peer
subsystem despite its directory placement" guidance.

## Lens 5 — The aspirational-vs-implemented gap

**Question:** What does the documentation describe that the code does not
implement?

For every feature claimed in README/docs/marketing, verify implementation
exists. Negative findings (claim with no implementation) are first-class
probe outputs.

- **Schema-extensible** — feature could be added without breaking changes
  (schema has the type, the writer specialist is missing)
- **Documentation-only** — feature has no schema or writer presence
- **Partially implemented** — some code paths support, others don't

**Why this matters:**
- Honest assessment of substrate maturity
- Tells operators what they can build on (implemented) vs what they
  should not commit to (aspirational)

**Worked example (Honcho probe):** Docs claim four reasoning modes
(explicit/deductive/inductive/abductive); schema implements three;
dreamer has two specialists (DeductionSpecialist, InductionSpecialist).
Abduction is schema-extensible-but-not-implemented. Resolved A11
honestly rather than echoing the doc claim.

## Lens 6 — The cadence/cost asymmetry

**Question:** Where does the substrate's primary cost come from — and is
it where the operator would expect?

Map each cost vector (LLM tokens, embedding tokens, database storage,
network egress) to its primary source. Look for amplification factors:

- **Linear-in-X amplifications** — e.g. observation writes are
  linear-in-observer-count, embedding generation is linear-in-document-count
- **Quadratic / pathological cases** — e.g. N-to-N peer interactions could
  cause quadratic observation write growth
- **Cost-discretion bound** — e.g. agent-driven write tools have no
  bounded cost per query

**Why this matters:**
- Reveals scaling cliffs before they're hit in production
- Surfaces operational tuning knobs the operator should know about
- Distinguishes "expensive but bounded" from "expensive and unbounded"

**Worked example (Honcho probe):** A13 (N-observer write amplification —
2x worst case for single-user-plus-assistant, but quadratic for
agent-swarm scenarios) and A22 (dialectic write tools are LLM-discretion-
bounded, not config-bounded). Both are operational tuning knobs the
operator must understand.

## Lens 7 — Locus of enforcement

**Question:** Where in the substrate is a given invariant actually
enforced — at the storage layer, at the API/ABI, at the application
layer, or by convention only?

For any claimed guarantee (uniqueness, ordering, level-policy, namespace
isolation, etc.), trace where the enforcement code lives. The locus
matters because it determines what bypasses the guarantee.

- **Storage-layer** — enforced by DB constraint, unique index, NOT NULL.
  Bypass only via direct SQL.
- **ABI/API-layer** — enforced by the function that mediates writes
  (dispatch handler, decorator, base-class method). Bypass by calling
  storage directly.
- **Application-layer** — enforced by caller-side checks before invoking
  the API. Bypass by any new caller that forgets the check.
- **Conventional** — enforced by code review and discipline. Bypass by
  any future writer.

**Why this matters:**
- Tells operators what failure modes are possible (storage-layer = none
  short of corruption; conventional = always at risk)
- Reveals where to put new policy (don't add to application-layer if a
  storage-layer constraint would work)

**Worked example (Honcho probe):** Per-triple write serialization is at
the ABI (`dialectic-tool-abi.md`), not the storage layer — so direct
inserts to `documents` bypass it. Level-policy enforcement is at the ABI
— so a future write path that doesn't go through the ABI could violate
the three-level model from `explicit-deductive.md`.

## Lens 8 — Operator impact

**Question:** What does this feature mean for an operator running the
substrate in production — what knobs do they touch, what failure modes
do they observe, what scaling cliffs do they hit?

Every Tier 3 bullet should answer "so what?" for the operator. Bullets
that describe internal mechanism without operator implication are
incomplete.

- **Cost knobs** — which config setting affects this feature's LLM/embed/
  storage cost?
- **Failure modes** — what does the operator see when this feature
  misbehaves (slow queries, missed observations, queue buildup)?
- **Scaling cliffs** — at what scale does this feature break (e.g.
  N-observer write amplification, queue depth thresholds)?

**Why this matters:**
- Distinguishes "what does the substrate do" from "what does running
  the substrate require"
- Forces the probe to be operationally useful, not just academically
  descriptive

**Worked example (Honcho probe):** Token-batching is the substrate's
primary cost lever for derivation — 10x batch size = ~10x reduction in
LLM calls. Without the operator-impact lens, this would sit as "batch
cap is 1024 tokens" with no actionable framing.

## Lens 9 — Failure mode (fails-open / fails-closed / graceful degradation)

**Question:** When this feature's primary mechanism fails (LLM timeout,
DB error, malformed input), does the system fail open, fail closed, or
gracefully degrade?

- **Fails open** — failure is swallowed; system proceeds without the
  feature's contribution (e.g. surprisal failures default to baseline
  cadence; telemetry callback exceptions are dropped)
- **Fails closed** — failure aborts the calling operation (e.g. structured
  output parse failure raises and the deriver task fails)
- **Graceful degradation** — failure triggers a fallback path that
  produces a reduced-quality result (e.g. tool-loop cap-hit synthesises
  from accumulated context instead of raising)

**Why this matters:**
- Determines which failures the operator must monitor vs which are
  self-healing
- Reveals optimistic-locking assumptions that may not hold

**Worked example (Honcho probe):** Surprisal "fails open" (worker-lease,
cap-hit synthesis). Tool-loop has graceful degradation via cap-hit
synthesis. Reconciler uses fails-open for vector-store sync. Each is a
distinct operational discipline the operator inherits.

## Lens 10 — Structural criticality (load-bearing identification)

**Question:** Is this feature load-bearing — i.e. would removing it
break something downstream that is itself load-bearing?

Use the phrase "load-bearing" sparingly and only when justified. A
load-bearing feature is one whose removal cascades.

- **Load-bearing for X** — explicit cross-feature dependency
- **Convenience / optimization** — system functions without it, just
  worse
- **Sealed boundary** — load-bearing at a structural level (e.g. the
  observer/observed key shape is load-bearing for the entire memory model)

**Why this matters:**
- Tells future maintainers what they cannot remove without re-architecting
- Identifies the "spine" features that drive the rest of the substrate

**Worked example (Honcho probe):** The ABI is the substrate's load-
bearing reuse seam (`dialectic-tool-abi.md`). The `(observer, observed)`
triple is load-bearing for the entire memory model (`peer-representation.md`).
`can_update_peer_card=False` for induction is a load-bearing policy
decision (`specialist-contract.md`).

## Lens 11 — Cross-feature invariant

**Question:** Does this feature share a structural pattern with another
feature in the substrate — and if so, is the pattern made explicit
anywhere?

Recurring patterns inside a substrate are typically:
- The same abstract base class used in multiple subsystems
- The same threading/concurrency pattern (e.g. DB-connection-free LLM
  execution in both deriver and dialectic)
- The same key-shape convention (e.g. `(observer, observed)` at every
  storage layer)
- The same telemetry pattern (e.g. `parent_category` threading across
  every subsystem)

**Why this matters:**
- Pattern-spotting in nanoprobe seeds crossprobe's later work
- Identifies "this is how this substrate does things" idioms that future
  maintainers must preserve

**Worked example (Honcho probe):** DB-connection-free LLM execution is
the same scalability pattern in dialectic (A24) and specialist (A6).
Pre-try telemetry initialization is a recurring discipline (specialist
A8). Both are substrate idioms, not feature-specific quirks.

## When to apply

- **End of each batch** — apply 2-3 lenses to the batch's specs to
  generate fresh assessment entries
- **Closing pass** — apply ALL lenses systematically to ensure no
  load-bearing finding is buried in feature specs
- **Pass 4 (cross-feature synthesis)** — apply lenses 7-11 specifically;
  these are the cross-feature lenses that catch invariants the
  descriptive pass misses
- **Mid-probe whenever you feel "this is just description"** — the lenses
  pull interpretation out of facts

## Adding new lenses

When a probe surfaces an analytical question shape that recurs (not just
a one-off finding), add it here as Lens N+1. Each lens should have:
the question, why it matters, the typical answer shapes (with a small
table if applicable), and one worked example with substrate name + the
assessment entry it produced.

Lenses are domain-portable — most apply to any substrate that accumulates
state. If a lens is genuinely substrate-specific (e.g. only applies to
LLM-derived artefacts), label it as such.
