# WorkGraph arc planning blueprint — dependency matrix

Canonical blueprint asset: `skills/workgraph-arc-planning/assets/planning-blueprint-template.json`

This matrix makes the planning blueprint's runbook-input discipline explicit. Future sibling outputs cannot be required Hub-doc references at seed time, so the blueprint uses `dependsOn` and verifier/closeout gate runbooks as compensating checks.

## Structural assertions

| Node | Runbook-required upstream input | Structural representation | Compensating gate check |
|---|---|---|---|
| `target_space_mapping` | Planning charter / target set | Required inline `charter` reference | Driver also carries required charter reference. |
| `value_unlock_triage` | Target-space map | `dependsOn: [target_space_mapping]` | Evidence `triage` must be produced after target map. |
| `scope_fence` | Value/unlock triage | `dependsOn: [value_unlock_triage]` | Evidence `scope_fence` binds selected/deferred/anti-scope decisions. |
| `axiom_alignment_audit` | Scope fence and current constitution | `dependsOn: [scope_fence]`; runbook requires `get_constitution` / `get_axiom` provenance and A0-A14 mapping or explicit not-required rationale | Direct axiom mapping is produced before implementation authority and before design options can finalize. |
| `current_state_inventory` | Scope fence | `dependsOn: [scope_fence]` | Inventory runbook is facts-only and target-scoped by scope fence. |
| `failure_mode_audit` | Scope fence | `dependsOn: [scope_fence]` | Audit runbook derives proof needs and red lines from selected scope. |
| `design_options` | Scope fence, direct axiom alignment, inventory, verifier audit | `dependsOn: [scope_fence, axiom_alignment_audit, current_state_inventory, failure_mode_audit]` | Options evidence must compare shapes after constitutional, engineer, and verifier inputs exist. |
| `feasibility_sketch` | Design options and current-state inventory | `dependsOn: [design_options, current_state_inventory]` | Engineer feasibility cannot start before both architect options and factual inventory exist. |
| `design_gate` | Design options, feasibility sketch, failure-mode audit, direct axiom alignment | `dependsOn: [design_options, feasibility_sketch, failure_mode_audit, axiom_alignment_audit]` | Gate runbook must check concrete artifacts, encoded dependencies, validation, closeout/survey proof, direct axiom mapping, active-surface boundaries, and anti-scope. |
| `final_design_packet` | Design gate, design options, feasibility sketch, direct axiom alignment | `dependsOn: [design_gate, design_options, feasibility_sketch, axiom_alignment_audit]` | Final packet cannot be claimable until verifier gate and source design inputs are done. |
| `planning_closeout` | Final design packet | `dependsOn: [final_design_packet]` | Closeout runbook requires WorkGraph state, selected arc, rejected alternatives, anti-scope, live walkthrough status, friction, entities, residuals, and non-claims. |
| `driver` | All planning children and final closeout | `completionDependsOn` covers every non-driver child | Driver is architect-held and can complete only after all child nodes, including closeout, are done. |

## Seed-time limitation and compensating control

Sibling output documents such as the target map, triage packet, scope fence, inventory, audit, design options, feasibility sketch, design gate, final packet, and closeout packet do not exist when the blueprint is seeded. The blueprint therefore cannot list those future docs as required Hub-doc `references` without creating seed-time dangling references.

The compensating control is load-bearing structure:

1. `dependsOn` prevents downstream nodes from becoming claimable until upstream output WorkItems are done.
2. Every upstream-producing node has a resolvable doc evidence requirement.
3. Gate runbooks explicitly inspect the upstream evidence rather than trusting prose memory.
4. The driver completion gate covers every child and completes last.
5. `validate-planning-blueprint.mjs` below asserts the structural edges and includes negative checks that fail if the prior early-gate/runbook mismatch class is reintroduced.

## Validation command

Run from the mission-kit root:

```bash
node skills/workgraph-arc-planning/assets/validate-planning-blueprint.mjs
```

Expected result:

```text
PASS planning blueprint validation: 12 nodes, 10 dependency assertions, driver gates 11 children, negative checks caught 7 broken variants.
```
