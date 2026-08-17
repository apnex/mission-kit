import test from "node:test";
import assert from "node:assert/strict";
import {
  boundedMissingness,
  pairedEffects,
} from "../../source/executables/statistics/index.mjs";

test("paired effects retain all-assigned missingness and expose bounds", () => {
  const effects = pairedEffects([
    { pairId: "p1", treatment: 4, control: 2 },
    { pairId: "p2", treatment: null, control: 3 },
  ]);
  assert.equal(effects.allAssignedCount, 2);
  assert.equal(effects.validPairCount, 1);
  assert.equal(effects.summary.mean, 2);
  assert.deepEqual(
    boundedMissingness({
      observed: [2],
      missingCount: 1,
      lowerBound: -2,
      upperBound: 4,
    }),
    { lowerMean: 0, upperMean: 3, denominator: 2 },
  );
});
