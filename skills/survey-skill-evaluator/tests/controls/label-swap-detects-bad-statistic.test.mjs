import test from "node:test";
import assert from "node:assert/strict";
import { labelSwapControl } from "../../source/executables/statistics/index.mjs";

test("label swap detects a statistic that depends on row order instead of arm labels", () => {
  const result = labelSwapControl(
    [
      { arm: "treatment", value: 8 },
      { arm: "control", value: 2 },
    ],
    {
      statistic(rows) {
        return rows[0].value - rows[1].value;
      },
    },
  );
  assert.equal(result.antisymmetric, false);
});
