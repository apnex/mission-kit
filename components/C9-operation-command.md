---
id: C9
category: component
title: operation-command - declarative CLI dispatch, honest exit statuses, and shell-safe repeat commands
status: active
hydrate-when: You are about to build a command-line interface for agents or humans and write flag parsing, env fallbacks, output formatting or exit codes by hand
sovereignty: internal
supersedes: []
related: [C0, C3, C5, C8, A1, A2, A3]
---

# C9 - operation-command

Sovereignty is `internal`, so a fit gap here is pressure that routes upstream rather than a constraint a consumer works around.

---

## Duty

Turn a declarative command specification into a command-line program whose exit status and output report how the underlying operation ended, and how to repeat it when the ending is unknown.

That is the whole duty.\
It does not also execute network calls itself, retry unknown operations automatically, run an interactive REPL or TUI, or decide authorisation - each of those belongs to [`C5`](C5-operation-call.md), [`C8`](C8-operation-proxy.md), or the application.

At the altitude below this one it is twelve units in its anchored core, listed under `Edges`.\
That is the anchored core of one box, per [`C0`](README.md#duty-is-singular-at-an-altitude), not twelve duties.

---

## Contract

What a consumer depends on, and what it may not reach past.

| surface | contract |
|---|---|
| declarative program (`declareProgram`) | declares commands, flags, environment-variable fallbacks, defaults and value types (`string` with optional regex pattern, `integer`, `duration`, `url` validated by WHATWG `URL` round-tripping and optional pattern, `boolean`, `repeatable`) as data; flag overrides environment variable, which overrides default (`OC1`) |
| distinct exit statuses (`EXIT_STATUS`) | exits `0` on `answered`, `1` on usage error or interruption before an invocation starts (`INTERRUPTED_LINE`, one diagnostic line on `stderr`, nothing invoked), `2` on operation `refused`, `3` on `not-delivered` (client preparation or send refused before any effect), and `4` on `unknown` (`RUN_FAILED`, including when an application's `run` callback throws or returns malformed data read through [`C3`](C3-shape-check.md)) |
| JSON and plain wordings | with `--json`, prints one self-contained JSON record per part and ending; without `--json`, formats answers and streamed parts through the command's plain wording function, falling back to JSON with one diagnostic line (`OC4`) if a broken peer returns an answer lacking a field the plain wording requires |
| shell-safe repeat (`repeat-command-line`) | every `unknown` ending includes the exact command array (in JSON) and single-quoted POSIX shell command line (in plain output) that repeats the call with the effective settings used (omitting any flag marked secret), carrying `--invocation <id>` when the command mutates state so the destination's repeat recognition applies, and omitting `--invocation` for read-only commands (`OC5`); streaming commands also print `partsTaken` and `resume` cursor state |
| generated reference (`formatReference`) | generates the CLI's `--help` and reference text directly from the command declaration data (`OC6`), so documentation and parser never drift |
| process runner | `@apnex/operation-command/process` exports `runProcess`, wiring `process.argv`, `process.env`, `stdout`, `stderr`, `SIGINT`/`SIGTERM` handling and `process.exitCode` to the declared program |

The command declaration and the wording callbacks are the seams: adding a subcommand is a data entry in `declareProgram`, not new parser or exit-status code.

---

## Reference

The sovereign repository `apnex/operation-command` (`@apnex/operation-command`), with its vision in `VISION.md`, its contract in `CONTRACT.md`, and its machine-checked surface in `export-map.json`.

The contract and export map state what is served now, so this reference stays true without a version recorded here.\
Where `export-map.json` records `deferred: {}`, current and target have not diverged.

Do not read the implementation to judge fit.\
If duty, contract and fit criteria are insufficient to decide, that is a defect in this entry.

---

## Fit criteria

### Does my project want this at all

Read this half first, before knowing anything about `operation-command`.\
If none of it describes you, stop here.

- You are exposing application operations as a CLI that scripts, CI pipelines or language-model agents invoke.
- You are about to write `process.argv` flag parsing, `process.env` fallback precedence, `--json` switches, or exit-code mappings by hand.
- Agents running your CLI need a distinct exit status when a write's outcome is `unknown` (`exit 4`) and a ready-to-run command line that safely repeats the write under its original invocation ID.

### Does it meet my requirement

- Every setting follows strict `flag > environment variable > default` precedence (`OC1`), and invalid flags fail with `exit 1` before touching the network or starting a proxy.
- Both whole answers and streaming multi-part answers (`follow`, paged `find`) are supported in `--json` and plain text.
- Help text (`formatReference`) is derived from the same declaration that parses arguments (`A2`).

**It is the wrong tool when**

| you need | reach elsewhere, because `operation-command` is |
|---|---|
| an interactive TUI, full-screen prompt, or stateful shell REPL | not a terminal UI - each invocation runs one command and exits |
| an in-process TypeScript SDK for programmatic callers | not an SDK - expose your client on [`C5`](C5-operation-call.md) or [`C6`](C6-entity-api.md) and wrap it with `operation-command` for the CLI |
| automatic retry loops inside the CLI process | not a retrier - it prints the repeat command on `exit 4` so the caller or agent decides |

---

## Adjustment policy

Internal and sovereign, so a fit gap has somewhere to go.

1. **Record the gap where both sides can see it.** A flag type, output mode or signal-handling requirement that `declareProgram` cannot express is recorded against `operation-command`'s contract.
2. **Close it at a seam where one exists.** Runtime process streams and clocks sit behind `runProcess` and `systemCommandClock`, while core dispatch is runtime-neutral.
3. **Never fork.** Hand-rolled CLI parsers across projects re-introduce exit-code ambiguity and flag/doc drift.

---

## Edges

**Contains** - twelve internal units in its anchored core: program dispatcher (`program`), declaration validator (`declaration`, `declaration-types`), argument and environment reader (`reading`), typed value parser (`values`, `value-text`), client-value plain-data reader (`client-value`), ending formatter (`endings`), repeat-command builder (`repeat`), stream resume tracker (`resume`), reference formatter (`reference`), clock port (`system-ports`), and the OS process adapter (`process-adapter`, which `implements` the process runner port).

**Contained-by** - nothing; `operation-command` is a top-level registered component.

**Consumes** - [`C5`](C5-operation-call.md) (`operation-call`) for call-ending, invocation-identity and deadline contracts, and [`C3`](C3-shape-check.md) (`shape-check`) for plain-data reading of client return values ([`E5`](../entities/E5-system.md)).

**Consumed-by** - `zorg` (`@apnex/zorg-cli`), which uses `operation-command` through its declared contract without containing it ([`E5`](../entities/E5-system.md)).
