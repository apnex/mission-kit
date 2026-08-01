import test from "node:test";
import assert from "node:assert/strict";
import { empiricalDistribution } from "../../source/executables/statistics/index.mjs";

test("distribution reporting remains empirical under a long-tailed sample", () => {
  const result = empiricalDistribution([0, 0, 0, 1, 100], {
    upperTail: 10,
  });
  assert.equal(result.normalityAssumed, false);
  assert.equal(result.median, 0);
  assert.equal(result.mean, 20.2);
  assert.equal(result.tailRates.upper, 0.2);
  assert.equal(result.empiricalCdf.at(-1).cumulativeProbability, 1);
});
