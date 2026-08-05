import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  commitReceiptDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createSurveyGenerationRecord,
} from "../../../source/authoring/survey/generation-record.mjs";

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

async function scenario() {
  const [
    request,
    assignment,
    submission,
    contextClosure,
    mutation,
    receipt,
    source,
    round,
  ] = await Promise.all([
    fixture(authoringRoot, "authoring-request"),
    fixture(authoringRoot, "authoring-assignment"),
    fixture(authoringRoot, "authoring-submission"),
    fixture(authoringRoot, "context-closure"),
    fixture(authoringRoot, "authoring-mutation"),
    fixture(authoringRoot, "authoring-commit-receipt"),
    fixture(authoringRoot, "source-snapshot"),
    fixture(surveyRoot, "survey-round-1"),
  ]);
  const inputReferences = {
    intake: resourceReferenceFrom(source),
    round: resourceReferenceFrom(round),
  };
  request.spec.operation.inputs = structuredClone(inputReferences);
  assignment.spec.request.reference = resourceReferenceFrom(request);
  submission.spec.assignment.reference = resourceReferenceFrom(assignment);
  receipt.spec.cause.assignment.reference =
    resourceReferenceFrom(assignment);
  receipt.spec.cause.submission.reference =
    resourceReferenceFrom(submission);
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
    round,
    created,
  ];
  return {
    request,
    assignment,
    submission,
    contextClosure,
    mutation,
    receipt,
    resources,
    inputReferences,
  };
}

test("post-receipt generation construction binds exact ancestry while producer telemetry remains evidence-only", async () => {
  const input = await scenario();
  const first = createSurveyGenerationRecord(input);
  const repeated = createSurveyGenerationRecord(input);
  assert.deepEqual(repeated, first);
  assert.notEqual(repeated, first);
  assert.deepEqual(
    first.spec.ancestry.inputResourceRefs,
    Object.keys(input.inputReferences)
      .sort()
      .map((key) => input.inputReferences[key]),
  );
  assert.deepEqual(
    first.spec.result.createdResourceRefs,
    input.receipt.spec.createdResources,
  );
  assert.deepEqual(
    first.evidence.producer,
    input.submission.evidence.producerProvenance.generation,
  );

  const changed = await scenario();
  changed.submission.evidence.producerProvenance.generation
    .telemetry.latencyMs += 1;
  const changedRecord = createSurveyGenerationRecord(changed);
  assert.equal(
    resourceSemanticDigest(changedRecord),
    resourceSemanticDigest(first),
  );
  assert.notDeepEqual(changedRecord.evidence, first.evidence);

  const missing = await scenario();
  delete missing.submission.evidence.producerProvenance.generation;
  assert.throws(
    () => createSurveyGenerationRecord(missing),
    (error) =>
      error.code === "GENERATION_PRODUCER_EVIDENCE_REQUIRED",
  );
});
