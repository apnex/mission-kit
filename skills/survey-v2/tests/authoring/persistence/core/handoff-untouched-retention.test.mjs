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

test("an undeclared handoff slot is retained byte-for-byte", () => {
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
    handoffSlots: ["other"],
  }).spec.handoffProducts, [slot("brief", brief)]);
});
