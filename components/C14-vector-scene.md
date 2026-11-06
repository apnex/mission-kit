---
id: C14
category: component
title: vector-scene - show an application's shapes, held as data in declared layers under its keys, exactly as described
status: active
hydrate-when: Your application draws its own content as SVG and you need to keep that drawing in step with its data, draw it where there is no browser, or say which of its things a pointer landed on
sovereignty: internal
supersedes: []
related: [C0, A3]
---

# C14 - vector-scene

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Show an application's shapes, held as data in declared layers under its keys, exactly as described, and say which shape a platform element belongs to and where a point lies.

That is the whole duty: one scene, kept equal to its description.\
It does not also decide what anything looks like or means, find a shape by geometry, read a clock, animate, style or sanitize - each of those is the application's or another component's.\
A view of the scene - panned and zoomed, written as one transform on every layer - is asked beside a root, and the root itself, its `viewBox` among its attributes, stays the application's.

At the altitude below this one it is ten units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not ten duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| declaration | `openScene(declaration)` returns `{ ok: true, scene }` or `{ ok: false, problems }` and never throws while it judges a declaration; a declaration holds a non-empty array of `layers`, each `{ name, attrs?, foreign? }` with names unique, optionally a `root` - an `<svg>` in a browser, or any object of its shape - and optionally `view: true`, which needs a root; with no root the scene holds and reads back data alone; problems are `{ pointer, problem }` records, an RFC 6901 pointer and a code, ordered by pointer and then by problem |
| layers | each layer is a `<g>` appended to the root in declared order, drawn back to front; a scene layer holds items, and a foreign layer's element, which `layerElement(name)` answers, holds whatever the application draws there, which the scene never writes beneath, reads or removes but as it removes every layer; `scene.close()` removes every layer element it made, so nothing the scene made outlives a failed opening or a close unless a removal threw |
| shapes | a shape is a plain object of `tag`, an SVG local name, optionally `attrs`, whose values are strings or finite numbers and whose names never begin with `on`, and `text` or `children` but not both, nesting at most 32 deep; the scene judges a shape's form, never its meaning, and is no sanitizer |
| items | `put(layer, key, shapes, place?)` makes `shapes` the description of the item `key` in a scene layer, a new item placed before the item `place.before` names or last; `remove(layer, key)` takes the item out; `items(layer)` answers `{ key, shapes }` back to front, each description a valid argument to `put`, and putting it again to its own item, with no `place`, calls nothing |
| bringing the platform | each put and removal makes exactly the platform calls that bring the elements to the description, writing only what descriptions differ by and reading nothing of the platform; an element keeps its identity while its shape keeps its position and its tag, so a captured pointer, a running transition or a hover outlasts the put; a platform method that throws leaves the scene failed, with only `close` left |
| shape at an element or a point | `itemOf(value)` answers `{ layer, key, path }` for an element the scene made for an item it holds, reading nothing of `value`, and `null` for anything else; `itemAt(screen)` answers the same for the first such element in the platform's own hit stack at a screen point, so it answers under a captured pointer too, whose every event targets the capturing element |
| conversions | `toDrawing(screen)` and `toScreen(point)` convert through the root's screen transform at the moment asked, with `DOMPoint`'s `matrixTransform` arithmetic, composed with the view on a viewed scene; a singular transform is refused |
| view | on a scene declared with `view: true`, `setView({ x, y, scale })` writes one `matrix` transform on every layer's element, within the range the scene supports (a `scale` from 2^-16 to 2^16, each transform member of magnitude at most 2^24), and `view()` answers the view written; `visible()` answers `{ region, scale }` in `snap-grid`'s view form; `zoomAbout(screen, scale)` answers, setting nothing, the view that keeps the drawing point under `screen` where it is; `onView(listener)` tells each listener what is visible after each `setView` |
| platform slice and errors | the scene touches only the members of the root, its document, the elements it makes and the screen transform that it names, reads none of the root's attributes and names no global; a malformed argument throws a `TypeError` whose message begins with the function's name, and a call the scene's state does not allow an `Error` |
| runtime | `@apnex/vector-scene` exports `openScene` and nothing else; it imports no package, reads no clock and no randomness and holds no timer, so it runs over a browser's elements, over plain objects of their shape, or with no root at all |

