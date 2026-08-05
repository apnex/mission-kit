import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveOperationIdentity,
} from "../../../../source/authoring/runtime/commit-records.mjs";
import {
  assignmentResource,
  digest,
} from "./support.mjs";

test("byte-identical Assignment reauthorization is keyed by locked prior evidence revision", () => {
  const assignment = assignmentResource();
  const identityAt = (priorEvidenceRevision) =>
    deriveOperationIdentity({
      operationClass: "assignment-issuance",
      machineId: "authoring-kernel",
      operationDigest: digest("9"),
      requestDigest: digest("b"),
      assignmentDigest: assignment.spec.assignmentDigest,
      priorEvidenceRevision,
    });
  assert.deepEqual([
    identityAt(3).payloadDigest === identityAt(4).payloadDigest,
    identityAt(3).idempotency.key === identityAt(4).idempotency.key,
  ], [true, false]);
});
