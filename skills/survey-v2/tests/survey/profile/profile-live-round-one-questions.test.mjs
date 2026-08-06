import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  roundOneFrameValues,
} from "../round-one/support.mjs";
import {
  roundOneQuestionFrameValues,
} from "../round-one-question-frames/support.mjs";
import {
  roundOneQuestionValues,
} from "../round-one-questions/support.mjs";
import {
  beginSurveyAuthoring,
  createLiveSurveyHarness,
  createRoundOneFrameSubmission,
  createRoundOneQuestionFramesSubmission,
  createRoundOneQuestionsSubmission,
  createSurveyFrameSubmission,
  issueRoundOneFrameAssignment,
  issueRoundOneQuestionFramesAssignment,
  issueRoundOneQuestionsAssignment,
  issueSurveyFrameAssignment,
  submitRoundOneFrame,
  submitRoundOneQuestionFrames,
  submitRoundOneQuestions,
  submitSurveyFrame,
  surveyAuthoringMachineId,
  surveyPhaseMachineId,
} from "./live-support.mjs";

test("the live AT05 path atomically commits the complete Round-1 instrument and coupled Q1-ready state", async () => {
  const harness = await createLiveSurveyHarness({
    storeId: "survey-v2-profile-live-at05",
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
  await submitRoundOneQuestionFrames(
    harness,
    issued,
    createRoundOneQuestionFramesSubmission(
      harness,
      issued,
      roundOneQuestionFrameValues(),
    ),
  );

  issued = await issueRoundOneQuestionsAssignment(harness);
  assert.deepEqual(
    issued.contextClosure.spec.layers.map((layer) => [
      layer.role,
      layer.selectedValue.map(({ path }) => path),
    ]),
    [
      ["survey-frame", ["/spec"]],
      ["round-frame", ["/spec"]],
      [
        "question-frame-set",
        [
          "/spec/slots/0/intentDimension",
          "/spec/slots/0/outcomeAxisAnchors",
          "/spec/slots/1/intentDimension",
          "/spec/slots/1/outcomeAxisAnchors",
          "/spec/slots/2/intentDimension",
          "/spec/slots/2/outcomeAxisAnchors",
          "/spec/coverageRationale",
          "/spec/orthogonalityRationale",
        ],
      ],
      ["question-frame-1", ["/spec"]],
      ["question-frame-2", ["/spec"]],
      ["question-frame-3", ["/spec"]],
      [
        "policy",
        [
          "/spec/geometry/questionsPerRound",
          "/spec/geometry/choiceOptions",
          "/spec/disclosure/mode",
          "/spec/disclosure/siblingQuestionFramesVisible",
          "/spec/disclosure/futureQuestionsVisible",
          "/spec/disclosure/interimInterpretationVisible",
          "/spec/validation/rationaleRequired",
          "/spec/validation/authority",
        ],
      ],
    ],
  );
  assert.deepEqual(
    Object.keys(issued.request.spec.operation.inputs),
    [
      "policy",
      "question-frame-1",
      "question-frame-2",
      "question-frame-3",
      "question-frame-set",
      "round-frame",
      "survey-frame",
    ],
  );
  const view = issued.viewBytes.toString("utf8");
  assert.match(view, /Question 1 prompt/u);
  assert.match(view, /Question 2 prompt/u);
  assert.match(view, /Question 3 prompt/u);
  assert.doesNotMatch(view, /policySnapshotRef/u);
  assert.doesNotMatch(view, /sourceReference/u);
  assert.doesNotMatch(view, /dependencyEdges/u);

  const submission = createRoundOneQuestionsSubmission(
    harness,
    issued,
    roundOneQuestionValues(),
  );
  const { command, result } = await submitRoundOneQuestions(
    harness,
    issued,
    submission,
  );
  assert.equal(result.kind, "committed");
  assert.deepEqual(
    result.receipt.spec.createdResources.map(({ kind }) => kind),
    [
      "Question",
      "Question",
      "Question",
      "SurveyQuestionBinding",
      "SurveyQuestionBinding",
      "SurveyQuestionBinding",
      "RoundInstrument",
    ],
  );
  assert.deepEqual(
    result.receipt.spec.handoffProducts.map(({ slot }) => slot),
    ["round-1-instrument"],
  );
  assert.equal(result.sidecars.length, 1);
  assert.equal(result.sidecars[0].kind, "GenerationRecord");

  const firstRead = await harness.coordinator.read(harness.storeId);
  const snapshot = firstRead.snapshot;
  assert.equal(
    snapshot.workspace.spec.authoringState,
    "waiting_for_round_1_responses",
  );
  assert.equal(snapshot.workspace.spec.semanticRevision, 5);
  assert.equal(
    snapshot.machineHeads.find(
      ({ machineId }) => machineId === surveyPhaseMachineId,
    ).state,
    "round_1_q1_ready",
  );
  assert.deepEqual(
    snapshot.journal.at(-1).machineEdges.map(
      ({ machineId, transitionId }) => [machineId, transitionId],
    ),
    [
      [surveyAuthoringMachineId, "AT05"],
      [surveyPhaseMachineId, "T03"],
    ],
  );

  const instrumentSlots = [
    "round-1-question-1",
    "round-1-question-2",
    "round-1-question-3",
    "round-1-question-binding-1",
    "round-1-question-binding-2",
    "round-1-question-binding-3",
    "round-1-instrument",
  ];
  const active = new Map(
    snapshot.workspace.spec.activeHeads.map(
      ({ slot, reference }) => [slot, reference],
    ),
  );
  const sources = new Set(
    instrumentSlots.map((slot) => canonicalize(active.get(slot))),
  );
  const instrumentEdges =
    snapshot.workspace.spec.dependencyEdges.filter(
      ({ from }) => sources.has(canonicalize(from)),
    );
  assert.equal(instrumentEdges.length, 22);
  assert.deepEqual(
    snapshot.workspace.spec.handoffProducts,
    [{
      slot: "round-1-instrument",
      reference: active.get("round-1-instrument"),
    }],
  );

  const replayed = await harness.coordinator.execute(
    harness.storeId,
    command,
  );
  assert.deepEqual(replayed, result);
  assert.deepEqual(
    (await harness.coordinator.read(harness.storeId)).snapshot,
    snapshot,
  );
  const waiting = await harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
  assert.equal(waiting.kind, "wait");
  assert.deepEqual(
    (await harness.coordinator.read(harness.storeId)).snapshot,
    snapshot,
  );
});
