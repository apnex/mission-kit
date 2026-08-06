import assert from "node:assert/strict";
import test from "node:test";

import {
  loadProfileScenario,
} from "./support.mjs";

test("AT05 binds the exact seven-layer Question-set task and atomic seven-product authority", async () => {
  const {
    profile,
    forms,
    directorQuestionProjectionAuthority,
  } = await loadProfileScenario();
  const task = profile.spec.tasks.find(
    ({ id }) => id === "author-round-1-questions",
  );

  assert.deepEqual(task.target, {
    slot: "round-1-instrument",
    resourceType: {
      apiVersion: "survey.mission-kit/v1alpha1",
      kind: "RoundInstrument",
    },
    cardinality: { min: 1, max: 1 },
  });
  assert.deepEqual(
    task.contextSelectors.map((selector) => ({
      role: selector.role,
      slot: selector.selection.slot,
      fields: selector.projection.fields,
    })),
    [
      {
        role: "survey-frame",
        slot: "survey-frame",
        fields: ["/spec"],
      },
      {
        role: "round-frame",
        slot: "round-1-frame",
        fields: ["/spec"],
      },
      {
        role: "question-frame-set",
        slot: "round-1-question-frame-set",
        fields: [
          "/spec/slots/0/intentDimension",
          "/spec/slots/0/outcomeAxisAnchors",
          "/spec/slots/1/intentDimension",
          "/spec/slots/1/outcomeAxisAnchors",
          "/spec/slots/2/intentDimension",
          "/spec/slots/2/outcomeAxisAnchors",
          "/spec/coverageRationale",
          "/spec/orthogonalityRationale",
        ],
      },
      {
        role: "question-frame-1",
        slot: "round-1-question-frame-1",
        fields: ["/spec"],
      },
      {
        role: "question-frame-2",
        slot: "round-1-question-frame-2",
        fields: ["/spec"],
      },
      {
        role: "question-frame-3",
        slot: "round-1-question-frame-3",
        fields: ["/spec"],
      },
      {
        role: "policy",
        slot: "policy",
        fields: [
          "/spec/geometry/questionsPerRound",
          "/spec/geometry/choiceOptions",
          "/spec/disclosure/mode",
          "/spec/disclosure/siblingQuestionFramesVisible",
          "/spec/disclosure/futureQuestionsVisible",
          "/spec/disclosure/interimInterpretationVisible",
          "/spec/validation/rationaleRequired",
          "/spec/validation/authority",
        ],
      },
    ],
  );
  assert.deepEqual(task.requestInputBindings, [
    {
      inputKey: "survey-frame",
      selectorId: "round-one-questions-survey-frame",
    },
    {
      inputKey: "round-frame",
      selectorId: "round-one-questions-round-frame",
    },
    {
      inputKey: "question-frame-set",
      selectorId: "round-one-questions-frame-set",
    },
    {
      inputKey: "question-frame-1",
      selectorId: "round-one-questions-frame-1",
    },
    {
      inputKey: "question-frame-2",
      selectorId: "round-one-questions-frame-2",
    },
    {
      inputKey: "question-frame-3",
      selectorId: "round-one-questions-frame-3",
    },
    {
      inputKey: "policy",
      selectorId: "round-one-questions-policy",
    },
  ]);
  assert.equal(
    task.formBindingId,
    "round-one-questions-form-binding",
  );
  assert.equal(
    task.projectionBindingId,
    "round-one-questions-projection-binding",
  );

  const form = forms.find(
    ({ metadata }) =>
      metadata.name === "round-one-questions-form",
  );
  assert.equal(form.spec.fields.length, 18);

  const at05 = profile.spec.transitionBindings.find(
    ({ transitionId }) => transitionId === "AT05",
  );
  assert.deepEqual(
    at05.mutationFootprint.created.map(
      ({ slot, resourceType }) => [slot, resourceType.kind],
    ),
    [
      ["round-1-question-1", "Question"],
      ["round-1-question-2", "Question"],
      ["round-1-question-3", "Question"],
      ["round-1-question-binding-1", "SurveyQuestionBinding"],
      ["round-1-question-binding-2", "SurveyQuestionBinding"],
      ["round-1-question-binding-3", "SurveyQuestionBinding"],
      ["round-1-instrument", "RoundInstrument"],
    ],
  );
  assert.deepEqual(
    at05.mutationFootprint.activeHeadSlots,
    at05.mutationFootprint.created.map(({ slot }) => slot),
  );
  assert.deepEqual(at05.mutationFootprint.dependencyRelations, [
    "belongs-to",
    "binds",
    "derived-from",
    "governed-by",
  ]);
  assert.deepEqual(
    at05.mutationFootprint.handoffSlots,
    ["round-1-instrument"],
  );
  assert.deepEqual(
    at05.mutationFootprint.externalCouplings,
    [{ machineId: "phase", transitionId: "T03" }],
  );
  assert.deepEqual(
    at05.commitSidecarBindingIds,
    ["survey-generation-record-sidecar"],
  );
  assert.deepEqual(
    Object.keys(directorQuestionProjectionAuthority),
    ["definition", "engine", "outputSchema"],
  );
});
