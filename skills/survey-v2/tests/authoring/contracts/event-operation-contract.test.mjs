import assert from "node:assert/strict";
import test from "node:test";
import {
  validateTransactionClosureSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  loadEventTransaction
} from "./support/transaction-scenarios.mjs";

test("an event-caused transaction closes without task-submission ancestry", async () => {
  const transaction = await loadEventTransaction();

  assert.equal(
    transaction.values.some((value) => (
      value.kind === "AuthoringRequest" ||
      value.kind === "AuthoringAssignment" ||
      value.kind === "AuthoringSubmission"
    )),
    false
  );
  assert.deepEqual(
    validateTransactionClosureSemantics(transaction.values, {
      roots: transaction.roots
    }),
    []
  );
});
