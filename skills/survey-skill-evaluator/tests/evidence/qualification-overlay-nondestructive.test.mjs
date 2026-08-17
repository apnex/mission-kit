import assert from "node:assert/strict";
import test from "node:test";
import { qualifyResult } from "../../source/executables/evidence/index.mjs";

test("qualification produces a typed overlay while retaining immutable inclusive source evidence", () => {
  const source = {
    attemptId: "attempt-1",
    outcomeClass: "candidate_failure",
    evidenceRefs: ["evidence:attempt-1"],
  };
  const qualified = qualifyResult(source, [
    {
      mappingId: "candidate-failure-adverse",
      sourcePath: "outcomeClass",
      equals: "candidate_failure",
      effect: "candidate_adverse",
      affectedDimensions: ["semantic", "utility"],
    },
  ]);
  assert.equal(qualified.qualifications[0].matched, true);
  assert.equal(qualified.qualifications[0].effect, "candidate_adverse");
  assert.equal(
    JSON.stringify(qualified.sourceResult),
    JSON.stringify({
      attemptId: "attempt-1",
      evidenceRefs: ["evidence:attempt-1"],
      outcomeClass: "candidate_failure",
    }),
  );
  source.outcomeClass = "success";
  assert.equal(qualified.sourceResult.outcomeClass, "candidate_failure");

  const nonmatching = qualifyResult(
    qualified.sourceResult,
    [
      {
        mappingId: "contamination-exclusion",
        sourcePath: "outcomeClass",
        equals: "contaminated",
        effect: "exclude_from_instrument_valid",
        affectedDimensions: ["semantic"],
      },
    ],
  );
  assert.equal(nonmatching.qualifications[0].matched, false);
  assert.deepEqual(nonmatching.sourceResult.evidenceRefs, ["evidence:attempt-1"]);
});
