import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
  submitCommand,
} from "./support.mjs";

function semanticHandler(input) {
  if (
    input.phase === "submission" &&
    input.normalizedValues.summary.startsWith("Reject")
  ) {
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
  if (input.phase !== "submission") {
    return { status: "accept", products: [] };
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
  "current semantic rejection retains exact Submission evidence and issues without changing semantic state",
  async () => {
    const harness = await createCoordinatorHarness({
      handlerInvoke: semanticHandler,
    });
    const issued = await issueAssignment(harness);
    const submission = submissionFor(harness, issued, {
      name: "rejected-submission",
      summary: "Reject this brief.",
      raw: "Reject this brief.\n",
    });
    const command = await submitCommand(
      harness,
      issued,
      submission,
    );
    const rejected = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const beforeReplay = await harness.store.read(
      harness.storeId,
    );
    const callbacksBeforeReplay = {
      ...harness.callbackCounts,
    };
    const replayed = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const afterReplay = await harness.store.read(
      harness.storeId,
    );

    assert.equal(rejected.kind, "rejected");
    assert.equal(rejected.operation, "submission");
    assert.equal(rejected.issues.length, 1);
    assert.equal(beforeReplay.commitRevision, 2);
    assert.equal(
      beforeReplay.workspace.spec.semanticRevision,
      0,
    );
    assert.equal(
      beforeReplay.workspace.spec.evidenceRevision,
      2,
    );
    assert.equal(
      beforeReplay.workspace.spec.openAssignment
        .assignmentDigest,
      issued.assignment.spec.assignmentDigest,
    );
    assert.equal(beforeReplay.journal[1].commitKind, "evidence");
    assert.deepEqual(beforeReplay.journal[1].machineEdges, []);
    assert.equal(
      beforeReplay.idempotencyOutcomeView[1].outcome.class,
      "submission-rejected",
    );
    const retained = beforeReplay.workspace.spec.resourceVersions
      .find(({ resource }) =>
        resource.kind === "AuthoringSubmission" &&
        resource.spec.normalizedSubmissionDigest ===
          submission.spec.normalizedSubmissionDigest);
    assert.notEqual(retained, undefined);
    assert.deepEqual(
      retained.resource.evidence.rawEvidence.content,
      submission.evidence.rawEvidence.content,
    );
    assert.equal(
      canonicalize(replayed),
      canonicalize(rejected),
    );
    assert.equal(
      canonicalize(afterReplay),
      canonicalize(beforeReplay),
    );
    assert.deepEqual(
      harness.callbackCounts,
      callbacksBeforeReplay,
    );
  },
);
