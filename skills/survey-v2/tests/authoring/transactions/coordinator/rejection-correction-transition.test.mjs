import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
  submitCommand,
} from "./support.mjs";

function correctionHandler(input) {
  if (input.normalizedValues.summary.startsWith("Reject")) {
    return {
      status: "reject",
      issues: [{
        code: "SUMMARY_REJECTED",
        field: "/summary",
        reason: "The summary is not yet acceptable.",
        correction: "Provide a bounded launch summary.",
      }],
    };
  }
  return {
    status: "accept",
    products: [{
      slot: "brief",
      resource: {
        apiVersion: "brief.example/v1alpha1",
        kind: "Brief",
        metadata: { name: "launch-brief" },
        spec: {
          summary: input.normalizedValues.summary,
        },
      },
      dependencies: [],
    }],
  };
}

test(
  "a corrected submission may consume the Assignment after an earlier retained rejection",
  async () => {
    const harness = await createCoordinatorHarness({
      handlerInvoke: correctionHandler,
    });
    const issued = await issueAssignment(harness);
    const rejectedSubmission = submissionFor(harness, issued, {
      name: "rejected-submission",
      summary: "Reject this brief.",
    });
    const rejected = await harness.coordinator.execute(
      harness.storeId,
      await submitCommand(
        harness,
        issued,
        rejectedSubmission,
      ),
    );
    const correctedSubmission = submissionFor(harness, issued, {
      name: "corrected-submission",
      summary: "A corrected bounded brief.",
    });
    const committed = await harness.coordinator.execute(
      harness.storeId,
      await submitCommand(
        harness,
        issued,
        correctedSubmission,
      ),
    );
    const snapshot = await harness.store.read(harness.storeId);

    assert.equal(rejected.kind, "rejected");
    assert.equal(committed.kind, "committed");
    assert.equal(snapshot.commitRevision, 3);
    assert.equal(snapshot.workspace.spec.semanticRevision, 1);
    assert.equal(snapshot.workspace.spec.evidenceRevision, 3);
    assert.equal(snapshot.workspace.spec.openAssignment, null);
    assert.deepEqual(
      snapshot.idempotencyOutcomeView.map(
        (entry) => entry.outcome.class,
      ),
      [
        "assignment-issued",
        "submission-rejected",
        "transition-committed",
      ],
    );
  },
);
