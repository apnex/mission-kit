---
id: P2
category: pattern
title: Node-label gate for cross-component contracts
status: active
hydrate-when: You have producer and consumer components co-scheduled onto the same nodes
supersedes: []
related: [S3]
---

# P2 — Node-label gate for cross-component contracts

## Rule

When a **producer** component must be ready before **consumer**
components can run on the same node, encode the gate as a **node
label** that the producer manages:

1. After successful initialization, the producer writes a label:
   `<producer>/state=ready` (and, if version skew matters,
   `<producer>/version=<value>`).
2. Consumers schedule with a `nodeSelector` (or equivalent
   affinity primitive) matching those labels.
3. On graceful shutdown, the producer **removes the label first**
   — before tearing down its own resources — so the scheduler
   stops placing new consumer work on the node while it still has
   capacity to drain in-flight work.
4. The label keys are part of the producer's published contract
   (see S3 — producer/consumer doc split).

The pattern works on any orchestrator that supports node labels +
label-based scheduling affinity (Kubernetes, Nomad, others).

## Rationale

The alternatives all have known failure modes for cross-pod
readiness:

- **`readinessProbe` on the producer pod** controls the
  *producer's* own traffic, not whether *consumer* pods get
  scheduled to the same node. The scheduler doesn't consult one
  pod's readiness when placing another pod.
- **Init containers in the consumer pod** can wait for the
  producer to be ready, but only after the consumer has already
  been scheduled to the node. If the consumer scheduled first
  (race or node-pressure), the init container will block, holding
  the node slot until timeout.
- **Service-mesh readiness gates** can encode this but require the
  mesh, and are overkill for what is fundamentally binary state
  ("the producer on this node is ready / is not").

Node labels are first-class to every orchestrator's scheduler.
Affinity decisions happen at placement time, before any consumer
container runs, which is exactly when the gate needs to fire.

Removing the label *first* on shutdown is what makes the pattern
graceful: any in-flight consumer work already on the node gets to
drain; new consumer work goes to other ready nodes. Tearing down
the producer first and the label second leaves a window where the
scheduler still places consumer work on a node whose producer is
already gone.

## Examples

**Bad:**

> Consumer pods declare a `readinessProbe` that calls into the
> producer's local socket and waits for HTTP 200. If the producer
> isn't up yet, the consumer pod schedules, hits CrashLoopBackoff,
> and burns retry budget while the scheduler does nothing about
> placement.

**Good:**

> Producer's init script ends with:
>
> ```bash
> kubectl label node "$NODE" \
>     <producer>/state=ready \
>     <producer>/version=<value> --overwrite
> ```
>
> Consumer manifest declares:
>
> ```yaml
> spec:
>   nodeSelector:
>     <producer>/state: ready
>     <producer>/version: <value>
> ```
>
> Producer's shutdown handler runs `kubectl label node "$NODE"
> <producer>/state- <producer>/version-` *first*, then proceeds
> with its own teardown.

## When to apply

- Producer/consumer components co-scheduled to the same nodes
  where the producer's readiness is a precondition for the
  consumer to start.
- Version skew matters between producer and consumer (the version
  label lets you pin consumers to a specific producer rev during
  rollouts).
- Graceful drain is required on producer restart / node
  decommission.

Don't apply: when producer and consumer always run on different
nodes (use Service readiness or network-level gates instead); when
producer readiness is *not* a hard precondition (the consumer can
self-degrade).
