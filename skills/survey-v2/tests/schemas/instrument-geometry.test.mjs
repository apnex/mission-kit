import assert from "node:assert/strict";
import test from "node:test";
import { validateById } from "../../generated/validators.mjs";
import { sha256Value } from "../../source/executables/runtime/lib/canonical.mjs";
import { instrumentDraft } from "../fixtures/runtime-fixture.mjs";

function frozen(round) {
  const value = {
    ...instrumentDraft(round),
    $schema: "urn:mission-kit:survey-v2:schema:instrument:v1",
    schemaVersion: "1.0.0",
    round
  };
  if (round === 2) value.boundRound1Digest = "sha256:".padEnd(71, "1");
  value.freezeDigest = sha256Value(value);
  return value;
}

test("instrument schema fixes each round to three canonical ordered questions", () => {
  const validate = (value) => validateById("urn:mission-kit:survey-v2:schema:instrument:v1", value);
  const round1 = frozen(1);
  assert.equal(validate(round1).valid, true);
  assert.equal(validate(frozen(2)).valid, true);
  assert.equal(validate({ ...round1, questions: round1.questions.slice(0, 2) }).valid, false);
  const reordered = structuredClone(round1);
  [reordered.questions[0], reordered.questions[1]] = [reordered.questions[1], reordered.questions[0]];
  assert.equal(validate(reordered).valid, false);
  const related = structuredClone(round1);
  related.questions[0].round1Relation = "refines";
  assert.equal(validate(related).valid, false);
});
