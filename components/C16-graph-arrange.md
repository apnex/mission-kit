---
id: C16
category: component
title: graph-arrange - arrange nodes, groups and links into deterministic 2D coordinates
status: active
hydrate-when: Two or more parts of your system are about to compute graph placement, cluster packing, collision separation, sibling label compaction or link bundling independently
sovereignty: internal
supersedes: []
related: [C0, C11, C14, P4, A3]
---

# C16 - graph-arrange

Sovereignty is `internal`, so a fit gap here routes upstream rather than spawning consumer-local forks.

---

## Duty

Arrange an application's nodes, nested groups and directed links into deterministic, non-overlapping 2D placement points, offered attachment slots, compact display labels, group envelopes and bundled link curves according to a named layout plugin.

That is the whole duty.\
It does not also render SVG or canvas elements, manage pointer gestures, own domain identity or state, persist layouts between calls or replace an external coordinate grid.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| registry and plugins | `createLayoutRegistry(initialPlugins?)` and `createDefaultLayoutRegistry()` expose `{ register, get, list, compute }`, bundling `radial-cluster`, `orbit-flat`, `hierarchy-hull` and `layered-flow`; `compute(pluginId, graph, options?)` throws an explicit `Error` naming any unknown `pluginId` instead of falling back silently |
| node and group placement | every placed node emits `{ node, point: { x, y }, bounds: { x, y, width, height }, displayLabel }` and every placed group emits `{ group, shape, point, bounds, radius?, collapsed, hiddenChildCount }` without `-0`; a node carrying `pinned: true` and finite `point` retains that exact point untouched by collision separation or `snap` |
| offered slots | every layout populates `PositionedScene.slots` with `{ point, groupId?, ring?, slot? }` entries exposing generated ring, orbital, hull-cell or lane coordinates |
| constraint seam | when `options.snap` is supplied, unpinned node `point` coordinates pass through `snap(point, bounds)` after collision separation and before bounds derivation and link routing |
| links and labels | `bundleLinks(links, nodes, groups, options?)` computes deterministic Bezier paths, midpoints, summarized counts and collapsed ancestor endpoints; `buildCompactLabelMap(entries, maxChars?)` and `compactSingleLabel` strip shared sibling prefixes while preserving distinguishing tails |
| arguments and answers | public entry points throw `TypeError` on malformed inputs, duplicate IDs, non-positive sizes or `pinned: true` without a finite point; every returned scene, link list and bounds object is freshly built and deep-frozen without mutating or freezing caller arguments |
| runtime | `@apnex/graph-arrange` exports everything on `.` (`dist/index.js`), declares zero runtime dependencies, uses only standard JavaScript built-ins, reads no clock or randomness and excludes consumer-specific domain nouns |

---

## Reference

The package `@apnex/graph-arrange` holds its vision in `VISION.md`, its contract in `CONTRACT.md`, its decisions in `docs/DECISIONS.md` and its machine-checked surface in `export-map.json`.

Releases are built by CI as `apnex-graph-arrange-<version>.tgz` GitHub release tarballs, targeting `apnex/graph-arrange` (`v0.1.0` published).\
Consumers name the release tarball URL in `package.json` so `package-lock.json` pins its integrity hash.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `graph-arrange`.\
If none of it describes you, stop here.

- More than one view or consumer lays out nodes, hierarchical groups and links in 2D and would otherwise duplicate packing, collision separation or link bundling.
- Multiple layouts (`radial-cluster`, `orbit-flat`, `hierarchy-hull`, `layered-flow` or custom plugins) must swap behind one deterministic input and output contract.

### Does it meet my requirement

- Placement coordinates use `{ x, y }` center points and `{ x, y, width, height }` bounds directly composable with [`C11`](C11-snap-grid.md) (`snap-grid`) via `options.snap` and [`C14`](C14-vector-scene.md) (`vector-scene`) for rendering.
- Fixed positions (`pinned: true` with finite `point`) stay put while surrounding unpinned neighbors separate around them.
- The library runs identically in Node and in browsers with zero dependencies, zero DOM assumptions and zero retained state.

**It is the wrong tool when**

| you need | reach elsewhere, because `graph-arrange` is |
|---|---|
| an empty snapping lattice | not a coordinate grid - declare empty lattices in [`C11`](C11-snap-grid.md) (`snap-grid`) and pass `snap` into `graph-arrange` |
| SVG or DOM rendering and hit-testing | not a renderer - project `PositionedScene` items through [`C14`](C14-vector-scene.md) (`vector-scene`) |
| pointer capture or key bindings | not an input layer - handle gestures with `input-capture` and `input-binding` |
| live graph mutations or persistence | not a state store - keep mutable application state outside the pure arrange pass |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Adapt domain records outside.** Consumers map proprietary entities to `GraphNode`, `GraphGroup` and `GraphLink` at their tenant boundary (`P4`) rather than leaking domain nouns into `graph-arrange`.
2. **Extend by plugin, promote on reuse.** Single-consumer arrangements register on `createLayoutRegistry()` via `register(plugin)`; strategies needed by two or more consumers graduate into `graph-arrange` ([`C0`](C0-components.md)).
3. **Fail loudly on unknown plugins.** Mismatched plugin IDs raise an `Error` rather than falling back to a different layout.

---

## Edges

**Contains** - internal modules: type contracts, geometry and collision solver (`resolveBoxCollisions`, `computeSceneBounds`), sibling label compactor (`buildCompactLabelMap`, `compactSingleLabel`), Bezier link bundler (`bundleLinks`), plugin registry (`createLayoutRegistry`, `createDefaultLayoutRegistry`) and four built-in plugins (`RadialClusterLayoutPlugin`, `OrbitFlatLayoutPlugin`, `HierarchyHullLayoutPlugin`, `LayeredFlowLayoutPlugin`).

**Contained-by** - nothing; `graph-arrange` is a top-level registered component.

**Consumes** - nothing; `graph-arrange` lists zero dependencies in `package.json` and composes optionally with [`C11`](C11-snap-grid.md) (`snap-grid`) via caller-injected `options.snap`.

**Consumed-by** - `cadolphus/disco` (`disco-web` topology canvas) and `apnex/drawv2` (planned layout placement consumer).
