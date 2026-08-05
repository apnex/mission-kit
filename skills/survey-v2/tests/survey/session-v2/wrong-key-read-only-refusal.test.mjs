import assert from "node:assert/strict";
import test from "node:test";
import {
  readdir,
} from "node:fs/promises";
import {
  createSurveySessionStore,
  readVerifiedCandidateSession,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  candidateSelector,
  createPersistentCandidate,
  readSessionBytes,
  wrongAuthenticationKey,
} from "./support.mjs";

function isBindingMismatch(error) {
  assert.equal(
    error?.code,
    "SURVEY_SESSION_IDENTITY_BINDING_MISMATCH",
  );
  return true;
}

test(
  "a wrong external key is rejected before a lock or session write can occur",
  async (testContext) => {
    const harness = await createPersistentCandidate(
      testContext,
    );
    const beforeBytes = await readSessionBytes(harness);
    const beforeEntries = await readdir(harness.runDirectory);

    await assert.rejects(
      readVerifiedCandidateSession({
        runDirectory: harness.runDirectory,
        selector: candidateSelector,
        authenticationKey: wrongAuthenticationKey,
      }),
      isBindingMismatch,
    );

    const wrongKeyStore = createSurveySessionStore({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
      authenticationKey: wrongAuthenticationKey,
    });
    let callbackInvoked = false;
    await assert.rejects(
      wrongKeyStore.withWriter(
        harness.session.sessionId,
        async () => {
          callbackInvoked = true;
        },
      ),
      isBindingMismatch,
    );

    assert.equal(callbackInvoked, false);
    assert.deepEqual(
      await readSessionBytes(harness),
      beforeBytes,
    );
    assert.deepEqual(
      await readdir(harness.runDirectory),
      beforeEntries,
    );
    assert.equal(
      beforeEntries.includes("session.lock"),
      false,
    );
  },
);
