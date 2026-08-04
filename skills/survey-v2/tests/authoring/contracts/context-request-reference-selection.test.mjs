import assert from "node:assert/strict";
import test from "node:test";
import {
  contextSelectorDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("a request-reference context selector resolves only its declared typed request input", async () => {
  const transaction = await loadCoreTransaction();
  const profile = transaction.byKind.get("AuthoringProfileManifest");
  const request = transaction.byKind.get("AuthoringRequest");
  const closure = transaction.byKind.get("ContextClosure");
  const selector = profile.spec.tasks[0].contextSelectors[0];
  selector.selection = { mode: "request-reference", inputKey: "intake" };
  selector.selectorDigest = contextSelectorDigest(selector);
  request.spec.operation.inputs = {
    intake: structuredClone(closure.spec.layers[0].sourceReference)
  };
  closure.spec.layers[0].selectorDigest = selector.selectorDigest;
  recomputeCoreTransaction(transaction);
  assert.deepEqual(transactionIssues(transaction), []);
});
