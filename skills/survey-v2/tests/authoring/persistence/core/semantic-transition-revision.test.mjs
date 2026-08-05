import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTransitionWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  makeMutation,
  makeWorkspace,
} from "./support.mjs";

test("an accepted transition increments both revisions and changes semantic identity", () => {
  const workspace = makeWorkspace();
  const mutation = makeMutation({ workspace });
  const result = applyTransitionWorkspace({
    workspace,
    mutation,
    handoffSlots: [],
  });
  assert.deepEqual([
    result.spec.semanticRevision,
    result.spec.evidenceRevision,
    result.spec.integrity.semanticStateDigest ===
      workspace.spec.integrity.semanticStateDigest,
  ], [1, 1, false]);
});
