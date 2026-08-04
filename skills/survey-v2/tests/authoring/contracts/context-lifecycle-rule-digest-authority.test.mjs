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

test("a recomputed closure rejects a lifecycle proof for another rule", async () => {
  const transaction = await loadContextLifecycleTransaction();
  transaction.layer.lifecycleProof.ruleDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_LIFECYCLE_MISMATCH");
});
