import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createLiveSurveyHarness,
} from "../profile/live-support.mjs";
import {
  digest,
  initializationAuthority,
} from "./initialization-adapter-support.mjs";

function adapterFor(
  harness,
  authority,
  observe,
) {
  return harness.createInitializationAdapter(authority, observe);
}

test(
  "cold reconciliation rejects a published AT01 plus T02 bound to a different ready dependency result",
  async () => {
    const harness = await createLiveSurveyHarness({
      storeId:
        "survey-initialization-recovery-dependency-mismatch",
    });
    const authority =
      initializationAuthority("dependency-owner");
    const acceptedReady = {
      status: "ready",
      resultDigest: digest("b"),
    };
    const changedReady = {
      status: "ready",
      resultDigest: digest("c"),
    };
    const owner = adapterFor(harness, authority);
    await owner.advance(
      owner.initialState,
      acceptedReady,
    );
    const published = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    const calls = { read: 0, execute: 0 };
    const cold = adapterFor(
      harness,
      authority,
      (operation) => {
        if (operation === "read") calls.read += 1;
        if (operation === "execute") calls.execute += 1;
      },
    );

    await assert.rejects(
      cold.advance(cold.initialState, changedReady),
      (error) =>
        error?.code ===
          "SURVEY_INITIALIZATION_RECOVERY_MISMATCH",
    );
    const after = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;

    assert.deepEqual(calls, { read: 1, execute: 0 });
    assert.equal(canonicalize(after), canonicalize(published));
    assert.equal(after.commitRevision, 1);
  },
);
