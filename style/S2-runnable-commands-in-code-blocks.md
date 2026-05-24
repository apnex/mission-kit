---
id: S2
category: style
title: Runnable workflow steps belong in code blocks
added: 2026-05-24
status: active
supersedes: []
related: [S1]
---

# S2 — Runnable workflow steps belong in code blocks

## Rule

Any command the reader is expected to **execute as a workflow step**
must appear in a fenced code block. Inline backtick mentions of
commands in prose are fine when they're **referencing**
(what does this command do? what flag should I think about?) rather
than **directing** (now type this).

The distinguishing test: *would the operator copy-paste this to run
right now, as part of the linear workflow being described?* If yes
→ code block. If they're just being told a command exists for
context, troubleshooting, or identification → inline backticks fine.

## Rationale

Code blocks signal "copy and execute"; inline backticks signal
"this is the name of a thing." Mixing them confuses copy-pasters,
breaks code-block tooling (syntax highlighting, copy buttons, doc
renderers, AI doc-parsers), and turns a workflow doc into a prose
treasure hunt where the reader has to mentally extract commands
from explanatory text.

The two roles are different. Workflow-step formatting tells the
operator's eye "stop reading, start typing." Reference-mention
formatting tells the eye "this is a technical term being discussed,
not an instruction."

## Examples

**Bad (workflow step in prose):**

> To verify the cluster is healthy, run `kubectl get nodes` and check
> STATUS is Ready.

**Good (workflow step in code block):**

> To verify the cluster is healthy:
>
> ```bash
> kubectl get nodes
> ```
>
> Expect a node with STATUS=Ready.

**Also good (reference mention, no execution implied):**

> The `kubectl rollout status` command is documented to take up to
> 60 seconds before declaring failure.

## When to apply

- Authoring any workflow doc (install, teardown, upgrade, runbook).
- Editing a doc that mixes prose explanation with operator steps.
- Code-review of a doc PR — scan for backticks inline with verbs
  like "run", "execute", "type", "do".

## Origin

Strict-mode test-drive of a teardown workflow — operator following
the docs verbatim shouldn't have to interpret prose to extract the
next command to type. The distinction between executable steps and
descriptive references became sharp once we ran the doc literally.
