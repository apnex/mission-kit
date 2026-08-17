import assert from "node:assert/strict";
import test from "node:test";
import {
  validateIndependentBallotSet,
} from "../../source/executables/statistics/index.mjs";

const ballot = (judge, suffix) => ({
  judgeId: judge,
  workOrderId: `order-${suffix}`,
  blindCommitmentDigest: suffix.repeat(64),
  ballotDigest: String.fromCharCode(suffix.charCodeAt(0) + 2).repeat(64),
});

test("semantic scoring requires two independently committed blind ballots", () => {
  const ballots = [ballot("judge-a", "a"), ballot("judge-b", "b")];
  assert.equal(validateIndependentBallotSet(ballots).minimumSatisfied, true);
  assert.throws(
    () => validateIndependentBallotSet([ballots[0]]),
    /at least two committed ballots/u,
  );
  assert.throws(
    () =>
      validateIndependentBallotSet([
        ballots[0],
        { ...ballots[1], blindCommitmentDigest: ballots[0].blindCommitmentDigest },
      ]),
    /independent judges, work orders, and blind commitments/u,
  );
});
