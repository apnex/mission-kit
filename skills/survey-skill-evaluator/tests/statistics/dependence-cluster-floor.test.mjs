import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDependencePlan } from "../../source/executables/statistics/index.mjs";
import { blockedObservations, clusteredPlan } from "./fixtures.mjs";

test("effective sampled clusters below the preregistered floor fail closed", () => {
  const plan = clusteredPlan({
    factors: [
      {
        factorId: "block",
        sampling: "sampled",
        relation: "root",
        field: "blockId",
        parentFactorId: null,
        generalizationPopulation: "eligible_blocks",
        assignmentMechanism: null,
        clusterCountFloor: 5,
      },
    ],
  });
  assert.throws(
    () => normalizeDependencePlan(plan, blockedObservations),
    /below its registered floor/,
  );
});
