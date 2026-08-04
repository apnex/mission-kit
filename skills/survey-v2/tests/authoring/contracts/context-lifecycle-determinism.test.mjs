import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContextLifecycleTransaction
} from "./support/lifecycle-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("lifecycle proof validation is observationally deterministic", async () => {
  const transaction = await loadContextLifecycleTransaction();
  const closureBefore = structuredClone(transaction.closure);
  const first = transactionIssues(transaction);
  const second = transactionIssues(transaction);
  assert.deepEqual(first, []);
  assert.deepEqual(second, first);
  assert.deepEqual(transaction.closure, closureBefore);
});
