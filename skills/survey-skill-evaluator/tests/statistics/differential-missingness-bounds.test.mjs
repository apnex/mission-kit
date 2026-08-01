import test from "node:test";
import assert from "node:assert/strict";
import { differentialMissingnessBounds } from "../../source/executables/statistics/index.mjs";

test("differential missingness reports all-assigned arm rates and worst-best contrast bounds", () => {
  const result = differentialMissingnessBounds(
    [
      { arm: "treatment", outcome: 8, status: "observed" },
      { arm: "treatment", outcome: null, status: "unresolved" },
      { arm: "control", outcome: 4, status: "observed" },
      { arm: "control", outcome: 6, status: "observed" },
    ],
    { lowerBound: 0, upperBound: 10 },
  );
  assert.equal(result.allAssignedCount, 4);
  assert.equal(result.treatment.missingRate, 0.5);
  assert.equal(result.control.missingRate, 0);
  assert.deepEqual(result.contrastBounds, { lower: -1, upper: 4 });
  assert.equal(result.completeCasePrimaryForbidden, true);
});
