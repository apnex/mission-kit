import assert from "node:assert/strict";
import test from "node:test";
import {
  projectProjectionArtifactCore,
  projectionArtifactDigest
} from "../../../source/authoring/kernel/digests.mjs";

test("projection-artifact identity omits its self field and retains output ancestry", () => {
  const artifact = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ProjectionArtifact",
    metadata: { name: "blank.alpha" },
    spec: {
      projectionArtifactDigest: `sha256:${"1".repeat(64)}`,
      sourceDigest: `sha256:${"2".repeat(64)}`,
      formDigest: `sha256:${"3".repeat(64)}`,
      engineDigest: `sha256:${"4".repeat(64)}`,
      output: {
        content: {
          mediaType: "text/plain",
          encoding: "base64",
          byteLength: 5,
          data: "YWxwaGE="
        },
        outputDigest: `sha256:${"5".repeat(64)}`
      }
    }
  };
  const changedSelf = structuredClone(artifact);
  changedSelf.spec.projectionArtifactDigest = `sha256:${"f".repeat(64)}`;
  assert.equal(
    projectionArtifactDigest(artifact),
    projectionArtifactDigest(changedSelf)
  );
  assert.equal(
    Object.hasOwn(projectProjectionArtifactCore(artifact).spec, "projectionArtifactDigest"),
    false
  );
  const changedOutput = structuredClone(artifact);
  changedOutput.spec.output.content.data = "YmV0YQ==";
  assert.notEqual(
    projectionArtifactDigest(artifact),
    projectionArtifactDigest(changedOutput)
  );
});
