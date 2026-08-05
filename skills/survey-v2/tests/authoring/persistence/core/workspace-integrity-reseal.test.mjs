import assert from "node:assert/strict";
import test from "node:test";
import { resourceReferenceFrom, workspaceIntegrityDigest } from "../../../../source/authoring/kernel/digests.mjs";
import {
  retainWorkspaceEvidence,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  makeWorkspace,
  resource,
  stored,
} from "./support.mjs";

test("evidence retention reseals complete workspace integrity without a revision", () => {
  const workspace = makeWorkspace();
  const evidence = resource("Evidence", "evidence-one");
  const result = retainWorkspaceEvidence({
    workspace,
    retainedResourceVersions: [stored(evidence)],
    historyReferences: [resourceReferenceFrom(evidence)],
  });
  assert.deepEqual([
    result.spec.integrity.workspaceIntegrityDigest ===
      workspaceIntegrityDigest(result),
    result.spec.integrity.workspaceIntegrityDigest ===
      workspace.spec.integrity.workspaceIntegrityDigest,
    result.spec.evidenceRevision,
  ], [true, false, 0]);
});
