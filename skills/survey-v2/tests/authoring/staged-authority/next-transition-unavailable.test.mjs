import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  rehashAuthority,
  trustedReducerInputs,
} from "../reducer/support.mjs";
import {
  configureExecutionClosure,
} from "./support.mjs";

test(
  "next rejects an unavailable staged transition before resolving task context",
  async () => {
    const scenario = await loadReducerScenario();
    configureExecutionClosure(scenario, {
      transitionIds: ["AT02"],
    });
    scenario.workspace.spec.resourceVersions = [];
    rehashAuthority(scenario);
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs(),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "PROFILE_EXECUTION_TRANSITION_UNAVAILABLE",
    );
    assert.equal(
      result.issues[0].spec.boundary,
      "kernel.authority",
    );
  },
);
