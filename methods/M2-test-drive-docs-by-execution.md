---
id: M2
category: method
title: Test-drive docs by execution - run the steps, or have a cold reader reason with it
status: active
hydrate-when: You are about to ship a document someone will act on - an operator workflow, or a charter, axiom or other reasoning document an agent will rely on
supersedes: []
related: [S1, S2, M1, E4, A8]
---

# M2 - Test-drive docs by execution

## Rule

A document is tested by having its reader use it, not by its author reading it.\
Two kinds of document need two instruments, and the principle is the same for both: **a reading pass checks whether a document is internally consistent; only use by a fresh reader checks whether it works.**

### Workflow documents - execute the steps

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

### Reasoning documents - have a cold reader reason with it

A charter, an axiom, a definition or a vision has no commands to run.\
Its job is to change what a reader can decide, so it is tested by giving fresh readers the document and asking questions only a good version lets them answer.

1. **Write the probes and the answer key before anyone reads the document.**
   A key written after seeing answers grades toward the result its author wants.
   Commit it, so the order is provable.
   **Then have a fresh reader audit the key** against the documents it is about - not answer it, judge whether each answer is right - and correct it before anyone is scored.
   The key is the author's opinion, and a wrong one yields a confident wrong result: every key audited this way in this corpus has had errors corrected before use.
2. **Derive the probes from what the document is for, not from what was changed.**
   For a charter, probe each concern it must answer - routing an excluded item,
   choosing a member, finding a gap, relating members. Probes built around the
   edit can only confirm it.
3. **Include control probes the old version should already answer well.**
   They are what lets the test fail the new version: a change that improves
   three answers and damages two is not an improvement.
4. **Use fresh readers holding only the document.** No session history, no
   repository, no knowledge of which version they hold. Blind the versions.
5. **Require readers to separate what the document says from what they guess.**
   A correct guess is not evidence the document works; it is evidence the
   reader is capable. Score a grounded answer above an ungrounded one.
6. **Run several readers per version.** One reader's answer is an anecdote.
7. **When the scorer authored the change, ties go to the original.** The bias
   runs one way, so the correction must too.
8. **Read what the readers found, not only how they scored.** Fresh readers
   flag defects the author cannot see, including defects outside the document
   under test - in the members it governs, or in what it cites.
   **When most readers hedge on one probe, look for an ambiguity in the document before blaming the key.**
   A consistent hedge usually means the text does not say which of two rules governs; `tools/eval.mjs` lists such probes beside every result.

Compare old against new, never the new version alone.\
Some findings appear only in the old version's runs, because a clearer document can suppress a question worth asking.

---

## Why this terminates

A procedure for evaluating documents is itself a document, which invites the question of what evaluates it - and then what evaluates that.\
The regress stops only at something that is not another document.

Three things can stop it, and an evaluation is legitimate exactly to the extent it rests on one:

- **Execution.** A command runs or fails; a cold reader answers correctly or does not. The world decides rather than an argument. Both instruments above rest here.
- **Mechanism.** A script holds what it can hold and is checked by being run, which is why every rule this corpus can mechanise, it does.
- **Authority.** Ratification by the director is the authority that needs no further authority, and is where a judgement that neither of the others can settle comes to rest.

A step in any evaluation that rests on none of the three is the author's opinion presented as a finding, and is the step to distrust first.

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
A doc that's passed three reading-pass reviews can still strand a fresh operator at command 3.\
Execution is the only review pass that catches that.

**The same is true of a reasoning document, and the author is the worst possible reader.**\
An author who reads their own revision knows what each sentence was meant to say, so ambiguity is invisible to them and an absence looks like an obvious implication.\
The author is an instrument reporting on itself - the same family as itself - and a lone agent revising its own work has no second actor to catch it.\
A fresh reader is the cheapest available second actor, and the only one that reads the document as its real reader will.

---

## Examples

**Bad - workflow:**

> Reviewer reads the install doc end-to-end, checks every command
> for plausibility, signs off. First external operator runs
> command 1 and hits `permission denied` because the doc never
> mentioned which user / group / context is assumed.

**Good - workflow:**

> Reviewer opens a fresh shell on a fresh host (or as close as
> possible). Runs each command verbatim from the doc. On command 4
> the doc says *"now restart the service"* but the literal command
> isn't given - halt, record gap, add the explicit command to the
> doc, resume from command 4. Continue until the workflow
> completes. Each halt is one finding.

**Bad - reasoning:**

> An author revises a charter, reads old and new side by side,
> judges the new one better, and records the change as improving
> it. One edit is justified by the claim that the old wording
> misled readers. Nobody but the author has read either version.

**Good - reasoning:**

> The author writes six probes from what the set's members do -
> two the old charter already handles - and commits an answer key.
> Three fresh readers get the old charter and three the new, blind,
> each told to mark what the document says apart from what they
> guess. The new version answers every probe from quoted text; the
> old forces guessing on three. The controls score identically. And
> the old-version readers refute the author's claim that the old
> wording misled: all three read it correctly and called it
> ambiguous. The claim is corrected. Separately, all three flag a
> defect in a member procedure that the author never noticed.

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
- **Before ratifying a change to a charter, an axiom, a definition or a vision** -
  anything an agent reasons from, where a defect propagates into every decision
  made with it.
- **Not** for a change whose effect on what a reader can decide is negligible.
  Fresh readers are expensive, and running them on trivial edits is the ceremony
  this set's charter names as a fault. The test is whether a reader could act
  differently after the change; if not, a reading pass is enough.
