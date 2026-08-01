---
name: survey
description: Capture open stakeholder intent through two sequential three-question rounds, preserve exact evidence and authority, and produce one ratified self-contained planning envelope; use before design when direction remains open.
---

<!-- GENERATED FILE. Edit canonical fragments and projection recipes, then run ./compile.sh. -->

# Survey

Use Survey before committing to a design when stakeholder direction remains open. Bypass it only when intent is already fixed and recorded; never use it to manufacture Director authority.

Run `scripts/survey-init.mjs` once for a new run, persist cognitive drafts through `scripts/survey-transition.mjs`, and use `scripts/survey-present.mjs` for the exact current Director view. Consult `scripts/survey-status.mjs` on takeover and `scripts/survey-envelope.mjs` only for ratified finalization or byte checking.

## Authority

| Authority | Sole work |
|---|---|
| Proposer | Author questions, interpretations, tensions, mappings and composite intent. |
| Bound Director | Supply picks and rationale, return or clarify a candidate, abort, and ratify exact reviewed bytes. |
| Deterministic substrate | Validate shape, hash, freeze, persist, replay, normalize declared picks, project and render. |
| Mechanical validator | Produce pass/fail evidence; never decide semantic correctness. |
| Runtime host | Supply actor context, one writer lease, and explicit dependency bindings. |

Require the Director actor reference to equal the session’s `directorRef` for
every pick, walkthrough acknowledgement, return, withholding withdrawal and
ratification. Treat that equality as host provenance unless an embedding host
also supplies authenticated identity evidence.

Never let this package authorize a canonical cutover or a live Director
canary. Those remain external decisions.
## Instrument

Design exactly three questions together for each round. Give every question a
distinct intent dimension, three or four stable options, an explicit
`composable`, `exclusive`, or `mixed` relationship, declared mixed-option
incompatibilities, design rationale, outcome-axis pre-anchors, and evidence
references.

For Round 2, bind the draft to the sealed Round-1 semantic digest and mark each
question `refines`, `challenges`, `disambiguates`, or `deepens`. Validate the
complete draft, canonicalize it, and seal its digest before the first
presentation attempt. After that attempt, reject any question or option
mutation as an integrity failure.
## Disclosure

Present only the current question’s prompt, its three or four options, and the
minimal instruction to pick one or more letters. Do not reveal a later title,
option, draft, aggregate lean, interpretation, or semantic feedback between
picks.

Commit the current outbox payload and attempt before emission. Treat an
`*_awaiting` state as an attempt, not proof of receipt. A valid Director
response acknowledges a question; `next` acknowledges a walkthrough segment.
After an ambiguous delivery crash, re-emit only the digest-identical current
payload through TF02.

Route objective future-question or inter-pick priming leakage to RT13 and a new
linked run.
## Pick capture

Preserve the Director’s response byte-for-byte. Normalize case and whitespace,
remove duplicate letters, and order selections by declared option order.
Accept one or more current-question option IDs only.

Accumulate composable picks. Preserve an exclusive multi-pick as a
contradictory-constraint record rather than rejecting or choosing for the
Director. For mixed questions, derive contradictions only from declared
incompatibility sets.

Make every accepted pick immediately immutable. Treat the same event ID and
payload as an idempotent replay; treat the same event ID with changed payload
as an integrity fault. Invalid or empty input records RJ01 and leaves state,
cursor, and current view unchanged.
## Interpretation order

Begin a round interpretation only after all three raw responses, normalized
picks, contradiction records, and the response-set digest are durable. Author a
complete immutable draft containing one interpretation per question, the
round composite, outcome-axis mapping, anchors, tensions, and applicable
dependency mappings.

Commit the complete draft and its validated hook output atomically. Do not ask
the Director to approve intermediate interpretations, and disclose no
interpretation between picks.
## Round-2 anchoring

Open Round-2 design only from the exact sealed Round-1 semantic digest. Carry
the work item, outcome axes, all three Round-1 picks, per-question readings,
composite, mappings, anchors and tensions into the proposer context.

Give every Q4–Q6 question one explicit relation to the Round-1 aggregate:
`refines`, `challenges`, `disambiguates`, or `deepens`. Persist that relation
in the instrument and final envelope. If a requested correction changes
Round-1 meaning after Round 2 exists, terminally block this run and create a
linked run.
## Ratification and handoff

