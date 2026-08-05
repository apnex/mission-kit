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
  "cold reconciliation rejects a published AT01 plus T02 owned by different initialization authority",
  async () => {
    const harness = await createLiveSurveyHarness({
      storeId:
        "survey-initialization-recovery-authority-mismatch",
    });
    const ready = {
      status: "ready",
      resultDigest: digest("a"),
    };
    const owner = adapterFor(
      harness,
      initializationAuthority("owner"),
    );
    await owner.advance(owner.initialState, ready);
    const published = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    const calls = { read: 0, execute: 0 };
    const impostor = adapterFor(
      harness,
      initializationAuthority("impostor"),
      (operation) => {
        if (operation === "read") calls.read += 1;
        if (operation === "execute") calls.execute += 1;
      },
    );

    await assert.rejects(
      impostor.advance(impostor.initialState, ready),
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
