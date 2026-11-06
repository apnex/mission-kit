---
id: C11
category: component
title: snap-grid - answer where a grid's positions lie and which lies nearest a point
status: active
hydrate-when: Two or more parts of your system snap to, draw or validate against the same grid, and each is about to write its own grid arithmetic
sovereignty: internal
supersedes: []
related: [C0, A3]
---

# C11 - snap-grid

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Answer, for a grid declared as data, where its positions lie in a plane and which position lies nearest a point.

That is the whole duty.\
It does not also draw a grid, hold which grids an application has, decide what may sit at a position, keep anything between calls, or move anything - each of those is the consumer's or another component's.

At the altitude below this one it is eight units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not eight duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| declaration | `openGrid(declaration, options?)` returns `{ ok: true, grid }` or `{ ok: false, problems }` and never throws for any declaration, throwing a `TypeError` only for malformed `options`; a problem is exactly `{ pointer, problem }`, an RFC 6901 pointer and one of `not-an-object`, `missing-property`, `unknown-shape`, `unknown-property`, `invalid-value` or `no-position-in-bounds`, ordered by pointer and then by problem by UTF-16 code unit; a square declaration is `shape: 'square'`, an integer `pitch` from 1 to 2^50, an integer `origin` `{ x, y }` of magnitude at most 2^50 and optional `bounds` `{ min, max }`; `grid.declaration` is a frozen copy, and the grid holds nothing else and never changes |
| exactness | a square grid's domain is every number of magnitude at most 2^50, and every answer over it is exact, so none needs a tolerance; `nearest`, `positionAt`, `inView`, `next` and `enclosing` answer only with offered positions - representable, and within the bounds when there are any - which `grid.offers(position)` reports |
| nearest and point | `grid.nearest(point)` is the offered position nearest the point, a coordinate exactly halfway going to the greater, clamped to the offered indices, and `null` for a coordinate not finite or outside the domain; `grid.pointOf(position)` is `{ x: col * pitch + origin.x, y: row * pitch + origin.y }` for a `{ col, row }` position, throwing a `RangeError` where that point would lie outside the domain; `grid.positionAt(point)` is `nearest(point)` when its point has exactly the point's `x` and `y` (`===`), and `null` otherwise |
| in view | `grid.inView(view, options?)` returns a frozen `{ stride, positions }`, each entry `{ position, point }`, for the offered positions in a `{ region, scale }` view, ordered by row and then by column; the stride is the least power of two that keeps neighbouring positions `options.minSpacing` apart on screen (default 0) and returns no more than `options.max` positions (default 10000), and a greater stride's positions are a subset of a lesser's, so zooming out drops positions and never moves one |
| neighbours | `grid.directions` (`-x`, `+x`, `-y` and `+y` on a square grid), `grid.opposite(direction)`, and `grid.next(position, direction)`, the neighbour that way when both it and the position are offered, and `null` otherwise |
| blocks and regions | `grid.span(from, to)` returns `{ through, covering }`, the smallest rect holding every point of the block and the smallest holding every cell; `grid.enclosing(rect)` returns the smallest block `{ from, to }` of offered positions whose `through` contains the rect, clamped to the offered positions, and `null` for an edge not finite or outside the domain; `grid.regionContains(region, point)` says whether a point lies in a region, edges included; a rect is `{ kind: 'rect', x, y, w, h }` with `w` and `h` at least 0 |
| arguments and answers | a point is any object with number properties `x` and `y` - a plain object, a `DOMPoint`, an entity - read through ordinary property access; every other argument is a plain object read through its own data properties, so no getter of it runs; a malformed argument throws a `TypeError` whose message begins with the function's name; every value returned is made afresh and frozen to its depth and holds no `-0`, and nothing a caller passes is frozen, kept or changed |
| shape port | a shape is a frozen `{ name, open }` whose grid offers every function above, and `options.shapes` adds shapes to `square`; `checkGridShape(shape, cases)`, from `@apnex/snap-grid/conformance`, returns a frozen array of failures `{ invariant, case, args, got }`, empty when the shape keeps every invariant the kit can judge through the port |
| runtime | the package imports no other package and no module particular to one runtime, reads no clock and no randomness and holds no timer, so the same files run in Node and in a browser and answer the same there |

The shape port is the load-bearing part of this contract for anyone extending rather than consuming: a grid of a new shape arrives as a shape proved by the kit, never as a change to a consumer.

---

## Reference

The sovereign repository `apnex/snap-grid` (`@apnex/snap-grid`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

Releases are published only by its own CI, as a tarball attached to a GitHub release at `https://github.com/apnex/snap-grid/releases`, and a published release is never replaced, so a fix is a new version.\
A consumer names the release file in its `package.json`, and its lockfile pins the file's hash.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `snap-grid`.\
If none of it describes you, stop here.

- More than one part of your system snaps to, draws or validates against the same grid, and they must agree to the last unit.
- You are about to write `Math.round((v - offset) / pitch) * pitch + offset` - especially if you have written it before.

### Does it meet my requirement

- The grid can be declared as data, and a square grid is the shape shipped: one integer pitch for both axes, an integer origin and optional integer bounds.
- Every answer must be exact over coordinates of magnitude up to 2^50, with no tolerance, so a point the canvas accepts is never one the server refuses.
- Points arrive as whatever you hold, and the library must run in Node and in a browser with no dependency and keep nothing between calls.

**It is the wrong tool when**

| you need | reach elsewhere, because `snap-grid` is |
|---|---|
| grid lines or dots drawn | not a renderer - `inView` says where the positions lie, and drawing them is the consumer's, through [`C14`](C14-vector-scene.md) (`vector-scene`) or its own |
| the item drawn under a point on the screen | not a hit tester - that is `vector-scene`'s `itemAt` ([`C14`](C14-vector-scene.md)) |
| which grids an application has, stored or edited | not a store |
| whether something may sit at a position | not an authority over occupancy |
| freehand placement, or snapping to other things' edges | not a general snapping engine - it knows only its grid |
| a grid of fractional pitch | not yet - pitches and origins are integers until a consumer needs otherwise |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A measured misfit at a consumer is recorded against `snap-grid`'s contract rather than met with grid arithmetic of the consumer's own.
2. **Adjust upstream, or fracture it if the gap reveals a second duty.** A grid of another shape has a designed seam: a consumer may write a shape against the port and prove it with `checkGridShape`, and a shape more than one consumer needs is adjusted into `snap-grid`.
3. **Never fork.** A shape copied between consumers, or grid arithmetic restated beside this one, re-creates the drift this component exists to eliminate.

---

## Edges

**Contains** - eight internal units in its anchored core: grid opener (`open-grid`), the square shape and its declaration (`square`, `square-declaration`), exact per-axis indices (`exact-index`), the conformance kit (`conformance`), shape form check (`shape-form`), problem records of a refused declaration (`declaration-problems`), argument checks (`argument-check`), and plain-data reading and freezing (`plain-data`).

**Contained-by** - nothing; `snap-grid` is a top-level registered component.

**Consumes** - nothing; `snap-grid` depends on no other component, and its `package.json` lists no dependency.

**Consumed-by** - `drawv2` (draw, `apnex/drawv2`) and `input-tester` (the gesture tester, `apnex/input-tester`, which places every key and mouse button by `span` on one square grid), which use `snap-grid` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
