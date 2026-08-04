import test from "node:test";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed context closure cannot alter its selector lifecycle requirement", async () => {
  const transaction = await loadCoreTransaction();
  transaction.byKind.get("ContextClosure")
    .spec.layers[0].requiredLifecycleState = "mutable";
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_SELECTOR_MISMATCH");
});
