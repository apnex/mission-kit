import assert from "node:assert/strict";
import test from "node:test";
import {
  validateAuthoringFieldValues,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  buildSurveyFrameProducts,
  createSurveyFrameFormDefinition,
} from "../../../source/authoring/survey/survey-frame-authority.mjs";

const digest = `sha256:${"f".repeat(64)}`;

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
            name: "unicode-intake",
            semanticDigest: digest,
          },
        },
        {
          ordinal: 2,
          role: "policy",
          sourceReference: {
            apiVersion: "survey.mission-kit/v1alpha1",
            kind: "SurveyPolicySnapshot",
            name: "unicode-policy",
            semanticDigest: digest,
          },
        },
      ],
    },
  };
}

test(
  "SurveyFrame products preserve form-valid astral Unicode at every paragraph list and record length boundary",
  () => {
    const values = {
      subject: "😀".repeat(160),
      purpose: "🎯".repeat(1000),
      "outcome-axes": ["🧭".repeat(512)],
      "scope-included": ["🌐".repeat(280)],
      givens: [
        `fact | ${"💡".repeat(500)}`,
      ],
      synopsis: "🧩".repeat(320),
      terms: [
        `${"🔑".repeat(80)} | ${"📚".repeat(280)}`,
      ],
    };
    const normalized = validateAuthoringFieldValues({
      formDefinition: createSurveyFrameFormDefinition(),
      normalizedValues: values,
    });
    const products = buildSurveyFrameProducts({
      normalizedValues: normalized,
      contextClosure: closure(),
    });

    assert.deepEqual(normalized, values);
    assert.equal(products.length, 2);
    const frame = products[0].resource;
    assert.equal(frame.spec.subject, values.subject);
    assert.deepEqual(
      frame.spec.givens,
      [{
        classification: "fact",
        text: "💡".repeat(500),
      }],
    );
    assert.deepEqual(
      frame.spec.terms,
      [{
        term: "🔑".repeat(80),
        meaning: "📚".repeat(280),
      }],
    );
    assert.deepEqual(
      products[1].resource.spec.outcomeAxes,
      values["outcome-axes"],
    );
  },
);
