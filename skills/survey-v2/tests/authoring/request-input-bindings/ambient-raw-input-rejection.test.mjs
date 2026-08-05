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
  "a bound next task rejects raw inputs not named by request-reference selectors",
  async () => {
    const scenario = await loadReducerScenario();
    configureActiveHeadInputBinding(scenario);
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "next",
        inputs: {
          ambient:
            scenario.workspace.spec.activeHeads[0].reference,
        },
      },
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
