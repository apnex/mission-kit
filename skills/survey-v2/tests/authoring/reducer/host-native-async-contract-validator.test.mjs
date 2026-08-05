import assert from "node:assert/strict";
import test from "node:test";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "./support.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";

test(
  "the reducer rejects a native async host contract validator before its first call",
  async () => {
    const scenario = await loadReducerScenario();
    let calls = 0;
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs({
        validateContract: async () => {
          calls += 1;
          return true;
        },
      }),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "CONTRACT_VALIDATOR_ASYNC_FORBIDDEN",
    );
    assert.equal(calls, 0);
  },
);
