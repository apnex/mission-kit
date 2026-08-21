---
id: MREQ-6
category: mission-required
title: The retrieval strategy for a ledger that outgrows always-on context
status: active
fulfilment: deferred
hydrate-when: You are deciding how the ledger reaches an agent once it no longer fits comfortably in always-on context
revival-trigger: >
  the ledger passes roughly 250 entries or 50 KB, OR an agent loads it in full
  and still fails to route to an entry whose trigger matched what it was doing
related-axioms: [A12, A4, A11]
related: [E2, S0]
---

# MREQ-6 - the retrieval strategy for a growing ledger

## What is deferred

Deciding how the entry ledger reaches an agent when loading all of it into every session stops being affordable.

The ledger is currently delivered whole, fetched at session start.\
That is the cheapest mechanism that works and it is the reason routing works at all: the failure that started this programme was a ledger nothing loaded, not a ledger nobody could read.

---

## Why it is parked rather than built

Because the cost is linear and measured, so the decision has a date rather than a guess, and building early would be Speculative Surface.

Measured: **206 bytes per entry**, essentially flat as the ledger has grown.

| Entries | Always-on cost |
| --- | --- |
| 133 | 27 KB |
| 200 | 40 KB |
| 350 | 71 KB |
| 500 | 101 KB |

The slope matters more than the total, and one finding should be carried forward honestly: **grouping the ledger by layer did not change it.**\
That change removed a redundant column and cut a one-off kilobyte, moving per-entry cost from 210 to 206 bytes.\
The remaining cost is title plus hydration trigger, which *is* the routing payload.\
It cannot be recovered by formatting, so the answer when the time comes is structural - a small always-on router with the rest fetched on demand - and not another round of trimming.

---

## What was built instead

Two substrates were evaluated against this problem and rejected, and the evidence is recorded here so the work is not repeated.

**kiwifs**, audited at `v0.19.61`: BUSL-1.1 rather than open source, no read-only mode, 71 MCP tools with no per-tool gating, a config type-error path that starts silently with no versioning, no authentication, grep-based search, and a hard-coded 256-entry vector queue that drops silently against a corpus already larger than that.\
Decisive point: roughly 965 lines of relevant value behind roughly 76,500 lines of dependency.

**Open Knowledge Format v0.2** (Apache-2.0, `GoogleCloudPlatform/knowledge-catalog`): a markdown-plus-frontmatter specification formalising the same pattern this corpus already follows, and close to conformant - `category` maps to its required `type`, `title` and `status` map directly.\
It was not adopted because it ships **no retrieval whatsoever**; its reference server is 96 lines and three CRUD verbs.\
It solves the format question, which was never the open one.

---

## On revival

Re-triage rather than resume, per [`M5`](../methodology/M5-anti-amnesia-deferral.md).

The two triggers are deliberately different in kind.\
The size trigger is a leading indicator and fires while there is still time to design.\
The routing-failure trigger is a lagging one and means the always-on assumption has already broken, which is the more important of the two and the harder to notice, because a failure to route leaves no trace in the corpus.
