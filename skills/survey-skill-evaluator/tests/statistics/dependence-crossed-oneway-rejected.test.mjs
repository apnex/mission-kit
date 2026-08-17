import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDependencePlan } from "../../source/executables/statistics/index.mjs";
import { crossedPlan } from "./fixtures.mjs";

test("crossed sampled factors reject a requested one-way bootstrap", () => {
  assert.throws(
    () =>
      normalizeDependencePlan(
        crossedPlan({ resamplingMethod: "stratified_cluster_bootstrap" }),
        [{ scenarioId: "s1", directorId: "d1" }],
      ),
    /conflicts with its factor graph/,
  );
});
