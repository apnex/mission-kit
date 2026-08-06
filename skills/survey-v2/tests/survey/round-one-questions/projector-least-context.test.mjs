import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  projectRoundOneQuestionsText,
} from "../../../source/authoring/survey/round-one-questions-projector.mjs";
import {
  roundOneQuestionsProjectorInput,
} from "./support.mjs";

test("Round 1 Question projector renders only the exact seven selected semantic layers", () => {
  const input = structuredClone(roundOneQuestionsProjectorInput());
  const frameSetSentinel = "FRAME_SET_IDENTITY_MUST_NOT_LEAK";
  const policySentinel = "POLICY_IDENTITY_MUST_NOT_LEAK";
  input.contextClosure.spec.layers[2].sourceSnapshot.metadata.name =
    frameSetSentinel;
  input.contextClosure.spec.layers[2].sourceReference = resourceReferenceFrom(
    input.contextClosure.spec.layers[2].sourceSnapshot,
  );
  input.contextClosure.spec.layers[6].sourceSnapshot.metadata.name =
    policySentinel;
  input.contextClosure.spec.layers[6].sourceReference = resourceReferenceFrom(
    input.contextClosure.spec.layers[6].sourceSnapshot,
  );
  const result = projectRoundOneQuestionsText(input);
  assert.equal(result.status, "accept");
  const text = Buffer.from(result.content.data, "base64").toString("utf8");
  assert.doesNotMatch(text, new RegExp(frameSetSentinel, "u"));
  assert.doesNotMatch(text, new RegExp(policySentinel, "u"));
  assert.match(text, /"role":"survey-frame"/u);
  assert.match(text, /"role":"round-frame"/u);
  assert.match(text, /"role":"question-frame-set"/u);
  assert.match(text, /"role":"question-frame-3"/u);
  assert.match(text, /"role":"policy"/u);
  assert.match(text, /q3-design-rationale/u);
});
