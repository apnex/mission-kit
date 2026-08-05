import assert from "node:assert/strict";
import test from "node:test";
import {
  createCanonicalSubmission
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  assertDagError,
  issueK10TextAssignment,
  producerProvenance
} from "./support.mjs";

test("a submission against the wrong projection artifact is rejected", async () => {
  const assigned = await issueK10TextAssignment({
    projectionName: "assigned-projection",
    assignmentName: "assigned-brief"
  });
  const other = await issueK10TextAssignment({
    projectionName: "other-projection",
    assignmentName: "other-brief"
  });

  assert.deepEqual(other.blankViewBytes, assigned.blankViewBytes);
  assert.equal(
    other.projectionArtifact.spec.projectionArtifactDigest,
    assigned.projectionArtifact.spec.projectionArtifactDigest
  );
  assert.notEqual(
    other.projectionArtifact.metadata.name,
    assigned.projectionArtifact.metadata.name
  );
  assertDagError(
    () => createCanonicalSubmission({
      name: "wrong-projection-submission",
      request: assigned.request,
      contextClosure: assigned.contextClosure,
      assignment: assigned.assignment,
      projectionArtifact: other.projectionArtifact,
      projectionBinding: assigned.projectionBinding,
      formDefinition: assigned.formDefinition,
      normalizedValues: { summary: "A useful brief." },
      rawEvidenceBytes: Buffer.from("canonical adapter evidence\n", "utf8"),
      producerProvenance: producerProvenance("canonical-adapter")
    }),
    "DAG_ASSIGNMENT_ANCESTRY_MISMATCH"
  );
});
