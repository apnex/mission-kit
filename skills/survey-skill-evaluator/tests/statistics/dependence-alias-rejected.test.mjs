import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDependencePlan } from "../../source/executables/statistics/index.mjs";

test("legacy dependence aliases are rejected unless a separate versioned adapter is used", () => {
  assert.throws(
    () =>
      normalizeDependencePlan(
        {
          planId: "legacy",
          factors: [
            {
              factorId: "trial",
              kind: "sampled",
              clusterField: "trialId",
            },
          ],
        },
        [{ trialId: "t1" }],
      ),
    /does not satisfy its sealed schema contract/,
  );
});
