# statusline-pi

A **swarm-aware, 2-line footer** for the pi coding agent - the multi-agent-network evolution of the Claude `statusline/` example (which is retained alongside this one).

Where the Claude statusline answers *"how is MY session?"* for a single human-driven CLI, this footer answers, for an autonomous agent embedded in a live multi-agent network: **"how am I doing, what am I doing, and does the network need anything from me?"**

**Status:** design-of-record (RATIFIED); implementation sliced + pending.\
This is a **design reference**, not a drop-in script - the footer is a native pi extension (`@apnex/pi-plugin`), not a bash statusline hook.\
The Claude `statusline/` remains the runnable bash example.

This artifact is a canonical instance of **[A5 - Perceptual Parity](../axioms/A5-perceptual-parity.md)** (Pre-Attentive Rendering; "agents never ask 'what is the status of X?'"), composed under **[A3 - Sovereign Composition](../axioms/A3-sovereign-composition.md)** (render lives in the last-mile shim, not the shared core), **[A11 - Cognitive Minimalism](../axioms/A11-cognitive-minimalism.md)** (fixed 2-line budget, zero hot-path cost), and **[A12 - Precision Context Engineering](../axioms/A12-precision-context-engineering.md)**.

---

## The line

Two physical lines, **fixed height** (row count never collapses -> zero terminal reflow-jank).\
Line 1 = SELF, line 2 = WORLD:
```text
 lily-arch │ ctx 17% [34k/200k] │ llm ok
 work idle │ hub [live] [45s] │ peers * * * │ nothing needs you
```

Grammar (inherited from the Claude `statusline/`): **pipes `│` delimit functional GROUPS; brackets `[ ]` enclose critical VALUES.**\
Color is an accelerator, never the sole carrier - glyph + value + text carry severity on monochrome terminals.\
No `alert`/`all clear` verbiage: calm = absence of amber/red.

**Line 1 - SELF** (*how am I doing*):
- `identity` - `name-role`.
- `ctx` - `PCT [used/total]` (the exact Claude-statusline `ctx:` grammar). Green <70% / amber >=70% / red >=90%.
- `llm` - model-call health. First slice: coarse error tally (`ok` / `WARNING err xN`, rolling window). Full retry/backoff/code ribbon is gated on an upstream pi extension hook.

**Line 2 - WORLD** (*what I'm doing + what's happening*):
- `work` - current WorkItem + remaining lease `[Nm Ns]` (from the client-side lease; no network poll).
- `hub` - the adapter session FSM, mirrored verbatim: `[disc]` / `[conn...]` / `[sync]` / `[live]` / `[recon]`. `[live]` is the only nominal state.
- `peers` - swarm population, exception-biased (`* * * ` healthy -> `[WARNING name down]` on trouble).
- `--> needs-you` - the role-scoped actionable surface.

The live incrementing model-call timer lives at the **prompt** (Claude-style `retry Working... (esc - 12.7s)`), not the footer - so the footer never runs a 1Hz render loop.

---

## Honesty (A5 / A1)

The hub FSM state **gates downstream honesty**: only `[live]` shows fresh data + trusted peers/needs.\
In `[recon]`/`[sync]` the swarm cells are stale-marked; in `[disc]` they render `?`, never zeros or "all clear."\
Stale data never red-alerts and never masquerades as nominal.\
Perception surfaces verified reality or an explicit unknown - never an invented one.

---

## Divergence from the Claude statusline

| | `statusline/` (Claude) | `statusline-pi/` (this) |
|---|---|---|
| Host | Claude Code (bash hook + `jq`) | pi (native extension, `@apnex/pi-plugin`) |
| Scope | single session (me) | me **+** the multi-agent swarm |
| Lines | 1 | 2 (fixed-height) |
| Quota/burn `5h/7d [t: x]` | [x] shipped | deferred (needs a hub-side quota-observability surface; the Claude form is the target grammar) |
| Swarm (hub FSM, peers, needs-you) | - | [x] the reason it exists |

---

## Source of record

Full ratified spec (cell specs, feedability grounding, fail-quiet cascade, acceptance gates, A5 measurability): the agentic-network design doc `docs/designs/m-swarm-footer/ratified-spec.md` (mission-97 design arc; implementation = mission-99).\
This kit entry is the portable design summary; the spec is authoritative.
