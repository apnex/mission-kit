import assert from "node:assert/strict";
import test from "node:test";
import {
  makeSession
} from "../../fixtures/survey/session-v2/session-factory.mjs";
import {
  validateSessionStructure
} from "./support/session-validation.mjs";

test("the v2 session forbids legacy complex draft mirrors after authoring product handoff", async () => {
  const session = makeSession();
  session.drafts.round1Interpretations.push({
    legacyComplexDraft: "must not survive protocol-v2 persistence"
  });
  const validation = await validateSessionStructure(session);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.errors.some(
      (item) =>
        item.instancePath === "/drafts/round1Interpretations" &&
        item.keyword === "maxItems"
    )
  );
});
