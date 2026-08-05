import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  matrixSession,
  pairedStateMatrix
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

test("every paired authoring and phase state declared legal by the matrix passes structural and semantic validation", async () => {
  assert.equal(pairedStateMatrix.pairs.length, 38);
  for (const pair of pairedStateMatrix.pairs) {
    const session = matrixSession(pair);
    const structure = await validateSessionStructure(session);
    assert.equal(
      structure.valid,
      true,
      `${pair.authoringState}/${pair.phaseState}: ${JSON.stringify(structure.errors)}`
    );
    assert.deepEqual(
      validateSessionSemantics(session),
      [],
      `${pair.authoringState}/${pair.phaseState}`
    );
  }
});
