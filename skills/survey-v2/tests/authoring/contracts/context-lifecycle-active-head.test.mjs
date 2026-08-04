import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContextLifecycleTransaction
} from "./support/lifecycle-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("an active-head context proves frozen state from exactly one stored resource version", async () => {
  const transaction = await loadContextLifecycleTransaction();
  assert.deepEqual(transactionIssues(transaction), []);
});
