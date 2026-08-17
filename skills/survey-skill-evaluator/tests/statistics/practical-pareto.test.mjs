import test from "node:test";
import assert from "node:assert/strict";
import { rankCandidates } from "../../source/executables/statistics/index.mjs";

test("uncertainty-aware Pareto ranking requires practical interval dominance and does not force a total order", () => {
  const result = rankCandidates(
    [
      {
        candidateId: "clear",
        dimensions: {
          quality: { lower: 9, upper: 10 },
          toil: { lower: 1, upper: 2 },
        },
      },
      {
        candidateId: "inferior",
        dimensions: {
          quality: { lower: 5, upper: 6 },
          toil: { lower: 3, upper: 4 },
        },
      },
      {
        candidateId: "uncertain",
        dimensions: {
          quality: { lower: 8, upper: 11 },
          toil: { lower: 0, upper: 3 },
        },
      },
    ],
    [
      {
        dimensionId: "quality",
        direction: "higher_better",
        minimumRelevantEffect: 0.5,
        equivalenceMargin: 0.25,
      },
      {
        dimensionId: "toil",
        direction: "lower_better",
        minimumRelevantEffect: 0.5,
        equivalenceMargin: 0.25,
      },
    ],
  );
  assert.deepEqual(result.nonDominated, ["clear", "uncertain"]);
  assert.equal(result.totalOrderSupported, false);
  assert.deepEqual(result.fronts[1], ["inferior"]);
});
