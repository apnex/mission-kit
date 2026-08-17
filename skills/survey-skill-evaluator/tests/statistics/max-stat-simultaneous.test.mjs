import test from "node:test";
import assert from "node:assert/strict";
import { maxStatisticSimultaneousIntervals } from "../../source/executables/statistics/index.mjs";
import { clusteredPlan } from "./fixtures.mjs";

test("max-statistic intervals use shared dependence-aware bootstrap draws for strong familywise coverage", () => {
  const units = [
    { blockId: "b1", stratum: "s", quality: 1, toil: -1 },
    { blockId: "b2", stratum: "s", quality: 2, toil: -3 },
    { blockId: "b3", stratum: "s", quality: 5, toil: -2 },
    { blockId: "b4", stratum: "s", quality: 8, toil: -7 },
  ];
  const result = maxStatisticSimultaneousIntervals({
    units,
    hypothesisIds: ["quality", "toil"],
    dependencePlan: clusteredPlan(),
    iterations: 120,
    seed: "shared-max-t",
    convergenceTolerance: 1,
  });
  assert.equal(result.strongFwerControlled, true);
  assert.equal(result.method, "dependence_dispatched_bootstrap_max_t");
  assert.ok(result.intervals.quality.dependenceAwareBootstrapScale > 0);
  assert.match(result.bootstrapEstimateDigest, /^[a-f0-9]{64}$/);
});
