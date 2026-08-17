import test from "node:test";
import assert from "node:assert/strict";
import {
  assignmentRandomizationInference,
  estimateBlockedContrast,
} from "../../source/executables/statistics/index.mjs";
import { assignmentPlan, blockedObservations } from "./fixtures.mjs";

test("assignment randomization stays inside sealed blocks and returns a valid finite randomization distribution", () => {
  const result = assignmentRandomizationInference({
    observations: blockedObservations,
    dependencePlan: assignmentPlan(),
    statistic: (rows) => estimateBlockedContrast(rows).estimate,
    iterations: 120,
    seed: "sealed-assignment",
  });
  assert.equal(result.method, "assignment_randomization");
  assert.equal(result.draws.length, 120);
  assert.ok(result.draws.every(Number.isFinite));
  assert.ok(result.pValue > 0 && result.pValue <= 1);
});
