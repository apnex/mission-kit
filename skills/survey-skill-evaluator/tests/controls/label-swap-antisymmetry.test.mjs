import test from "node:test";
import assert from "node:assert/strict";
import { labelSwapControl } from "../../source/executables/statistics/index.mjs";

test("label swap negates a registered treatment-minus-control statistic", () => {
  const result = labelSwapControl(
    [
      { arm: "treatment", value: 8 },
      { arm: "treatment", value: 6 },
      { arm: "control", value: 2 },
      { arm: "control", value: 4 },
    ],
    {
      statistic(rows) {
        const treatment = rows.filter((row) => row.arm === "treatment");
        const control = rows.filter((row) => row.arm === "control");
        return (
          treatment.reduce((sum, row) => sum + row.value, 0) / treatment.length -
          control.reduce((sum, row) => sum + row.value, 0) / control.length
        );
      },
    },
  );
  assert.equal(result.original, 4);
  assert.equal(result.swapped, -4);
  assert.equal(result.antisymmetric, true);
  assert.equal(result.statisticTrustBoundary, "registered_package_function");
});
