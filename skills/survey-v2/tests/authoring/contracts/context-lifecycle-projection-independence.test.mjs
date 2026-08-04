import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContextLifecycleTransaction,
  pointerLifecycleRule
} from "./support/lifecycle-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a lifecycle field excluded from projection still rejects the wrong source state", async () => {
  const transaction = await loadContextLifecycleTransaction({
    lifecycleRule: pointerLifecycleRule,
    observedValue: "mutable",
    proofObservedState: "mutable"
  });
  assert.deepEqual(transaction.selector.projection.fields, ["/spec"]);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_LIFECYCLE_MISMATCH");
});
