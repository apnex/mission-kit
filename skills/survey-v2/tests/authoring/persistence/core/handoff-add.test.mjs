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

test("a selected handoff slot can be added", () => {
  const brief = resource("Brief", "brief-one");
  const workspace = makeWorkspace();
  const mutation = makeMutation({
    workspace,
    createdResources: [{ slot: "brief", resource: brief }],
    activeHeadChanges: [{
      slot: "brief",
      before: null,
      after: resourceReferenceFrom(brief),
    }],
    handoffProducts: [slot("brief", brief)],
  });
  assert.deepEqual(applyTransitionWorkspace({
    workspace,
    mutation,
    handoffSlots: ["brief"],
  }).spec.handoffProducts, [slot("brief", brief)]);
});
