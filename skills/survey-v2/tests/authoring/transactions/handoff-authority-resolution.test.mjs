import assert from "node:assert/strict";
import test from "node:test";
import {
  transitionHandoffSlots,
} from "../../../source/authoring/runtime/transaction-resources.mjs";
import {
  createIssuedTransactionScenario,
  transactionFixture,
} from "./support.mjs";

test("transition handoff application receives only the manifest-selected slot set", async () => {
  const [scenario, mutation] = await Promise.all([
    createIssuedTransactionScenario(),
    transactionFixture("authoring-mutation"),
  ]);
  assert.deepEqual(
    transitionHandoffSlots(scenario.profile, mutation),
    ["brief"],
  );
});
