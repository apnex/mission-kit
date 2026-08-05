import assert from "node:assert/strict";
import test from "node:test";
import {
  loadReducerScenario,
  passRegistrySource,
  reducerCommandBase,
  rehashAuthority,
  trustedReducerInputs,
} from "./support.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";

test(
  "event selection explicitly rejects a declared event with no matching edge",
  async () => {
    const scenario = await loadReducerScenario();
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    rehashAuthority(scenario);
    const calls = [];
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "event",
        eventId: "REVISE",
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
      "AUTHORING_EVENT_TRANSITION_MISSING",
    );
    assert.deepEqual(calls, []);
  },
);
