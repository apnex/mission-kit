import assert from "node:assert/strict";
import test from "node:test";
import { resourceReferenceFrom } from "../../../../source/authoring/kernel/digests.mjs";
import {
  applyTransitionWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  makeMutation,
  makeWorkspace,
  resource,
  slot,
} from "./support.mjs";

test("declared active heads advance while every undeclared head is retained", () => {
  const oldBrief = resource("Brief", "brief-one", { value: "old" });
  const newBrief = resource("Brief", "brief-one", { value: "new" });
  const intake = resource("Source", "intake-one");
  const workspace = makeWorkspace({
    resources: [oldBrief, intake],
    activeHeads: [slot("brief", oldBrief), slot("intake", intake)],
  });
  const mutation = makeMutation({
    workspace,
    createdResources: [{ slot: "brief", resource: newBrief }],
    activeHeadChanges: [{
      slot: "brief",
      before: resourceReferenceFrom(oldBrief),
      after: resourceReferenceFrom(newBrief),
    }],
    supersededResources: [resourceReferenceFrom(oldBrief)],
  });
  const result = applyTransitionWorkspace({
    workspace,
    mutation,
    handoffSlots: [],
  });
  assert.deepEqual(result.spec.activeHeads, [
    slot("brief", newBrief),
    slot("intake", intake),
  ]);
});
