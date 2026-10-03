---
id: M10
category: method
title: Guided dialogue - lead a human to understanding, then to a recorded decision
status: active
hydrate-when: You need a human with limited context to understand something or decide something
supersedes: []
related: [S15, ST1, W24, W23, AR4, A13, A12, A5, A4, A8, A3]
---

# M10 - Guided dialogue

## Rule

Use this whenever you need a human to understand something or decide something.\
The human is competent, has limited time and context, and may be reading cold.

**The two limits you are moving toward:**

- Understand: the human ends up seeing what you see on the point - nothing missing that matters, nothing extra - reached one confirmed step at a time, with depth available on request and never pushed.
- Decide: one decision at a time; the human knows why it is needed now and what each option costs, including doing nothing; nothing is chosen for them or hidden; they can answer with a pick, not a paragraph; the reasoning is recorded so it can be revisited.

**The steps:**

1. Know the finish line before you start, and say how many steps remain.
2. Give one step per message, and stop at a pause point - each message in the form [`S15`](../style/S15-message-to-a-human.md) sets.
3. If a decision depends on understanding, establish the understanding first, and confirm it has landed.
4. Ask for one decision per message, in `S15`'s decision frame. The options include each one with its cost and doing nothing, and none is hidden - checking that needs the real options, so it is this step's, not the message's form.
5. Record the decision and its reasoning where it will be found later; say where in one line.

---

## Rationale

The limits are derived from axioms: `A5` that the human sees what the agent sees, `A12` that nothing extra reaches them, `A8` that each step lands before the next builds on it, `A4` that depth is kept rather than deleted, `A3` one concern per exchange, and `A13` that the director's attention goes to judgement and their decision is never narrowed.\
The director stated the need and left the implementation to the agent; the agent derived the limits and wrote the guidance, and it was tested on the director.\
The director confirmed the understand limit in words, and proceeded from the decide limit without confirming it in words.

**Evidence.**\
A fresh agent given this guidance, against one without it, on four new scenarios: preferred 4 of 4 (`docs/evals/human/runs/guidance-1-*`).\
The evidence is for the guidance as a whole, from one human; no single step's share is known (`docs/evals/human/MATRIX.md`).

---

## When to apply

Whenever a human must understand or decide, and especially when they have not followed the work.\
A recorded decision belongs in a decision record ([`AR4`](../artifacts/AR4-decision-record.md)); [`W23`](../work-types/W23-capture-decision-and-ratify.md) is the unit of work that captures and ratifies one.\
[`W24`](../work-types/W24-director-walkthrough.md), a live walkthrough the director leads, cites this procedure as the one that conducts it.
