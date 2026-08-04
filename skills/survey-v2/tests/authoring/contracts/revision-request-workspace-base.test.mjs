import test from "node:test";
import {
  loadRevisionRequestTransaction
} from "./support/transaction-scenarios.mjs";
import {
  requestCoreDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a recomputed revision request cannot bind a foreign workspace state", async () => {
  const transaction = await loadRevisionRequestTransaction();
  transaction.request.spec.base.semanticStateDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  transaction.request.spec.requestDigest =
    requestCoreDigest(transaction.request);
  assertTransactionIssue(transaction, "REQUEST_WORKSPACE_BASE_MISMATCH");
});
