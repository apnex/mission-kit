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
  configureActiveHeadInputBinding,
} from "./support.mjs";

test(
  "next derives active-head ancestry into request inputs without caller supply",
  async () => {
    const scenario = await loadReducerScenario();
    const { inputKey } = configureActiveHeadInputBinding(scenario);
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs(),
    );
    assert.equal(result.kind, "task");
    const reference =
      result.contextClosure.spec.layers[0].sourceReference;
    assert.deepEqual(
      result.request.spec.operation.inputs,
      { [inputKey]: reference },
    );
  },
);
