import test from "node:test";
import assert from "node:assert/strict";
import { holmStrongFwer } from "../../source/executables/statistics/index.mjs";

test("Holm correction uses stable numeric IDs, monotone adjusted values, and rejects duplicate IDs", () => {
  const numeric = holmStrongFwer([0.01, 0.01, 0.2]);
  assert.deepEqual(
    numeric.results.map((result) => result.hypothesisId).sort(),
    ["hypothesis-1", "hypothesis-2", "hypothesis-3"],
  );
  assert.ok(
    numeric.results.every(
      (result, index) =>
        index === 0 ||
        result.adjustedPValue >= numeric.results[index - 1].adjustedPValue,
    ),
  );
  assert.throws(
    () =>
      holmStrongFwer([
        { hypothesisId: "same", pValue: 0.1 },
        { hypothesisId: "same", pValue: 0.2 },
      ]),
    /must be unique/,
  );
});
