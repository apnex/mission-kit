import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "../reducer/support.mjs";
import {
  configureRequestReferenceInputBinding,
} from "./support.mjs";

test(
  "next seals a request-reference input from its resolved context layer",
  async () => {
    const scenario = await loadReducerScenario();
    const { inputKey } =
      configureRequestReferenceInputBinding(scenario);
    const supplied =
      scenario.workspace.spec.activeHeads[0].reference;
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "next",
        inputs: { [inputKey]: supplied },
      },
      await trustedReducerInputs(),
    );
    assert.equal(result.kind, "task");
    const resolved =
      result.contextClosure.spec.layers[0].sourceReference;
    assert.deepEqual(
      result.request.spec.operation.inputs,
      { [inputKey]: resolved },
    );
  },
);
