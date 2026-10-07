---
id: M7
category: method
title: Axiom alignment audit - required gate for extensive planning/design
status: active
hydrate-when: You are about to implement a design that changes shared procedure, governance, coordination or anything other agents will rely on
related: [M1, RU3, PC1, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14]
---

# M7 - Axiom alignment audit

## Rule

Every **extensive planning or design exercise** must undergo a dedicated axiom alignment audit before implementation approval.

The audit is a [gate](../entities/E7-gate.md), not decoration.\
It maps the proposed plan/design to the active charter axioms, names load-bearing alignments, exposes tensions, and records a verdict: a pass, with any guardrails implementation must keep, or a fail, with what the design must change.

Do not use axioms to generate a preferred answer from an unverified story.\
Establish reality first, design from evidence, then use axioms to interrogate the near-final artifact.

This governs the order of reasoning about **facts**: an axiom never tells you what is true of a system, so where the system stands is established by evidence first.\
It does not stop axioms guiding design.\
An axiom states a limit the system is built toward ([`A0`](../axioms/README.md)), so it gives the direction a design should move the system, and evidence gives where the system stands; a design needs both.

---

## When this is required

Run an axiom alignment audit when any of these are true:

- the plan/design creates or changes reusable methodology, workflow, skill, template, or operating procedure;
- the design introduces or changes substrate behavior that other agents will rely on;
- the design is a governance, coordination, lifecycle, delivery, verification, or authority pattern;
- the work is extensive enough to require council input, Director approval, a blueprint, a verifier gate, or a closeout packet;
- the work touches multiple roles or changes what future agents will perceive as normal procedure.

A short local fix - a bug, a typo, a wording correction - does not require a standalone audit unless it changes operating doctrine or a reusable seam other work relies on.\
When unsure, run the audit.\
The cost is small; the missed-gate cost is compounding drift.

---

## Required sequencing

1. **Establish reality.** Read the real code, entities, prior decisions, WorkGraph state, and observed incidents before invoking axioms.
2. **Produce the plan/design.** Let evidence and stakeholder intent shape the proposed mechanism, and the axioms in force set the direction it moves the system.
3. **Audit the near-final artifact.** Map it to axioms and look for gaps, contradictions, overreach, and missing proof.
4. **Record deltas.** If the audit finds a flaw, either update the design or have the director accept the deviation, recorded as an override.
5. **Gate implementation.** Do not start implementation until the audit passes, or the director overrides a fail, recorded as an override and never as a pass.
6. **Carry guardrails into validation and closeout.** Tests, verifier gates, delivery claims, and closeout packets must reference unresolved guardrails.

---

## Audit artifact contract

The audit artifact must include:

| Section | Required content |
|---|---|
| Identity | mission/arc/work id, source plan/design refs, constitution snapshot/provenance |
| Verdict | `pass`, with any guardrails recorded; or `fail`, recorded as `revise-before-implementation` or `blocked` with the reason |
| Axiom mapping | active axioms considered, with load-bearing alignments and risks |
| Layered application | how the design behaves at each relevant layer/altitude |
| Tensions | inter-axiom or design-vs-axiom tensions and their resolutions |
| Deltas | required changes, follow-ups, or accepted deviations |
| Implementation guardrails | concrete rules implementation must not violate |
| Closeout hooks | what validation/verifier/closeout must re-check |

Do not force every axiom to be equally load-bearing.\
Mark whether each mapping is **load-bearing**, **supporting**, or **not materially implicated**.\
A decorative citation is worse than omission because it launders weak reasoning as principle.

---

## Layered application guide

Use the following layers to translate axioms into operational questions.\
This is the first slice of the broader axiom application guide; extend it only from observed need.

| Layer | Primary axioms | Audit questions |
|---|---|---|
| Umbrella / intent | A13 | Does this design help strategic intent become substrate-owned execution, or does it drag the Director into how-to? |
| State / truth | A1, A5, A7 | What is the source of truth? Is any state hidden, stale, lossy, or unqueryable? What happens on restart/failure? |
| Specification / configuration | A2, A11 | Is behavior declared/configured/mechanized, or trapped in prompts and prose? Can the spec and runtime drift? |
| Composition / boundaries | A3 | Does each module/pattern own one concern? Are surfaces earned by real consumers, not speculative reuse? |
| Knowledge / audit | A4 | What context, rationale, raw evidence, and consequence must be durable? Is any summarization lossy? |
| Perception / context | A5, A12 | What does each actor see before acting? Is the context a precise projection rather than a raw dump or stale transcript? |
| Collaboration / operations | A6, A7 | Does the design remove administrative handoff and produce actionable failures? |
| Integrity / validation / deployment | A8, A9 | What gates prove lower layers before higher layers depend on them? What chaos/race/adversarial paths must be tested? |
| Self-evolution | A10, A14 | Did discovered friction become backlog, methodology, tests, or reusable capital? Is any lesson left in conversation memory only? |
| Director attention / authority | A13 | Is the Director asked for strategic gate decisions only? Is authority explicit and non-delegated? |

---

## Common failure modes

| Failure | Why it is bad | Correction |
|---|---|---|
| Axiom-first generation | A confident axiom story can bless an unverified false premise | Establish reality by evidence; axioms set the direction and audit the result, and never supply the facts |
| Decorative mapping | Every axiom gets a vague paragraph but none changes the design | Mark load-bearing mappings and remove filler |
| Hidden exception | The design violates an axiom but calls it a pragmatic shortcut | Record an explicit guardrail, a follow-up, or a deviation the director accepts as an override |
| Prompt-only enforcement | A recurring deterministic rule is left for the LLM to remember | Mechanize or file a primitive/config follow-up |
| Director markdown gate | The Director is asked to read a long doc to approve | Present one decision at a time; markdown is the durable record |
| Audit after implementation | The audit becomes a post-hoc justification | Gate implementation before code or record a process fault |

---

## Output

A successful audit leaves:

- a durable audit artifact;
- a clear implementation verdict;
- design deltas or guardrails where needed;
- follow-up ids for reusable methodology or substrate gaps;
- validation and closeout hooks;
- no reliance on session memory for why the design is constitutionally acceptable.
