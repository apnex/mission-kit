import test from "node:test";
import assert from "node:assert/strict";
import { mapInstrumentOutcomes } from "../../source/executables/statistics/index.mjs";

test("observed outcomes outside registered bounds are rejected before missingness bounds are computed", () => {
  assert.throws(
    () =>
      mapInstrumentOutcomes(
        [{ status: "observed", outcome: 11 }],
        { lowerBound: 0, upperBound: 10, direction: "higher_better" },
      ),
    /outside its declared bounded domain/,
  );
});
