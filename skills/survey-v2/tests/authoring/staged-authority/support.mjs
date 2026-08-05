import {
  rehashAuthority,
} from "../reducer/support.mjs";

export function allTransitionIds(profile) {
  return profile.spec.transitionBindings.map(
    (binding) => binding.transitionId,
  );
}

export function allRevisionPlanIds(profile) {
  return profile.spec.revisionUnits.flatMap((unit) =>
    unit.revisionPlans.map((plan) => plan.id));
}

export function configureExecutionClosure(
  scenario,
  {
    id = "local-stage",
    transitionIds = allTransitionIds(scenario.profile),
    revisionPlanIds = allRevisionPlanIds(scenario.profile),
  } = {},
) {
  scenario.profile.spec.executionClosure = {
    id,
    transitionIds: structuredClone(transitionIds),
    revisionPlanIds: structuredClone(revisionPlanIds),
  };
  rehashAuthority(scenario);
  return scenario.profile.spec.executionClosure;
}
