import test from "node:test";
import assert from "node:assert/strict";
import {
  dependenceDiagnostics,
  normalizeDependencePlan,
} from "../../source/executables/statistics/index.mjs";
import { crossedPlan } from "./fixtures.mjs";

test("crossed sampled factors dispatch multiway cluster bootstrap", () => {
  const observations = [
    { scenarioId: "s1", directorId: "d1" },
    { scenarioId: "s1", directorId: "d2" },
    { scenarioId: "s2", directorId: "d1" },
  ];
  const result = normalizeDependencePlan(crossedPlan(), observations);
  const diagnostics = dependenceDiagnostics(crossedPlan(), observations);
  assert.equal(result.resamplingMethod, "multiway_cluster_bootstrap");
  assert.deepEqual(diagnostics.observedEffectiveIndependentClusterCounts, {
    scenario: 2,
    director: 2,
  });
});
