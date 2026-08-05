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

test("a selected handoff slot is replaced by its exact new active head", () => {
  const before = resource("Brief", "brief-one", { value: "before" });
  const after = resource("Brief", "brief-one", { value: "after" });
  const workspace = makeWorkspace({
    resources: [before],
    activeHeads: [slot("brief", before)],
    handoffProducts: [slot("brief", before)],
  });
  const mutation = makeMutation({
    workspace,
    createdResources: [{ slot: "brief", resource: after }],
    activeHeadChanges: [{
      slot: "brief",
      before: resourceReferenceFrom(before),
      after: resourceReferenceFrom(after),
    }],
    supersededResources: [resourceReferenceFrom(before)],
    handoffProducts: [slot("brief", after)],
  });
  assert.deepEqual(applyTransitionWorkspace({
    workspace,
    mutation,
    handoffSlots: ["brief"],
  }).spec.handoffProducts, [slot("brief", after)]);
});
