import assert from "node:assert/strict";
import test from "node:test";
import {
  loadEventLifecycleTransaction
} from "./support/lifecycle-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("an event active-head input proves frozen state from its stored resource version", async () => {
  const transaction = await loadEventLifecycleTransaction();
  assert.deepEqual(transactionIssues(transaction), []);
});
