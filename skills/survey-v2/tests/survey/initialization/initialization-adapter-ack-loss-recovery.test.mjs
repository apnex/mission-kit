import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createLiveSurveyHarness,
} from "../profile/live-support.mjs";
import {
  inMemoryCoordinatorContractDriver,
} from "../../authoring/transactions/coordinator/drivers/in-memory-driver.mjs";
import {
  digest,
  initializationAuthority,
} from "./initialization-adapter-support.mjs";

function adapterFor(harness, authority) {
  return harness.createInitializationAdapter(authority);
}

test(
  "acknowledgement loss after atomic AT01 plus T02 publication is reconciled without a second commit",
  async () => {
    const faultPoint =
      inMemoryCoordinatorContractDriver.capabilities
        .logicalFaultInjection.points
        .afterPublishBeforeAcknowledgement;
    let injected = false;
    const harness = await createLiveSurveyHarness({
      storeId:
        "survey-initialization-adapter-ack-loss",
      faultInjector({ point, snapshot }) {
        if (
          !injected &&
          point === faultPoint &&
          snapshot.commitRevision === 1
        ) {
          injected = true;
          throw new Error(
            "injected initialization acknowledgement loss",
          );
        }
      },
    });
    const authority =
      initializationAuthority("ack-loss");
    const ready = {
      status: "ready",
      resultDigest: digest("9"),
    };
    const first = adapterFor(harness, authority);

    await assert.rejects(
      first.advance(first.initialState, ready),
      /injected initialization acknowledgement loss/u,
    );
    const published = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    assert.equal(published.commitRevision, 1);
    assert.equal(published.journal.length, 1);
    assert.equal(
      published.workspace.spec.authoringState,
      "survey_frame_required",
    );

    const cold = adapterFor(harness, authority);
    const recovered = await cold.advance(
      cold.initialState,
      ready,
    );
    const after = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;

    assert.equal(recovered.kind, "initialized");
    assert.equal(recovered.runtimeStatus, "active");
    assert.equal(recovered.state.evidence.length, 1);
    assert.equal(
      recovered.state.evidence[0].disposition,
      "activated",
    );
    assert.equal(
      recovered.commit.receiptDigest,
      published.idempotencyOutcomeView[0]
        .outcome.receipt.receiptDigest,
    );
    assert.equal(canonicalize(after), canonicalize(published));
    assert.equal(after.commitRevision, 1);
    assert.equal(after.journal.length, 1);
  },
);
