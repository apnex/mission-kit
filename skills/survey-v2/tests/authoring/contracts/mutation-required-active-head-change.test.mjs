import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a required created target cannot omit its declared active-head change", async () => {
  const transaction = await loadCoreTransaction();
  transaction.byKind.get("AuthoringMutation").spec.activeHeadChanges = [];
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_ACTIVE_HEAD_FOOTPRINT_MISMATCH"
  );
});
