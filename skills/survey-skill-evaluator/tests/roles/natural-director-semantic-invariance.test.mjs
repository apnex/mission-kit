import assert from "node:assert/strict";
import test from "node:test";
import {
  scoreObligationRegistry,
} from "../../source/executables/evidence/index.mjs";

function scoreRecoveredMeaning(_naturalResponse, status) {
  return scoreObligationRegistry({
    registryId: "semantic-key-1",
    obligations: [
      {
        obligationId: "release-boundary",
        kind: "constraint",
        required: true,
      },
    ],
    findings: [
      {
        obligationId: "release-boundary",
        status,
        evidenceCitations: ["sealed-evidence:release-boundary"],
      },
    ],
  });
}

test("semantic scoring is invariant to paraphrased Director wording and changes only when recovered meaning changes", () => {
  const concise = scoreRecoveredMeaning(
    "Keep release approval with the external owner.",
    "pass",
  );
  const conversational = scoreRecoveredMeaning(
    "I am comfortable with the result, though someone outside this evaluator must still make the release call.",
    "pass",
  );
  assert.deepEqual(conversational, concise);

  const lostMeaning = scoreRecoveredMeaning(
    "The evaluator can release its own candidate.",
    "fail",
  );
  assert.notEqual(
    lostMeaning.normalizedSummary,
    concise.normalizedSummary,
  );
  assert.notEqual(
    lostMeaning.scoringResultDigest,
    concise.scoringResultDigest,
  );
});
