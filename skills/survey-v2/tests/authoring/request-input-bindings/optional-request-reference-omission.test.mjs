import assert from "node:assert/strict";
import test from "node:test";
import {
  contextSelectorDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  rehashAuthority,
  trustedReducerInputs,
} from "../reducer/support.mjs";
import {
  configureRequestReferenceInputBinding,
} from "./support.mjs";

test(
  "an optional request-reference omission emits neither a context layer nor a derived request input",
  async () => {
    const scenario = await loadReducerScenario();
    const { selector } =
      configureRequestReferenceInputBinding(scenario);
    selector.cardinality = { min: 0, max: 1 };
    selector.selectorDigest = contextSelectorDigest(selector);
    rehashAuthority(scenario);

    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs(),
    );

    assert.equal(result.kind, "task");
    assert.deepEqual(result.contextClosure.spec.layers, []);
    assert.deepEqual(result.request.spec.operation.inputs, {});
  },
);
