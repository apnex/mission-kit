import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTransitionWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  makeMutation,
  makeWorkspace,
  resource,
  slot,
} from "./support.mjs";

test("omitting a product for a selected handoff slot removes it", () => {
  const brief = resource("Brief", "brief-one");
  const workspace = makeWorkspace({
    resources: [brief],
    activeHeads: [slot("brief", brief)],
    handoffProducts: [slot("brief", brief)],
  });
  const mutation = makeMutation({ workspace });
  assert.deepEqual(applyTransitionWorkspace({
    workspace,
    mutation,
    handoffSlots: ["brief"],
  }).spec.handoffProducts, []);
});
