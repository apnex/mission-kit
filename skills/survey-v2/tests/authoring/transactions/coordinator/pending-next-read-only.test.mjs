import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test(
  "repeated next reproduces the pending Assignment byte-for-byte without a write",
  async () => {
    const harness = await createCoordinatorHarness();
    const first = await issueAssignment(harness);
    const before = await harness.store.read(harness.storeId);
    const second = await issueAssignment(harness);
    const after = await harness.store.read(harness.storeId);

    assert.equal(
      canonicalize({
        ...first,
        viewBytes: Buffer.from(first.viewBytes).toString("base64"),
      }),
      canonicalize({
        ...second,
        viewBytes: Buffer.from(second.viewBytes).toString("base64"),
      }),
    );
    assert.equal(canonicalize(after), canonicalize(before));
  },
);
