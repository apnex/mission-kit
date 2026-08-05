import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  commitReceiptDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createSurveyGenerationRecord,
} from "../../../source/authoring/survey/generation-record.mjs";
import {
  createSurveyResourceResolver,
  validateSurveyResourceSemantics,
} from "../../../source/authoring/survey/resource-semantics.mjs";

const authoringRoot = new URL(
  "../../fixtures/authoring/contracts/positive/",
  import.meta.url,
);
const surveyRoot = new URL(
  "../../fixtures/survey/contracts/positive/",
  import.meta.url,
);

async function fixture(root, stem) {
  return JSON.parse(
    await readFile(new URL(`${stem}.json`, root), "utf8"),
  );
}

function namedGenerationRecord(template, name) {
  const record = structuredClone(template);
  record.metadata.name = name;
  return record;
}

async function scenario() {
  const [
    request,
    assignment,
    submission,
    contextClosure,
    mutation,
    receipt,
    source,
    generationTemplate,
  ] = await Promise.all([
    fixture(authoringRoot, "authoring-request"),
    fixture(authoringRoot, "authoring-assignment"),
    fixture(authoringRoot, "authoring-submission"),
    fixture(authoringRoot, "context-closure"),
    fixture(authoringRoot, "authoring-mutation"),
    fixture(authoringRoot, "authoring-commit-receipt"),
    fixture(authoringRoot, "source-snapshot"),
    fixture(surveyRoot, "generation-record"),
  ]);
  const priorAlpha = namedGenerationRecord(
    generationTemplate,
    "prior-generation-alpha",
  );
  const priorOmega = namedGenerationRecord(
    generationTemplate,
    "prior-generation-omega",
  );
  const unrelatedPrior = namedGenerationRecord(
    generationTemplate,
    "unrelated-prior-generation",
  );
  const priorAlphaRef = resourceReferenceFrom(priorAlpha);
  const priorOmegaRef = resourceReferenceFrom(priorOmega);
  request.spec.operation.inputs = {
    "omega-prior": priorOmegaRef,
    "middle-source": resourceReferenceFrom(source),
    "alpha-prior": priorAlphaRef,
  };
  assignment.spec.request.reference = resourceReferenceFrom(request);
  submission.spec.assignment.reference = resourceReferenceFrom(
    assignment,
  );
  receipt.spec.cause.assignment.reference = resourceReferenceFrom(
    assignment,
  );
  receipt.spec.cause.submission.reference = resourceReferenceFrom(
    submission,
  );
  const created = structuredClone(
    mutation.spec.createdResources[0].resource,
  );
  receipt.spec.createdResources = [resourceReferenceFrom(created)];
  receipt.spec.receiptDigest = commitReceiptDigest(receipt);
  const resources = [
    request,
    assignment,
    submission,
    contextClosure,
    mutation,
    receipt,
    source,
    priorAlpha,
    priorOmega,
    unrelatedPrior,
    created,
  ];
  const generation = createSurveyGenerationRecord({
    request,
    assignment,
    submission,
    contextClosure,
    mutation,
    receipt,
    resources,
  });
  return {
    expectedPriorRefs: [priorAlphaRef, priorOmegaRef],
    generation,
    resolver: createSurveyResourceResolver(resources),
    unrelatedPriorRef: resourceReferenceFrom(unrelatedPrior),
  };
}

test("GenerationRecord semantic validation rejects omitted, extra, or reordered prior refs against the canonical request-input subset", async () => {
  const {
    expectedPriorRefs,
    generation,
    resolver,
    unrelatedPriorRef,
  } = await scenario();
  assert.deepEqual(
    validateSurveyResourceSemantics(generation, {
      resolveReference: resolver,
    }),
    [],
  );

  const expectedIssue = {
    code: "GENERATION_PRIOR_ANCESTRY_MISMATCH",
    field: "/spec/ancestry/priorGenerationRecordRefs",
    reason:
      "GenerationRecord prior ancestry must equal the GenerationRecord-valued subset of the AuthoringRequest's exact inputs in canonical field-ID order.",
  };
  const expected = generation.spec.ancestry.priorGenerationRecordRefs;
  assert.deepEqual(expected, expectedPriorRefs);
  const candidates = [
    {
      label: "omitted",
      priorGenerationRecordRefs: expected.slice(1),
    },
    {
      label: "extra",
      priorGenerationRecordRefs: [...expected, unrelatedPriorRef],
    },
    {
      label: "reordered",
      priorGenerationRecordRefs: [...expected].reverse(),
    },
  ];
  for (const candidate of candidates) {
    const changed = structuredClone(generation);
    changed.spec.ancestry.priorGenerationRecordRefs =
      candidate.priorGenerationRecordRefs;
    assert.deepEqual(
      validateSurveyResourceSemantics(changed, {
        resolveReference: resolver,
      }),
      [expectedIssue],
      candidate.label,
    );
  }
});
