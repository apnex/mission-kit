import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAdjudicationTrigger } from "../../source/executables/statistics/index.mjs";

test("adjudication starts only from preregistered disagreement thresholds and preserves raw ballots", () => {
  const result = evaluateAdjudicationTrigger({
    ballots: [
      { ballotId: "b1", scores: { semantic: 0.1 }, findings: [] },
      { ballotId: "b2", scores: { semantic: 0.9 }, findings: [] },
    ],
    agreementReport: { alpha: 0.2 },
    policy: {
      minimumValidBallots: 2,
      maximumScoreDistance: 0.5,
      minimumAgreement: 0.6,
      preregistered: true,
    },
  });
  assert.equal(result.triggered, true);
  assert.deepEqual(
    result.reasons.map((reason) => reason.type),
    ["score_distance", "low_agreement"],
  );
  assert.equal(result.rawBallotsPreserved, true);
  assert.equal(result.armMapConsumed, false);
});
