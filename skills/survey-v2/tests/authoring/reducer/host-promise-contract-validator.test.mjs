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
  "a synchronous host contract validator returning a rejected Promise is consumed and rejected deterministically",
  async () => {
    const scenario = await loadReducerScenario();
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs({
        validateContract: () => Promise.reject(
          new Error("host-contract-promise-sentinel"),
        ),
      }),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "CONTRACT_VALIDATOR_ASYNC_FORBIDDEN",
    );
    await new Promise((resolve) => setImmediate(resolve));
  },
);
