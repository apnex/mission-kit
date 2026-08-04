import assert from "node:assert/strict";
import test from "node:test";
import {
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  loadContextLifecycleTransaction,
  pointerLifecycleRule
} from "./support/lifecycle-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("source integrity failure is reported before lifecycle evaluation", async () => {
  const transaction = await loadContextLifecycleTransaction({
    lifecycleRule: pointerLifecycleRule
  });
  transaction.layer.sourceIntegrityDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  recomputeCoreTransaction(transaction);
  const codes = transactionIssues(transaction).map(({ code }) => code);
  assert.ok(codes.includes("CONTEXT_LAYER_SOURCE_MISMATCH"));
  assert.equal(codes.includes("CONTEXT_LAYER_LIFECYCLE_MISMATCH"), false);
});