Answering by the platform's own elements is the load-bearing part of this contract: `itemOf` and `itemAt` never run a second hit test that would disagree with the platform's at every stroke's edge, and with no root the same code holds and reads back the same descriptions.

---

## Reference

The sovereign repository `apnex/vector-scene` (`@apnex/vector-scene`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

Releases are published only by its own CI, as a tarball attached to a GitHub release at `https://github.com/apnex/vector-scene/releases`, and a published release is never replaced, so a fix is a new version.\
A consumer names the release file in its `package.json`, and its lockfile pins the file's hash.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `vector-scene`.\
If none of it describes you, stop here.

- An application draws its own content as SVG and keeps that drawing in step with its data as the data changes.
- The same drawing must also be produced where there is no browser, from the same code.
- Something must say which of its things a pointer landed on, by the platform's own hit test.
- Something must say what lies under a captured pointer, whose every event targets the capturing element.
- The drawing must be panned and zoomed by a view the scene writes on its layers, each listener told what is visible.

### Does it meet my requirement

- Every shape is an SVG element described as data - a tag, attributes, and text or child shapes - under a key in a declared layer.
- The application describes every attribute, and keeps out of a description what it does not trust.
- Content the scene does not describe - a canvas, an animation run frame by frame - is drawn by the application in a foreign layer.
- The root and its attributes, its `viewBox` among them, stay the application's.

**It is the wrong tool when**

| you need | reach elsewhere, because `vector-scene` is |
|---|---|
| what an input means, or a pointer's events as facts | not an input layer - that is [`C12`](C12-input-binding.md) (`input-binding`) and [`C13`](C13-input-capture.md) (`input-capture`) |
| where a grid's positions lie in what the root shows | not a grid - that is [`C11`](C11-snap-grid.md) (`snap-grid`), whose `inView` takes `visible()`'s answer unchanged |
| what a thing looks like, its styles or its state's meaning | not a theme - the application describes every attribute |
| a shape found by geometry, with no platform | not a geometry engine - it answers by the platform's elements |
| shapes unloaded or culled as they leave the view | not a culler - an item out of view stays on the page, removing one being one removal |
| animation run frame by frame, or a canvas or WebGL drawing | not an animator - draw it in a foreign layer |
| HTML elements | not a page builder - every shape is an SVG element |
| SVG from an untrusted source drawn safely | not a sanitizer - it judges a shape's form, never its meaning |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A measured misfit at a consumer is recorded against `vector-scene`'s contract rather than met by building or reading elements by hand beside the scene.
2. **Adjust upstream, or fracture it if the gap reveals a second duty.** The view was added upstream this way: a declaration that does not ask for it meets every answer, call and read of the release before, but for the scene's five new keys.
3. **Never fork.** A copy of the scene adjusted in place gives two contracts that both read as authoritative, the failure [`C0`](README.md#adjustment-over-replacement) exists to prevent.

---

## Edges

**Contains** - ten internal units in its anchored core: opening a scene and its layers, items and descriptions (`open-scene`), the declaration's reading (`declaration-reading`), shape and attribute reading (`shape-reading`), bringing the platform to a description and the element-to-item map (`scene-writing`), the item at a point (`shape-at-point`), the conversions (`conversion`), the view (`scene-view`), argument reading (`argument-reading`), judging a value at its own pointer (`reflection`), and problem records of a refused declaration (`declaration-problems`).

**Contained-by** - nothing; `vector-scene` is a top-level registered component.

**Consumes** - nothing; `vector-scene` depends on no other component, and its `package.json` lists no dependency; its tests alone pin `snap-grid` as a development dependency, to hand `visible()` to `inView`.

**Consumed-by** - `drawv2` (draw, `apnex/drawv2`) and `input-tester` (the gesture tester, `apnex/input-tester`, which draws its keys and mouse as items, hands `toDrawing` to `input-capture` as its conversion, and asks `itemAt` with a fact's `screen` when `itemOf` of its target answers `null`), which use `vector-scene` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
