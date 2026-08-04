import test from "node:test";
import {
  loadCoreTransaction,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed mutation cannot create an undeclared dependency relation", async () => {
  const transaction = await loadCoreTransaction();
  const workspace = transaction.byKind.get("AuthoringWorkspace");
  const mutation = transaction.byKind.get("AuthoringMutation");
  mutation.spec.dependencyEdges.created.push({
    from: structuredClone(workspace.spec.activeHeads[0].reference),
    to: structuredClone(mutation.spec.createdResources[0].reference),
    relation: "undeclared-relation"
  });
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_DEPENDENCY_FOOTPRINT_MISMATCH"
  );
});
