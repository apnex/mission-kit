import test from "node:test";
import assert from "node:assert/strict";
import { mapInstrumentOutcomes } from "../../source/executables/statistics/index.mjs";

test("candidate-caused failures map adverse while exogenous failures remain typed missingness", () => {
  const result = mapInstrumentOutcomes(
    [
      { status: "candidate_protocol_failure" },
      { status: "infrastructure_failure" },
    ],
    { lowerBound: 0, upperBound: 10, direction: "higher_better" },
  );
  assert.deepEqual(
    result.map(({ value, mapping, missing }) => ({ value, mapping, missing })),
    [
      { value: 0, mapping: "candidate_adverse", missing: false },
      {
        value: null,
        mapping: "exogenous_typed_not_observed",
        missing: true,
      },
    ],
  );
});
