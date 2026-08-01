import test from "node:test";
import assert from "node:assert/strict";
import { rankCandidates } from "../../source/executables/statistics/index.mjs";

test("changing only protected learning or Director-judgment attention cannot worsen rank", () => {
  const dimensions = [
    { dimensionId: "quality", direction: "higher_better" },
    {
      dimensionId: "learning",
      direction: "protected_descriptive",
      attentionEconomicClass: "learning_investment",
    },
  ];
  const baseline = rankCandidates(
    [
      {
        candidateId: "a",
        dimensions: {
          quality: { lower: 9, upper: 9 },
          learning: { lower: 1, upper: 1 },
        },
      },
      {
        candidateId: "b",
        dimensions: {
          quality: { lower: 5, upper: 5 },
          learning: { lower: 1, upper: 1 },
        },
      },
    ],
    dimensions,
  );
  const highLearning = rankCandidates(
    [
      {
        candidateId: "a",
        dimensions: {
          quality: { lower: 9, upper: 9 },
          learning: { lower: 1000, upper: 1000 },
        },
      },
      {
        candidateId: "b",
        dimensions: {
          quality: { lower: 5, upper: 5 },
          learning: { lower: 0, upper: 0 },
        },
      },
    ],
    dimensions,
  );
  assert.deepEqual(highLearning.fronts, baseline.fronts);
  assert.deepEqual(highLearning.excludedProtectedDimensions, ["learning"]);
});
