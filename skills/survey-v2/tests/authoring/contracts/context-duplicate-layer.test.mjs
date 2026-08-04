import test from "node:test";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed context closure cannot duplicate a selector layer", async () => {
  const transaction = await loadCoreTransaction();
  const closure = transaction.byKind.get("ContextClosure");
  const duplicate = structuredClone(closure.spec.layers[0]);
  duplicate.ordinal = 2;
  closure.spec.layers.push(duplicate);
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_SELECTOR_CARDINALITY_MISMATCH");
});
