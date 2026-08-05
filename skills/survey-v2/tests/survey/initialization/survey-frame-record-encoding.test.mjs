import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSurveyFrameProducts,
} from "../../../source/authoring/survey/survey-frame-authority.mjs";

const digest = `sha256:${"1".repeat(64)}`;

function closure() {
  return {
    spec: {
      layers: [
        {
          ordinal: 1,
          role: "intake",
          sourceReference: {
            apiVersion: "authoring.mission-kit/v1alpha1",
            kind: "SourceSnapshot",
            name: "intake",
            semanticDigest: digest,
          },
        },
        {
          ordinal: 2,
          role: "policy",
          sourceReference: {
            apiVersion: "survey.mission-kit/v1alpha1",
            kind: "SurveyPolicySnapshot",
            name: "policy",
            semanticDigest: digest,
          },
        },
      ],
    },
  };
}

function values(overrides = {}) {
  return {
    subject: "Survey context",
    purpose: "Capture exact Director intent.",
    "outcome-axes": ["quality"],
    "scope-included": ["Survey design"],
    synopsis: "A bounded Survey context.",
    ...overrides,
  };
}

test("SurveyFrame record encoding rejects ambiguity and shared-schema semantic conflicts", () => {
  const rejected = [
    values({ givens: ["constraint: no delimiter"] }),
    values({ givens: ["unknown | unsupported classification"] }),
    values({
      givens: [
        "fact | Same semantic statement.",
        "assumption | Same semantic statement.",
      ],
    }),
    values({ terms: ["term without delimiter"] }),
    values({
      terms: [
        "context | First meaning.",
        "context | Second meaning.",
      ],
    }),
    values({
      "scope-included": ["same boundary"],
      "scope-excluded": ["same boundary"],
    }),
    {
      ...values(),
      ambient: "not admitted",
    },
  ];
  for (const normalizedValues of rejected) {
    assert.throws(
      () => buildSurveyFrameProducts({
        normalizedValues,
        contextClosure: closure(),
      }),
    );
  }
});
