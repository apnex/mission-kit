import assert from "node:assert/strict";
import test from "node:test";
import { projectRequestCore } from "../../../source/authoring/kernel/digests.mjs";

test("request core rejects fields produced later in the assignment digest DAG", () => {
  const request = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringRequest",
    spec: {
      requestDigest: `sha256:${"1".repeat(64)}`,
      semanticRevision: 1,
      projectionArtifactDigest: `sha256:${"9".repeat(64)}`
    }
  };
  assert.throws(
    () => projectRequestCore(request),
    /cannot contain later projection field projectionArtifactDigest/
  );
});
