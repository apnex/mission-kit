import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed mutation cannot patch a handoff slot outside its footprint", async () => {
  const transaction = await loadCoreTransaction();
  transaction.byKind.get("AuthoringMutation")
    .spec.handoffProducts[0].slot = "foreign-handoff";
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_HANDOFF_FOOTPRINT_MISMATCH"
  );
});
