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

test("a recomputed closure rejects a false observed lifecycle state", async () => {
  const transaction = await loadContextLifecycleTransaction();
  transaction.layer.lifecycleProof.observedState = "mutable";
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_LIFECYCLE_MISMATCH");
});
