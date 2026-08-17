import test from "node:test";
import assert from "node:assert/strict";
import { crossedJudgeEffects } from "../../source/executables/statistics/index.mjs";

test("judge variance decomposition rejects an incomplete or duplicated crossed panel", () => {
  assert.throws(
    () =>
      crossedJudgeEffects([
        { unitId: "u1", judgeId: "j1", value: 1 },
        { unitId: "u1", judgeId: "j2", value: 2 },
        { unitId: "u2", judgeId: "j1", value: 3 },
      ]),
    /complete balanced panel/,
  );
  assert.throws(
    () =>
      crossedJudgeEffects([
        { unitId: "u1", judgeId: "j1", value: 1 },
        { unitId: "u1", judgeId: "j1", value: 2 },
      ]),
    /duplicate unit-by-judge cell/,
  );
});
