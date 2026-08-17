import assert from "node:assert/strict";
import test from "node:test";
import {
  differentialMissingnessBounds,
  empiricalDistribution,
} from "../../source/executables/statistics/index.mjs";

test("EM12 reports empirical tails and differential-missingness bounds without normality", () => {
  const distribution = empiricalDistribution([0, 0, 1, 2, 50], {
    upperTail: 10,
  });
  const missingness = differentialMissingnessBounds(
    [
      { arm: "treatment", outcome: 8, status: "observed" },
      { arm: "treatment", outcome: null, status: "unresolved" },
      { arm: "control", outcome: 4, status: "observed" },
      { arm: "control", outcome: 6, status: "observed" },
    ],
    { lowerBound: 0, upperBound: 10 },
  );
  assert.equal(distribution.normalityAssumed, false);
  assert.equal(distribution.tailRates.upper, 0.2);
  assert.deepEqual(missingness.contrastBounds, { lower: -1, upper: 4 });
  assert.equal(missingness.completeCasePrimaryForbidden, true);
});
