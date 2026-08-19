---
id: S9
category: style
title: Action-first README structure
status: active
supersedes: []
related: [S4, S5, S6, S7, S8]
---

# S9 - Action-first README structure

## Rule

Top-of-file README structure for an operator-facing project, in order:

1. **Title.**
2. **One-sentence elevator pitch** - what it is + one key trait.
3. **Status line** - a lifecycle marker: production / experimental /
   archived, plus supported platforms or versions if non-obvious. See
   below for what does not belong in it.
4. **Action paths** - install / use / test / remove (the
   [[S4]] four-journey table or pointers to deep-dive docs).
5. **Anything else** - deep-dive architecture, troubleshooting, "why this
   exists," backstory, philosophy. Order within "anything else" matters
   less; just keep it **below** the action paths.

### The status line is a lifecycle marker, not a changelog

It states what the project **is** - production, experimental, archived - and that claim holds until the lifecycle itself changes.\
What has *happened* to the project is a different kind of fact: how many times it was verified, on what date, against which run, how many deployments it has survived.\
That is point-in-time.\
A README is always current by construction, so a line asserting what was true when it was written has nothing to say and dates the document the moment it lands.

The test: **would a routine, uneventful run make this line wrong?** If yes, it is a changelog entry wearing a status line's clothes.

Supported platforms and versions are still fair game, because they are claims about what the project supports rather than about what was done to it.\
"Tested on P, Q, R" is a support claim.\
"Verified end to end by two live runs" is a changelog.

The principle: most readers arrived to ACT.\
They want to install / run / test / remove the thing.\
Backstory, design philosophy, and bug-description prose are valuable - but they don't gate action paths.\
Putting backstory first taxes every reader to subsidize the few who want it.

---

## Rationale

**Reader intent.** The README is a landing page.\
Some readers want to understand; most want to use.\
The action-seekers vastly outnumber the understanding-seekers in the steady-state.\
Optimize for the majority.

**Scroll cost.** Every line of backstory above the first install hint is a scroll the action-seeker must do before they can start.\
On a 200-line README, "Status" appearing at line 9 vs line 80 is a real cost in abandoned attention.

**Backstory belongs where readers look for it.** "Why does this exist?" "What problem does it solve?" "What was the design rationale?" are valid questions, but they're meta-questions.\
Readers who want them will scroll past the action paths or use the TOC.\
Putting them at the bottom doesn't hide them - it puts them where the small audience who wants them goes looking.

**Don't read your own README as a writer.** Writers tend to think "people need context first to understand the project." Readers experience the opposite - they need to ACT first; understanding solidifies through use.\
Resist the urge to front-load context.

---

## Examples

**Bad (backstory-first):**
```markdown
# foo-tool

foo-tool is a containerised utility that solves the long-standing
problem of bar-X by combining baz with qux, originally developed in
response to incident-Y on hardware-class-Z. Built on framework-A,
deployable on substrate-B, integrates with system-C through interface-D.
The patches add E, F, G, and H.

Status: in production. Tested on platforms P, Q, R.

## How it fits together

[7 paragraphs of architecture]

## Install

[first actionable command at line 80]
```

**Good (action-first):**
```markdown
# foo-tool

A containerised utility that solves bar-X on hardware-class-Z.

**Status:** in production. Tested on P, Q, R.

## Install

[immediate action - link to deep-dive doc for full steps]

## Use

[immediate action]

## Test

[immediate action]

## Remove

[immediate action]

## Architecture

[the 7 paragraphs that used to be at the top]

## Why this exists

[backstory + design rationale]
```

**Bad (changelog entries):**
```markdown
Status: working - verified end to end by two live bootstraps.
Status: working - each root applied and destroyed repeatedly.
Status: stable as of 2026-08-06, 14 deployments without incident.
```

**Good (lifecycle markers):**
```markdown
**Status:** production. Tested on P, Q, R.
**Status:** experimental.
**Status:** archived - superseded by <other-thing>.
```

Every line in the first block needs editing after an ordinary run.\
None in the second does.

---

## When to apply

- Writing a new operator-facing README.
- Rewriting an existing README that suffers from the
  too-much-backstory-first pattern.
- Reviewing a README PR - check that the first actionable command appears
  within the first ~30 lines of source.