Compose one envelope model containing methodology and authority, source work
item, axes, complete frozen instrument, raw and normalized picks,
interpretations, mappings, contradictions, tensions, uncertainty, composite
intent, scope, anti-goals, open design questions, dependency evidence,
calibration and the exact `intent-open → intent-captured` handoff. Do not
require branch strategy, review strategy, implementation sequencing or
compressed timelines.

Seal immutable semantic and rendered candidate digests. Walk the Director
through every frozen segment before presenting one exact ratification view.
Only the bound Director may ratify. Preserve withholding and corrections;
rebuild every affected descendant and repeat the walkthrough and ratification.

The reviewed candidate carries an explicit pending ratification target and
cannot pre-claim Director approval. After T31, the deterministic substrate
changes no reviewed intent content: it appends a detached mechanical
attestation containing the Director event ID and the exact reviewed semantic
and render digests. This avoids both a circular self-digest and a final artifact
that falsely says ratification is pending.

Render those terminal self-contained bytes into state before T35. T35 seals
their distinct handoff digest and target path atomically, then closes the run.
Materialize the file after commit and verify its digest before reporting a
successful handoff.
## State and resume

Store each run beneath `surveys/<slug>/<session-id>/` and refuse reuse. Keep
accepted events, rejected-command audit, idempotency records, outbox attempts
and acknowledgements, dependency snapshots, cognitive drafts, semantic
artifacts and the reproducible materialized product state in one atomic
`session.json`.

For every mutation, hold one exclusive writer lock; verify expected revision,
event chain and snapshot; interpret the manifest transition; validate the
complete next document; fsync a sibling temporary file; rename it over
`session.json`; fsync the directory; then emit any committed view.

On process start, rehydrate before phase work. Reproduce the exact current
view and use sealed dependency bytes. If the session is too corrupt to append
RT08 honestly, create OQ01 as a fsynced, hard-link/no-replace
`quarantine.json`; refuse every command and preserve the run for linked restart.

### Runtime invocation contract

CLI arguments use `--key=value` form. The package root is inferred from each
script; `--sessions-root` is the explicit location for run state:

```sh
node scripts/survey-init.mjs \
  --slug=work-item --session-id=run-1 --work-item="Intent to capture" \
  --outcome-axes=scope,quality --director-ref=director \
  --proposer-ref=proposer --sessions-root=/absolute/session/root
node scripts/survey-status.mjs --run=/absolute/session/root/work-item/run-1
```

Use `survey-transition.mjs` only for proposer-owned commands, with
`--payload-json=...` or a no-symlink `--payload-file=...` beneath
`--payload-root`. Use `survey-present.mjs` for substrate presentation and
`survey-envelope.mjs` for terminal materialization or `--check=true`.

Director-owned commands deliberately have no role-spoofable CLI. An embedding
host imports `applySurveyCommand` from
`source/executables/runtime/lib/engine.mjs`, authenticates the respondent,
binds the exact session `directorRef`, and supplies an assertion source prefixed
by `host-adapter:`. A disposable synthetic-Director adapter may do this only
inside its evaluation namespace.

## Runtime references

- [Question design](references/question-design.md) — read when that boundary controls the current step.
- [Interaction protocol](references/interaction-protocol.md) — read when that boundary controls the current step.
- [Interpretation](references/interpretation.md) — read when that boundary controls the current step.
- [State and resume](references/state-and-resume.md) — read when that boundary controls the current step.
- [Dependency resolution](references/dependency-resolution.md) — read when that boundary controls the current step.
- [Envelope contract](references/envelope-contract.md) — read when that boundary controls the current step.
- [Validation](references/validation.md) — read when that boundary controls the current step.
- [Protocol FSM](references/protocol-fsm.md) — read when that boundary controls the current step.
- [Director FLOW](references/director-flow.md) — read when that boundary controls the current step.
- [Mechanism index](references/mechanism-index.md) — read when that boundary controls the current step.

The only successful terminal handoff is the exact envelope path and digest sealed by T35. A generated file, validator, or proposer cannot ratify for the Director or authorize promotion.
