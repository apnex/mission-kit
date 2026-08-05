import assert from "node:assert/strict";
import test from "node:test";
import { appendTransitionScenario } from "./support.mjs";

test("a transition bundle is the authoring cause followed by every coupling", () => {
  const scenario = appendTransitionScenario({
    repeatedExternalEdges: true,
  });
  assert.deepEqual(
    scenario.transitionRecord.machineEdges.map(
      ({ machineId, transitionId }) => [machineId, transitionId],
    ),
    [
      ["authoring-kernel", "AT01"],
      ["runtime-kernel", "RT01"],
      ["runtime-kernel", "RT02"],
    ],
  );
});
