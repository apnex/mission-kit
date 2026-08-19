---
id: K4
category: skill
title: research-artefacts — discipline for producing persistent research outputs
status: active
supersedes: []
related: [K3, M1, M3, S6]
---

# K4 — research-artefacts

## Rule

When producing any research artefact intended for future re-reading
(by humans or AI agents), apply four non-negotiable disciplines:

1. **Tier separation** — keep behaviour (Tier 1), mechanism (Tier 2),
   and analytical interpretation (Tier 3) in distinct sections or files.
   Mixing tiers destroys re-readability: a reader hunting for "what
   does this do" should not have to wade through opinion, and a reader
   hunting for "is this good" should not have to extract claims from
   prose.
2. **Signal density** — default to terse, structured entries
   (§-style slot blocks, tables, bullet stacks) over paragraph prose.
   Paragraphs are appropriate when explaining *why*; everything else
   compresses better as structure.
3. **Scaffolding before content** — establish the folder layout, file
   templates, and naming conventions of an artefact set *before*
   writing the first entry. Retro-fitting structure onto an
   accumulated pile of prose is strictly more work than starting
   structured.
4. **Two-pass discipline** — descriptive work (what the substrate is,
   in its own vocabulary) and comparative work (how it stacks up
   against alternatives) are **strictly separate passes**. Mixing
   them contaminates the descriptive pass with comparison bias and
   makes the artefact unreusable for any reader with a different
   comparison frame.

These four rules apply regardless of substrate, audience, or output
format. They are necessary preconditions for any research output that
will be re-consulted; without them, artefacts decay into write-only
prose within weeks.

## Rationale

Research artefacts that violate these rules survive one reading and
then ossify — the original author can still navigate them, but no
second reader (human or agent) can extract value without re-doing
the underlying investigation. The four rules each address a specific
decay mode:

- **Tier separation** prevents "every paragraph is an opinion piece"
  rot, where readers cannot separate fact from analyst-voice.
- **Signal density** prevents "wall of prose" rot, where finding any
  specific claim requires re-reading the entire document.
- **Scaffolding-first** prevents "everything is a special case" rot,
  where each new entry invents its own shape and the set as a whole
  becomes uncrawlable.
- **Two-pass discipline** prevents "comparison-tainted description"
  rot, where descriptive sections quietly assume the comparison frame
  of the moment they were written and become misleading once that
  frame shifts.

A research artefact that follows all four rules is reusable by future
investigators with different goals; one that violates any single rule
typically is not.

## When to apply

- Any persistent research output: substrate audits, vendor
  evaluations, design journals, technical briefs, comparison
  matrices.
- Any artefact that will be re-read after the session that produced
  it (i.e. almost all research output).
- Any output destined for a knowledge repository where future readers
  will not have access to the original investigator.

Skip the discipline only when:

- The output is a throwaway scratch note that will be discarded
  inside the session.
- The output is a single-screen one-shot answer with no archival
  intent.

## Tooling

Full discipline, including foundational vocabulary and worked
examples, lives in the skill tree at
[`research-artefacts/`](research-artefacts/). The SKILL.md is the
canonical source; this entry is the mission-kit index handle.

This skill is referenced as a **foundational dependency** by `K3`
(`substrate-audit`) — every substrate audit must obey the four rules
above before its findings can be considered well-formed. It is
included in the `nanoprobe` bundle alongside `substrate-audit`
(see [`bundles/nanoprobe.yaml`](../bundles/nanoprobe.yaml)).
