import assert from "node:assert/strict";
import test from "node:test";
import {
  loadReducerScenario,
  passRegistrySource,
  rehashAuthority,
  trustedReducerInputs,
} from "./support.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";

test(
  "a profile manifest cannot self-authorize schema, validator, guard, or handler executables",
  async () => {
    const scenario = await loadReducerScenario();
    scenario.profile.spec.handlerBindings[0].handler.invoke =
      "profile-owned-executable";
    rehashAuthority(scenario);
    let calls = 0;
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      { class: "next", inputs: {} },
      await trustedReducerInputs({
        executables: passRegistrySource({
          handlerInvoke: () => {
            calls += 1;
            return { status: "accept", products: [] };
          },
        }),
      }),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(result.issues[0].spec.code, "CLOSED_CONTRACT_REJECTED");
    assert.equal(calls, 0);
  },
);
