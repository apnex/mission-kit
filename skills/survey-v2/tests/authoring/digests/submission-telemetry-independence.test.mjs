import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizedSubmissionDigest,
  projectNormalizedSubmissionCore,
  resourceIntegrityDigest,
  resourceSemanticDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { authoringSubmission, digestA } from "./resource-fixture.mjs";

test("submission semantic identities exclude raw evidence and producer telemetry", () => {
  const expectedCore = {
    assignmentDigest: digestA,
    normalizedValues: {
      purpose: "Make the boundary explicit",
      included: ["kernel"]
    }
  };
  const first = authoringSubmission({
    normalizedValues: expectedCore.normalizedValues,
    rawData: "Zmlyc3Q=",
    producerId: "producer-one"
  });
  const second = authoringSubmission({
    normalizedValues: expectedCore.normalizedValues,
    rawData: "c2Vjb25k",
    producerId: "producer-two"
  });
  second.evidence.telemetry = { latencyMs: 999, cost: 50 };
  assert.deepEqual(projectNormalizedSubmissionCore(first), expectedCore);
  assert.equal(normalizedSubmissionDigest(first), normalizedSubmissionDigest(second));
  assert.equal(resourceSemanticDigest(first), resourceSemanticDigest(second));
  assert.notEqual(resourceIntegrityDigest(first), resourceIntegrityDigest(second));
});
