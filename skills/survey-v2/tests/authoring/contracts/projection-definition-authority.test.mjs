import test from "node:test";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("recomputed projection and assignment digests cannot authorize a rogue projection definition", async () => {
  const transaction = await loadCoreTransaction();
  transaction.byKind.get("ProjectionArtifact")
    .spec.projectionDefinitionDigest =
      "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "PROJECTION_AUTHORITY_MISMATCH");
});
