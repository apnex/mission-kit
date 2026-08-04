import assert from "node:assert/strict";
import test from "node:test";
import {
  projectRequestCore,
  requestCoreDigest
} from "../../../source/authoring/kernel/digests.mjs";

test("request core omits only its self digest and non-semantic metadata", () => {
  const request = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringRequest",
    metadata: { name: "request.alpha", labels: { producer: "one" } },
    spec: {
      requestDigest: `sha256:${"1".repeat(64)}`,
      semanticRevision: 4,
      semanticStateDigest: `sha256:${"2".repeat(64)}`,
      formDigest: `sha256:${"3".repeat(64)}`
    }
  };
  const changedSelf = structuredClone(request);
  changedSelf.spec.requestDigest = `sha256:${"f".repeat(64)}`;
  changedSelf.metadata.name = "request.beta";
  assert.deepEqual(projectRequestCore(request), {
    apiVersion: request.apiVersion,
    kind: request.kind,
    spec: {
      semanticRevision: 4,
      semanticStateDigest: `sha256:${"2".repeat(64)}`,
      formDigest: `sha256:${"3".repeat(64)}`
    }
  });
  assert.equal(requestCoreDigest(request), requestCoreDigest(changedSelf));
});
