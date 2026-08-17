import { deepCloneCanonical, deepFreeze } from "../engine/canonical-json.mjs";
import { ValidationError } from "../engine/errors.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "../engine/hash.mjs";
import { sealAnalysisPlan, sealAnalysisResult } from "./facades.mjs";

function exactKeys(value, expected, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(",") !== [...expected].sort().join(",")
  ) {
    throw new ValidationError(`${label} has an invalid field set`);
  }
}

export function bindStatisticalClaim(unsafeInput) {
  const input = deepCloneCanonical(unsafeInput);
  exactKeys(
    input,
    [
      "claimId",
      "claimContrast",
      "analysisPlan",
      "analysisResult",
      "populationClass",
      "effectId",
    ],
    "Statistical claim binding",
  );
  if (
    typeof input.claimId !== "string" ||
    input.claimId.length === 0 ||
    typeof input.effectId !== "string" ||
    input.effectId.length === 0 ||
    typeof input.populationClass !== "string" ||
    input.populationClass.length === 0
  ) {
    throw new ValidationError("Statistical claim identities are invalid");
  }
  const plan = sealAnalysisPlan(input.analysisPlan);
  const result = sealAnalysisResult(input.analysisResult);
  const contrast = input.claimContrast;
  exactKeys(
    contrast,
    [
      "claimClass",
      "treatmentArmId",
      "controlArmId",
      "treatmentConditionClass",
      "controlConditionClass",
      "treatmentSnapshotDigest",
      "controlSnapshotDigest",
      "treatmentEnvironmentDigest",
      "controlEnvironmentDigest",
      "registeredContrast",
    ],
    "Registered claim contrast",
  );
  const planDigest = hashCanonical("analysis-plan/v1", plan);
  if (
    contrast.registeredContrast !== true ||
    !plan.claimIds.includes(input.claimId) ||
    plan.estimand.treatmentArmId !== contrast.treatmentArmId ||
    plan.estimand.controlArmId !== contrast.controlArmId ||
    result.analysisPlanDigest !== planDigest ||
    result.dependencePlanDigest !== plan.dependencePlanDigest
  ) {
    throw new ValidationError(
      "Statistical claim is not bound to its registered contrast and plan",
    );
  }
  const population = result.populationViews.find(
    (view) => view.populationClass === input.populationClass,
  );
  const effect = result.effects.find(
    (candidate) => candidate.effectId === input.effectId,
  );
  if (
    !population ||
    !effect ||
    effect.estimandId !== plan.estimand.estimandId ||
    effect.status !== "estimated" ||
    !Number.isFinite(effect.estimate) ||
    !Number.isFinite(effect.interval?.lower) ||
    !Number.isFinite(effect.interval?.upper) ||
    effect.interval.lower > effect.interval.upper
  ) {
    throw new ValidationError(
      "Statistical claim lacks its population or uncertainty evidence",
    );
  }
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    claimId: input.claimId,
    claimClass: contrast.claimClass,
    treatmentArmId: contrast.treatmentArmId,
    controlArmId: contrast.controlArmId,
    populationClass: population.populationClass,
    populationDenominatorDigest: population.denominatorDigest,
    assignmentCount: population.assignmentCount,
    analysisUnit: plan.estimand.analysisUnit,
    estimandId: plan.estimand.estimandId,
    supportedConclusion: plan.estimand.supportedConclusion,
    effectId: effect.effectId,
    estimate: effect.estimate,
    uncertainty: deepCloneCanonical(effect.interval),
    dependencePlanDigest: plan.dependencePlanDigest,
  };
  return deepFreeze({
    ...core,
    claimBindingDigest: hashCanonical("statistical-claim-binding/v1", core),
  });
}
