import assert from "node:assert/strict";
import test from "node:test";
import {
  projectionArtifactDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  verifyTextAssignmentDag
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  assertDagError,
  issueK10TextAssignment
} from "./support.mjs";

test("projection sources are exactly ordered request then context", async () => {
  const scenario = await issueK10TextAssignment();
  assert.deepEqual(scenario.projectionArtifact.spec.sources, [
    {
      role: "request",
      reference: resourceReferenceFrom(scenario.request),
      integrityDigest: resourceIntegrityDigest(scenario.request)
    },
    {
      role: "context",
      reference: resourceReferenceFrom(scenario.contextClosure),
      integrityDigest: resourceIntegrityDigest(scenario.contextClosure)
    }
  ]);

  const reversedProjection = structuredClone(scenario.projectionArtifact);
  reversedProjection.spec.sources.reverse();
  reversedProjection.spec.projectionArtifactDigest =
    projectionArtifactDigest(reversedProjection);

  assertDagError(
    () => verifyTextAssignmentDag({
      ...scenario,
      projectionArtifact: reversedProjection
    }),
    "DAG_PROJECTION_SOURCE_MISMATCH"
  );
});
