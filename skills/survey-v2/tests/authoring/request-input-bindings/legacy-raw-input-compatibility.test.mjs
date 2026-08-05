import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "../reducer/support.mjs";

test(
  "a task without request input bindings rejects ambient raw request inputs",
  async () => {
    const scenario = await loadReducerScenario();
    const inputs = {
      legacy: scenario.workspace.spec.activeHeads[0].reference,
    };
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs },
      await trustedReducerInputs(),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "REQUEST_INPUT_UNDECLARED",
    );
    assert.equal(
      result.issues[0].spec.boundary,
      "kernel.authority",
    );
  },
);
