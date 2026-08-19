---
id: S3
category: style
title: Producer / consumer doc split
status: active
supersedes: []
related: [S4, P2]
---

# S3 - Producer / consumer doc split

## Rule

When two components have a producer/consumer relationship (a driver
+ the workloads that use it; a library + the apps that link it; an
API + its clients), split the documentation along the same boundary:

1. The **producer** repo documents (a) its public contract - what
   it guarantees, on what signal, with what version semantics - and
   (b) its own implementation. The contract is normative and lives
   under a stable path (e.g., `docs/consumer-contract.md`).
2. The **consumer** repo documents (a) *its* implementation - how
   it uses the producer - and (b) a one-line cross-link to the
   producer's contract. It does **not** restate the contract.

If a consumer needs information about the producer's behavior that isn't in the contract, the fix is to extend the contract (in the producer repo), not to encode the assumption in the consumer repo.

---

## Rationale

Duplicating the contract in both repos guarantees drift.\
The producer evolves its interface; one of the two copies gets updated and the other doesn't; consumers downstream silently follow the wrong copy.\
The single-source-of-truth rule is mechanical prevention for this.

The split also makes ownership crisp.\
When something about the interface is wrong, you know which repo's PR queue handles it.\
When a new consumer onboards, they read one document - the producer's contract - rather than reverse-engineering an existing consumer's docs to figure out what's contract vs. local convention.

---

## Examples

**Bad:**

> Consumer repo's README has a "Driver requirements" section that
> lists the exact label keys, version-skew rules, and shutdown
> ordering the driver guarantees. The driver repo has the same
> information in its own README, in different words.

**Good:**

> Producer repo: `docs/consumer-contract.md` enumerates label keys,
> version-skew rules, init/shutdown ordering, with a `Version: N`
> header so changes are explicit.
>
> Consumer repo's README has a one-liner: *"This component requires
> the producer's contract version N or newer - see
> `<producer-repo>/docs/consumer-contract.md`."* Plus its own
> implementation detail (manifest snippets, image references, etc.)
> that show how it consumes the contract.

---

## When to apply

- Splitting docs across two repos where one component is consumed
  by the other.
- Writing the first consumer of an existing producer - resist the
  temptation to copy the producer's interface docs into your repo.
- Reviewing a doc PR that adds interface details to a consumer repo
  - push back, ask whether it should live in the producer's
  contract doc instead.
