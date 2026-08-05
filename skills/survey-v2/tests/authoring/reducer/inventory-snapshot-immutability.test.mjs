import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  createReducerSubmissionScenario,
  passRegistrySource,
  reducerSubmissionInventory,
  trustedReducerInputs,
  validBriefProduct,
} from "./support.mjs";

async function execute(scenario, executables, inventory) {
  return reduceAuthoring(
    scenario.profile,
    scenario.protocol,
    scenario.workspace,
    {
      class: "submit",
      request: scenario.request,
      assignment: scenario.assignment,
      submission: scenario.submission,
      externalCouplings: scenario.externalCouplings,
    },
    await trustedReducerInputs({ executables, inventory }),
  );
}

test(
  "trusted inventory is snapshotted before executable dispatch",
  async () => {
    const control = await createReducerSubmissionScenario();
    const controlResult = await execute(
      control,
      passRegistrySource({
        handlerInvoke: () => ({
          status: "accept",
          products: [validBriefProduct(control)],
        }),
      }),
      reducerSubmissionInventory(control),
    );
    assert.equal(controlResult.kind, "mutation");

    const attacked = await createReducerSubmissionScenario();
    const inventory = reducerSubmissionInventory(attacked);
    const attackedResult = await execute(
      attacked,
      passRegistrySource({
        handlerInvoke() {
          const conflictingClosure = structuredClone(
            attacked.contextClosure,
          );
          conflictingClosure.metadata.injected = true;
          inventory.push(conflictingClosure);
          return {
            status: "accept",
            products: [validBriefProduct(attacked)],
          };
        },
      }),
      inventory,
    );

    assert.equal(attackedResult.kind, "mutation");
    assert.equal(
      canonicalize(attackedResult),
      canonicalize(controlResult),
    );
  },
);
