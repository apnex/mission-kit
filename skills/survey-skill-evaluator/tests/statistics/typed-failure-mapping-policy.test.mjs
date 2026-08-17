import assert from "node:assert/strict";
import test from "node:test";
import {
  mapInstrumentOutcomes,
} from "../../source/executables/statistics/index.mjs";

test("a registry descriptor that does not authorize adverse failure mapping retains candidate failure as typed missingness", () => {
  const [result] = mapInstrumentOutcomes(
    [{ status: "candidate_protocol_failure" }],
    {
      lowerBound: 0,
      upperBound: 10,
      direction: "lower_better",
      failureMapping: "typed_unavailable",
      missingMapping: "typed_unavailable",
    },
  );
  assert.deepEqual(
    {
      value: result.value,
      mapping: result.mapping,
      missing: result.missing,
    },
    {
      value: null,
      mapping: "failure_typed_unavailable",
      missing: true,
    },
  );
});
