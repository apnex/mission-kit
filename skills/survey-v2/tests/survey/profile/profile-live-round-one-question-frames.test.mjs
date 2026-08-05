import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
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
  submitRoundOneQuestionFrames,
  submitSurveyFrame,
  surveyPhaseMachineId,
  validateContract,
} from "./live-support.mjs";

test("the live Survey AT04 path atomically commits three grounded QuestionFrames, their set, and one GenerationRecord", async () => {
  const harness = await createLiveSurveyHarness({
    storeId: "survey-v2-profile-live-at04",
  });
  await beginSurveyAuthoring(harness);
  let issued = await issueSurveyFrameAssignment(harness);
  await submitSurveyFrame(
    harness,
    issued,
    createSurveyFrameSubmission(harness, issued),
  );
  issued = await issueRoundOneFrameAssignment(harness);
  await submitRoundOneFrame(
    harness,
    issued,
    createRoundOneFrameSubmission(
      harness,
      issued,
      roundOneFrameValues(),
    ),
  );

  issued = await issueRoundOneQuestionFramesAssignment(harness);
  assert.deepEqual(
    issued.contextClosure.spec.layers.map((layer) => [
      layer.role,
      layer.selectedValue.map(({ path }) => path),
    ]),
    [
      ["survey-frame", ["/spec"]],
      ["round-frame", ["/spec"]],
      ["survey", ["/spec/outcomeAxes"]],
    ],
  );
  assert.deepEqual(
    Object.keys(issued.request.spec.operation.inputs),
    ["round-frame", "survey", "survey-frame"],
  );
  const view = issued.viewBytes.toString("utf8");
  assert.match(view, /authority/u);
  assert.match(view, /determinism/u);
  assert.doesNotMatch(view, /policySnapshotRef/u);
  assert.doesNotMatch(view, /dependencyEdges/u);

  const submission = createRoundOneQuestionFramesSubmission(
    harness,
    issued,
    roundOneQuestionFrameValues(),
  );
  const beforeStaleVector = await harness.coordinator.read(
    harness.storeId,
  );
  const staleWorkspace = structuredClone(
    beforeStaleVector.snapshot.workspace,
  );
  staleWorkspace.spec.semanticRevision += 1;
  const staleResult = reduceAuthoring(
    harness.profile,
    harness.protocol,
    resealWorkspace(staleWorkspace),
    {
      class: "submit",
      request: issued.request,
      assignment: issued.assignment,
      submission,
      externalCouplings: [],
    },
    {
      validateContract,
      kernel: harness.profile.spec.kernel,
      inventory: harness.resources,
      executables: harness.executables,
    },
  );
  assert.equal(staleResult.kind, "rejected");
  assert.equal(
    staleResult.issues[0].spec.code,
    "SUBMISSION_BASE_STALE",
  );
  assert.deepEqual(
    (await harness.coordinator.read(harness.storeId)).snapshot,
    beforeStaleVector.snapshot,
  );
  const { command, result } =
    await submitRoundOneQuestionFrames(
      harness,
      issued,
      submission,
    );
  assert.equal(result.kind, "committed");
  assert.deepEqual(
    result.receipt.spec.createdResources.map(({ kind }) => kind),
    ["ContextFrame", "ContextFrame", "ContextFrame", "QuestionFrameSet"],
  );
  assert.equal(result.sidecars.length, 1);
  assert.equal(result.sidecars[0].kind, "GenerationRecord");

  const firstRead = await harness.coordinator.read(harness.storeId);
  assert.equal(
    firstRead.snapshot.workspace.spec.authoringState,
    "round_1_questions_required",
  );
  assert.equal(firstRead.snapshot.workspace.spec.semanticRevision, 4);
  assert.equal(
    firstRead.snapshot.machineHeads.find(
      (head) => head.machineId === surveyPhaseMachineId,
    ).state,
    "round_1_drafting",
  );
  const active = new Map(
    firstRead.snapshot.workspace.spec.activeHeads.map(
      (head) => [head.slot, head.reference],
    ),
  );
  const frameSetVersion =
    firstRead.snapshot.workspace.spec.resourceVersions.find(
      ({ reference }) =>
        canonicalize(reference) ===
          canonicalize(active.get("round-1-question-frame-set")),
    );
  assert.ok(frameSetVersion);
  assert.equal(frameSetVersion.resource.spec.slots.length, 3);
  assert.deepEqual(
    frameSetVersion.resource.spec.slots.map((slot) => slot.questionOrdinal),
    [1, 2, 3],
  );
  const closureRefs = issued.contextClosure.spec.layers.map(
    (layer) => layer.sourceReference,
  );
  for (const slot of frameSetVersion.resource.spec.slots) {
    assert.deepEqual(slot.sourceEvidenceRefs, closureRefs);
    assert.equal(Object.hasOwn(slot, "round1Relation"), false);
  }
  const frameEdges = firstRead.snapshot.workspace.spec.dependencyEdges
    .filter((edge) =>
      canonicalize(edge.from) ===
        canonicalize(active.get("round-1-question-frame-set")) &&
      edge.relation === "frames")
    .map((edge) => canonicalize(edge.to));
  assert.deepEqual(frameEdges, [...frameEdges].sort());

  const replayed = await harness.coordinator.execute(
    harness.storeId,
    command,
  );
  const replayRead = await harness.coordinator.read(harness.storeId);
  assert.deepEqual(replayed, result);
  assert.deepEqual(replayRead.snapshot, firstRead.snapshot);

  const unavailable = await harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
  assert.equal(unavailable.kind, "rejected");
  assert.equal(
    unavailable.issues[0].spec.code,
    "PROFILE_EXECUTION_TRANSITION_UNAVAILABLE",
  );
  assert.deepEqual(
    (await harness.coordinator.read(harness.storeId)).snapshot,
    firstRead.snapshot,
  );
});
