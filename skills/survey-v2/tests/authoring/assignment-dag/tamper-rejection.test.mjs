import test from "node:test";
import {
  assignmentDigest,
  projectionArtifactDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  exactTextContent,
  textContentBytes
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  verifyTextAssignmentDag
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  assertDagError,
  issueK10TextAssignment
} from "./support.mjs";

test("tampering with any sealed assignment-DAG stage is rejected", async () => {
  const scenario = await issueK10TextAssignment();

  const changedRequest = structuredClone(scenario.request);
  changedRequest.spec.operation.task.id = "tampered-task";
  assertDagError(
    () => verifyTextAssignmentDag({ ...scenario, request: changedRequest }),
    "DAG_DIGEST_MISMATCH"
  );

  const changedProjection = structuredClone(scenario.projectionArtifact);
  changedProjection.spec.output.outputDigest =
    `sha256:${"f".repeat(64)}`;
  changedProjection.spec.projectionArtifactDigest =
    projectionArtifactDigest(changedProjection);
  assertDagError(
    () => verifyTextAssignmentDag({
      ...scenario,
      projectionArtifact: changedProjection
    }),
    "DAG_PROJECTION_OUTPUT_MISMATCH"
  );

  const changedAssignment = structuredClone(scenario.assignment);
  const originalSkeleton = textContentBytes(
    changedAssignment.spec.uneditedSkeleton.content
  );
  const changedSkeleton = Buffer.from(
    originalSkeleton.toString("utf8").replace(
      "Enter the intent",
      "Tampered intent"
    ),
    "utf8"
  );
  changedAssignment.spec.uneditedSkeleton.content =
    exactTextContent(changedSkeleton);
  changedAssignment.spec.assignmentDigest =
    assignmentDigest(changedAssignment);
  assertDagError(
    () => verifyTextAssignmentDag({
      ...scenario,
      assignment: changedAssignment
    }),
    "DAG_SKELETON_MISMATCH"
  );
});
