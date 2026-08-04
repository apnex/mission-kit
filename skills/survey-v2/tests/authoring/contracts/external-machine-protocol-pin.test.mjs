import test from "node:test";
import {
  loadCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("an external coupling rejects a protocol body outside its exact profile pin", async () => {
  const transaction = await loadCoreTransaction();
  const runtime = transaction.values.find(
    (value) => value.metadata.name === "runtime-flow"
  );
  runtime.spec.states[0].label = "Changed runtime authority";
  assertTransactionIssue(
    transaction,
    "EXTERNAL_MACHINE_PROTOCOL_UNRESOLVED"
  );
});
