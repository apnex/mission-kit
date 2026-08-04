import assert from "node:assert/strict";
import {
  validateTransactionClosureSemantics
} from "../../../../source/authoring/kernel/contract-semantics.mjs";

export function transactionIssues(transaction) {
  return validateTransactionClosureSemantics(transaction.values, {
    roots: transaction.roots
  });
}

export function assertTransactionIssue(transaction, expectedCode) {
  const issues = transactionIssues(transaction);
  assert.ok(
    issues.some((candidate) => candidate.code === expectedCode),
    JSON.stringify(issues)
  );
}
