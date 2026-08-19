---
id: S14
category: style
title: Hydration triggers state a condition, not a topic
status: active
enforced-by: tools/s14-hydration-triggers.sh
hydrate-when: You are adding a catalogue entry, or reviewing one that has never routed anyone
supersedes: []
related: [S11, A11, A12]
---

# S14 - Hydration triggers state a condition, not a topic

## Rule

Every catalogue entry declares `hydrate-when` in its frontmatter, and that value states a condition an agent can evaluate against what it is doing right now.

A condition can be answered yes or no at a moment.\
A topic cannot, so it never fires.

```yaml
hydrate-when: You are about to write or edit a document another agent will read
```

The trigger is the only part of an entry a reader sees before deciding whether to open it, so it carries the whole routing decision.\
An entry with no trigger is reachable only by someone who already knew it existed, which is the same value as no entry.

---

## The discriminator

Ask whether the sentence could be false right now.

- **Topic.** Names a subject area. Always equally true, so it never selects a moment. *Authoring documents.*
- **Condition.** Names a state of the work or an action about to be taken. True at some moments and false at others. *You are about to write a document another agent will read.*

A useful second test: could two agents doing different work disagree about whether it applies?\
If not, it is a topic.

---

## Form

State the condition in the second person, present tense, as a single sentence.

- Address the agent directly, so the evaluation is about its own situation.
- Describe the state, not the entry. The trigger is not a summary of what the entry contains.
- Qualify where the boundary is real. A trigger that fires on everything routes nothing.
- One sentence. A trigger long enough to need two is describing the entry, not the moment.

---

## Checking

The form is mechanically decidable and is enforced by `tools/check-style.sh --rule S14`.

It requires the value to be present, to be a single sentence of at least thirty characters, to differ from the entry's title, and to carry at least one condition marker:
```
you are | you have | you need | you must | before you | after you
about to | is still | has been | when the | if the | while the
```

The marker list is a proxy for the discriminator above, not a substitute for it.\
A sentence can carry a marker and still name a topic, which is why the rule states the test and the checker only catches the obvious failures.

---

## Examples

**Good.**

```yaml
hydrate-when: Direction is still open and you are about to commit to a design
hydrate-when: You are naming anything another agent must find by plain-text search
hydrate-when: You have two readings that both survive the evidence and cannot separate them
```

Each names a state the agent can check.\
The first fires during design and not during implementation; the second on naming and not on reading; the third only when stuck in a specific way.

**Bad.**

```yaml
hydrate-when: Documentation standards            # topic, always true
hydrate-when: Use this when writing docs         # describes the entry, not the moment
hydrate-when: Any engineering work               # fires on everything, routes nothing
hydrate-when: Plain ASCII in markdown            # restates the title
```

---

## When to apply

- Adding any catalogue entry.
- Reviewing an entry whose trigger has never been evaluated against real work.
- Noticing that an entry you needed was one you already knew about, which is evidence its trigger did not do the routing.
