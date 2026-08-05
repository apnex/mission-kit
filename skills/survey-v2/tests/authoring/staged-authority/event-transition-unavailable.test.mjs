import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  passRegistrySource,
  reducerCommandBase,
  rehashAuthority,
  trustedReducerInputs,
} from "../reducer/support.mjs";
import {
  configureExecutionClosure,
} from "./support.mjs";

test(
  "event rejects an unavailable staged transition before invoking any callback",
  async () => {
    const scenario = await loadReducerScenario();
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    configureExecutionClosure(scenario, {
      transitionIds: ["AT01"],
    });
    rehashAuthority(scenario);
    const calls = [];
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "event",
        eventId: "ACCEPT",
        base: reducerCommandBase(scenario.workspace),
        commandDigest: `sha256:${"1".repeat(64)}`,
        payloadDigest: `sha256:${"2".repeat(64)}`,
        evidenceDigest: `sha256:${"3".repeat(64)}`,
        inputs: {},
        externalCouplings: [],
      },
      await trustedReducerInputs({
        executables: passRegistrySource({
          guardInvoke() {
            calls.push("guard");
            return { status: "pass" };
          },
          handlerInvoke() {
            calls.push("handler");
            return { status: "accept", products: [] };
          },
          validatorInvoke() {
            calls.push("validator");
            return { status: "pass" };
          },
        }),
      }),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "PROFILE_EXECUTION_TRANSITION_UNAVAILABLE",
    );
    assert.deepEqual(calls, []);
  },
);
