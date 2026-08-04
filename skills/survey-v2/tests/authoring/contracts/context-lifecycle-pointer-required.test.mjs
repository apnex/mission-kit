import test from "node:test";
import {
  loadContextLifecycleTransaction,
  pointerLifecycleRule
} from "./support/lifecycle-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a JSON Pointer lifecycle rule fails when its path is absent", async () => {
  const transaction = await loadContextLifecycleTransaction({
    lifecycleRule: pointerLifecycleRule,
    includePointerPath: false
  });
  assertTransactionIssue(transaction, "CONTEXT_LAYER_LIFECYCLE_MISMATCH");
});
