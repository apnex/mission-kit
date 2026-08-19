---
id: M2
category: methodology
title: Test-drive docs by execution
status: active
hydrate-when: You are about to ship an operator-facing workflow document to someone who will run it
supersedes: []
related: [S1, S2, M1]
---

# M2 - Test-drive docs by execution

## Rule

Validate a workflow doc by **executing it against the live system**, command by command, as a literal operator would.\
The ground rules:

1. Each command run is **copy-pasted verbatim from the doc**. No
   silent fix-ups. No memory-recalled flags. If you'd need to add
   a flag to make it work, that's a doc bug - record it.
2. **Halt on the first action that isn't in the doc.** That gap is
   the finding. Fix the doc, then resume.
3. **Run on the real substrate**, not a synthetic stand-in. Doc
   bugs about authentication, ordering, prereqs, and state
   asymmetry only surface against the real thing.
4. Reading-pass review precedes this (typos, structure). Execution
   pass is what finds the semantic gaps.

---

## Rationale

Reading-pass review checks whether the doc is internally consistent.\
Execution-pass review checks whether it matches reality.\
The two failure modes are different:

- Reading catches: typos, broken cross-links, misnamed flags,
  missing code blocks, prose-vs-step ambiguity.
- Execution catches: missing prereqs, wrong command ordering, false
  assumptions about prior state, asymmetric init/teardown
  (e.g., installer creates 7 things, uninstaller removes 6),
  inherited environment that worked for the author but won't for a
  fresh operator, "this command succeeds with NotFound" assumptions
  documented as failures.

These are not the same bug class.\
A doc that's passed three reading-pass reviews can still strand a fresh operator at command
3. Execution is the only review pass that catches that.

---

## Examples

**Bad:**

> Reviewer reads the install doc end-to-end, checks every command
> for plausibility, signs off. First external operator runs
> command 1 and hits `permission denied` because the doc never
> mentioned which user / group / context is assumed.

**Good:**

> Reviewer opens a fresh shell on a fresh host (or as close as
> possible). Runs each command verbatim from the doc. On command 4
> the doc says *"now restart the service"* but the literal command
> isn't given - halt, record gap, add the explicit command to the
> doc, resume from command 4. Continue until the workflow
> completes. Each halt is one finding.

---

## When to apply

- Before shipping any operator-facing workflow doc to external
  users.
- After any major refactor of an install / teardown / runbook.
- When onboarding a new operator - their first traversal of the
  doc is itself an execution-pass review; capture every halt as a
  doc bug.
- When a doc has been "stable" for a while but the underlying
  system has evolved - drift only surfaces under execution.
