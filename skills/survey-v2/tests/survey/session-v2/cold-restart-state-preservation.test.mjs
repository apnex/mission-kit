import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyAuthoringRuntime,
  nextSurveyAuthoringTask,
  readSurveyAuthoringState,
} from "../../../source/authoring/survey/authoring-runtime.mjs";
import {
  compileSurveySessionJournalIdentity,
} from "../../../source/authoring/survey/session-journal-identity.mjs";
import {
  createSurveySessionStore,
  readVerifiedCandidateSession,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  authenticationKey,
  candidateSelector,
  createPersistentCandidate,
  readSessionBytes,
  readyDependencyResult,
} from "./support.mjs";

test(
  "a cold Survey runtime preserves the pending assignment and reissues its exact view without a write",
  async (testContext) => {
    const harness = await createPersistentCandidate(
      testContext,
    );
    const warmStore = createSurveySessionStore({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
      authenticationKey,
    });
    const warmRuntime = await createSurveyAuthoringRuntime({
      store: warmStore,
      identity: harness.identity,
      systemActorId: "warm-session-adapter-test",
    });
    await warmRuntime.initialize(
      harness.session.sessionId,
      harness.session.authority,
      readyDependencyResult(harness.session),
    );
    const warmPending = await nextSurveyAuthoringTask(
      warmRuntime,
      harness.session.sessionId,
    );
    const warmState = await readSurveyAuthoringState(
      warmRuntime,
      harness.session.sessionId,
    );
    const publishedBytes = await readSessionBytes(harness);

    const persisted = await readVerifiedCandidateSession({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
      authenticationKey,
    });
    const coldIdentity =
      compileSurveySessionJournalIdentity(
        persisted,
        Buffer.from(authenticationKey),
      );
    const coldStore = createSurveySessionStore({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
      authenticationKey: Buffer.from(authenticationKey),
    });
    const coldRuntime = await createSurveyAuthoringRuntime({
      store: coldStore,
      identity: coldIdentity,
      systemActorId: "cold-session-adapter-test",
    });

    const coldState = await readSurveyAuthoringState(
      coldRuntime,
      harness.session.sessionId,
    );
    const coldPending = await nextSurveyAuthoringTask(
      coldRuntime,
      harness.session.sessionId,
    );

    assert.deepEqual(coldState, warmState);
    assert.deepEqual(coldPending, warmPending);
    assert.deepEqual(
      coldPending.viewBytes,
      warmPending.viewBytes,
    );
    assert.deepEqual(
      await readSessionBytes(harness),
      publishedBytes,
    );
  },
);
