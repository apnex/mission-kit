---
id: C13
category: component
title: input-capture - turn each platform input event on one surface into one uniform fact, and carry the application's answer back
status: active
hydrate-when: Your application turns a browser's pointer and key events into its own values in more than one place, or you need to test its input without a browser
sovereignty: internal
supersedes: []
related: [C0, A3]
---

# C13 - input-capture

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Turn each input event a platform delivers on one surface into one uniform fact, in the application's coordinates, and carry the application's answer for that fact back to the platform.

That is the whole duty: one boundary, crossed both ways for each event.\
It does not also decide what an input means, find what lies under a pointer, convert coordinates, read a clock, or draw anything - each of those is `input-binding`'s, the application's or another component's.\
An event's `timeStamp` is a field the platform delivered, read as data, so capture reads no clock.

At the altitude below this one it is six units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not six duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| declaration | `openCapture(declaration)` returns `{ ok: true, capture }` or `{ ok: false, problems }` and never throws while it judges a declaration; a declaration holds a `surface` whose `addEventListener`, `removeEventListener` and `setPointerCapture` are functions, optionally a key source `keys`, the conversion `toDrawing`, optionally `hit` and `focus` (`focus` requiring `keys`), `deliver`, and optionally `listen`, distinct names among `'wheel'`, `'context-menu'` and `'blur'` (`'blur'` requiring `keys`); problems are `{ pointer, problem }` records, an RFC 6901 pointer and a code, ordered by pointer and then by problem |
| lifecycle | no listener is added until the declaration is judged; an `addEventListener` that throws takes back every listener added and rethrows its error, the capture never open; `capture.close()` removes exactly the listeners it added, in reverse order, attempting every removal; a capture that is not open makes no fact |
| events | the surface's `pointerleave`, `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerout` and `dblclick`, the key source's `keydown` and `keyup`, and, only when `listen` names them, the surface's `wheel` (added with `{ passive: false }`) and `contextmenu` and the key source's `blur`, each become one fact, made synchronously and delivered before the listener returns; capture queues, merges, defers and synthesizes nothing, so the platform's own sequence is the facts' sequence, and it listens for nothing else |
| fact | a frozen record of exactly `type`, `at`, `screen`, `hit`, `focus`, `button`, `buttons`, `pointerId`, `pointerType`, `key`, `code`, `repeat`, `shiftKey`, `ctrlKey`, `altKey`, `metaKey`, `deltaX`, `deltaY`, `deltaZ`, `deltaMode` and `time`, in that order, each `null` where its family carries none or as the contract's table gives it (a `blur` fact's four modifiers `false`, a pointer event's missing `button` `0`); `screen` is the event's `clientX` and `clientY`, `at` the conversion's answer for it, `time` the event's own `timeStamp`; `at`, `screen` and the deltas hold exactly the numbers read, `-0` kept, the wheel's deltas never converted, and `deltaMode` is `0`, `1`, `2` or `null` |
| application's functions | `toDrawing(screen)`, `hit(target, fact)`, `focus(target, fact)` and `deliver(fact, reply)` are called synchronously, with no receiver, at most once for each event; `hit` is asked for every pointer fact and `focus` for every key fact, and their answers are held in the fact by reference, never read; the event's `target` is handed to them and never read |
| reply | a fresh frozen `{ claim, takePointer }`, live while its fact is delivered: `claim()` calls the event's `preventDefault` once, so a claimed `wheel` prevents its scroll and a claimed `context-menu` the menu; `takePointer()` calls the surface's `setPointerCapture` with the fact's `pointerId` and answers `true` when it returns, `false` when it throws or the fact holds no pointer; each throws an `Error` once delivery has ended |
| platform slice | capture touches only the members of the surface, the key source and the events it names, never a target's members or an event's prototype, and names no global - no `window`, no `document` - so the same code runs over a browser's objects and over plain objects of their shape |
| errors | a listener refuses an event that is not an object, or whose field is refused, by throwing a `TypeError` whose message begins with the platform event's name and a colon, or with `toDrawing: ` for a refused conversion answer, before `deliver` is called; any exception from an application function propagates unchanged |
| runtime | `@apnex/input-capture` exports `openCapture` and nothing else; it imports no package and reads no clock and no randomness and holds no timer; its TypeScript declarations state the platform slice as its own structural types, generic in the hit and the focus, and the families `listen` names reach the delivered fact's type |

The fact is the load-bearing part of this contract: it holds no event, no target and no function, so no layer above capture needs the platform's event, and input can be driven without a browser.

---

## Reference

The sovereign repository `apnex/input-capture` (`@apnex/input-capture`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

Releases are published only by its own CI, as a tarball attached to a GitHub release at `https://github.com/apnex/input-capture/releases`, and a published release is never replaced, so a fix is a new version.\
A consumer names the release file in its `package.json`, and its lockfile pins the file's hash.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `input-capture`.\
If none of it describes you, stop here.

- An application turns a browser's pointer and key events into its own values in more than one place, or tests its input without a browser.
- A gesture needs the pointer captured, or the default action prevented, and the code deciding so should not hold the event.
- An application will pan or zoom, and its input must follow the view without its listeners changing.

### Does it meet my requirement

- Input arrives on one surface and one key source you hand it, a browser's elements or plain objects of their shape.
- You supply the conversion from a screen point to your own coordinates, and optionally the hit and the focus, and capture holds their answers as given.
- Every fact must say exactly what the platform reported, in the platform's own order, its own `timeStamp` as `time`, with no number computed.
- The wheel, a touchpad's pinch (a `wheel` with `ctrlKey` true), the context menu and the key source's focus loss arrive as facts when `listen` names them.

**It is the wrong tool when**

| you need | reach elsewhere, because `input-capture` is |
|---|---|
| what an input means, a click told from a drag, a gesture's phases | not a binder - that is [`C12`](C12-input-binding.md) (`input-binding`), which reads a pointer fact as it is |
| what lies under a point, or where a screen point lies in a drawing | not a hit tester or a view - the application supplies both, from [`C14`](C14-vector-scene.md) (`vector-scene`) or its own |
| a touchpad's pinch told from Ctrl and the wheel | not a reader of hardware - the platform delivers both alike |
| composition and lock state | not yet - held until an application needs either as facts |
| events from the whole page, or from controls outside the surface | not a page listener - one capture listens to one surface and one key source |
| a hold, a sequence or a double click decided by time | not a clock - a double click is the platform's own event, and a fact's `time` is the event's own, for the application to compare |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A measured misfit at a consumer is recorded against `input-capture`'s contract rather than met by reading the platform's events in a second place.
2. **Adjust upstream, or fracture it if the gap reveals a second duty.** The wheel, the context menu, focus loss and every fact's time were added upstream by a recorded decision (`D3` in its `docs/DECISIONS.md`), and composition and lock state are held until an application needs either as facts.
3. **Never fork.** A second reader of the platform's events lets the platform leak into another layer, which is the leak this component exists to contain.

---

## Edges

**Contains** - six internal units in its anchored core: opening, closing and the listeners (`open-capture`), the declaration's reading (`declaration-reading`), the reading of an event into a fact (`event-reading`), the fact (`fact`), the reply (`reply`), and problem records of a refused declaration (`declaration-problems`).

**Contained-by** - nothing; `input-capture` is a top-level registered component.

**Consumes** - nothing; `input-capture` depends on no other component, and its `package.json` lists no dependency.

**Consumed-by** - `drawv2` (draw, `apnex/drawv2`) and `input-tester` (the gesture tester, `apnex/input-tester`, which uses every family, `time` and the deltas, and hands its facts to `input-binding` as they are), which use `input-capture` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
