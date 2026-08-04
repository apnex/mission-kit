import test from "node:test";
import {
  loadCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("an operational request requires one selected workspace authority", async () => {
  const transaction = await loadCoreTransaction();
  const request = transaction.byKind.get("AuthoringRequest");
  transaction.roots = [request];
  assertTransactionIssue(transaction, "REQUEST_WORKSPACE_BASE_MISMATCH");
});
