import assert from "node:assert/strict";
import test from "node:test";
import {
  transactionInventory,
} from "../../../source/authoring/runtime/transaction-resources.mjs";
import {
  createIssuedTransactionScenario,
} from "./support.mjs";

test("an exact inventory reference cannot resolve to different retained bytes", async () => {
  const scenario = await createIssuedTransactionScenario();
  const changed = structuredClone(scenario.formDefinition);
  changed.metadata.annotation = "different evidence bytes";
  assert.throws(
    () => transactionInventory({
      workspace: scenario.workspace,
      staticInventory: [scenario.formDefinition, changed],
    }),
    (error) =>
      error?.code === "TRANSACTION_INVENTORY_REFERENCE_CONFLICT",
  );
});
