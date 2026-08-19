---
id: D1
category: domain
title: delivery-code — the product/service codebase
status: active
subjectSurface: the shipped product/service codebase — features, fixes, the delivered artifact
evidenceResolvesAgainst: source files, PRs, commits, CI/test runs on the product repo
freeForTypes: [build-a-slice, fix-a-bug-or-repair, retire-or-hard-cut, validate-locally, author-guard-or-falsifier-tests, merge-and-land, verify-gate-reactive, audit-a-surface, design-a-contract-or-invariant]
pinnedForTypes: []
related: [D0]
---

# D1 — delivery-code

## Subject-surface
The product/service codebase: the features, fixes, and shipped artifact. Evidence
resolves against source files, PRs, commits, and CI/test runs on the product
repo.

## Freedom
A **free** discriminating domain for object-level build/ship/assurance types — a
`build-a-slice` or `verify-gate` genuinely chooses this surface vs distribution
or tooling.

## Axiom alignment
- **A1 (Sovereign State Transparency):** node truth binds to real code artifacts
  (PR/commit/CI), not prose.
