import assert from "node:assert/strict";
import test from "node:test";
import {
  pairedStatePathClasses,
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  matrixSession,
  pairedStateMatrix
} from "../../fixtures/survey/session-v2/session-factory.mjs";

test("illegal pairs reject while declared correction, abort, and terminal pairs are admitted", () => {
  for (const pathClass of ["correction", "abort", "terminal"]) {
    const pairs = pairedStateMatrix.pairs.filter(
      (pair) => pair.pathClasses.includes(pathClass)
    );
    assert.ok(pairs.length > 0, `${pathClass} pairs must be declared`);
    for (const pair of pairs) {
      const session = matrixSession(pair);
      assert.deepEqual(validateSessionSemantics(session), []);
      assert.ok(pairedStatePathClasses(session).includes(pathClass));
    }
  }

  const illegal = matrixSession(
    pairedStateMatrix.pairs.find(
      (pair) => pair.authoringState === "survey_frame_required"
    )
  );
  illegal.phase = "round_2_drafting";
  const issues = validateSessionSemantics(illegal);
  assert.deepEqual(issues.map((item) => item.code), [
    "SESSION_PAIRED_STATE_ILLEGAL"
  ]);
  assert.deepEqual(Object.keys(issues[0]).sort(), [
    "code",
    "field",
    "reason"
  ]);

  const legalDrift = matrixSession(
    pairedStateMatrix.pairs.find(
      (pair) => (
        pair.authoringState === "candidate_ready" &&
        pair.phaseState === "composite_candidate"
      )
    )
  );
  legalDrift.phase = "walkthrough_ready";
  const legalDriftCodes = validateSessionSemantics(legalDrift)
    .map((item) => item.code);
  assert.equal(
    legalDriftCodes.includes("SESSION_PAIRED_STATE_ILLEGAL"),
    false,
    "a legal terminal pair must not be misclassified as an illegal pair"
  );
  assert.equal(
    legalDriftCodes.includes("SESSION_MACHINE_EDGE_FINAL_STATE_MISMATCH"),
    true,
    "journal drift remains independently detectable when the terminal pair itself is legal"
  );
});
