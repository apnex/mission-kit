import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("recomputed mutation and receipt digests cannot authorize a created resource in an undeclared slot", async () => {
  const transaction = await loadCoreTransaction();
  transaction.byKind.get("AuthoringMutation")
    .spec.createdResources[0].slot = "foreign-slot";
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_CREATED_FOOTPRINT_MISMATCH"
  );
});
