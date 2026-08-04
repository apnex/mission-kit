import assert from "node:assert/strict";
import test from "node:test";
import {
  validateTransactionClosureSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  loadRevisionRequestTransaction
} from "./support/transaction-scenarios.mjs";

test("a revision request resolves its unit, plan, executable pins, and current heads", async () => {
  const transaction = await loadRevisionRequestTransaction();

  assert.deepEqual(
    validateTransactionClosureSemantics(transaction.values, {
      roots: transaction.roots
    }),
    []
  );
});
