import test from "node:test";
import {
  loadContextLifecycleTransaction,
  pointerLifecycleRule
} from "./support/lifecycle-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a JSON Pointer lifecycle rule fails when its target is not a string", async () => {
  const transaction = await loadContextLifecycleTransaction({
    lifecycleRule: pointerLifecycleRule,
    observedValue: { state: "frozen" }
  });
  assertTransactionIssue(transaction, "CONTEXT_LAYER_LIFECYCLE_MISMATCH");
});
