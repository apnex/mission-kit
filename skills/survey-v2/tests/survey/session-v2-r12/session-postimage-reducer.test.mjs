import assert from "node:assert/strict";
import test from "node:test";
import {
  projectSessionAuthoringSnapshot,
  sealSurveySessionRoot,
  synchronizeSurveySessionPostImage,
  verifySurveySessionSnapshotDigest,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  createCandidate,
} from "./session-provenance-support.mjs";

test("the Survey postimage reducer is deterministic and failure-atomic", async (context) => {
await context.test("the neutral postimage synchronizer is deterministic and does not mutate either input", async () => {
  const { session } = await createCandidate();
  const snapshot = projectSessionAuthoringSnapshot(session);
  const beforeSession = structuredClone(session);
  const beforeSnapshot = structuredClone(snapshot);

  const first = synchronizeSurveySessionPostImage(
    session,
    snapshot,
  );
  const second = synchronizeSurveySessionPostImage(
    session,
    snapshot,
  );

  assert.deepEqual(first, second);
  assert.equal(first.pendingProjection, null);
  assert.deepEqual(session, beforeSession);
  assert.deepEqual(snapshot, beforeSnapshot);
  verifySurveySessionSnapshotDigest(
    sealSurveySessionRoot(first),
  );
});

await context.test("a rejected R12 transition leaves both preimage and proposed postimage byte-identical", async () => {
  const { session } = await createCandidate();
  const next = structuredClone(
    projectSessionAuthoringSnapshot(session),
  );
  next.commitRevision = 1;
  next.machineHeads = next.machineHeads.map((head) => {
    if (head.machineId === "authoring") {
      return {
        ...head,
        state: "waiting_for_round_1_responses",
      };
    }
    if (head.machineId === "phase") {
      return {
        ...head,
        state: "round_1_q1_ready",
      };
    }
    return head;
  });
  const beforeSession = structuredClone(session);
  const beforeNext = structuredClone(next);

  assert.throws(
    () => synchronizeSurveySessionPostImage(session, next),
    {
      code: "SURVEY_SESSION_R12_POSTIMAGE_INVALID",
    },
  );
  assert.deepEqual(session, beforeSession);
  assert.deepEqual(next, beforeNext);
});
});
