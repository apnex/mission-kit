import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptSubmission,
  createCoordinatorHarness,
  eventCommand,
  issueAssignment,
  submissionFor,
} from "./support.mjs";

function rejectEventHandler(input) {
  if (input.phase === "event") {
    return {
      status: "reject",
      issues: [{
        code: "ACCEPTANCE_EVIDENCE_MISSING",
        field: "",
        reason: "Acceptance evidence is incomplete.",
        correction: "Supply the required acceptance evidence.",
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
  "current event rejection retains issues in one evidence-only commit",
  async () => {
    const harness = await createCoordinatorHarness({
      handlerInvoke: rejectEventHandler,
    });
    const issued = await issueAssignment(harness);
    await acceptSubmission(
      harness,
      issued,
      submissionFor(harness, issued),
    );
    const rejected = await harness.coordinator.execute(
      harness.storeId,
      await eventCommand(harness),
    );
    const snapshot = await harness.store.read(harness.storeId);

    assert.equal(rejected.kind, "rejected");
    assert.equal(rejected.operation, "event");
    assert.equal(rejected.issues.length, 1);
    assert.equal(snapshot.commitRevision, 3);
    assert.equal(snapshot.workspace.spec.semanticRevision, 1);
    assert.equal(snapshot.workspace.spec.evidenceRevision, 3);
    assert.equal(
      snapshot.workspace.spec.authoringState,
      "awaiting_acceptance",
    );
    assert.equal(snapshot.journal[2].commitKind, "evidence");
    assert.deepEqual(snapshot.journal[2].machineEdges, []);
    assert.equal(
      snapshot.idempotencyOutcomeView[2].outcome.class,
      "event-rejected",
    );
  },
);
