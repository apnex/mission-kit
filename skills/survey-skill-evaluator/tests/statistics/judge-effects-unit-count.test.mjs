import test from "node:test";
import assert from "node:assert/strict";
import { crossedJudgeEffects } from "../../source/executables/statistics/index.mjs";

test("crossed judge analysis counts judged units rather than inflating experimental N with ratings", () => {
  const result = crossedJudgeEffects([
    { unitId: "u1", judgeId: "j1", value: 1 },
    { unitId: "u1", judgeId: "j2", value: 2 },
    { unitId: "u1", judgeId: "j3", value: 3 },
    { unitId: "u2", judgeId: "j1", value: 4 },
    { unitId: "u2", judgeId: "j2", value: 5 },
    { unitId: "u2", judgeId: "j3", value: 6 },
  ]);
  assert.equal(result.experimentalUnitCount, 2);
  assert.equal(result.ratingCount, 6);
  assert.equal(result.judgeRatingsInflateExperimentalN, false);
});
