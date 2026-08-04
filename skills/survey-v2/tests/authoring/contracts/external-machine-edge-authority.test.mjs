import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed external coupling must match its pinned concrete machine edge", async () => {
  const transaction = await loadCoreTransaction();
  transaction.byKind.get("AuthoringMutation")
    .spec.externalCouplings[0].fromState = "foreign-state";
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(transaction, "EXTERNAL_COUPLING_EDGE_MISMATCH");
});
