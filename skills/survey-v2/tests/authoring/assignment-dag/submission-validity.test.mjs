import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizedSubmissionDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createTextSubmission
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  validateContract
} from "../contracts/support/contract-validation.mjs";
import {
  issueK10TextAssignment,
  populatedTextBytes,
  producerProvenance
} from "./support.mjs";

test("a completed text form produces one structurally and semantically valid submission", async () => {
  const scenario = await issueK10TextAssignment();
  const { parsed, submission } = createTextSubmission({
    name: "brief-submission",
    request: scenario.request,
    contextClosure: scenario.contextClosure,
    assignment: scenario.assignment,
    projectionArtifact: scenario.projectionArtifact,
    projectionBinding: scenario.projectionBinding,
    formDefinition: scenario.formDefinition,
    submittedBytes: populatedTextBytes(scenario),
    producerProvenance: producerProvenance(),
    renderProjection: scenario.renderProjection
  });

  assert.deepEqual(parsed.normalizedValues, {
    summary: "A useful brief."
  });
  assert.equal(
    submission.spec.normalizedSubmissionDigest,
    normalizedSubmissionDigest(submission)
  );
  assert.deepEqual(
    await validateContract("authoring-submission", submission),
    {
      valid: true,
      structuralErrors: [],
      semanticIssues: []
    }
  );
});
