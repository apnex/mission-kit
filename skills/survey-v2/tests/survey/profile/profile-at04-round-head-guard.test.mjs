import assert from "node:assert/strict";
import test from "node:test";
import {
  invokeGuard,
  invokeHandler,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "../round-one-question-frames/support.mjs";
import {
  loadProfileScenario,
} from "./support.mjs";

test("the AT04 guard rejects a non-SurveyRound active Round head without dispatching its handler", async () => {
  const scenario = await loadProfileScenario();
  const authority = roundOneQuestionFramesAuthorityInputs();
  authority.workspace.spec.authoringState =
    "round_1_question_frames_required";
  authority.workspace.spec.activeHeads.find(
    ({ slot }) => slot === "round-1",
  ).reference.kind = "Survey";
  const guardBinding = scenario.profile.spec.guardBindings.find(
    ({ guardId }) => guardId === "frozen-round-1-parent-closure",
  );
  const at04 = scenario.profile.spec.transitionBindings.find(
    ({ transitionId }) => transitionId === "AT04",
  );
  const handlerBinding = scenario.profile.spec.handlerBindings.find(
    ({ id }) => id === at04.handlerBindingId,
  );
  const input = {
    phase: "submission",
    operation: {
      class: "task-submission",
      task: { id: "author-round-1-frame-set" },
      inputs: {
        "survey-frame":
          authority.contextClosure.spec.layers[0].sourceReference,
        "round-frame":
          authority.contextClosure.spec.layers[1].sourceReference,
        survey:
          authority.contextClosure.spec.layers[2].sourceReference,
      },
    },
    workspace: authority.workspace,
    contextClosure: authority.contextClosure,
  };
  const before = structuredClone(input);
  let handlerCalls = 0;
  const guarded = invokeGuard(
    scenario.compiled,
    guardBinding.handler,
    input,
  );
  const result = guarded.status === "pass"
    ? (() => {
      handlerCalls += 1;
      return invokeHandler(
        scenario.compiled,
        handlerBinding.handler,
        input,
      );
    })()
    : guarded;
  assert.equal(result.status, "reject");
  assert.equal(
    result.issues[0].code,
    "ROUND_ONE_QUESTION_FRAMES_ROUND_HEAD_INVALID",
  );
  assert.equal(handlerCalls, 0);
  assert.deepEqual(input, before);
});
