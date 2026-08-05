import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSubmission,
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
} from "./support.mjs";

test(
  "coordinator captures trusted capabilities and static inventory at construction",
  async () => {
    const harness = await createCoordinatorHarness();
    const originalInventoryLength =
      harness.trustedInputs.inventory.length;

    harness.trustedInputs.validateContract = () => false;
    harness.trustedInputs.kernel.id = "hostile-replacement";
    harness.trustedInputs.inventory.splice(
      0,
      harness.trustedInputs.inventory.length,
    );
    for (const kind of ["guards", "handlers", "validators"]) {
      for (const entry of harness.trustedInputs.executables[kind]) {
        entry.invoke = () => {
          throw new Error("hostile replacement capability invoked");
        };
      }
    }

    assert.ok(originalInventoryLength > 0);
    assert.equal(harness.trustedInputs.inventory.length, 0);

    const issued = await issueAssignment(harness);
    const submission = submissionFor(harness, issued);
    const result = await acceptSubmission(
      harness,
      issued,
      submission,
    );
    const { snapshot } =
      await harness.coordinator.read(harness.storeId);

    assert.equal(result.kind, "committed");
    assert.equal(snapshot.commitRevision, 2);
    assert.equal(snapshot.workspace.spec.semanticRevision, 1);
    assert.equal(harness.callbackCounts.guard, 1);
    assert.equal(harness.callbackCounts.handler, 1);
    assert.ok(harness.callbackCounts.validator >= 1);
  },
);
