---
id: C12
category: component
title: input-binding - decide what each input means in its context
status: active
hydrate-when: More than one surface of your application must agree on what an input means, or you are about to decide click or drag, or which release ends a gesture, in a second place
sovereignty: internal
supersedes: []
related: [C0, A3]
---

# C12 - input-binding

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Decide what each input means in its context: the one declared row it matches, and the phase it makes due for the gesture in progress.

That is the whole duty.\
A gesture's phase is what an input means over time, so the table and the session serve one concern: binding decides when each phase of a gesture is due and reports it, and the application runs its own code for the phase.\
It does not also listen to a platform's events, find what lies under a pointer, convert coordinates, draw a preview, perform an action, hold an application's situation, or read a clock - each of those is the consumer's or another component's.

At the altitude below this one it is eight units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not eight duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| table declaration | `composeBindingTable(declaration)` never throws and returns `{ ok: true, table }` or `{ ok: false, problems }`; a declaration holds `tenants`, each `{ owner, rows }`, and optionally `guards`, `claim` and `opens`; a row holds a non-empty `id`, a predicate `on` over facts, an optional predicate `when` over contexts, optionally a boolean for each declared guard and claim flag, an optional gesture name under the `opens` field, and any payload of the application's, which the table never reads; problems are `{ pointer, problem }` records, an RFC 6901 pointer and a code, ordered by pointer and then by problem, `duplicate-id` and `duplicate-field` among the codes |
| what a table holds | table order is the tenants in declared order, each tenant's rows in its order; each row's `id`, `on`, `when`, flags and `opens` field are read once, at composition, so a row changed later changes no answer, and the row object itself is handed back as `row`; `table.rows` holds `{ id, owner, opens, row }` entries; a table holds no state, and any number of callers may share one |
| guards | a guard `{ state, flag, default, refuses }` refuses a row by a guard state's boolean `state` and the row's `flag`, as `state-and-flag`, `state-without-flag` or `flag-without-state` says; a row is admitted when no guard refuses it |
| one match | `table.matchInput(fact, context, guards?)` returns `{ match, claimed }`: `match` the one admitted row whose `on` and `when` both hold, as its `table.rows` entry, or `null` when none or several do - never chosen by position, so no permutation of tenants or rows changes it - and `claimed` true when an admitted row whose `on` held carries its claim flag, so the platform's default action is suppressed |
| trace and overlaps | `table.traceInput(fact, context, guards?)` returns one record `{ id, owner, refusedBy, on, when, hit }` per row, in table order, each reading as refused, unbound, unmet or a hit; `table.findOverlaps(facts, contexts, guardStates)` lists every combination given in which two or more rows hit, as `{ fact, context, guards, ids }` |
| predicates | a predicate is the application's, called with no receiver and one argument, at most once in a call of `traceInput` or `matchInput` and once for each combination in `findOverlaps`, every `on` before any `when`, in table order; an exception it throws propagates unchanged, and the call leaves nothing behind |
| session | `openGestureSession(declaration)` never throws and returns `{ ok: true, session }` or `{ ok: false, problems }`; a declaration holds `threshold`, a finite number at least 0, `gestures`, each `{ name, engaged, button }` with `button` a safe integer or `null`, and optionally `measure`, `'at'` or `'screen'`; a session belongs to the application that opens it, one for each input surface, and two sessions share nothing |
| press | `pointerDown`, `pointerMove`, `pointerUp` and `pointerLost` keep at most one press, which is beyond once its travel from its origin exceeds the threshold, decided exactly over the real numbers the coordinates denote, so a travel of exactly the threshold is a click; a release answers `trigger` `'click'` or `'drop'` by the moves before it, never by where it lands; a session declared with `measure: 'screen'` reads every point from a fact's `screen`, its threshold in screen pixels |
| live gesture | at most one gesture is live, `{ name, row, engaged }`, and each operation answers the phase it makes due - `start`, `update`, `become`, `commit`, `cancel` or `null` - by the declared gestures and the inputs alone: `pressMatched` starts the gesture a match opens or cancels a live one, a move updates, a release commits a gesture whose `button` is `null`, the release's or the press's own, `pointerLost` cancels, and another pointer's move or release changes nothing; the requests `startGesture`, `becomeGesture` and `cancelGesture` are checked against the same rules, and an operation the session's state does not allow throws an `Error` and changes nothing |
| held keys | `keyDown`, `keyUp` and `keysLost` keep the codes of the keys held, in the order first pressed; a key fact whose `code` is `''` or `null` is untracked, never refused; no key operation makes a phase due |
| press resolution | `session.resolvePress(fact, handlers)` takes a press through the session in one call - made, matched by the application's own `match`, a live gesture cancelled with `cancelled` told, and the start the match opens - and never asks `match` of a press the live gesture takes |
| facts, state and errors | binding reads of a fact only `at`, or `screen` under that measure, `button`, `pointerId` and, of a key fact, `code`, and hands every other property unread to the predicates; `session.state` is a frozen `{ press, gesture, keys }`, the very same value when nothing changed, and every outcome is fresh and frozen; a malformed argument throws a `TypeError` whose message begins with the function's name |
| runtime | `@apnex/input-binding` exports `composeBindingTable` and `openGestureSession` and nothing else; it imports no other package, touches no DOM, reads no clock and no randomness and holds no timer, so the same files run in Node.js and in a browser; its TypeScript declarations are generic in the fact and the context |

