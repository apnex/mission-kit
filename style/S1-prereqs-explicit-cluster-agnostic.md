---
id: S1
category: style
title: Prerequisites explicit + cluster-agnostic + assumes authenticated tooling
status: active
supersedes: []
related: [S2, M2, P1]
---

# S1 - Prerequisites explicit + cluster-agnostic + assumes authenticated tooling

## Rule

Every workflow doc that drives shared infrastructure (Kubernetes, cloud APIs, etc.) must state in its prerequisites:

1. Which **substrate family** is required, not which specific
   implementation. *Kubernetes* - not k3s. *Cloud SQL* - not
   Postgres 15.4 on Cloud SQL. The reference implementation can be
   named as context, but it must not be the requirement.
2. That the doc **assumes authenticated tooling**. The first command
   in the workflow needs to work for someone who's already
   configured their environment. *How* they configured it (config
   path, sudo, RBAC, IAM, etc.) is out of scope for the workflow doc.
3. A **one-line verify command in a code block** the operator can
   run before starting to confirm the prerequisite is met.

---

## Rationale

Tying a workflow doc to a specific implementation (k3s, a specific cloud region, etc.) excludes operators on other implementations for no functional reason.\
The patches / commands / contracts are usually substrate-generic.

Conversely, not stating the authenticated-tooling assumption invites operators to copy-paste the first command, get a cryptic auth error, and have no escalation path.\
The doc shouldn't try to teach how to log in to AWS / configure kubeconfig / install gcloud - those are the operator's environment, not the workflow's.

The verify code block in a prerequisites section turns "is my env set up?" into a yes/no answer the operator can act on.

---

## Examples

**Bad:**

> Path B: k3s installed (`systemctl is-active k3s`) and
> nvidia-container-toolkit installed.

(Ties to k3s specifically; doesn't say how kubectl reaches the cluster; doesn't say what "installed" looks like to verify.)

**Good:**

> Path B: **Kubernetes cluster** (any distribution - k3s, kind,
> kubeadm, RKE2, EKS, GKE, ...) with kubectl authenticated against it.
> Verify:
>
> ```bash
> kubectl get nodes
> ```
>
> Expect at least one node with STATUS=Ready. Reference setup used
> by this project: k3s on a single host. The steps below assume
> `kubectl` works without flags from your shell - how that's
> configured (kubeconfig path, sudo, RBAC) is out of scope.

---

## When to apply

- Authoring any workflow doc that uses `kubectl`, `gcloud`, `aws`,
  `az`, `terraform`, or any tool whose access is environment-bound.
- Reviewing a workflow doc PR for the first time - check that the
  substrate-vs-implementation distinction is honored.
- Porting docs across teams / clusters / clouds - substrate-generic
  phrasing is what makes that port mostly mechanical.
