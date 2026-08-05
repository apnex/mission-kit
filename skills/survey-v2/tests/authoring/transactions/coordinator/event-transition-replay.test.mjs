import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  acceptSubmission,
  createCoordinatorHarness,
  eventCommand,
  issueAssignment,
  submissionFor,
} from "./support.mjs";

test(
  "accepted event commits one transition and exact replay wins before stale-state evaluation",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    await acceptSubmission(
      harness,
      issued,
      submissionFor(harness, issued),
    );
    const command = await eventCommand(harness);
    const first = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const beforeReplay = await harness.store.read(
      harness.storeId,
    );
    const callbacksBeforeReplay = {
      ...harness.callbackCounts,
    };
    const replayed = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const afterReplay = await harness.store.read(
      harness.storeId,
    );

    assert.equal(first.kind, "committed");
    assert.equal(beforeReplay.commitRevision, 3);
    assert.equal(
      beforeReplay.workspace.spec.semanticRevision,
      2,
    );
    assert.equal(
      beforeReplay.workspace.spec.evidenceRevision,
      3,
    );
    assert.equal(
      beforeReplay.workspace.spec.authoringState,
      "complete",
    );
    assert.deepEqual(
      beforeReplay.journal[2].machineEdges.map(
        (edge) => [edge.machineId, edge.transitionId],
      ),
      [["authoring-kernel", "AT02"]],
    );
    assert.equal(
      canonicalize(replayed),
      canonicalize(first),
    );
    assert.equal(
      canonicalize(afterReplay),
      canonicalize(beforeReplay),
    );
    assert.deepEqual(
      harness.callbackCounts,
      callbacksBeforeReplay,
    );
  },
);
