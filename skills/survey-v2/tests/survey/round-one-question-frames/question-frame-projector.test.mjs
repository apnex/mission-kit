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

function projectorInput() {
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

test("Round 1 QuestionFrame projector deterministically exposes only three frozen least-context layers", () => {
  const input = projectorInput();
  const before = structuredClone(input);
  const first = projectRoundOneQuestionFramesText(input);
  assert.deepEqual(projectRoundOneQuestionFramesText(input), first);
  assert.deepEqual(input, before);
  assert.equal(first.status, "accept");
  const view = Buffer.from(first.content.data, "base64").toString("utf8");
  const context = JSON.parse(
    view.match(/## Context\n```json\n(.+)\n```/u)[1],
  );
  assert.deepEqual(
    context[2],
    {
      ordinal: 3,
      role: "survey",
      value: [{
        path: "/spec/outcomeAxes",
        value: ["authority", "determinism"],
      }],
    },
  );
  assert.match(view, /foundation Round/u);
  assert.match(view, /authority/u);
  assert.match(view, /determinism/u);
  assert.ok(view.indexOf("authority") < view.indexOf("determinism"));
  assert.doesNotMatch(view, /policySnapshotRef/u);
  assert.doesNotMatch(view, /semanticDigest/u);
  assert.doesNotMatch(view, /dependencyEdges/u);
  assert.doesNotMatch(view, /round1InterpretationRef/u);
});
