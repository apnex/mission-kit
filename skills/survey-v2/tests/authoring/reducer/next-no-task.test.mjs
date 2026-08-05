import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  rehashAuthority,
  trustedReducerInputs,
} from "./support.mjs";

test(
  "a frozen state with no admitted task returns an explicit no-task result",
  async () => {
    const scenario = await loadReducerScenario();
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    rehashAuthority(scenario);
    const selected = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs(),
    );
    assert.deepEqual(selected, {
      kind: "wait",
      state: {
        id: "awaiting_acceptance",
        label: "Await acceptance",
        class: "wait",
      },
    });
  },
);
