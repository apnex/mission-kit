import assert from "node:assert/strict";
import test from "node:test";
import {
  applyEvidenceWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import { makeWorkspace } from "./support.mjs";

test("an evidence-only write increments only evidenceRevision", () => {
  const workspace = makeWorkspace();
  const result = applyEvidenceWorkspace({
    workspace,
    openAssignmentAfter: null,
  });
  assert.deepEqual([
    result.spec.semanticRevision,
    result.spec.evidenceRevision,
    result.spec.integrity.semanticStateDigest,
  ], [0, 1, workspace.spec.integrity.semanticStateDigest]);
});
