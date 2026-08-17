import test from "node:test";
import assert from "node:assert/strict";
import { rankCandidates } from "../../source/executables/statistics/index.mjs";

test("interval ranking preserves a non-dominating tie instead of forcing order", () => {
  const result = rankCandidates(
    [
      {
        candidateId: "a",
        dimensions: {
          quality: { lower: 7, upper: 9 },
          toil: { lower: 4, upper: 5 },
        },
      },
      {
        candidateId: "b",
        dimensions: {
          quality: { lower: 8, upper: 10 },
          toil: { lower: 5, upper: 7 },
        },
      },
    ],
    [
      { dimensionId: "quality", direction: "higher_better" },
      { dimensionId: "toil", direction: "lower_better" },
    ],
  );
  assert.deepEqual(result.nonDominated, ["a", "b"]);
  assert.equal(result.totalOrderSupported, false);
});
