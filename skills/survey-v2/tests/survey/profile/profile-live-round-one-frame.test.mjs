import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  roundOneFrameValues,
} from "../round-one/support.mjs";
import {
  beginSurveyAuthoring,
  createLiveSurveyHarness,
  createRoundOneFrameSubmission,
  createSurveyFrameSubmission,
  issueRoundOneFrameAssignment,
  issueSurveyFrameAssignment,
  submitRoundOneFrame,
  submitSurveyFrame,
  surveyAuthoringMachineId,
  surveyPhaseMachineId,
} from "./live-support.mjs";

test("the live Survey AT03 path commits its Round frame, SurveyRound, and one replay-stable GenerationRecord", async () => {
  const harness = await createLiveSurveyHarness({
    storeId: "survey-v2-profile-live-at03",
  });
  await beginSurveyAuthoring(harness);
  const surveyIssued =
    await issueSurveyFrameAssignment(harness);
  await submitSurveyFrame(
    harness,
    surveyIssued,
    createSurveyFrameSubmission(harness, surveyIssued),
  );

  const issued = await issueRoundOneFrameAssignment(harness);
  assert.equal(issued.kind, "assignment");
  assert.deepEqual(
    Object.keys(issued.request.spec.operation.inputs),
    ["survey", "survey-frame"],
  );
  assert.deepEqual(
    issued.contextClosure.spec.layers.map(
      (layer) => [
        layer.ordinal,
        layer.role,
        layer.selectedValue.map(({ path }) => path),
      ],
    ),
    [
      [1, "survey-frame", ["/spec"]],
      [2, "survey", ["/spec/outcomeAxes"]],
    ],
  );
  assert.deepEqual(
    issued.request.spec.operation.inputs["survey-frame"],
    issued.contextClosure.spec.layers[0].sourceReference,
  );
  assert.deepEqual(
    issued.request.spec.operation.inputs.survey,
    issued.contextClosure.spec.layers[1].sourceReference,
  );
  const view = issued.viewBytes.toString("utf8");
  assert.match(
    view,
    /Define the Survey boundary before Round authoring\./u,
  );
  assert.match(view, /authority/u);
  assert.match(view, /determinism/u);
  assert.doesNotMatch(view, /policySnapshotRef/u);
  assert.doesNotMatch(view, /semanticDigest/u);

  const submission = createRoundOneFrameSubmission(
    harness,
    issued,
    roundOneFrameValues(),
  );
  const { command, result } = await submitRoundOneFrame(
    harness,
    issued,
    submission,
  );
  assert.equal(result.kind, "committed");
  assert.equal(result.sidecars.length, 1);
  assert.equal(result.sidecars[0].kind, "GenerationRecord");
  assert.deepEqual(
    result.receipt.spec.createdResources.map(
      (reference) => reference.kind,
    ),
    ["ContextFrame", "SurveyRound"],
  );
  assert.deepEqual(
    result.sidecars[0].spec.result.createdResourceRefs,
    result.receipt.spec.createdResources,
  );
  assert.deepEqual(
    result.sidecars[0].spec.requestRef,
    resourceReferenceFrom(issued.request),
  );
  assert.deepEqual(
    result.sidecars[0].spec.assignmentRef,
    resourceReferenceFrom(issued.assignment),
  );
  assert.deepEqual(
    result.sidecars[0].spec.submissionRef,
    resourceReferenceFrom(submission),
  );

  const firstRead = await harness.coordinator.read(
    harness.storeId,
  );
  assert.equal(firstRead.snapshot.commitRevision, 5);
  assert.equal(
    firstRead.snapshot.workspace.spec.authoringState,
    "round_1_question_frames_required",
  );
  assert.equal(
    firstRead.snapshot.workspace.spec.semanticRevision,
    3,
  );
  assert.equal(
    firstRead.snapshot.workspace.spec.evidenceRevision,
    5,
  );
  assert.deepEqual(
    firstRead.snapshot.workspace.spec.activeHeads.map(
      (head) => head.slot,
    ),
    [
      "intake",
      "policy",
      "survey-frame",
      "survey",
      "round-1-frame",
      "round-1",
    ],
  );
  assert.deepEqual(
    firstRead.snapshot.journal[4].machineEdges.map(
      (edge) => [edge.machineId, edge.transitionId],
    ),
    [[surveyAuthoringMachineId, "AT03"]],
  );
  assert.equal(
    firstRead.snapshot.machineHeads.find(
      (head) => head.machineId === surveyPhaseMachineId,
    ).state,
    "round_1_drafting",
  );
  assert.equal(
    firstRead.snapshot.workspace.spec.resourceVersions
      .filter(({ resource }) =>
        resource.kind === "GenerationRecord")
      .length,
    2,
  );

  const replayed = await harness.coordinator.execute(
    harness.storeId,
    command,
  );
  const replayRead = await harness.coordinator.read(
    harness.storeId,
  );
  assert.deepEqual(replayed, result);
  assert.deepEqual(replayRead.snapshot, firstRead.snapshot);
});
