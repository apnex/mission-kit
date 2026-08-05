import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSubmission,
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
} from "./support.mjs";

test(
  "accepted submission atomically stores semantic post-image, receipt, edges, journal, and outcome",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    const submission = submissionFor(harness, issued);
    const result = await acceptSubmission(
      harness,
      issued,
      submission,
    );
    const { snapshot } =
      await harness.coordinator.read(harness.storeId);

    assert.equal(result.kind, "committed");
    assert.equal(snapshot.commitRevision, 2);
    assert.equal(snapshot.journal.length, 2);
    assert.equal(snapshot.workspace.spec.semanticRevision, 1);
    assert.equal(snapshot.workspace.spec.evidenceRevision, 2);
    assert.equal(
      snapshot.workspace.spec.authoringState,
      "awaiting_acceptance",
    );
    assert.equal(snapshot.workspace.spec.openAssignment, null);
    assert.equal(snapshot.journal[1].commitKind, "transition");
    assert.deepEqual(
      snapshot.journal[1].machineEdges.map(
        (edge) => [edge.machineId, edge.transitionId],
      ),
      [
        ["authoring-kernel", "AT01"],
        ["runtime-kernel", "RT01"],
        ["runtime-kernel", "RT02"],
      ],
    );
    assert.equal(
      snapshot.idempotencyOutcomeView[1].outcome.class,
      "transition-committed",
    );
    assert.ok(
      snapshot.workspace.spec.resourceVersions.some(
        ({ resource }) =>
          resource.kind === "AuthoringSubmission" &&
          resource.spec.normalizedSubmissionDigest ===
            submission.spec.normalizedSubmissionDigest,
      ),
    );
    assert.ok(
      snapshot.workspace.spec.resourceVersions.some(
        ({ resource }) =>
          resource.kind === "AuthoringMutation",
      ),
    );
    assert.ok(
      snapshot.workspace.spec.resourceVersions.some(
        ({ resource }) =>
          resource.kind === "AuthoringCommitReceipt" &&
          resource.spec.receiptDigest ===
            result.receipt.spec.receiptDigest,
      ),
    );
  },
);
