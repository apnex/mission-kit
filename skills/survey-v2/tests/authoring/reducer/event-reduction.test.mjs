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
  "the reducer dispatches an admitted event into only its manifest-owned mutation",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    rehashAuthority(scenario);
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
        executables: passRegistrySource(),
        inventory: reducerSubmissionInventory(scenario),
      }),
    );
    assert.equal(result.kind, "mutation");
    assert.equal(result.mutation.spec.cause.class, "event");
    assert.equal(result.mutation.spec.cause.edge.transitionId, "AT02");
    assert.equal(result.mutation.spec.nextAuthoringState, "complete");
    assert.deepEqual(result.mutation.spec.createdResources, []);
    assert.deepEqual(result.mutation.spec.activeHeadChanges, []);
  },
);
