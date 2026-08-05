import assert from "node:assert/strict";
import test from "node:test";
import {
  loadProfileScenario,
} from "./support.mjs";

test("the R11 profile declares the exact closed AT04 task, four-target footprint, and validator authority", async () => {
  const {profile} = await loadProfileScenario();
  const task = profile.spec.tasks.find(
    ({id}) => id === "author-round-1-frame-set",
  );
  assert.deepEqual(task.target, {
    slot: "round-1-question-frame-set",
    resourceType: {
      apiVersion: "survey.mission-kit/v1alpha1",
      kind: "QuestionFrameSet",
    },
    cardinality: {min: 1, max: 1},
  });
  assert.deepEqual(task.requestInputBindings, [
    {inputKey: "survey-frame", selectorId: "round-one-question-survey-frame"},
    {inputKey: "round-frame", selectorId: "round-one-question-round-frame"},
    {inputKey: "survey", selectorId: "round-one-question-survey"},
  ]);
  const at04 = profile.spec.transitionBindings.find(
    ({transitionId}) => transitionId === "AT04",
  );
  assert.deepEqual(at04.mutationFootprint, {
    created: [
      {
        slot: "round-1-question-frame-1",
        resourceType: {apiVersion: "schemas.mission-kit/v1alpha1", kind: "ContextFrame"},
        cardinality: {min: 1, max: 1},
      },
      {
        slot: "round-1-question-frame-2",
        resourceType: {apiVersion: "schemas.mission-kit/v1alpha1", kind: "ContextFrame"},
        cardinality: {min: 1, max: 1},
      },
      {
        slot: "round-1-question-frame-3",
        resourceType: {apiVersion: "schemas.mission-kit/v1alpha1", kind: "ContextFrame"},
        cardinality: {min: 1, max: 1},
      },
      {
        slot: "round-1-question-frame-set",
        resourceType: {apiVersion: "survey.mission-kit/v1alpha1", kind: "QuestionFrameSet"},
        cardinality: {min: 1, max: 1},
      },
    ],
    activeHeadSlots: [
      "round-1-question-frame-1",
      "round-1-question-frame-2",
      "round-1-question-frame-3",
      "round-1-question-frame-set",
    ],
    supersededSlots: [],
    dependencyRelations: ["belongs-to", "derived-from", "frames", "parent-frame"],
    handoffSlots: [],
    nextState: "round_1_questions_required",
  });
  assert.ok(
    profile.spec.schemaBindings.some((binding) =>
      binding.id === "question-frame-set-schema-binding" &&
      binding.resourceType.apiVersion === "survey.mission-kit/v1alpha1" &&
      binding.resourceType.kind === "QuestionFrameSet"),
  );
  assert.deepEqual(
    profile.spec.validatorSets.find(
      ({id}) => id === "question-frame-set-validator-set",
    ).members,
    [profile.spec.schemaBindings.find(
      ({id}) => id === "question-frame-set-schema-binding",
    ).semanticValidator],
  );
});
