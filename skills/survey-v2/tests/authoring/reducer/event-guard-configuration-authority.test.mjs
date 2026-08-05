import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  passRegistrySource,
  reducerCommandBase,
  reducerSubmissionInventory,
  rehashAuthority,
  trustedReducerInputs,
} from "./support.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";

test(
  "event guards receive the exact manifest-declared handler configuration authority",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    scenario.protocol.spec.transitions[1].guardIds = ["payload-valid"];
    rehashAuthority(scenario);
    let configuration;
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
          guardInvoke: (input) => {
            configuration = input.configuration;
            return { status: "pass" };
          },
        }),
        inventory: reducerSubmissionInventory(scenario),
      }),
    );
    assert.equal(result.kind, "mutation");
    assert.deepEqual(
      configuration,
      scenario.profile.spec.transitionBindings[1].authority,
    );
  },
);
