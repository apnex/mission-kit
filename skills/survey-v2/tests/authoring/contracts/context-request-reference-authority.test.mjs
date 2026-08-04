import test from "node:test";
import {
  contextSelectorDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  loadCoreTransaction,
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  assertTransactionIssue
} from "./support/assert-transaction-issue.mjs";

test("a context layer cannot differ from its declared request-reference input", async () => {
  const transaction = await loadCoreTransaction();
  const profile = transaction.byKind.get("AuthoringProfileManifest");
  const request = transaction.byKind.get("AuthoringRequest");
  const closure = transaction.byKind.get("ContextClosure");
  const mutation = transaction.byKind.get("AuthoringMutation");
  const selector = profile.spec.tasks[0].contextSelectors[0];
  selector.selection = { mode: "request-reference", inputKey: "intake" };
  selector.selectorDigest = contextSelectorDigest(selector);
  closure.spec.layers[0].selectorDigest = selector.selectorDigest;
  request.spec.operation.inputs = {
    intake: structuredClone(mutation.spec.createdResources[0].reference)
  };
  recomputeCoreTransaction(transaction);
  assertTransactionIssue(transaction, "CONTEXT_LAYER_SOURCE_MISMATCH");
});
