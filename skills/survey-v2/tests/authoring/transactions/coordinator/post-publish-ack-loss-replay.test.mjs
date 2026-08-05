import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
  optionalDriverFaultPoint,
  submissionFor,
  submitCommand,
} from "./support.mjs";
import {
  resolveCoordinatorContractDriver,
} from "./driver-config.mjs";

test(
  "acknowledgement loss after publication resolves to the committed outcome on retry",
  async (context) => {
    const driver = await resolveCoordinatorContractDriver();
    const acknowledgementLossPoint =
      optionalDriverFaultPoint(
        driver,
        "afterPublishBeforeAcknowledgement",
      );
    if (acknowledgementLossPoint === null) {
      context.skip(
        `driver ${driver.id} has no acknowledgement-loss fault capability`,
      );
      return;
    }
    let injected = false;
    const harness = await createCoordinatorHarness({
      driver,
      faultInjector({ point, snapshot }) {
        if (
          !injected &&
          point === acknowledgementLossPoint &&
          snapshot.commitRevision === 2
        ) {
          injected = true;
          throw new Error("injected acknowledgement loss");
        }
      },
    });
    const issued = await issueAssignment(harness);
    const submission = submissionFor(harness, issued);
    const command = await submitCommand(
      harness,
      issued,
      submission,
    );

    await assert.rejects(
      harness.coordinator.execute(
        harness.storeId,
        command,
      ),
      /injected acknowledgement loss/,
    );
    const published = await harness.store.read(harness.storeId);
    const replayed = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const afterReplay = await harness.store.read(
      harness.storeId,
    );

    assert.equal(published.commitRevision, 2);
    assert.equal(replayed.kind, "committed");
    assert.equal(
      canonicalize(afterReplay),
      canonicalize(published),
    );
    assert.equal(
      replayed.receipt.spec.receiptDigest,
      published.idempotencyOutcomeView[1]
        .outcome.receipt.receiptDigest,
    );
  },
);
