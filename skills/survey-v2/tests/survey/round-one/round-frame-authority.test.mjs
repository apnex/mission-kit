import assert from "node:assert/strict";
import test from "node:test";
import {
  validateById,
} from "../../../generated/validators.mjs";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createRoundOneFrameFormDefinition,
  buildRoundOneFrameProducts,
} from "../../../source/authoring/survey/round-one-frame-authority.mjs";
import {
  createSurveyResourceResolver,
  validateSurveyResourceSemantics,
} from "../../../source/authoring/survey/resource-semantics.mjs";
import {
  roundOneContextClosure,
  roundOneFrameValues,
} from "./support.mjs";

test("Round 1 frame authority deterministically creates one ContextFrame and its exact foundation SurveyRound", () => {
  const form = createRoundOneFrameFormDefinition();
  assert.deepEqual(
    form.spec.fields.map(({ id, ordinal }) => ({ id, ordinal })),
    [
      { id: "subject", ordinal: 1 },
      { id: "purpose", ordinal: 2 },
      { id: "scope-included", ordinal: 3 },
      { id: "scope-excluded", ordinal: 4 },
      { id: "givens", ordinal: 5 },
      { id: "synopsis", ordinal: 6 },
      { id: "terms", ordinal: 7 },
      { id: "scope-relation", ordinal: 8 },
      { id: "containment-rationale", ordinal: 9 },
    ],
  );
  assert.equal(
    validateById(
      "urn:mission-kit:authoring:schema:authoring-form-definition:v1alpha1",
      form,
    ).valid,
    true,
  );

  const input = {
    normalizedValues: roundOneFrameValues(),
    contextClosure: roundOneContextClosure(),
  };
  const first = buildRoundOneFrameProducts(input);
  const repeated = buildRoundOneFrameProducts(input);
  assert.deepEqual(repeated, first);
  assert.notEqual(repeated, first);
  assert.deepEqual(
    first.map(({ slot, resource }) => [slot, resource.kind]),
    [
      ["round-1-frame", "ContextFrame"],
      ["round-1", "SurveyRound"],
    ],
  );
  const [frameProduct, roundProduct] = first;
  const parentLayers = input.contextClosure.spec.layers;
  assert.deepEqual(roundProduct.resource.spec, {
    surveyRef: parentLayers[1].sourceReference,
    ordinal: 1,
    role: "foundation",
    surveyFrameRef: parentLayers[0].sourceReference,
    roundFrameRef: resourceReferenceFrom(frameProduct.resource),
    parentBinding: {
      parentFrameRef: parentLayers[0].sourceReference,
      scopeRelation: "narrows",
      containmentRationale:
        input.normalizedValues["containment-rationale"],
    },
  });
  assert.equal(
    Object.hasOwn(
      roundProduct.resource.spec,
      "round1InterpretationRef",
    ),
    false,
  );
  assert.deepEqual(
    frameProduct.dependencies,
    [{
      relation: "derived-from",
      selector: { mode: "context-layer", ordinal: 1 },
    }],
  );
  assert.deepEqual(
    roundProduct.dependencies,
    [
      {
        relation: "belongs-to",
        selector: { mode: "context-layer", ordinal: 2 },
      },
      {
        relation: "frames",
        selector: {
          mode: "created-slot",
          slot: "round-1-frame",
        },
      },
      {
        relation: "parent-frame",
        selector: { mode: "context-layer", ordinal: 1 },
      },
    ],
  );
  for (const resource of first.map(({ resource }) => resource)) {
    const schemaId = resource.kind === "ContextFrame"
      ? "urn:mission-kit:schemas:context-frame:v1alpha1"
      : "urn:mission-kit:survey:schema:survey-round:v1alpha1";
    const structural = validateById(schemaId, resource);
    assert.equal(
      structural.valid,
      true,
      structural.errors.join("; "),
    );
  }
  const resources = [
    ...parentLayers.map((layer) => layer.sourceSnapshot),
    ...first.map(({ resource }) => resource),
  ];
  assert.deepEqual(
    validateSurveyResourceSemantics(roundProduct.resource, {
      resolveReference: createSurveyResourceResolver(resources),
    }),
    [],
  );
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(roundProduct.resource.spec), true);
});
