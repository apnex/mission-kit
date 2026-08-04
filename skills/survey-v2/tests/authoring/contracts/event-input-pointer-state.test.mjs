import test from "node:test";
import {
  loadEventLifecycleTransaction,
  pointerLifecycleRule
} from "./support/lifecycle-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("an event-input pointer rejects a different observed state", async () => {
  const transaction = await loadEventLifecycleTransaction({
    lifecycleRule: pointerLifecycleRule,
    observedValue: "mutable"
  });
  assertTransactionIssue(transaction, "EVENT_INPUT_LIFECYCLE_MISMATCH");
});
