import assert from "node:assert/strict";
import test from "node:test";
import {
  sourceSnapshotDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  loadCoreTransaction
} from "./support/transaction-scenarios.mjs";
import {
  transactionIssues
} from "./support/assert-transaction-issue.mjs";

test("an exact four-field reference selects one immutable version among the same logical name", async () => {
  const transaction = await loadCoreTransaction();
  const current = transaction.byKind.get("ContextClosure")
    .spec.layers[0].sourceSnapshot;
  const decoy = structuredClone(current);
  decoy.spec.provenance.revision = "2";
  decoy.spec.sourceDigest = sourceSnapshotDigest(decoy);
  transaction.values.push(decoy);
  assert.deepEqual(transactionIssues(transaction), []);
});
