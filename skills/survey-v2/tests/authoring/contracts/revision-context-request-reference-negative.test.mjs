import test from "node:test";
import {
  requestCoreDigest,
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import {
  configureRevisionContextRequestReference,
  loadRevisionRequestTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a revision context rejects another exact request input", async () => {
  const transaction = configureRevisionContextRequestReference(
    await loadRevisionRequestTransaction()
  );
  transaction.request.spec.operation.inputs.intake =
    resourceReferenceFrom(transaction.brief);
  transaction.request.spec.requestDigest =
    requestCoreDigest(transaction.request);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_SOURCE_MISMATCH");
});
