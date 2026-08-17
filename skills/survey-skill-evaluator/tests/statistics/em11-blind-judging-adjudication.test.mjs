import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateAdjudicationTrigger,
  krippendorffAlpha,
  validateIndependentBallotSet,
} from "../../source/executables/statistics/index.mjs";

test("EM11 preserves independent ballots, measured disagreement, and a separate adjudication trigger", () => {
  const ballots = [
    {
      judgeId: "j1",
      workOrderId: "w1",
      blindCommitmentDigest: "a".repeat(64),
      ballotDigest: "c".repeat(64),
    },
    {
      judgeId: "j2",
      workOrderId: "w2",
      blindCommitmentDigest: "b".repeat(64),
      ballotDigest: "d".repeat(64),
    },
  ];
  assert.equal(validateIndependentBallotSet(ballots).ballotCount, 2);
  const agreement = krippendorffAlpha(
    [{ unitId: "u1", ratings: ["pass", "fail"] }],
    { scale: "nominal" },
  );
  assert.ok(agreement.alpha < 1);
  const trigger = evaluateAdjudicationTrigger({
    ballots: [
      { ballotId: "b1", scores: { semantic: 0.1 }, findings: [] },
      { ballotId: "b2", scores: { semantic: 0.9 }, findings: [] },
    ],
    agreementReport: { alpha: agreement.alpha },
    policy: {
      minimumValidBallots: 2,
      maximumScoreDistance: 0.5,
      minimumAgreement: 0.8,
      preregistered: true,
    },
  });
  assert.equal(trigger.triggered, true);
  assert.equal(trigger.rawBallotsPreserved, true);
  assert.equal(trigger.armMapConsumed, false);
});
