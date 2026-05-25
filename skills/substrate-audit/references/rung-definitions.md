# Rung definitions

The full L1-L5 ladder. nanoprobe sits at **L3 floor** — meaning every probe
reaches at least L3, and L4/L5 are run separately on a culled shortlist.

| Rung | Action | Per-substrate cost | Output |
|---|---|---|---|
| L1 — Triage | Stars, README one-liner, license, last-push date | ~5 min | row in landscape doc |
| L2 — Doc walk | Read docs end-to-end, enumerate every advertised feature | ~30 min | folded into L3 for nanoprobe |
| **L3 — Code probe** | **Trace 3-5 core paths; map every feature to file:line in source; identify *how* each feature is implemented and *what problem* it solves** | **~2 hr** | **nanoprobe output** |
| L4 — Behavioural probe | Stand up the substrate, run a fixed scenario suite, observe actual behaviour vs documented behaviour | ~half-day | post-nanoprobe pass, separate skill |
| L5 — Comparative benchmark | Same scenario suite across shortlist, with numbers | ~1 day × N | crossprobe / benchmark skill |

## Why L3 is the floor for nanoprobe

L1 and L2 produce claim-only or doc-only evidence. Both can lie:

- Claim evidence (README, marketing copy) systematically overstates.
- Doc evidence (API reference, config schema) systematically lags reality
  and often documents intent rather than current behaviour.

Source is the only artefact that *is* the behaviour. L3 is the floor because
it's the rung at which evidence becomes load-bearing.

## Why L4/L5 are separate skills, not part of nanoprobe

L4 requires environment setup, scenario fixtures, and observation tooling per
substrate. It's a fundamentally different workflow from reading code. Bundling
it into nanoprobe would make every probe a half-day instead of two hours and
discourage the descriptive-pass-on-everything coverage that makes the corpus
valuable.

L5 is inherently cross-substrate — it's about running the same scenarios
across N substrates and comparing results. That's crossprobe's territory.

## Cull gates between rungs

A cull gate is an explicit decision to NOT advance a substrate to the next
rung, recorded with reasoning. Cull reasons must be re-evaluable — "stale
project" is OK if you cite last-push date; "not interesting" is not.

Standard cull criteria:

- **L1 → L2 cull:** SaaS-only (fails sovereignty for self-hosted deploys),
  last commit > 18 months ago without v1.0, license-incompatible (e.g.
  Server Side Public License when you need Apache-2).
- **L2 → L3 cull:** advertised features don't address any of the domain's
  goals (cite goals doc).
- **L3 → L4 cull:** L3 probe revealed a fundamental architectural mismatch
  (e.g. memory substrate that's actually a vector DB wrapper) OR triangulation
  showed enough vapourware to disqualify.
- **L4 → L5 cull:** behavioural probe revealed deal-breakers (latency,
  correctness, resource cost).

Record every cull in the substrate's `00-summary.md` under "Cull status" with
date, reason, and re-evaluation trigger ("re-probe if upstream ships v2 with
graph backend").
