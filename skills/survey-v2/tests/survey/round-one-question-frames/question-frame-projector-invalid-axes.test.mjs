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
    request: {apiVersion: "authoring.mission-kit/v1alpha1", kind: "AuthoringRequest", metadata: {name: "request"}, spec: {}},
    contextClosure: roundOneQuestionFramesAuthorityInputs().contextClosure,
    formDefinition: createRoundOneQuestionFramesFormDefinition(),
    requestHandle: "12345678",
    projectionBinding: {id: "projection", definitionDigest: digest, engine: {id: "projector", digest}},
  };
}

test("Round 1 QuestionFrame projector rejects missing, wrong-path, or altered Survey outcome-axis authority", () => {
  const variants = [];
  const missing = input();
  missing.contextClosure.spec.layers.pop();
  variants.push(missing);
  const wrongPath = input();
  wrongPath.contextClosure.spec.layers[2].selectedValue[0].path = "/spec";
  variants.push(wrongPath);
  const altered = input();
  altered.contextClosure.spec.layers[2].selectedValue[0].value = ["invented"];
  variants.push(altered);
  for (const candidate of variants) {
    const before = structuredClone(candidate);
    const rejected = projectRoundOneQuestionFramesText(candidate);
    assert.equal(rejected.status, "reject");
    assert.equal(
      rejected.issues[0].code,
      "ROUND_ONE_QUESTION_FRAMES_PROJECTION_PARENT_INVALID",
    );
    assert.deepEqual(candidate, before);
  }
});
