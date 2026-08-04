import assert from "node:assert/strict";
import test from "node:test";
import {
  loadEventLifecycleTransaction,
  pointerLifecycleRule
} from "./support/lifecycle-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("an event-input pointer accepts the exact state on its durable resource body", async () => {
  const transaction = await loadEventLifecycleTransaction({
    lifecycleRule: pointerLifecycleRule
  });
  assert.deepEqual(transactionIssues(transaction), []);
});
