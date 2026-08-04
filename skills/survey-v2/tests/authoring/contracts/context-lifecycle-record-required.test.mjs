import test from "node:test";
import {
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  loadContextLifecycleTransaction
} from "./support/lifecycle-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a context lifecycle proof fails when its resource version is absent", async () => {
  const transaction = await loadContextLifecycleTransaction();
  transaction.workspace.spec.resourceVersions = [];
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_LIFECYCLE_MISMATCH");
});
