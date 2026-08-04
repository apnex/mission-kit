import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  matrixSession,
  pairedStateMatrix
} from "../../fixtures/survey/session-v2/session-factory.mjs";

test("every paired authoring and phase state declared legal by the matrix validates", () => {
  assert.equal(pairedStateMatrix.pairs.length, 38);
  for (const pair of pairedStateMatrix.pairs) {
    assert.deepEqual(
      validateSessionSemantics(matrixSession(pair)),
      [],
      `${pair.authoringState}/${pair.phaseState}`
    );
  }
});
