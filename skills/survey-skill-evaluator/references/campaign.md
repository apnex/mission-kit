# Campaign workflow

Create authored inputs with `campaign init`. Before execution, seal the exact
candidate and control bytes, claim, estimand, population, scenarios, semantic
keys, assignments, reviewer allocation, stopping rule, metrics, judging policy,
analysis plan, and recommendation policy.

Validate all schemas, package roots, authority bindings, family/cohort
authorizations, assurance admission, and lifecycle preconditions. Advance state
only through the registered lifecycle transition tuples. Persist accepted or
rejected event, resulting state, semantic cursor, and outbox atomically.

Use `campaign run` for a first advance and `campaign resume` after a crash.
Replay identical commands idempotently; reject changed bytes under the same
identity. Status is read-only. Reports derive only from sealed evidence.

Retain every assignment and terminal attempt. Failure first fences new work and
drains the complete realized-child cut, including never-granted positions,
before terminal campaign closure.
