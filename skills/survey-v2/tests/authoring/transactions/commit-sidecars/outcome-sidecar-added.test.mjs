import assert from "node:assert/strict";
import test from "node:test";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  rehashTerminalRecord,
  replaySnapshot,
  snapshot,
  terminalOutcome,
} from "./support.mjs";

test(
  "cold replay rejects an outcome sidecar added beyond the exact WorkspaceEffect",
  async () => {
    const harness = await createSidecarCoordinatorHarness();
    const { command } = await prepareSubmission(harness);
    await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const retained = await snapshot(harness);
    const journal = structuredClone(retained.journal);
    const outcomes = structuredClone(
      retained.idempotencyOutcomeView,
    );
    const sidecarReference =
      terminalOutcome({
        idempotencyOutcomeView: outcomes,
      }).sidecars[0];
    const effect = journal.at(-1).workspaceEffect;
    effect.retainedResources =
      effect.retainedResources.filter(
        ({ reference }) =>
          reference.name !== sidecarReference.name,
      );
    effect.historyReferences =
      effect.historyReferences.filter(
        (reference) =>
          reference.name !== sidecarReference.name,
      );
    rehashTerminalRecord(harness, journal, outcomes);

    assert.throws(
      () => replaySnapshot(harness, retained, {
        journal,
        idempotencyOutcomeView: outcomes,
      }),
      (error) =>
        error?.code ===
          "JOURNAL_TERMINAL_RESOURCE_DELTA_MISMATCH",
    );
  },
);
