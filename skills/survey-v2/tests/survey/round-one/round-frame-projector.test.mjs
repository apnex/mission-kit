import assert from "node:assert/strict";
import test from "node:test";
import {
  createRoundOneFrameFormDefinition,
} from "../../../source/authoring/survey/round-one-frame-authority.mjs";
import {
  projectRoundOneFrameText,
} from "../../../source/authoring/survey/round-one-frame-projector.mjs";
import {
  roundOneContextClosure,
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
    contextClosure: roundOneContextClosure(),
    formDefinition: createRoundOneFrameFormDefinition(),
    requestHandle: "12345678",
    projectionBinding: {
      id: "round-one-frame-projection",
      definitionDigest: digest,
      engine: {
        id: "round-one-frame-projector",
        digest,
      },
    },
  };
}

test("Round 1 projector exposes only frozen Survey semantics and outcome axes without mutating its closure", () => {
  const projectorInput = input();
  const before = structuredClone(projectorInput);
  const first = projectRoundOneFrameText(projectorInput);
  const repeated = projectRoundOneFrameText(projectorInput);
  assert.deepEqual(repeated, first);
  assert.deepEqual(projectorInput, before);
  assert.equal(first.status, "accept");
  const view = Buffer.from(first.content.data, "base64")
    .toString("utf8");
  assert.match(
    view,
    /Frame the complete Survey before authoring its foundation Round\./u,
  );
  assert.match(view, /intent fidelity/u);
  assert.match(view, /question-generation quality/u);
  assert.doesNotMatch(view, /policySnapshotRef/u);
  assert.doesNotMatch(view, /semanticDigest/u);
  assert.doesNotMatch(view, /SourceSnapshot/u);
  assert.doesNotMatch(view, /RoundInterpretation/u);
  assert.doesNotMatch(view, /QuestionFrameSet/u);

  const malformed = input();
  malformed.contextClosure.spec.layers.reverse();
  const rejected = projectRoundOneFrameText(malformed);
  assert.equal(rejected.status, "reject");
  assert.equal(
    rejected.issues[0].code,
    "ROUND_ONE_PROJECTION_PARENT_INVALID",
  );
});
