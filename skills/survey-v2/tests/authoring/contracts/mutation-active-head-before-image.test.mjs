import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a mutation active-head change must bind the exact workspace before-image", async () => {
  const transaction = await loadCoreTransaction();
  const workspace = transaction.byKind.get("AuthoringWorkspace");
  transaction.byKind.get("AuthoringMutation")
    .spec.activeHeadChanges[0].before =
      structuredClone(workspace.spec.activeHeads[0].reference);
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_ACTIVE_HEAD_FOOTPRINT_MISMATCH"
  );
});
