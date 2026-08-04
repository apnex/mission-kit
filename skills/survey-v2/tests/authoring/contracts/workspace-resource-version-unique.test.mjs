import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContractSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  recomputeCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  loadContextLifecycleTransaction
} from "./support/lifecycle-scenarios.mjs";

test("a workspace contract rejects duplicate exact stored resource versions", async () => {
  const transaction = await loadContextLifecycleTransaction();
  transaction.workspace.spec.resourceVersions.push(
    structuredClone(transaction.workspace.spec.resourceVersions[0])
  );
  recomputeCoreTransaction(transaction);
  assert.deepEqual(
    validateContractSemantics(transaction.workspace).map(({ code }) => code),
    ["STORED_RESOURCE_VERSION_DUPLICATE"]
  );
});
