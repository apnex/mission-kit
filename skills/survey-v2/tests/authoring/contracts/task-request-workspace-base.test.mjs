import test from "node:test";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed task request cannot bind a stale workspace semantic revision", async () => {
  const transaction = await loadCoreTransaction();
  transaction.byKind.get("AuthoringRequest").spec.base.semanticRevision += 1;
  recomputeCoreTransaction(transaction, { preserveRequestBase: true });
  assertTransactionIssue(transaction, "REQUEST_WORKSPACE_BASE_MISMATCH");
});
