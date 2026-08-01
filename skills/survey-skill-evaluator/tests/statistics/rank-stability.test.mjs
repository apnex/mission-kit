import test from "node:test";
import assert from "node:assert/strict";
import { rankStabilityFromDraws } from "../../source/executables/statistics/index.mjs";

test("rank stability reports empirical rank distributions without calling them posterior probabilities", () => {
  const result = rankStabilityFromDraws(
    [
      [
        { candidateId: "a", dimensions: { quality: 3 } },
        { candidateId: "b", dimensions: { quality: 2 } },
      ],
      [
        { candidateId: "a", dimensions: { quality: 1 } },
        { candidateId: "b", dimensions: { quality: 4 } },
      ],
      [
        { candidateId: "a", dimensions: { quality: 5 } },
        { candidateId: "b", dimensions: { quality: 2 } },
      ],
    ],
    [
      {
        dimensionId: "quality",
        direction: "higher_better",
        minimumRelevantEffect: 0,
      },
    ],
  );
  assert.equal(result.candidateStability.a.proportionRankedBest, 2 / 3);
  assert.equal(result.proportionsArePosteriorProbabilities, false);
  assert.deepEqual(result.candidateStability.a.rankDistribution, {
    "1": 2 / 3,
    "2": 1 / 3,
  });
});
