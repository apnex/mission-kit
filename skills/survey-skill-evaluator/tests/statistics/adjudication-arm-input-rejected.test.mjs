import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAdjudicationTrigger } from "../../source/executables/statistics/index.mjs";

test("adjudication trigger rejects arm, candidate, and rank information at any nesting depth", () => {
  assert.throws(
    () =>
      evaluateAdjudicationTrigger({
        ballots: [
          {
            ballotId: "b1",
            scores: { semantic: 1 },
            metadata: { nested: { armMap: { opaque: "treatment" } } },
          },
          { ballotId: "b2", scores: { semantic: 1 } },
        ],
        agreementReport: { alpha: 1 },
        policy: { minimumValidBallots: 2 },
      }),
    /cannot consume arm or rank information/,
  );
});
