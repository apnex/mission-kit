import assert from "node:assert/strict";
import test from "node:test";
import {
  createRoundOneQuestionFramesFormDefinition,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  projectRoundOneQuestionFramesText,
} from "../../../source/authoring/survey/round-one-question-frames-projector.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

const digest = `sha256:${"1".repeat(64)}`;

function input() {
  return {
    request: {
      apiVersion: "authoring.mission-kit/v1alpha1",
      kind: "AuthoringRequest",
      metadata: { name: "request" },
      spec: {},
    },
    contextClosure:
      roundOneQuestionFramesAuthorityInputs().contextClosure,
    formDefinition:
      createRoundOneQuestionFramesFormDefinition(),
    requestHandle: "12345678",
    projectionBinding: {
      id: "round-one-question-frames-projection",
      definitionDigest: digest,
      engine: {
        id: "round-one-question-frames-projector",
        digest,
      },
    },
  };
}

test("Round 1 QuestionFrame projector rejects ambient selected-value keys without disclosure or input mutation", () => {
  for (let layer = 0; layer < 3; layer += 1) {
    const candidate = input();
    const sentinel = `SECRET_LAYER_${layer}`;
    candidate.contextClosure.spec.layers[layer]
      .selectedValue[0].ambient = sentinel;
    const before = structuredClone(candidate);
    const result = projectRoundOneQuestionFramesText(candidate);
    assert.equal(result.status, "reject", `layer ${layer + 1}`);
    assert.equal(
      result.issues[0].code,
      "ROUND_ONE_QUESTION_FRAMES_PROJECTION_PARENT_INVALID",
      `layer ${layer + 1}`,
    );
    assert.doesNotMatch(
      JSON.stringify(result),
      new RegExp(sentinel, "u"),
      `layer ${layer + 1}`,
    );
    assert.deepEqual(candidate, before, `layer ${layer + 1}`);
  }
});
