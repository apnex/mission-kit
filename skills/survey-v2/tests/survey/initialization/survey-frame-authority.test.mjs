import assert from "node:assert/strict";
import test from "node:test";
import {
  validateById,
} from "../../../generated/validators.mjs";
import {
  validateSharedResource,
} from "../../../generated/shared-semantic-validators.mjs";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createSurveyFrameFormDefinition,
  buildSurveyFrameProducts,
} from "../../../source/authoring/survey/survey-frame-authority.mjs";

function digest(fill) {
  return `sha256:${fill.repeat(64)}`;
}

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
            name: "survey-intake",
            semanticDigest: digest("1"),
          },
        },
        {
          ordinal: 2,
          role: "policy",
          sourceReference: {
            apiVersion: "survey.mission-kit/v1alpha1",
            kind: "SurveyPolicySnapshot",
            name: "survey-policy",
            semanticDigest: digest("2"),
          },
        },
      ],
    },
  };
}

test("SurveyFrame authority deterministically defines its form and exact two-resource product group", () => {
  const form = createSurveyFrameFormDefinition();
  assert.deepEqual(
    form.spec.fields.map(({ id, ordinal }) => ({ id, ordinal })),
    [
      { id: "subject", ordinal: 1 },
      { id: "purpose", ordinal: 2 },
      { id: "outcome-axes", ordinal: 3 },
      { id: "scope-included", ordinal: 4 },
      { id: "scope-excluded", ordinal: 5 },
      { id: "givens", ordinal: 6 },
      { id: "synopsis", ordinal: 7 },
      { id: "terms", ordinal: 8 },
    ],
  );
  const structuralForm = validateById(
    "urn:mission-kit:authoring:schema:authoring-form-definition:v1alpha1",
    form,
  );
  assert.equal(
    structuralForm.valid,
    true,
    structuralForm.errors.join("; "),
  );

  const input = {
    normalizedValues: {
      subject: "Survey-v2 ContextFrame authoring",
      purpose: "Determine how context should govern Survey generation.",
      "outcome-axes": [
        "intent fidelity",
        "question-generation quality",
      ],
      "scope-included": [
        "Survey-level semantic context",
        "deterministic downstream generation",
      ],
      "scope-excluded": ["runtime response collection"],
      givens: [
        "fact | A Survey contains two rounds of three questions.",
        "constraint | Projection must be deterministic.",
      ],
      synopsis:
        "Frame Survey intent before any Round or Question is generated.",
      terms: [
        "ContextFrame | A process-neutral semantic context resource.",
      ],
    },
    contextClosure: closure(),
  };
  const first = buildSurveyFrameProducts(input);
  const repeated = buildSurveyFrameProducts(input);
  assert.deepEqual(repeated, first);
  assert.notEqual(repeated, first);
  assert.deepEqual(
    first.map(({ slot, resource }) => ({
      slot,
      kind: resource.kind,
    })),
    [
      { slot: "survey-frame", kind: "ContextFrame" },
      { slot: "survey", kind: "Survey" },
    ],
  );
  const [frameProduct, surveyProduct] = first;
  assert.deepEqual(
    surveyProduct.resource.spec.surveyFrameRef,
    resourceReferenceFrom(frameProduct.resource),
  );
  assert.deepEqual(
    surveyProduct.resource.spec.outcomeAxes,
    input.normalizedValues["outcome-axes"],
  );
  assert.deepEqual(
    surveyProduct.resource.spec.policySnapshotRef,
    closure().spec.layers[1].sourceReference,
  );
  const sharedValidation = validateSharedResource(
    frameProduct.resource.apiVersion,
    frameProduct.resource.kind,
    frameProduct.resource,
  );
  assert.equal(
    sharedValidation.valid,
    true,
    JSON.stringify(sharedValidation, null, 2),
  );
  const structuralSurvey = validateById(
    "urn:mission-kit:survey:schema:survey:v1alpha1",
    surveyProduct.resource,
  );
  assert.equal(
    structuralSurvey.valid,
    true,
    structuralSurvey.errors.join("; "),
  );
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(frameProduct.resource.spec), true);
});
