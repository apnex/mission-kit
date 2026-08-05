import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyAuthoringRuntime,
} from "../../../source/authoring/survey/authoring-runtime.mjs";
import {
  createSurveySessionStore,
  readVerifiedCandidateSession,
  validateSurveySessionStoreRoot,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  authenticationKey,
  candidateSelector,
  createPersistentCandidate,
  readyDependencyResult,
} from "./support.mjs";

test(
  "an authenticated filesystem read replays the exact committed Survey journal",
  async (testContext) => {
    const harness = await createPersistentCandidate(
      testContext,
    );
    const store = createSurveySessionStore({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
      authenticationKey,
    });
    const runtime = await createSurveyAuthoringRuntime({
      store,
      identity: harness.identity,
      systemActorId: "session-adapter-test",
    });
    const initialized = await runtime.initialize(
      harness.session.sessionId,
      harness.session.authority,
      readyDependencyResult(harness.session),
    );
    assert.equal(initialized.kind, "initialized");

    const persisted = await readVerifiedCandidateSession({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
      authenticationKey,
    });
    const verified = validateSurveySessionStoreRoot(
      persisted,
      {
        selector: candidateSelector,
        authenticationKey,
      },
    );
    const finalRecord = persisted.journal.at(-1);

    assert.equal(persisted.commitRevision, 1);
    assert.equal(persisted.journal.length, 1);
    assert.equal(
      verified.replay.journalHeadDigest,
      finalRecord.recordDigest,
    );
    assert.deepEqual(
      verified.replay.revisionState,
      finalRecord.after,
    );
    assert.deepEqual(
      verified.replay.machineHeads,
      persisted.authoring.persistence.machineHeads,
    );
    assert.deepEqual(
      verified.snapshot.workspace,
      persisted.authoring.workspace,
    );
  },
);
