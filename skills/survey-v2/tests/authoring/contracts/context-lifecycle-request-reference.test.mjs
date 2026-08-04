import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContextLifecycleTransaction
} from "./support/lifecycle-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("a request-reference context proves frozen state from its stored resource version", async () => {
  const transaction = await loadContextLifecycleTransaction({
    selection: "request-reference"
  });
  assert.deepEqual(transactionIssues(transaction), []);
});
