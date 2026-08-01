---
name: survey-skill-evaluator
description: Use when explicitly asked to design, run, resume, inspect, or report a controlled Survey-skill evaluation campaign over sealed candidate and control packages with synthetic Directors and independent judging. Do not use for ordinary stakeholder surveying, candidate implementation, installation, or promotion.
---

# Survey Skill Evaluator

Evaluate sealed Survey-skill candidates through controlled, role-isolated
campaigns. Treat recommendations as evidence only; never install or promote a
candidate.

## Operate a campaign

1. Run `scripts/campaign-init.mjs` to create authored campaign inputs.
2. Seal the candidate, control, scenario, population, estimand, allocation,
   analysis, stopping, judgment, and recommendation policy before outcomes.
3. Run `scripts/campaign-validate.mjs` and resolve every typed failure.
4. For role execution, pass `--driver PATH` to a host-owned module that
   supplies the subject, Director, scenario-material, reviewer-allocation,
   isolation, and signed command-authority providers. Omitting `--driver`
   selects the diagnostic no-provider path, which is protocol evidence only.
5. Run or resume only through `scripts/campaign-run.mjs` or
   `scripts/campaign-resume.mjs`.
6. Inspect immutable status and evidence roots with
   `scripts/campaign-status.mjs`.
7. Project a report from sealed evidence with
   `scripts/campaign-report.mjs`.

The production driver executes fixed completion or terminal-only
sequential-to-maximum sampling. It rejects interim or repeated outcome looks;
do not claim sequential efficacy from that bounded mode.

Use `scripts/package-check.mjs` to validate this evaluator package. Use
`compile.sh --check` to prove generated projections and package identity are
current.

## Preserve authority

- Keep scenario authority, synthetic Director, Survey executor, classifiers,
  judges, adjudicators, downstream consumers, diagnostic actors, payback
  observers, deterministic services, and external authorities separate.
- Never expose private persona/key, arm map, peer ballot, peer-masked DB
  opening, signing key, or promotion capability to an unauthorized role.
- Do not infer state across products. Consume exact grants, fences, outboxes,
  acknowledgements, results, and companion receipts.
- Preserve every assigned, failed, missing, contaminated, quarantined, unused,
  and terminal observation.
- Keep producer-sealed SourceRequests and observer-owned PaybackObservations
  immutable. LCR admits requests; LC references sources but never authors them.
- Require LR/DB/LCR/LC recovery and learning evidence without reopening closed
  source work or granting release authority.

## Read only what the task needs

- [Authority and isolation](references/authority.md)
- [Campaign workflow](references/campaign.md)
- [Evidence and analysis](references/evidence-analysis.md)
- [Learning protocol](references/learning.md)
- [Assurance and package boundary](references/assurance.md)
- [Schema and lifecycle index](references/index.md)

Load bounded role capsules from `references/role-capsules/`; never substitute a
raw campaign dump for an authorized projection. On overflow, use the declared
continuation contract or fail with a typed error—never silently truncate.

## Release boundary

The canonical result is `recommendation.json` with
`promotionAuthorized: false`. Only an external release authority may consume a
complete EDL06 lineage handoff. A synthetic campaign does not satisfy a live
Director canary or promotion gate.
