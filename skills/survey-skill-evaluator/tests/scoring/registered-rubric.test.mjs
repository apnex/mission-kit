import test from "node:test";
import assert from "node:assert/strict";
import { scoreRegisteredRubric } from "../../source/executables/evidence/index.mjs";

test("registered rubric scoring preserves observed and not-observable dimensions", () => {
  const result = scoreRegisteredRubric(
    { protocol: { passed: true } },
    {
      rubricId: "rubric-1",
      dimensions: [
        {
          dimensionId: "protocol",
          sourcePath: "protocol.passed",
          transform: "boolean",
        },
        {
          dimensionId: "latency",
          sourcePath: "telemetry.elapsed",
          transform: "identity",
        },
      ],
    },
  );
  assert.equal(result.dimensions[0].value, 1);
  assert.equal(result.dimensions[1].status, "not_observable");
});
