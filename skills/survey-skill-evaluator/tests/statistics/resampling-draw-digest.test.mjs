import test from "node:test";
import assert from "node:assert/strict";
import { hashCanonical } from "../../source/executables/engine/hash.mjs";
import {
  estimateBlockedContrast,
  resamplingInference,
} from "../../source/executables/statistics/index.mjs";
import { blockedObservations, clusteredPlan } from "./fixtures.mjs";

test("bootstrap result binds every finite raw draw through a domain-separated digest", () => {
  const result = resamplingInference({
    observations: blockedObservations,
    dependencePlan: clusteredPlan(),
    statistic: (weighted) =>
      estimateBlockedContrast(weighted, {
        stratumFields: ["stratum"],
      }).estimate,
    iterations: 120,
    seed: "draw-binding",
  });
  assert.equal(result.draws.length, 120);
  assert.ok(result.draws.every(Number.isFinite));
  assert.equal(
    result.drawVectorDigest,
    hashCanonical("statistics-resample-draw-vector/v1", result.draws),
  );
});
