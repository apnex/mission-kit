import test from "node:test";
import assert from "node:assert/strict";
import { validateMultiplicityProcedure } from "../../source/executables/statistics/index.mjs";

test("false-discovery-rate control cannot satisfy a confirmatory family", () => {
  assert.throws(
    () =>
      validateMultiplicityProcedure({
        evidencePurpose: "confirmatory_causal",
        procedure: "fdr",
      }),
    /cannot satisfy a confirmatory/,
  );
});
