import assert from "node:assert/strict";
import test from "node:test";
import {
  commitAuditResource,
  createSidecarCoordinatorHarness,
  prepareSubmission,
  replaySnapshot,
  snapshot,
  terminalOutcome,
} from "./support.mjs";

test(
  "cold replay rejects outcome sidecar references reordered against WorkspaceEffect",
  async () => {
    const harness = await createSidecarCoordinatorHarness({
      cardinality: { min: 2, max: 2 },
      sidecarInvoke(input) {
        return {
          status: "accept",
          resources: [
            commitAuditResource(input, { name: "audit-one" }),
            commitAuditResource(input, { name: "audit-two" }),
          ],
        };
      },
    });
    const { command } = await prepareSubmission(harness);
    await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const retained = await snapshot(harness);
    const outcomes = structuredClone(
      retained.idempotencyOutcomeView,
    );
    terminalOutcome({
      idempotencyOutcomeView: outcomes,
    }).sidecars.reverse();

    assert.throws(
      () => replaySnapshot(harness, retained, {
        idempotencyOutcomeView: outcomes,
      }),
      (error) =>
        error?.code === "JOURNAL_WORKSPACE_EFFECT_MISMATCH",
    );
  },
);
