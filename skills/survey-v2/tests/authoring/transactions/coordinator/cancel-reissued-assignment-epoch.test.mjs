import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../../source/authoring/kernel/canonical.mjs";
import {
  assignmentBinding,
  createCoordinatorHarness,
  digest,
  issueAssignment,
} from "./support.mjs";

test(
  "a byte-identical reissued Assignment has a new cancellation epoch while each epoch remains exactly replayable",
  async () => {
    const harness = await createCoordinatorHarness();
    const first = await issueAssignment(harness);
    const command = {
      class: "cancel",
      assignment: assignmentBinding(first),
      cancellationEvidenceDigest: digest("c"),
    };
    await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const reissued = await issueAssignment(harness);
    assert.deepEqual(
      assignmentBinding(reissued),
      assignmentBinding(first),
    );

    const secondCancellation =
      await harness.coordinator.execute(
        harness.storeId,
        command,
      );
    const afterSecond = await harness.store.read(
      harness.storeId,
    );
    const replayed = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const afterReplay = await harness.store.read(
      harness.storeId,
    );

    assert.equal(secondCancellation.kind, "cancelled");
    assert.equal(afterSecond.commitRevision, 4);
    assert.equal(
      afterSecond.workspace.spec.openAssignment,
      null,
    );
    assert.notEqual(
      afterSecond.journal[1].idempotency.key,
      afterSecond.journal[3].idempotency.key,
    );
    assert.deepEqual(replayed, secondCancellation);
    assert.equal(
      canonicalize(afterReplay),
      canonicalize(afterSecond),
    );
  },
);
