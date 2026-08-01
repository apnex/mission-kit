import assert from "node:assert/strict";
import test from "node:test";
import {
  governedSelectionProfile,
} from "../../source/executables/statistics/index.mjs";

test("EM13 keeps inclusive candidates, Pareto non-dominance, and uncertainty without a false total order", () => {
  const result = governedSelectionProfile(
    [
      { candidateId: "a", dimensions: { quality: { lower: 7, upper: 10 } } },
      { candidateId: "b", dimensions: { quality: { lower: 8, upper: 9 } } },
      {
        candidateId: "guardrail-failed",
        feasible: false,
        dimensions: { quality: { lower: 20, upper: 21 } },
      },
    ],
    [{
      dimensionId: "quality",
      direction: "higher_better",
      minimumRelevantEffect: 0.5,
      equivalenceMargin: 0.25,
    }],
  );
  assert.equal(result.inclusiveProfiles.length, 3);
  assert.deepEqual(result.eligibleCandidateIds, ["a", "b"]);
  assert.deepEqual(result.ranking.nonDominated, ["a", "b"]);
  assert.equal(result.ranking.totalOrderSupported, false);
});
