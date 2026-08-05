import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyFrameFormDefinition,
} from "../../../source/authoring/survey/survey-frame-authority.mjs";
import {
  projectSurveyFrameText,
} from "../../../source/authoring/survey/survey-frame-projector.mjs";

const digest = `sha256:${"1".repeat(64)}`;

function exactText(text) {
  const bytes = Buffer.from(text, "utf8");
  return {
    mediaType: "text/plain;charset=utf-8",
    encoding: "base64",
    byteLength: bytes.byteLength,
    data: bytes.toString("base64"),
  };
}

function input() {
  return {
    request: {
      apiVersion: "authoring.mission-kit/v1alpha1",
      kind: "AuthoringRequest",
      metadata: { name: "request" },
      spec: {},
    },
    contextClosure: {
      apiVersion: "authoring.mission-kit/v1alpha1",
      kind: "ContextClosure",
      metadata: { name: "closure" },
      spec: {
        layers: [
          {
            ordinal: 1,
            role: "intake",
            selectedValue: [
              {
                path: "/spec/inventory",
                value: [{
                  ordinal: 1,
                  logicalName: "intent.txt",
                  content: exactText("Exact Director intent.\n"),
                  rawEvidenceDigest: digest,
                }],
              },
            ],
          },
          {
            ordinal: 2,
            role: "policy",
            selectedValue: [
              {
                path: "",
                value: {
                  geometry: {
                    rounds: 2,
                    questionsPerRound: 3,
                  },
                },
              },
            ],
          },
        ],
      },
    },
    formDefinition: createSurveyFrameFormDefinition(),
    requestHandle: "12345678",
    projectionBinding: {
      id: "survey-frame-projection",
      definitionDigest: digest,
      engine: {
        id: "survey-frame-projector",
        digest,
      },
    },
  };
}

test("SurveyFrame projector exposes readable exact intake without mutating its closure authority", () => {
  const projectorInput = input();
  const before = structuredClone(projectorInput);
  const first = projectSurveyFrameText(projectorInput);
  const repeated = projectSurveyFrameText(projectorInput);
  assert.deepEqual(repeated, first);
  assert.deepEqual(projectorInput, before);
  assert.equal(first.status, "accept");
  const view = Buffer.from(first.content.data, "base64").toString("utf8");
  assert.match(view, /Exact Director intent\./u);
  assert.match(view, /intent\.txt/u);
  assert.doesNotMatch(view, /RXhhY3QgRGlyZWN0b3IgaW50ZW50Lgo=/u);

  const malformed = input();
  malformed.contextClosure.spec.layers[0].selectedValue[0].value[0]
    .content.data = "not-canonical!";
  const rejected = projectSurveyFrameText(malformed);
  assert.equal(rejected.status, "reject");
  assert.equal(rejected.issues.length, 1);
});
