import test from "node:test";
import {
  loadEventLifecycleTransaction,
  refreshEventTransaction
} from "./support/lifecycle-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("an event workspace-version rule fails when the exact pre-state record is absent", async () => {
  const transaction = await loadEventLifecycleTransaction();
  transaction.workspace.spec.resourceVersions = [];
  refreshEventTransaction(transaction);
  assertTransactionIssue(transaction, "EVENT_INPUT_LIFECYCLE_MISMATCH");
});
