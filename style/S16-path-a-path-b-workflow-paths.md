---
id: S16
category: style
title: Path A / Path B - one complete path per execution environment in a workflow document
status: active
medium: documents
hydrate-when: You are authoring a workflow document that supports more than one execution path
supersedes: []
related: [S1, S4, S7]
---

# S16 - Path A / Path B workflow paths

## Rule

When a single workflow has two (or more) valid execution environments - e.g., Docker Compose **and** Kubernetes; bare-metal **and** cloud; local **and** remote - structure the doc as:

1. **Shared prerequisites + intro.** Everything that applies
   regardless of environment.
2. **Path A - `<environment name>`.** A complete, independently
   followable sequence for environment A.
3. **Path B - `<environment name>`.** A complete, independently
   followable sequence for environment B.
4. **Shared verification / next-steps.** Anything that's the same
   regardless of path.

Each path is **read in isolation**.\
The doc explicitly states at the top which path is recommended for production (if either) and why.\
The operator picks a path once and never has to mentally context-switch mid-workflow.

If a step is shared between paths, **duplicate it** under each path's section rather than introducing a "for both paths..." interleaved aside.\
Environment sections must not interleave.

---

## Rationale

Environment-interleaved docs read like: *"for environment A do X; for environment B do Y; for both do Z; except in environment A also do W."*\
Every step costs the operator a context-switch to figure out which clause applies.\
The cost compounds across a long workflow and operators make mistakes from the cognitive overhead, not from the environments being hard.

Pre-splitting the doc into independent paths trades a small amount of duplication (the shared steps appear twice) for a large reduction in cognitive load: each operator follows one linear sequence with no branches.\
Duplication of shared steps is cheap to maintain - they're shared precisely because they don't vary - while the cognitive overhead of an interleaved doc is paid by every reader.

The "recommended for production" label is critical when both paths work but one is meaningfully more battle-tested or more aligned with the team's deployment model.\
Operators making a first-time decision shouldn't have to infer it.

---

## Examples

**Bad:**

> 1. Install the package. For Docker, also start the daemon.
> 2. Pull the image. (On k3s, pre-import into containerd first.)
> 3. Apply the manifest. For Docker, use `docker compose up`; for
>    k3s, use `kubectl apply -f`. If you're on Docker, also expose
>    the port; on k3s it's exposed by the Service.
> 4. Verify. Both paths can use `curl localhost:8080`.

**Good:**

> ## Shared prerequisites
> - Linux host, root or sudo, network reachable.
>
> ## Path A - Docker Compose *(recommended for single-host)*
> 1. Install Docker + start the daemon.
> 2. Pull the image.
> 3. `docker compose up -d`.
> 4. Expose port 8080.
> 5. Verify: `curl localhost:8080`.
>
> ## Path B - Kubernetes *(recommended for multi-host)*
> 1. Cluster reachable via `kubectl get nodes`.
> 2. Pre-import the image into the node's container runtime.
> 3. `kubectl apply -f manifest.yaml`.
> 4. (Port is exposed by the Service.)
> 5. Verify: `curl localhost:8080`.

---

## When to apply

- Authoring a workflow doc that genuinely supports more than one
  environment.
- Refactoring a doc whose conditionals (`if you're on X...`, `for Y
  only...`) have started to dominate the prose.
- Onboarding-doc design when readers will arrive with different
  environment choices already made.

Don't apply: when one environment is overwhelmingly more common + the other is a niche fallback.\
In that case write the doc for the common environment and add a short "alternative environment" section with the deltas; the dual-path structure adds cost without proportionate value.
