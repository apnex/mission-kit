import test from "node:test";
import assert from "node:assert/strict";
import { estimateBlockedContrast } from "../../source/executables/statistics/index.mjs";

test("blocked contrast preserves target stratum weights and resampled block multiplicity", () => {
  const result = estimateBlockedContrast(
    [
      { row: { blockId: "a", stratum: "small", arm: "treatment", outcome: 10 }, weight: 3 },
      { row: { blockId: "a", stratum: "small", arm: "control", outcome: 0 }, weight: 3 },
      { row: { blockId: "b", stratum: "small", arm: "treatment", outcome: 2 }, weight: 1 },
      { row: { blockId: "b", stratum: "small", arm: "control", outcome: 0 }, weight: 1 },
      { row: { blockId: "c", stratum: "large", arm: "treatment", outcome: 4 }, weight: 1 },
      { row: { blockId: "c", stratum: "large", arm: "control", outcome: 0 }, weight: 1 },
    ],
    {
      stratumFields: ["stratum"],
      stratumWeights: {
        "stratum=small": 0.25,
        "stratum=large": 0.75,
      },
    },
  );
  assert.equal(result.byStratum["stratum=small"].meanEffect, 8);
  assert.equal(result.estimate, 5);
  assert.equal(result.effectiveExperimentalN, 5);
});
