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
  "the reducer rejects a proxy trusted surface without invoking its contract validator",
  async () => {
    const scenario = await loadReducerScenario();
    const base = await trustedReducerInputs();
    let validatorCalls = 0;
    const trusted = new Proxy({
      validateContract(candidate) {
        validatorCalls += 1;
        return base.validateContract(candidate);
      },
    }, {});

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
    assert.equal(validatorCalls, 0);
  },
);
