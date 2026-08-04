import assert from "node:assert/strict";
import test from "node:test";
import {
  projectWorkspaceSemanticStateCore,
  workspaceSemanticStateDigest
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
      dependencyEdges: [{ from: digestA, to: digestB }],
      handoffProducts: [],
      evidenceRevision: 9,
      resourceVersions: [{ digest: digestA }],
      history: [{ semanticDigest: digestA }],
      openAssignment: null,
      integrity: {
        semanticStateDigest: `sha256:${"1".repeat(64)}`,
        workspaceIntegrityDigest: `sha256:${"2".repeat(64)}`
      }
    }
  };
}

test("workspace semantic-state identity is an explicit evidence-free whitelist", () => {
  const value = workspace();
  assert.deepEqual(projectWorkspaceSemanticStateCore(value), {
    apiVersion: value.apiVersion,
    kind: value.kind,
    spec: {
      profile: value.spec.profile,
      protocol: value.spec.protocol,
      authoringState: value.spec.authoringState,
      semanticRevision: value.spec.semanticRevision,
      activeHeads: value.spec.activeHeads,
      dependencyEdges: value.spec.dependencyEdges,
      handoffProducts: value.spec.handoffProducts
    }
  });

  const evidenceOnly = structuredClone(value);
  evidenceOnly.metadata.name = "workspace.beta";
  evidenceOnly.spec.evidenceRevision = 10;
  evidenceOnly.spec.resourceVersions.push({ digest: digestB });
  evidenceOnly.spec.history.push({ semanticDigest: digestB });
  evidenceOnly.spec.integrity.semanticStateDigest = `sha256:${"f".repeat(64)}`;
  evidenceOnly.spec.integrity.workspaceIntegrityDigest = `sha256:${"e".repeat(64)}`;
  assert.equal(
    workspaceSemanticStateDigest(value),
    workspaceSemanticStateDigest(evidenceOnly)
  );

  const semanticChange = structuredClone(value);
  semanticChange.spec.activeHeads[0].reference.semanticDigest = digestB;
  assert.notEqual(
    workspaceSemanticStateDigest(value),
    workspaceSemanticStateDigest(semanticChange)
  );
});
