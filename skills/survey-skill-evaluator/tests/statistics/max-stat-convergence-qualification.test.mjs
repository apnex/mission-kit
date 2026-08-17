import test from "node:test";
import assert from "node:assert/strict";
import { maxStatisticSimultaneousIntervals } from "../../source/executables/statistics/index.mjs";
import { clusteredPlan } from "./fixtures.mjs";

test("unstable max-statistic draws fail closed instead of silently claiming strong FWER", () => {
  const result = maxStatisticSimultaneousIntervals({
    units: [
      { blockId: "b1", stratum: "s", quality: 1 },
      { blockId: "b2", stratum: "s", quality: 2 },
      { blockId: "b3", stratum: "s", quality: 5 },
      { blockId: "b4", stratum: "s", quality: 9 },
    ],
    hypothesisIds: ["quality"],
    dependencePlan: clusteredPlan(),
    iterations: 100,
    seed: "unstable-max-t",
    convergenceTolerance: 1e-12,
  });
  assert.equal(result.convergence.stable, false);
  assert.equal(result.strongFwerControlled, false);
  assert.equal(result.simultaneousIntervalsAdmissible, false);
  assert.equal(result.inferenceStatus, "qualified_unstable_resampling");
});
