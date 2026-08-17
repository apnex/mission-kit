import assert from "node:assert/strict";
import test from "node:test";
import { hashCanonical } from "../../source/executables/engine/index.mjs";
import {
  bindStatisticalClaim,
} from "../../source/executables/statistics/index.mjs";
import {
  analysisPlanFixture,
  analysisResultFixture,
} from "../composition/analytical-fixtures.mjs";

test("statistical claim binds the exact contrast, population, analysis unit, and uncertainty interval", () => {
  const plan = analysisPlanFixture();
  const result = {
    ...analysisResultFixture(),
    analysisPlanDigest: hashCanonical("analysis-plan/v1", plan),
    dependencePlanDigest: plan.dependencePlanDigest,
  };
  const contrast = {
    claimClass: "upgrade-effect",
    treatmentArmId: "opaque-a",
    controlArmId: "opaque-b",
    treatmentConditionClass: "candidate",
    controlConditionClass: "frozen-prior",
    treatmentSnapshotDigest: "a".repeat(64),
    controlSnapshotDigest: "b".repeat(64),
    treatmentEnvironmentDigest: "c".repeat(64),
    controlEnvironmentDigest: "d".repeat(64),
    registeredContrast: true,
  };
  const bound = bindStatisticalClaim({
    claimId: "claim-1",
    claimContrast: contrast,
    analysisPlan: plan,
    analysisResult: result,
    populationClass: "all_assigned",
    effectId: "semantic-effect-1",
  });
  assert.equal(bound.analysisUnit, "sealed_block");
  assert.equal(bound.assignmentCount, 4);
  assert.equal(bound.uncertainty.lower, 0.05);
  assert.equal(bound.uncertainty.upper, 0.35);
  assert.equal(bound.uncertainty.confidence, 0.95);
  assert.equal(bound.uncertainty.simultaneous, true);
  assert.equal(bound.uncertainty.method, "max_t");

  assert.throws(
    () =>
      bindStatisticalClaim({
        claimId: "claim-1",
        claimContrast: { ...contrast, treatmentArmId: "wrong-arm" },
        analysisPlan: plan,
        analysisResult: result,
        populationClass: "all_assigned",
        effectId: "semantic-effect-1",
      }),
    /registered contrast and plan/u,
  );
});
