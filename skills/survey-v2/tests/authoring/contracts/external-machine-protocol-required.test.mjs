import test from "node:test";
import {
  loadCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a used external coupling requires its exactly pinned inventory protocol", async () => {
  const transaction = await loadCoreTransaction();
  transaction.values = transaction.values.filter(
    (value) => value.metadata.name !== "runtime-flow"
  );
  assertTransactionIssue(
    transaction,
    "EXTERNAL_MACHINE_PROTOCOL_UNRESOLVED"
  );
});
