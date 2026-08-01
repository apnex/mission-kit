import test from "node:test";
import assert from "node:assert/strict";
import { scoreRegisteredRubric } from "../../source/executables/evidence/index.mjs";

test("rubric scoring preserves native and normalized measurements as separate fields", () => {
  const result = scoreRegisteredRubric(
    { latency: 250 },
    {
      rubricId: "latency",
      dimensions: [
        {
          dimensionId: "latency",
          sourcePath: "latency",
          transform: "bounded",
          minimum: 0,
          maximum: 1000,
          nativeUnit: "milliseconds",
        },
      ],
    },
  );
  assert.equal(result.dimensions[0].nativeValue, 250);
  assert.equal(result.dimensions[0].normalizedValue, 0.25);
  assert.equal(result.dimensions[0].nativeUnit, "milliseconds");
});
