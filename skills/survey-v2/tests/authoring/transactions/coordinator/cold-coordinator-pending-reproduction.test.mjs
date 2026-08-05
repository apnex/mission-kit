import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  createCoordinatorHarness,
  issueAssignment,
} from "./support.mjs";

test(
  "a fresh coordinator over retained persistence reproduces the exact pending Assignment",
  async () => {
    const first = await createCoordinatorHarness();
    const issued = await issueAssignment(first);
    const second = await createCoordinatorHarness({
      storeId: first.storeId,
      driver: first.driver,
      persistence: first.persistence,
      initialize: false,
    });
    const pending = await second.coordinator.execute(
      second.storeId,
      { class: "next", inputs: {} },
    );

    assert.equal(
      canonicalize({
        ...pending,
        viewBytes:
          Buffer.from(pending.viewBytes).toString("base64"),
      }),
      canonicalize({
        ...issued,
        viewBytes:
          Buffer.from(issued.viewBytes).toString("base64"),
      }),
    );
    const snapshot = await second.store.read(second.storeId);
    assert.equal(snapshot.commitRevision, 1);
  },
);
