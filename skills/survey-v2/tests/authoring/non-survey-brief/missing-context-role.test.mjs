import assert from "node:assert/strict";
import test from "node:test";
import {
  createBriefHarness,
  issueBriefAssignment,
} from "./support.mjs";

test(
  "the Brief profile refuses missing constraints without a write or callback",
  async () => {
    const harness = await createBriefHarness({
      omitActiveSlots: ["constraints"],
    });
    const before = await harness.store.read(harness.storeId);
    const result = await issueBriefAssignment(harness);
    const after = await harness.store.read(harness.storeId);

    assert.equal(result.kind, "rejected");
    assert.deepEqual(
      result.issues.map((entry) => entry.spec.code),
      ["CONTEXT_SELECTOR_CARDINALITY_MISMATCH"],
    );
    assert.equal(before.commitRevision, 0);
    assert.deepEqual(after, before);
    assert.equal(after.workspace.spec.openAssignment, null);
    assert.deepEqual(harness.callbackCounts, {
      guard: 0,
      handler: 0,
      validator: 0,
    });
  },
);
