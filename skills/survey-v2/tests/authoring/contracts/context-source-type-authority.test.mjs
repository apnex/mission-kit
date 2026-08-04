import test from "node:test";
import {
  resourceIntegrityDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed context closure cannot substitute a source of the wrong resource type", async () => {
  const transaction = await loadCoreTransaction();
  const closure = transaction.byKind.get("ContextClosure");
  const foreign = structuredClone(closure.spec.layers[0].sourceSnapshot);
  foreign.kind = "ForeignSnapshot";
  foreign.metadata.name = "foreign-intake";
  transaction.values.push(foreign);
  closure.spec.layers[0].sourceSnapshot = structuredClone(foreign);
  closure.spec.layers[0].sourceReference = resourceReferenceFrom(foreign);
  closure.spec.layers[0].sourceIntegrityDigest =
    resourceIntegrityDigest(foreign);
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_SOURCE_MISMATCH");
});
