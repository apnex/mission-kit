import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed mutation cannot supersede a workspace head outside its footprint", async () => {
  const transaction = await loadCoreTransaction();
  const workspace = transaction.byKind.get("AuthoringWorkspace");
  transaction.byKind.get("AuthoringMutation")
    .spec.supersededResources.push(
      structuredClone(workspace.spec.activeHeads[0].reference)
    );
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_SUPERSESSION_FOOTPRINT_MISMATCH"
  );
});
