import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  replaySnapshot,
  snapshot,
  terminalOutcome,
} from "./support.mjs";

test(
  "cold replay rejects an outcome sidecar that aliases a prior retained resource",
  async () => {
    const harness = await createSidecarCoordinatorHarness();
    const { command } = await prepareSubmission(harness);
    await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const retained = await snapshot(harness);
    const outcomes = structuredClone(
      retained.idempotencyOutcomeView,
    );
    const prior = retained.workspace.spec.resourceVersions
      .find(({ resource }) => resource.kind === "SourceSnapshot")
      .resource;
    terminalOutcome({
      idempotencyOutcomeView: outcomes,
    }).sidecars[0] = resourceReferenceFrom(prior);

    assert.throws(
      () => replaySnapshot(harness, retained, {
        idempotencyOutcomeView: outcomes,
      }),
      (error) =>
        error?.code === "JOURNAL_OUTCOME_SIDECAR_ALIAS",
    );
  },
);
