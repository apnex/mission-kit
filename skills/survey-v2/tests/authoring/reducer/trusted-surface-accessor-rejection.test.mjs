import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "./support.mjs";

test(
  "the reducer rejects an accessor trusted surface without evaluating the accessor",
  async () => {
    const scenario = await loadReducerScenario();
    const base = await trustedReducerInputs();
    let getterCalls = 0;
    const trusted = {};
    Object.defineProperty(trusted, "validateContract", {
      configurable: true,
      enumerable: true,
      get() {
        getterCalls += 1;
        return base.validateContract;
      },
    });

    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      trusted,
    );

    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "REDUCER_TRUSTED_INPUTS_INVALID",
    );
    assert.equal(result.issues[0].spec.field, "/trustedInputs");
    assert.equal(getterCalls, 0);
  },
);
