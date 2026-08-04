import assert from "node:assert/strict";
import test from "node:test";
import {
  projectWorkspaceIntegrityCore,
  workspaceIntegrityDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { digestA, digestB } from "./resource-fixture.mjs";

function workspace() {
  return {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: { name: "workspace.alpha", labels: { location: "one" } },
    spec: {
      profile: { name: "brief", digest: digestA },
      protocol: { name: "authoring-v1", digest: digestB },
      authoringState: "frame_required",
      semanticRevision: 3,
      activeHeads: [{ slot: "frame", reference: { semanticDigest: digestA } }],
      dependencyEdges: [],
      handoffProducts: [],
      evidenceRevision: 9,
      resourceVersions: [{ digest: digestA }],
      history: [{ semanticDigest: digestA }],
      integrity: {
        semanticStateDigest: `sha256:${"1".repeat(64)}`,
        workspaceIntegrityDigest: `sha256:${"2".repeat(64)}`
      }
    }
  };
}

test("workspace integrity omits only its nested self digest and retains all evidence", () => {
  const value = workspace();
  const core = projectWorkspaceIntegrityCore(value);
  assert.equal(
    Object.hasOwn(core.spec.integrity, "workspaceIntegrityDigest"),
    false
  );
  assert.equal(core.spec.integrity.semanticStateDigest, value.spec.integrity.semanticStateDigest);
  assert.deepEqual(core.metadata, value.metadata);
  assert.deepEqual(core.spec.resourceVersions, value.spec.resourceVersions);
  assert.deepEqual(core.spec.history, value.spec.history);

  const changedSelf = structuredClone(value);
  changedSelf.spec.integrity.workspaceIntegrityDigest = `sha256:${"f".repeat(64)}`;
  assert.equal(workspaceIntegrityDigest(value), workspaceIntegrityDigest(changedSelf));

  const changedEvidence = structuredClone(value);
  changedEvidence.spec.evidenceRevision = 10;
  assert.notEqual(
    workspaceIntegrityDigest(value),
    workspaceIntegrityDigest(changedEvidence)
  );

  const changedSemanticBinding = structuredClone(value);
  changedSemanticBinding.spec.integrity.semanticStateDigest = `sha256:${"e".repeat(64)}`;
  assert.notEqual(
    workspaceIntegrityDigest(value),
    workspaceIntegrityDigest(changedSemanticBinding)
  );
});
