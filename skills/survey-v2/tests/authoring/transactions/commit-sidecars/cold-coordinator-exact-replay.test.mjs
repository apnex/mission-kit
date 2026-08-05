import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../../source/authoring/kernel/canonical.mjs";
import {
  createSidecarCoordinatorHarness,
  prepareSubmission,
  snapshot,
} from "./support.mjs";

test(
  "a cold coordinator returns exact retained sidecars without invoking their executable",
  async () => {
    const first = await createSidecarCoordinatorHarness();
    const { command } = await prepareSubmission(first);
    const committed = await first.coordinator.execute(
      first.storeId,
      command,
    );
    const retained = await snapshot(first);

    const cold = await createSidecarCoordinatorHarness({
      storeId: first.storeId,
      driver: first.driver,
      persistence: first.persistence,
      initialize: false,
      sidecarInvoke() {
        throw new Error(
          "cold replay must not invoke the sidecar executable",
        );
      },
    });
    const replayed = await cold.coordinator.execute(
      cold.storeId,
      command,
    );

    assert.equal(canonicalize(replayed), canonicalize(committed));
    assert.equal(cold.counts.sidecar, 0);
    assert.deepEqual(await snapshot(cold), retained);
  },
);
