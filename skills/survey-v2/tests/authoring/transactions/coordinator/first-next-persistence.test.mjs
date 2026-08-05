import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test(
  "first next persists one complete Assignment DAG in one evidence commit",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    const { snapshot, pending } =
      await harness.coordinator.read(harness.storeId);

    assert.equal(issued.kind, "assignment");
    assert.deepEqual(
      Buffer.from(issued.viewBytes),
      Buffer.from(pending.viewBytes),
    );
    assert.equal(snapshot.commitRevision, 1);
    assert.equal(snapshot.journal.length, 1);
    assert.equal(
      snapshot.idempotencyOutcomeView.length,
      1,
    );
    assert.equal(snapshot.journal[0].commitKind, "evidence");
    assert.deepEqual(snapshot.journal[0].machineEdges, []);
    assert.equal(snapshot.workspace.spec.semanticRevision, 0);
    assert.equal(snapshot.workspace.spec.evidenceRevision, 1);
    assert.equal(
      snapshot.idempotencyOutcomeView[0].outcome.class,
      "assignment-issued",
    );
    assert.equal(
      snapshot.workspace.spec.openAssignment.assignmentDigest,
      issued.assignment.spec.assignmentDigest,
    );
  },
);
