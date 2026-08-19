---
id: W25
category: work-type
title: backstop-a-prod-window - hold abort/rollback over a risk window
status: active
backstop: true
roleEligibility: [architect, verifier, director]
evidenceContract:
  - kind: freeform
    description: "lease-held backstop node: abort criteria, rollback plan, final disposition"
evidenceAuthority: executor-evidence
domainEligibility: [coordination-substrate]
domainFreedom: pinned
parameters:
  - name: window
    fills: the bracketed nodes/window
    bindingSource: provided-by-trigger
generationMode: arc-seeded
falsifier: stood down before closeout, or abort trigger ignored
compositionHooks: completionDependsOn on the bracketed nodes (stands-down-last)
---

# W25 — backstop-a-prod-window

## Definition

Hold a standing abort/rollback authority over a bracketed risk window (a
deploy, a migration, a prod change), releasing only once every bracketed node
has closed. Not a role and not an overlay layer — an ordinary `arc-seeded`
work-type carrying a `backstop:true` flag.

## Evidence & closeability

Closes on a single `freeform` lease-held backstop node recording abort criteria,
the rollback plan, and the final disposition of the window. The
`roleEligibility` union (architect/verifier/director) is permissive; authority is
`executor-evidence` — the backstop holder attests its own disposition. It
satisfies (does not restate) the canonical constraint set and closeability
preflight in `work-types/README.md`; the load-bearing constraint here is #6
(repair-path / declared disposition) reached via the stands-down-last
`completionDependsOn`, so the node cannot self-close ahead of the window.

## Generation

`arc-seeded` — minted by a driver inside a blueprint that brackets a risk
window, with `window` provided by the trigger. idea-425/451/403 instantiate it
as the backstop rung a seed/drive/closeout arc plants alongside the risky nodes;
its `completionDependsOn` on those nodes is the "stands-down-last" edge, so the
engine cannot terminal-close the backstop while any bracketed node is live.
Falsifier: it stood down before closeout, or an abort trigger fired and was
ignored.

## Axiom alignment

- **A7/A8** — a standing abort/rollback authority over a live window is the
  assurance-and-recoverability discipline these axioms demand; the backstop is
  the recoverable-by-design hold, not after-the-fact cleanup.
- **A13** — director eligibility gives the window a ratifying abort authority of
  last resort when the risk crosses a director-reserved line.
