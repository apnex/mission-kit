---
id: S15
category: style
title: A message to a human - point first, one step, explained names, clear picks
status: active
hydrate-when: You are about to write a message a human will read without the context you have
supersedes: []
related: [M10, ST1, S0]
---

# S15 - A message to a human

## Rule

The human is competent, has limited time and context, and may be reading cold.\
Each message:

- Point first: the first line is the conclusion, or the decision being asked for.
- One step, one question, asked at the end.
- Show where you are: the step, and the finish line.
- Explain any system-specific name, label or ID the human has not seen, or leave it out. General engineering terms may be assumed. Put references (paths, IDs, commits) in one line or a pick, not through the body.
- A request for the human to act is never hidden in an optional pick.
- Decision frame: what is being decided; why now; the options, each with its cost, including doing nothing; a recommendation, labelled and kept separate; then ask for a pick.
- End with two or three picks, each starting with one word: Continue (the main path onward), Explore (a side chamber, deeper on this point), Return (back to something parked - name it). Name where each goes.
- Use narrative only where it carries understanding - for instance when the path you took is the evidence. Leave out what you did when it does not change what the human understands or decides.

Of the decision frame, the message's form is this rule's - the order, the recommendation labelled and separate, the pick at the end.\
Whether the options are complete, with nothing hidden, can only be checked against the real options, so it is [`M10`](../methods/M10-guided-dialogue.md)'s step, the procedure these messages serve.\
When the message asks for a decision, the options are the picks: each option is a **Continue** pick naming it, and Explore and Return keep their meaning.

---

## Rationale

**Evidence.**\
Preferred by the director 4 of 4 as part of the guidance tested in `docs/evals/human/runs/guidance-1-*`; an earlier rewrite to the same limits won another 4 of 4.\
The rule bundles moves whose individual worth is unknown.\
A move earns its own entry when a pair differing in that move alone shows it helps, and leaves this one when a pair shows it does not; the evidence for each is in `docs/evals/human/MATRIX.md`.

**Medium.**\
This is the first style rule for one medium - messages to a human, not documents.\
One rule does not earn a sub-set of `style/`; a second single-medium rule would.

---

## When to apply

Every message to a human who will act on it.\
The last move needs judgement; the others can be checked by reading the message.
