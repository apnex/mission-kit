import assert from "node:assert/strict";
import test from "node:test";
import { resourceReferenceFrom } from "../../../../source/authoring/kernel/digests.mjs";
import {
  retainWorkspaceEvidence,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  makeWorkspace,
  resource,
  stored,
} from "./support.mjs";

test("history retains its prior order and appends new evidence in transaction order", () => {
  const one = resource("Evidence", "evidence-one");
  const two = resource("Evidence", "evidence-two");
  const three = resource("Evidence", "evidence-three");
  const workspace = makeWorkspace({
    resources: [one],
    history: [resourceReferenceFrom(one)],
  });
  assert.deepEqual(retainWorkspaceEvidence({
    workspace,
    retainedResourceVersions: [stored(two), stored(three)],
    historyReferences: [
      resourceReferenceFrom(two),
      resourceReferenceFrom(three),
    ],
  }).spec.history, [
    resourceReferenceFrom(one),
    resourceReferenceFrom(two),
    resourceReferenceFrom(three),
  ]);
});
