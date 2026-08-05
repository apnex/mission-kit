import assert from "node:assert/strict";
import test from "node:test";
import { appendTransitionScenario } from "./support.mjs";

test("ordered same-machine refreeze edges replay at one global ordinal", () => {
  const result = appendTransitionScenario({
    repeatedExternalEdges: true,
  }).replay();
  assert.deepEqual({
    runtimeHead: result.machineHeads[1].state,
    runtimeOrdinal: result.perMachineOrdinals[1].ordinal,
  }, {
    runtimeHead: "ready",
    runtimeOrdinal: 1,
  });
});
