import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
  submissionFor,
  submitCommand,
} from "./support.mjs";

test(
  "concurrent identical submissions produce one commit and one deterministic replay",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    const submission = submissionFor(harness, issued);
    const command = await submitCommand(
      harness,
      issued,
      submission,
    );
    const [left, right] = await Promise.all([
      harness.coordinator.execute(harness.storeId, command),
      harness.coordinator.execute(harness.storeId, command),
    ]);
    const snapshot = await harness.store.read(harness.storeId);

    assert.equal(left.kind, "committed");
    assert.equal(right.kind, "committed");
    assert.equal(canonicalize(left), canonicalize(right));
    assert.equal(snapshot.commitRevision, 2);
    assert.equal(snapshot.journal.length, 2);
    assert.equal(snapshot.workspace.spec.semanticRevision, 1);
  },
);
