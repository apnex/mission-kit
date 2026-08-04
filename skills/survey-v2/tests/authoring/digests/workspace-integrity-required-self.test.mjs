import assert from "node:assert/strict";
import test from "node:test";
import {
  projectWorkspaceIntegrityCore
} from "../../../source/authoring/kernel/digests.mjs";

test("workspace-integrity projection requires its nested self-digest field", () => {
  const workspace = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: { name: "workspace.alpha" },
    spec: {
      integrity: {
        semanticStateDigest: `sha256:${"a".repeat(64)}`
      }
    }
  };

  assert.throws(
    () => projectWorkspaceIntegrityCore(workspace),
    /missing required field workspaceIntegrityDigest/
  );
});
