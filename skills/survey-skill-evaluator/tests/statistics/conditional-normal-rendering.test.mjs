import assert from "node:assert/strict";
import test from "node:test";
import {
  empiricalDistribution,
} from "../../source/executables/statistics/index.mjs";

test("normal rendering is never accepted as an implicit distribution model", () => {
  const symmetric = empiricalDistribution([-2, -1, 0, 1, 2]);
  const hostile = empiricalDistribution([0, 0, 0, 1, 100]);
  assert.equal(symmetric.normalityAssumed, false);
  assert.equal(hostile.normalityAssumed, false);
  assert.equal(symmetric.distributionAssumption, "empirical_nonparametric");
  assert.throws(
    () =>
      empiricalDistribution([-2, -1, 0, 1, 2], {
        distributionAssumption: "normal",
      }),
    /no implicit model assumption/u,
  );
});
