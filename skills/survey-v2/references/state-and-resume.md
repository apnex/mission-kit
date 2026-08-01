<!-- GENERATED FILE. Edit canonical fragments and projection recipes. -->

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
