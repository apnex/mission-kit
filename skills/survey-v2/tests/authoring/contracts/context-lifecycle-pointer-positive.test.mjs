import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContextLifecycleTransaction,
  pointerLifecycleRule
} from "./support/lifecycle-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("a JSON Pointer lifecycle rule accepts an exact string state", async () => {
  const transaction = await loadContextLifecycleTransaction({
    lifecycleRule: pointerLifecycleRule
  });
  assert.deepEqual(transactionIssues(transaction), []);
});
