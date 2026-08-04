import test from "node:test";
import {
  loadCoreTransaction,
  recomputeCreatedResource,
  recomputeMutationAndReceipt
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("recomputed mutation and receipt digests cannot authorize a created resource of the wrong kind", async () => {
  const transaction = await loadCoreTransaction();
  const mutation = transaction.byKind.get("AuthoringMutation");
  const created = mutation.spec.createdResources[0];
  created.resource.kind = "ForeignBrief";
  recomputeCreatedResource(created);
  mutation.spec.activeHeadChanges[0].after =
    structuredClone(created.reference);
  mutation.spec.handoffProducts[0].reference =
    structuredClone(created.reference);
  recomputeMutationAndReceipt(transaction);
  assertTransactionIssue(
    transaction,
    "MUTATION_CREATED_FOOTPRINT_MISMATCH"
  );
});
