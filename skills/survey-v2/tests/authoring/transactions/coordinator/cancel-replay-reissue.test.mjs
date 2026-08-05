import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  assignmentBinding,
  createCoordinatorHarness,
  digest,
  issueAssignment,
} from "./support.mjs";

test(
  "cancellation is replayable and a later next explicitly reauthorizes the byte-identical Assignment",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    const command = {
      class: "cancel",
      assignment: assignmentBinding(issued),
      cancellationEvidenceDigest: digest("c"),
    };
    const cancelled = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const afterCancel = await harness.store.read(
      harness.storeId,
    );
    const replayed = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const afterReplay = await harness.store.read(
      harness.storeId,
    );
    const reissued = await issueAssignment(harness);
    const afterReissue = await harness.store.read(
      harness.storeId,
    );

    assert.equal(cancelled.kind, "cancelled");
    assert.equal(afterCancel.commitRevision, 2);
    assert.equal(afterCancel.workspace.spec.openAssignment, null);
    assert.equal(
      afterCancel.idempotencyOutcomeView[1].outcome.class,
      "assignment-cancelled",
    );
    assert.equal(
      canonicalize(replayed),
      canonicalize(cancelled),
    );
    assert.equal(
      canonicalize(afterReplay),
      canonicalize(afterCancel),
    );
    assert.equal(
      reissued.assignment.spec.assignmentDigest,
      issued.assignment.spec.assignmentDigest,
    );
    assert.deepEqual(
      Buffer.from(reissued.viewBytes),
      Buffer.from(issued.viewBytes),
    );
    assert.equal(afterReissue.commitRevision, 3);
    assert.equal(
      afterReissue.workspace.spec.semanticRevision,
      0,
    );
    assert.equal(
      afterReissue.workspace.spec.evidenceRevision,
      3,
    );
    assert.equal(
      afterReissue.workspace.spec.resourceVersions.length,
      afterCancel.workspace.spec.resourceVersions.length,
    );
  },
);
