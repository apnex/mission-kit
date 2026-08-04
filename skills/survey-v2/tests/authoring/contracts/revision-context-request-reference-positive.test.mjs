import assert from "node:assert/strict";
import test from "node:test";
import {
  validateTransactionClosureSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  configureRevisionContextRequestReference,
  loadRevisionRequestTransaction
} from "./support/transaction-scenarios.mjs";

test("a revision context resolves its declared request-reference input", async () => {
  const transaction = configureRevisionContextRequestReference(
    await loadRevisionRequestTransaction()
  );
  assert.deepEqual(
    validateTransactionClosureSemantics(transaction.values, {
      roots: transaction.roots
    }),
    []
  );
});
