import assert from "node:assert/strict";
import test from "node:test";
import {
  commitReceiptDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import { appendTransitionScenario } from "./support.mjs";

test("a Receipt binds the locked revisions and exact K12 Mutation result", () => {
  const { receipt, mutation } = appendTransitionScenario();
  assert.deepEqual({
    digest: receipt.spec.receiptDigest === commitReceiptDigest(receipt),
    mutation: receipt.spec.mutation.mutationDigest,
    created: receipt.spec.createdResources,
    handoffs: receipt.spec.handoffProducts,
  }, {
    digest: true,
    mutation: mutation.spec.mutationDigest,
    created: mutation.spec.createdResources.map(
      (record) => record.reference,
    ),
    handoffs: mutation.spec.handoffProducts,
  });
});