The single match is the load-bearing part of this contract: two rows that both hit mean nothing rather than one winning by its position, and `findOverlaps` finds such a combination before it ships.

---

## Reference

The sovereign repository `apnex/input-binding` (`@apnex/input-binding`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

Releases are published only by its own CI, as a tarball attached to a GitHub release at `https://github.com/apnex/input-binding/releases`, and a published release is never replaced, so a fix is a new version.\
A consumer names the release file in its `package.json`, and its lockfile pins the file's hash.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `input-binding`.\
If none of it describes you, stop here.

- More than one surface - a key, a press, a help overlay, a panel that follows the situation - must agree on what an input means.
- You are about to write a ladder of `if` branches in which the order decides which one wins, or a read-only check placed at a line number.
- You are about to decide "click or drag", or which release ends a gesture, in a second place.
- You are about to write, again, the press's sequence - make it, ask for its match, cancel the live gesture, start the one the match opens.

### Does it meet my requirement

- What an input means can be declared as rows of predicates over your own facts and contexts, composed once from source, with guards and a claim as boolean flags.
- A tie between two rows must mean nothing, and be found before it ships, rather than be settled by order.
- Click or drop is decided by one distance threshold, exactly, in your own units or in screen pixels, with one live gesture per input surface.
- Your application keeps each gesture's working data and runs each phase's code, and binding holds only the press, the live gesture's name, row and `engaged`, and the keys held.
- It must run in Node.js and in a browser with no dependency and no clock.

**It is the wrong tool when**

| you need | reach elsewhere, because `input-binding` is |
|---|---|
| platform events turned into facts, coordinates, a hit under the pointer | not a listener - facts are [`C13`](C13-input-capture.md)'s (`input-capture`), read as they are, and the hit test and the coordinates the application's |
| a preview drawn, or what lies under a point | not a renderer - that is [`C14`](C14-vector-scene.md) (`vector-scene`), or the application |
| an action performed, an undo kept, a gesture's body run | not an executor - rows carry the application's payload, and phases are reported for the application's code to run |
| one row to win over another by priority | not a precedence engine - two hits mean nothing, and an overlap fails the application's gate |
| a hold, or a double click decided by time | not yet - binding reads no clock, and a timed trigger waits for a consumer, its time then a field of the facts |
| a second pointer's press told apart from the first's | not yet - one press, a second pointer's press replacing the first's |
| bindings a person edits while the application runs | not a store - rows are source, composed once |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A measured misfit at a consumer is recorded against `input-binding`'s contract rather than met with a second ladder, or a second rule for click or drag, in the consuming project.
2. **Adjust upstream, or fracture it if the gap reveals a second duty.** The contract holds its own open gaps this way: a timed trigger waits for a consumer, its time then a field of the facts, rather than binding reading a clock.
3. **Never fork.** Two binders that almost agree let what an input does, what help says it does and what a tester highlights disagree, which is the drift this component exists to eliminate.

---

## Edges

**Contains** - eight internal units in its anchored core: the binding table (`binding-table`), its declaration check (`binding-declaration`), the gesture session (`gesture-session`), its declaration check (`session-declaration`), the exact decision of a press's travel (`travel-beyond`), argument reading (`argument-reading`), judging a value at its own pointer (`reflection`), and problem records of a refused declaration (`declaration-problems`).

**Contained-by** - nothing; `input-binding` is a top-level registered component.

**Consumes** - nothing; `input-binding` depends on no other component, and its `package.json` lists no dependency.

**Consumed-by** - `drawv2` (draw, `apnex/drawv2`) and `input-tester` (the gesture tester, `apnex/input-tester`, which traces and matches its own tables and resolves every mouse press with `resolvePress`), which use `input-binding` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
