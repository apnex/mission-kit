import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import { roundOneFrameValues } from "../round-one/support.mjs";
import {
  roundOneQuestionFrameValues,
} from "../round-one-question-frames/support.mjs";
import {
  beginSurveyAuthoring,
  createLiveSurveyHarness,
  createRoundOneFrameSubmission,
  createRoundOneQuestionFramesSubmission,
  createSurveyFrameSubmission,
  issueRoundOneFrameAssignment,
  issueRoundOneQuestionFramesAssignment,
  issueSurveyFrameAssignment,
  submitRoundOneFrame,
  submitSurveyFrame,
  validateContract,
} from "./live-support.mjs";

test("the pure R11 reducer rejects a stale AT04 request base without mutating inputs or dispatching callbacks", async () => {
  const harness = await createLiveSurveyHarness({storeId: "survey-at04-stale-base"});
  await beginSurveyAuthoring(harness);
  let issued = await issueSurveyFrameAssignment(harness);
  await submitSurveyFrame(harness, issued, createSurveyFrameSubmission(harness, issued));
  issued = await issueRoundOneFrameAssignment(harness);
  await submitRoundOneFrame(
    harness,
    issued,
    createRoundOneFrameSubmission(harness, issued, roundOneFrameValues()),
  );
  issued = await issueRoundOneQuestionFramesAssignment(harness);
  const submission = createRoundOneQuestionFramesSubmission(
    harness,
    issued,
    roundOneQuestionFrameValues(),
  );
  const before = await harness.coordinator.read(harness.storeId);
  const staleWorkspace = structuredClone(before.snapshot.workspace);
  staleWorkspace.spec.semanticRevision += 1;
  let callbackCalls = 0;
  const executables = Object.fromEntries(
    Object.entries(harness.executables).map(([category, entries]) => [
      category,
      entries.map((entry) => ({
        ...entry,
        ...(typeof entry.invoke === "function"
          ? {
            invoke(...args) {
              callbackCalls += 1;
              return entry.invoke(...args);
            },
          }
          : {}),
      })),
    ]),
  );
  const reducerInputs = {
    profile: structuredClone(harness.profile),
    protocol: structuredClone(harness.protocol),
    workspace: resealWorkspace(staleWorkspace),
    request: structuredClone(issued.request),
    assignment: structuredClone(issued.assignment),
    submission: structuredClone(submission),
  };
  const frozenBefore = structuredClone(reducerInputs);
  const result = reduceAuthoring(
    reducerInputs.profile,
    reducerInputs.protocol,
    reducerInputs.workspace,
    {
      class: "submit",
      request: reducerInputs.request,
      assignment: reducerInputs.assignment,
      submission: reducerInputs.submission,
      externalCouplings: [],
    },
    {
      validateContract,
      kernel: harness.profile.spec.kernel,
      inventory: harness.resources,
      executables,
    },
  );
  assert.equal(result.kind, "rejected");
  assert.equal(result.issues[0].spec.code, "SUBMISSION_BASE_STALE");
  assert.equal(callbackCalls, 0);
  assert.deepEqual(reducerInputs, frozenBefore);
  assert.deepEqual((await harness.coordinator.read(harness.storeId)).snapshot, before.snapshot);
});
