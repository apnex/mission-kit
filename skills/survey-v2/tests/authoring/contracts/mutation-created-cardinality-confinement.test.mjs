import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("recomputed mutation and receipt digests cannot exceed a created-resource cardinality", async () => {
  const transaction = await loadCoreTransaction();
  const created = transaction.byKind.get("AuthoringMutation")
    .spec.createdResources[0];
  transaction.byKind.get("AuthoringMutation").spec.createdResources.push(
    structuredClone(created)
  );
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_CREATED_FOOTPRINT_MISMATCH"
  );
});
