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
  "identical submission replay returns the retained Receipt and changes no revision or callback count",
  async () => {
    const harness = await createCoordinatorHarness();
    const issued = await issueAssignment(harness);
    const submission = submissionFor(harness, issued);
    const command = await submitCommand(
      harness,
      issued,
      submission,
    );
    const first = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const before = await harness.store.read(harness.storeId);
    const callbacksBefore = { ...harness.callbackCounts };
    const second = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const after = await harness.store.read(harness.storeId);

    assert.equal(first.kind, "committed");
    assert.equal(
      canonicalize(second),
      canonicalize(first),
    );
    assert.equal(canonicalize(after), canonicalize(before));
    assert.deepEqual(
      harness.callbackCounts,
      callbacksBefore,
    );
  },
);
